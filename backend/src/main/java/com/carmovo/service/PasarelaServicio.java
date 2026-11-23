package com.carmovo.service;

import com.carmovo.dto.CotizacionDTO;
import com.carmovo.dto.IntentoPagoDTO;
import com.carmovo.model.ConstanciaPago;
import com.carmovo.model.IntentoPago;
import com.carmovo.repository.ConstanciaPagoRepositorio;
import com.carmovo.repository.IntentoPagoRepositorio;
import com.carmovo.repository.PagoRepositorio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Pasarela de pago SIMULADA de CARMOVO, validada en el servidor.
 *
 * Flujo:
 *  1. crear(): el servidor calcula el monto (no confía en el navegador) y abre un intento de 15 minutos.
 *  2. Según el método:
 *       Tarjeta  → pagarTarjeta() → verificar3ds() → APROBADO / RECHAZADO
 *       Yape          → subirConstancia() + reportarYape()          → EN_REVISION (lo valida el Cajero)
 *       Plin          → subirConstancia() + reportarPlin()          → EN_REVISION (lo valida el Cajero)
 *       Transferencia → subirConstancia() + reportarTransferencia() → EN_REVISION (lo valida el Cajero)
 *       Efectivo → elegirEfectivo()                → PENDIENTE  (se paga en la oficina)
 *  3. La reserva consume el intento una sola vez (consumir + marcarUsado).
 *
 * Tres errores seguidos bloquean el intento. Nunca se guarda el número de tarjeta ni el CVV.
 */
@Service
public class PasarelaServicio {

    public static final List<String> METODOS = List.of("tarjeta", "yape", "plin", "transferencia", "efectivo");
    /** Métodos que se verifican a mano: el cliente sube la foto o captura del pago. */
    public static final List<String> CON_CONSTANCIA = List.of("yape", "plin", "transferencia");
    public static final List<String> BANCOS_PLIN = List.of("Interbank", "BBVA", "Scotiabank", "BanBif", "Caja Arequipa", "Caja Huancayo");
    public static final List<String> BANCOS_TRANSFERENCIA = List.of("BCP", "Interbank", "BBVA", "Scotiabank", "BanBif",
            "Banco de la Nación", "Banco Pichincha", "Caja Arequipa", "Caja Huancayo", "Caja Piura");
    private static final long MAX_CONSTANCIA = 5L * 1024 * 1024;
    private static final List<String> CONSUMIBLES = List.of("APROBADO", "EN_REVISION", "PENDIENTE");
    private static final int MINUTOS_INTENTO = 15;
    private static final int MAX_FALLOS = 3;
    private static final String MARCA_FALLA_3DS = "__FALLA_3DS__";

    private final IntentoPagoRepositorio intentos;
    private final ConstanciaPagoRepositorio constancias;
    private final PagoRepositorio pagos;
    private final AlquilerServicio alquileres;
    private final BigDecimal limiteYape;

    public PasarelaServicio(IntentoPagoRepositorio intentos, PagoRepositorio pagos, AlquilerServicio alquileres,
                            ConstanciaPagoRepositorio constancias,
                            @Value("${carmovo.pagos.limite-yape:2000}") BigDecimal limiteYape) {
        this.intentos = intentos;
        this.constancias = constancias;
        this.pagos = pagos;
        this.alquileres = alquileres;
        this.limiteYape = limiteYape;
    }

    // ------------------------------------------------------------------ cotización e intento

    public CotizacionDTO cotizar(Long idVehiculo, LocalDate inicio, LocalDate fin, boolean conChofer) {
        return aDto(alquileres.cotizar(idVehiculo, inicio, fin, conChofer));
    }

    @Transactional
    public IntentoPagoDTO crear(Long idUsuario, String metodo, Long idVehiculo, LocalDate inicio, LocalDate fin, boolean conChofer) {
        String m = metodo == null ? "" : metodo.trim().toLowerCase(Locale.ROOT);
        if (!METODOS.contains(m)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un método de pago válido.");
        }
        AlquilerServicio.Cotizacion cotizacion = alquileres.cotizar(idVehiculo, inicio, fin, conChofer);
        if ("yape".equals(m) && cotizacion.total().compareTo(limiteYape) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El monto supera el límite de Yape (S/ " + limiteYape.setScale(2) + " por operación). "
                            + "Elige tarjeta, Plin o efectivo para este alquiler.");
        }

        IntentoPago intento = new IntentoPago();
        intento.setCodigo("PI-" + SimuladorPasarela.alfanumerico(8));
        intento.setIdUsuario(idUsuario);
        intento.setIdVehiculo(idVehiculo);
        intento.setFechaInicio(inicio);
        intento.setFechaFin(fin);
        intento.setConChofer(conChofer);
        intento.setMetodo(m);
        intento.setMonto(cotizacion.total());
        intento.setEstado("CREADO");
        intento.setIntentosFallidos(0);
        intento.setExpira(LocalDateTime.now().plusMinutes(MINUTOS_INTENTO));
        IntentoPagoDTO dto = aDto(intentos.save(intento));
        dto.setCotizacion(aDto(cotizacion));
        return dto;
    }

    @Transactional(readOnly = true)
    public IntentoPagoDTO obtener(String codigo, Long idUsuario) {
        return aDto(propio(codigo, idUsuario));
    }

    // ------------------------------------------------------------------ tarjeta

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO pagarTarjeta(String codigo, Long idUsuario, Map<String, String> datos) {
        IntentoPago intento = activo(codigo, idUsuario, "tarjeta", "CREADO");
        String numero = texto(datos.get("numero")).replaceAll("\\D", "");
        String vence = texto(datos.get("vence")).replaceAll("\\s", "");
        String cvv = texto(datos.get("cvv"));
        int cuotas = entero(datos.get("cuotas"), 1);

        int mes = 0, anio = 0;
        if (vence.matches("\\d{2}/\\d{2}")) {
            mes = Integer.parseInt(vence.substring(0, 2));
            anio = 2000 + Integer.parseInt(vence.substring(3));
        }
        SimuladorPasarela.Resultado r = mes == 0
                ? new SimuladorPasarela.Resultado(false, "54", "La fecha de vencimiento no es válida (MM/AA).")
                : SimuladorPasarela.autorizarTarjeta(numero, mes, anio, cvv, YearMonth.now());
        if (!r.aprobado()) return fallo(intento, r.motivo());

        String tipo = SimuladorPasarela.tipo(numero);
        if (!List.of(1, 3, 6, 12).contains(cuotas) || ("DÉBITO".equals(tipo) && cuotas > 1)) cuotas = 1;
        intento.setDetalle(SimuladorPasarela.marca(numero) + " •••• " + numero.substring(numero.length() - 4)
                + " · " + tipo.toLowerCase(Locale.ROOT) + (cuotas > 1 ? " · " + cuotas + " cuotas" : ""));
        intento.setMotivo(SimuladorPasarela.falla3ds(numero) ? MARCA_FALLA_3DS : null);
        intento.setEstado("REQUIERE_3DS");
        IntentoPagoDTO dto = aDto(intentos.save(intento));
        dto.setTipoTarjeta(tipo);
        return dto;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO verificar3ds(String codigo, Long idUsuario, String otp) {
        IntentoPago intento = activo(codigo, idUsuario, "tarjeta", "REQUIERE_3DS");
        if (MARCA_FALLA_3DS.equals(intento.getMotivo())) {
            intento.setEstado("RECHAZADO");
            intento.setMotivo("Tu banco no pudo verificar tu identidad (3D Secure). No se realizó ningún cargo.");
            return aDto(intentos.save(intento));
        }
        if (!SimuladorPasarela.OTP_3DS.equals(texto(otp))) {
            return fallo(intento, "El código de verificación es incorrecto.");
        }
        intento.setEstado("APROBADO");
        intento.setMotivo(null);
        intento.setReferencia("AUT-" + SimuladorPasarela.numeros(6));
        return aDto(intentos.save(intento));
    }

    // ------------------------------------------------------------------ constancia (foto del pago)

    /** Guarda la foto, captura o PDF del pago (Yape, Plin o transferencia). Si ya había una, la reemplaza. */
    @Transactional
    public Map<String, Object> subirConstancia(String codigo, Long idUsuario, MultipartFile archivo) {
        IntentoPago intento = propio(codigo, idUsuario);
        if (!CON_CONSTANCIA.contains(intento.getMetodo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este método de pago no necesita constancia.");
        }
        if (!"CREADO".equals(intento.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este pago ya fue enviado.");
        }
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sube la foto o captura de tu pago.");
        }
        if (archivo.getSize() > MAX_CONSTANCIA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto pesa más de 5 MB. Toma una captura más liviana.");
        }
        byte[] datos;
        try {
            datos = archivo.getBytes();
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo.");
        }
        String tipo = tipoConstancia(datos);
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sube una imagen JPG, PNG o WEBP, o un PDF.");
        }
        ConstanciaPago c = constancias.findByIdIntento(intento.getIdIntento()).orElseGet(ConstanciaPago::new);
        c.setIdIntento(intento.getIdIntento());
        String nombre = texto(archivo.getOriginalFilename());
        c.setNombreArchivo(nombre.isEmpty() ? "constancia" : nombre.length() > 150 ? nombre.substring(0, 150) : nombre);
        c.setTipoContenido(tipo);
        c.setTamano((long) datos.length);
        c.setDatos(datos);
        constancias.save(c);
        return Map.of("ok", true, "tipo", tipo, "tamano", datos.length);
    }

    /** Constancia del pago de un alquiler (para que caja la revise). */
    @Transactional(readOnly = true)
    public ConstanciaPago constanciaDeAlquiler(Long idAlquiler) {
        IntentoPago intento = intentos.findFirstByIdAlquilerOrderByIdIntentoDesc(idAlquiler)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Este pago no tiene constancia."));
        ConstanciaPago c = constancias.findByIdIntento(intento.getIdIntento())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Este pago no tiene constancia."));
        c.getDatos();
        return c;
    }

    @Transactional(readOnly = true)
    public boolean tieneConstancia(Long idAlquiler) {
        return intentos.findFirstByIdAlquilerOrderByIdIntentoDesc(idAlquiler)
                .map(i -> constancias.existsByIdIntento(i.getIdIntento())).orElse(false);
    }

    /** Reconoce el archivo por sus primeros bytes (no por la extensión). */
    static String tipoConstancia(byte[] d) {
        if (d.length < 12) return null;
        if ((d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8) return "image/jpeg";
        if ((d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') return "image/png";
        if (d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F' && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') return "image/webp";
        if (d[0] == '%' && d[1] == 'P' && d[2] == 'D' && d[3] == 'F') return "application/pdf";
        return null;
    }

    // ------------------------------------------------------------------ yape, plin y transferencia

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO reportarYape(String codigo, Long idUsuario, String celular, String operacion, String fechaOperacion) {
        IntentoPago intento = activo(codigo, idUsuario, "yape", "CREADO");
        String cel = texto(celular).replaceAll("\\D", "");
        if (!ValidadorDocumentos.celularValido(cel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa el celular desde el que yapeaste (9 dígitos, empieza con 9).");
        }
        String op = operacionValida(operacion, 6, 12, "yape");
        LocalDateTime fecha = fechaOperacionValida(fechaOperacion);
        exigirConstancia(intento);
        return enviarARevision(intento, op, null, fecha, "Yape desde el celular " + cel);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO reportarPlin(String codigo, Long idUsuario, String operacion, String banco, String fechaOperacion) {
        IntentoPago intento = activo(codigo, idUsuario, "plin", "CREADO");
        String op = operacionValida(operacion, 6, 10, "plin");
        if (!BANCOS_PLIN.contains(texto(banco))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el banco desde el que pagaste.");
        }
        LocalDateTime fecha = fechaOperacionValida(fechaOperacion);
        exigirConstancia(intento);
        return enviarARevision(intento, op, texto(banco), fecha, "Plin desde " + texto(banco));
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO reportarTransferencia(String codigo, Long idUsuario, String operacion, String banco,
                                                String titular, String fechaOperacion) {
        IntentoPago intento = activo(codigo, idUsuario, "transferencia", "CREADO");
        String op = operacionValida(operacion, 6, 12, "transferencia");
        if (!BANCOS_TRANSFERENCIA.contains(texto(banco))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el banco desde el que transferiste.");
        }
        String nombre = texto(titular);
        if (nombre.length() < 3 || nombre.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe el nombre del titular de la cuenta de origen.");
        }
        LocalDateTime fecha = fechaOperacionValida(fechaOperacion);
        exigirConstancia(intento);
        return enviarARevision(intento, op, texto(banco), fecha, "Transferencia desde " + texto(banco) + " · titular " + nombre);
    }

    private String operacionValida(String operacion, int min, int max, String metodo) {
        String op = texto(operacion).replaceAll("\\D", "");
        if (op.length() < min || op.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El N° de operación debe tener entre " + min + " y " + max + " dígitos.");
        }
        String nombre = metodo.substring(0, 1).toUpperCase(Locale.ROOT) + metodo.substring(1);
        if (pagos.existsByMetodoIgnoreCaseAndReferencia(nombre, op) || intentos.existsByMetodoAndReferencia(metodo, op)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este N° de operación ya fue usado en otra reserva.");
        }
        return op;
    }

    private static LocalDateTime fechaOperacionValida(String fechaOperacion) {
        LocalDateTime fecha;
        try {
            fecha = LocalDateTime.parse(texto(fechaOperacion));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica la fecha y hora del pago.");
        }
        if (fecha.isAfter(LocalDateTime.now().plusMinutes(5)) || fecha.isBefore(LocalDateTime.now().minusHours(24))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha del pago debe ser de las últimas 24 horas.");
        }
        return fecha;
    }

    private void exigirConstancia(IntentoPago intento) {
        if (!constancias.existsByIdIntento(intento.getIdIntento())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sube la foto o captura de tu pago para que caja pueda verificarlo.");
        }
    }

    /** El pago queda "En revisión" hasta que caja lo apruebe o lo rechace. */
    private IntentoPagoDTO enviarARevision(IntentoPago intento, String op, String banco, LocalDateTime fecha, String detalle) {
        intento.setEstado("EN_REVISION");
        intento.setReferencia(op);
        intento.setBanco(banco);
        intento.setFechaOperacion(fecha);
        intento.setDetalle(detalle);
        return aDto(intentos.save(intento));
    }

    // ------------------------------------------------------------------ efectivo

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public IntentoPagoDTO elegirEfectivo(String codigo, Long idUsuario) {
        IntentoPago intento = activo(codigo, idUsuario, "efectivo", "CREADO");
        intento.setEstado("PENDIENTE");
        intento.setReferencia(intento.getCodigo());
        intento.setDetalle("Pago en efectivo en oficina");
        IntentoPagoDTO dto = aDto(intentos.save(intento));
        dto.setVencePago(vencimientoEfectivo(intento.getFechaInicio()));
        return dto;
    }

    /** El efectivo se paga en la oficina hasta las 12:00 del día de recojo. */
    public static LocalDateTime vencimientoEfectivo(LocalDate inicio) {
        return inicio.atTime(12, 0);
    }

    // ------------------------------------------------------------------ uso desde la reserva

    /** Verifica que el intento pertenezca al cliente, coincida con la reserva y se pueda usar. */
    @Transactional(readOnly = true)
    public IntentoPago consumir(String codigo, Long idUsuario, Long idVehiculo, LocalDate inicio, LocalDate fin, boolean conChofer) {
        if (codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa el pago antes de confirmar la reserva.");
        }
        IntentoPago intento = propio(codigo, idUsuario);
        if (!CONSUMIBLES.contains(intento.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este pago no está aprobado o ya fue usado.");
        }
        if (intento.getExpira().plusMinutes(MINUTOS_INTENTO).isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El tiempo para completar la reserva venció. Inicia el pago de nuevo.");
        }
        if (!intento.getIdVehiculo().equals(idVehiculo) || !intento.getFechaInicio().equals(inicio)
                || !intento.getFechaFin().equals(fin) || intento.isConChofer() != conChofer) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Los datos de la reserva cambiaron después del pago. Vuelve a iniciar el pago.");
        }
        return intento;
    }

    @Transactional
    public void marcarUsado(IntentoPago intento, Long idAlquiler) {
        intento.setIdAlquiler(idAlquiler);
        intento.setMotivo(intento.getEstado());
        intento.setEstado("USADO");
        intentos.save(intento);
    }

    /** Cada 10 minutos: los intentos abandonados pasan a EXPIRADO. */
    @Scheduled(fixedDelay = 600_000, initialDelay = 60_000)
    @Transactional
    public void expirarIntentosAbandonados() {
        intentos.findByEstadoInAndExpiraBefore(List.of("CREADO", "REQUIERE_3DS"), LocalDateTime.now())
                .forEach(i -> {
                    i.setEstado("EXPIRADO");
                    intentos.save(i);
                    constancias.deleteByIdIntento(i.getIdIntento());
                });
    }

    // ------------------------------------------------------------------ auxiliares

    private IntentoPago propio(String codigo, Long idUsuario) {
        IntentoPago intento = intentos.findByCodigo(texto(codigo))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El pago no existe."));
        if (!intento.getIdUsuario().equals(idUsuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este pago no te pertenece.");
        }
        return intento;
    }

    private IntentoPago activo(String codigo, Long idUsuario, String metodo, String estadoEsperado) {
        IntentoPago intento = propio(codigo, idUsuario);
        if (!metodo.equals(intento.getMetodo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este pago corresponde a otro método.");
        }
        if ("BLOQUEADO".equals(intento.getEstado())) {
            throw new ResponseStatusException(HttpStatus.LOCKED, "El pago se bloqueó por demasiados intentos. Inicia uno nuevo.");
        }
        if (intento.getExpira().isBefore(LocalDateTime.now())) {
            intento.setEstado("EXPIRADO");
            intentos.save(intento);
            throw new ResponseStatusException(HttpStatus.GONE, "El tiempo para pagar venció. Inicia el pago de nuevo.");
        }
        if (!estadoEsperado.equals(intento.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este paso del pago ya no está disponible.");
        }
        return intento;
    }

    /** Registra un rechazo. Al tercero, el intento queda bloqueado. */
    private IntentoPagoDTO fallo(IntentoPago intento, String motivo) {
        intento.setIntentosFallidos(intento.getIntentosFallidos() + 1);
        if (intento.getIntentosFallidos() >= MAX_FALLOS) {
            intento.setEstado("BLOQUEADO");
            intento.setMotivo(motivo + " Superaste el número de intentos; el pago quedó bloqueado.");
        } else if (!MARCA_FALLA_3DS.equals(intento.getMotivo())) {
            intento.setMotivo(motivo);
        }
        intentos.save(intento);
        IntentoPagoDTO dto = aDto(intento);
        dto.setEstado("BLOQUEADO".equals(intento.getEstado()) ? "BLOQUEADO" : "RECHAZADO");
        dto.setMotivo("BLOQUEADO".equals(intento.getEstado()) ? intento.getMotivo() : motivo);
        return dto;
    }

    private IntentoPagoDTO aDto(IntentoPago i) {
        IntentoPagoDTO dto = new IntentoPagoDTO();
        dto.setCodigo(i.getCodigo());
        dto.setMetodo(i.getMetodo());
        dto.setEstado(i.getEstado());
        dto.setMonto(i.getMonto());
        dto.setReferencia(i.getReferencia());
        dto.setDetalle(i.getDetalle());
        dto.setMotivo(MARCA_FALLA_3DS.equals(i.getMotivo()) ? null : i.getMotivo());
        dto.setIntentosRestantes(Math.max(0, MAX_FALLOS - i.getIntentosFallidos()));
        dto.setExpira(i.getExpira());
        return dto;
    }

    private CotizacionDTO aDto(AlquilerServicio.Cotizacion c) {
        CotizacionDTO dto = new CotizacionDTO();
        dto.setDias(c.dias());
        dto.setPrecioDia(c.precioDia());
        dto.setTarifaBase(c.tarifaBase());
        dto.setChofer(c.chofer());
        dto.setSeguro(c.seguro());
        dto.setIgv(c.igv());
        dto.setTotal(c.total());
        dto.setLimiteYape(limiteYape);
        dto.setDescuento(c.descuento());
        dto.setPrecioRegular(c.precioRegular());
        return dto;
    }

    private static String texto(String v) {
        return v == null ? "" : v.trim();
    }

    private static int entero(String v, int porDefecto) {
        try { return Integer.parseInt(texto(v)); } catch (NumberFormatException e) { return porDefecto; }
    }
}

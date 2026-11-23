package com.carmovo.service;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.model.Pago;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

/**
 * Correos automáticos para el cliente. Los textos están aquí para que sean fáciles de cambiar.
 * Si el envío falla, el proceso principal (reserva, pago) NO se interrumpe.
 */
@Service
public class NotificacionServicio {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CorreoServicio correo;
    private final String urlPublica;

    public NotificacionServicio(CorreoServicio correo, @Value("${carmovo.url-publica:http://localhost:8080}") String urlPublica) {
        this.correo = correo;
        this.urlPublica = urlPublica.endsWith("/") ? urlPublica.substring(0, urlPublica.length() - 1) : urlPublica;
    }

    public void reservaRegistrada(AlquilerDTO a, Pago pago) {
        String estadoPago = pago.getEstado();
        StringBuilder cuerpo = new StringBuilder()
                .append("Hola ").append(a.getCliente()).append(",\n\n")
                .append("Registramos tu reserva #").append(a.getIdAlquiler()).append(" del ").append(a.getVehiculo())
                .append(" (").append(a.getFechaInicio().format(FECHA)).append(" al ").append(a.getFechaFin().format(FECHA)).append(").\n")
                .append("Total: S/ ").append(a.getTotal().setScale(2, RoundingMode.HALF_UP)).append("\n")
                .append("Método de pago: ").append(pago.getMetodo()).append("\n\n");
        switch (estadoPago) {
            case "Pagado" -> cuerpo.append("Tu pago fue aprobado. Puedes ver y descargar tu comprobante en Mi Cuenta.\n");
            case "En revisión" -> cuerpo.append("Estamos validando tu operación ").append(pago.getMetodo()).append(" (N° ").append(pago.getReferencia())
                    .append("). Te avisaremos en cuanto se confirme.\n");
            case "Pendiente" -> cuerpo.append("Paga en efectivo en nuestra oficina presentando el código ")
                    .append(pago.getReferencia()).append(" hasta el ")
                    .append(pago.getVencePago() == null ? "día de recojo" : pago.getVencePago().format(FECHA_HORA))
                    .append(". Si no se paga a tiempo, la reserva se cancelará automáticamente.\n");
            default -> { }
        }
        cuerpo.append("\nMi Cuenta: ").append(urlPublica).append("/miCuenta\n\nGracias por elegir CARMOVO.");
        enviar(a.getCorreoCliente(), "Reserva #" + a.getIdAlquiler() + " registrada · CARMOVO", cuerpo.toString());
    }

    public void pagoConfirmado(AlquilerDTO a, Pago pago) {
        enviar(a.getCorreoCliente(), "Pago confirmado · Reserva #" + a.getIdAlquiler(),
                "Hola " + a.getCliente() + ",\n\n"
                        + "Confirmamos el pago de tu reserva #" + a.getIdAlquiler() + " (" + a.getVehiculo() + ").\n"
                        + "Monto: S/ " + pago.getMonto().setScale(2, RoundingMode.HALF_UP) + " · " + pago.getMetodo() + "\n\n"
                        + "Tu " + ("FACTURA".equalsIgnoreCase(pago.getTipoComprobante()) ? "factura" : "boleta")
                        + " ya está disponible en Mi Cuenta: " + urlPublica + "/miCuenta#comprobante\n\nGracias por elegir CARMOVO.");
    }

    public void pagoRechazado(AlquilerDTO a, Pago pago) {
        enviar(a.getCorreoCliente(), "No pudimos validar tu pago · Reserva #" + a.getIdAlquiler(),
                "Hola " + a.getCliente() + ",\n\n"
                        + "No pudimos validar el pago de tu reserva #" + a.getIdAlquiler() + ".\n"
                        + "Motivo: " + pago.getMotivoRechazo() + "\n\n"
                        + "La reserva fue cancelada y el vehículo quedó libre. Si crees que es un error, "
                        + "responde este correo o escríbenos desde la sección Soporte.\n\nEquipo CARMOVO");
    }

    private void enviar(String para, String asunto, String cuerpo) {
        if (para == null || para.isBlank()) return;
        correo.enviar(para, asunto, cuerpo);
    }
}

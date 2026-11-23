package com.carmovo.controller;

import com.carmovo.dto.CotizacionDTO;
import com.carmovo.dto.IntentoPagoDTO;
import com.carmovo.service.ClienteActual;
import com.carmovo.service.PasarelaServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

/**
 * Pasarela de pago simulada para el cliente (requiere JWT de cliente:
 * todas las rutas /api/v1/reservas/** están protegidas por Spring Security).
 */
@RestController
@RequestMapping("/api/v1/reservas")
public class PasarelaController {

    private final PasarelaServicio pasarela;

    public PasarelaController(PasarelaServicio pasarela) {
        this.pasarela = pasarela;
    }

    /** Precio calculado por el servidor (antes de elegir el método de pago). */
    @PostMapping("/cotizacion")
    public CotizacionDTO cotizar(@RequestBody Map<String, String> datos) {
        return pasarela.cotizar(id(datos.get("vehiculoId")), fecha(datos.get("fechaInicio")),
                fecha(datos.get("fechaFin")), Boolean.parseBoolean(datos.get("conChofer")));
    }

    @PostMapping("/pagos/intentos")
    public ResponseEntity<IntentoPagoDTO> crear(@RequestBody Map<String, String> datos) {
        IntentoPagoDTO intento = pasarela.crear(ClienteActual.id(), datos.get("metodo"), id(datos.get("vehiculoId")),
                fecha(datos.get("fechaInicio")), fecha(datos.get("fechaFin")), Boolean.parseBoolean(datos.get("conChofer")));
        return ResponseEntity.status(HttpStatus.CREATED).body(intento);
    }

    @GetMapping("/pagos/intentos/{codigo}")
    public IntentoPagoDTO obtener(@PathVariable String codigo) {
        return pasarela.obtener(codigo, ClienteActual.id());
    }

    @PostMapping("/pagos/intentos/{codigo}/tarjeta")
    public IntentoPagoDTO tarjeta(@PathVariable String codigo, @RequestBody Map<String, String> datos) {
        return pasarela.pagarTarjeta(codigo, ClienteActual.id(), datos);
    }

    @PostMapping("/pagos/intentos/{codigo}/3ds")
    public IntentoPagoDTO verificar3ds(@PathVariable String codigo, @RequestBody Map<String, String> datos) {
        return pasarela.verificar3ds(codigo, ClienteActual.id(), datos.get("codigo"));
    }

    /** Foto, captura o PDF del pago (Yape, Plin o transferencia). */
    @PostMapping(value = "/pagos/intentos/{codigo}/constancia", consumes = "multipart/form-data")
    public Map<String, Object> constancia(@PathVariable String codigo, @RequestParam("archivo") MultipartFile archivo) {
        return pasarela.subirConstancia(codigo, ClienteActual.id(), archivo);
    }

    @PostMapping("/pagos/intentos/{codigo}/yape")
    public IntentoPagoDTO yape(@PathVariable String codigo, @RequestBody Map<String, String> datos) {
        return pasarela.reportarYape(codigo, ClienteActual.id(), datos.get("celular"), datos.get("operacion"),
                datos.get("fechaOperacion"));
    }

    @PostMapping("/pagos/intentos/{codigo}/transferencia")
    public IntentoPagoDTO transferencia(@PathVariable String codigo, @RequestBody Map<String, String> datos) {
        return pasarela.reportarTransferencia(codigo, ClienteActual.id(), datos.get("operacion"), datos.get("banco"),
                datos.get("titular"), datos.get("fechaOperacion"));
    }

    @PostMapping("/pagos/intentos/{codigo}/plin")
    public IntentoPagoDTO plin(@PathVariable String codigo, @RequestBody Map<String, String> datos) {
        return pasarela.reportarPlin(codigo, ClienteActual.id(), datos.get("operacion"), datos.get("banco"),
                datos.get("fechaOperacion"));
    }

    @PostMapping("/pagos/intentos/{codigo}/efectivo")
    public IntentoPagoDTO efectivo(@PathVariable String codigo) {
        return pasarela.elegirEfectivo(codigo, ClienteActual.id());
    }

    private static Long id(String valor) {
        try {
            return Long.valueOf(valor);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un vehículo.");
        }
    }

    private static LocalDate fecha(String valor) {
        try {
            return LocalDate.parse(valor);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas no son válidas.");
        }
    }
}

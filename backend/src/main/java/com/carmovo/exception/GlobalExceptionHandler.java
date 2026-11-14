package com.carmovo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> manejarErroresValidacion(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> errores = new LinkedHashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage() == null
                            ? "El valor ingresado no es válido."
                            : error.getDefaultMessage()
            );
        }

        Map<String, Object> respuesta = new LinkedHashMap<>();

        respuesta.put("status", HttpStatus.BAD_REQUEST.value());
        respuesta.put("error", "Error de validación");
        respuesta.put("message", "Revisa los datos ingresados en el formulario.");
        respuesta.put("detail", String.join(" ", errores.values()));
        respuesta.put("errores", errores);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(respuesta);
    }

    /** Evita que el navegador muestre solamente "Forbidden" o "Conflict". */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> manejarErrorEstado(ResponseStatusException ex) {
        int estado = ex.getStatusCode().value();
        String mensaje = ex.getReason();
        if (mensaje == null || mensaje.isBlank()) {
            mensaje = switch (estado) {
                case 400 -> "Los datos enviados no son válidos.";
                case 401 -> "Debes iniciar sesión para continuar.";
                case 403 -> "No tienes permiso para realizar esta acción.";
                case 404 -> "No se encontró el recurso solicitado.";
                case 409 -> "Los datos entran en conflicto con un registro existente.";
                default -> "No se pudo completar la solicitud.";
            };
        }
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("status", estado);
        respuesta.put("error", mensaje);
        respuesta.put("message", mensaje);
        respuesta.put("detail", mensaje);
        return ResponseEntity.status(ex.getStatusCode()).body(respuesta);
    }
}

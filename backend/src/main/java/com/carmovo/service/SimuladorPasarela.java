package com.carmovo.service;

import java.security.SecureRandom;

/**
 * "Banco" simulado de la pasarela de CARMOVO (modo prueba).
 * Reglas fijas y documentadas para la demostración:
 *
 *  Tarjetas de prueba (cualquier otra tarjeta válida se aprueba):
 *   4111 1111 1111 1111 → aprobada
 *   4000 0000 0000 0002 → fondos insuficientes
 *   4000 0000 0000 0069 → tarjeta vencida o bloqueada
 *   4000 0000 0000 0127 → CVV incorrecto
 *   4000 0000 0000 3220 → falla la verificación 3D Secure
 *  Código 3D Secure: 123456
 *  Yape: cualquier código de aprobación de 6 dígitos; 000000 rechaza; 111111 = código vencido.
 */
public final class SimuladorPasarela {

    public static final String OTP_3DS = "123456";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private SimuladorPasarela() {}

    public record Resultado(boolean aprobado, String codigo, String motivo) {
        static Resultado ok() { return new Resultado(true, "00", null); }
        static Resultado no(String codigo, String motivo) { return new Resultado(false, codigo, motivo); }
    }

    public static boolean luhn(String numero) {
        if (numero == null || !numero.matches("\\d{13,19}")) return false;
        int suma = 0;
        boolean doble = false;
        for (int i = numero.length() - 1; i >= 0; i--) {
            int d = numero.charAt(i) - '0';
            if (doble) { d *= 2; if (d > 9) d -= 9; }
            suma += d;
            doble = !doble;
        }
        return suma % 10 == 0;
    }

    public static String marca(String numero) {
        if (numero == null) return null;
        if (numero.startsWith("4")) return "VISA";
        if (numero.matches("^(5[1-5]|2[2-7]).*")) return "MASTERCARD";
        if (numero.matches("^3[47].*")) return "AMEX";
        if (numero.matches("^3(0|6|8).*")) return "DINERS";
        return null;
    }

    /** Débito o crédito según el BIN (regla simulada: los BIN que terminan en par son de crédito). */
    public static String tipo(String numero) {
        if (numero == null || numero.length() < 6) return "CRÉDITO";
        return (numero.charAt(5) - '0') % 2 == 0 ? "CRÉDITO" : "DÉBITO";
    }

    /** Valida formato y decide el resultado de la autorización (antes del 3D Secure). */
    public static Resultado autorizarTarjeta(String numero, int mesVence, int anioVence, String cvv,
                                             java.time.YearMonth hoy) {
        String marca = marca(numero);
        if (!luhn(numero) || marca == null) return Resultado.no("14", "El número de tarjeta no es válido.");
        java.time.YearMonth vence = java.time.YearMonth.of(anioVence, Math.max(1, Math.min(12, mesVence)));
        if (mesVence < 1 || mesVence > 12 || vence.isBefore(hoy)) return Resultado.no("54", "La tarjeta está vencida.");
        int largoCvv = "AMEX".equals(marca) ? 4 : 3;
        if (cvv == null || !cvv.matches("\\d{" + largoCvv + "}"))
            return Resultado.no("N7", "El CVV debe tener " + largoCvv + " dígitos.");
        return switch (numero) {
            case "4000000000000002" -> Resultado.no("51", "Fondos insuficientes.");
            case "4000000000000069" -> Resultado.no("62", "La tarjeta está bloqueada. Comunícate con tu banco.");
            case "4000000000000127" -> Resultado.no("N7", "El CVV es incorrecto.");
            default -> Resultado.ok();
        };
    }

    public static boolean falla3ds(String numero) {
        return "4000000000003220".equals(numero);
    }

    public static Resultado aprobarYape(String codigoAprobacion) {
        if (codigoAprobacion == null || !codigoAprobacion.matches("\\d{6}"))
            return Resultado.no("YP1", "El código de aprobación debe tener 6 dígitos.");
        if ("000000".equals(codigoAprobacion)) return Resultado.no("YP2", "Código de aprobación inválido.");
        if ("111111".equals(codigoAprobacion)) return Resultado.no("YP3", "El código de aprobación venció. Genera otro en tu app Yape.");
        return Resultado.ok();
    }

    public static String numeros(int cantidad) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cantidad; i++) sb.append(ALEATORIO.nextInt(10));
        return sb.toString();
    }

    public static String alfanumerico(int cantidad) {
        String c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cantidad; i++) sb.append(c.charAt(ALEATORIO.nextInt(c.length())));
        return sb.toString();
    }
}

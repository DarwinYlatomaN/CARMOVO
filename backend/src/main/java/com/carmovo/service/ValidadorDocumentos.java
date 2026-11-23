package com.carmovo.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;

/**
 * Validaciones de documentos peruanos y reglas de conducción.
 * Clase sin dependencias: se prueba con pruebas unitarias (ValidadorDocumentosTest).
 */
public final class ValidadorDocumentos {

    /** Edad mínima para alquilar un vehículo. */
    public static final int EDAD_MINIMA = 21;

    /** Categorías de licencia de menor a mayor (MTC Perú, clase A). */
    private static final List<String> CATEGORIAS = List.of("A-I", "A-IIA", "A-IIB", "A-IIIA", "A-IIIB", "A-IIIC");

    private ValidadorDocumentos() {}

    public static boolean dniValido(String dni) {
        return dni != null && dni.trim().matches("\\d{8}");
    }

    /** RUC: 11 dígitos, prefijo 10/15/17/20 y dígito verificador (módulo 11). */
    public static boolean rucValido(String ruc) {
        if (ruc == null) return false;
        String r = ruc.trim();
        if (!r.matches("\\d{11}") || !List.of("10", "15", "17", "20").contains(r.substring(0, 2))) return false;
        int[] pesos = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};
        int suma = 0;
        for (int i = 0; i < 10; i++) suma += (r.charAt(i) - '0') * pesos[i];
        int digito = 11 - (suma % 11);
        if (digito == 10) digito = 0;
        if (digito == 11) digito = 1;
        return digito == r.charAt(10) - '0';
    }

    /** Placa peruana: ABC-123 o A1B-234 (con o sin guion). Devuelve null si no es válida. */
    public static String normalizarPlaca(String placa) {
        if (placa == null) return null;
        String p = placa.trim().toUpperCase(Locale.ROOT).replace(" ", "");
        if (!p.matches("[A-Z0-9]{3}-?\\d{3}")) return null;
        return p.contains("-") ? p : p.substring(0, 3) + "-" + p.substring(3);
    }

    /** Celular peruano: 9 dígitos que empiezan con 9. */
    public static boolean celularValido(String celular) {
        return celular != null && celular.replaceAll("\\s", "").matches("9\\d{8}");
    }

    /** Normaliza "A1", "a-i", "A-IIa" → "A-I", "A-IIA"... Devuelve null si no se reconoce. */
    public static String normalizarCategoria(String categoria) {
        if (categoria == null) return null;
        String c = categoria.trim().toUpperCase(Locale.ROOT).replace(" ", "");
        if (c.equals("A1") || c.equals("AI")) c = "A-I";
        if (!c.startsWith("A-") && c.startsWith("A")) c = "A-" + c.substring(1);
        return CATEGORIAS.contains(c) ? c : null;
    }

    /**
     * Categoría mínima según el tipo de vehículo:
     * furgonetas y vans de carga/pasajeros piden A-IIb; el resto, A-I.
     */
    public static String categoriaRequerida(String categoriaVehiculo) {
        String v = categoriaVehiculo == null ? "" : categoriaVehiculo.toLowerCase(Locale.ROOT);
        return v.contains("furgon") ? "A-IIB" : "A-I";
    }

    public static boolean categoriaSuficiente(String categoriaLicencia, String requerida) {
        String c = normalizarCategoria(categoriaLicencia);
        return c != null && CATEGORIAS.indexOf(c) >= CATEGORIAS.indexOf(requerida);
    }

    /** "A-IIB" → "A-IIb" (forma en que aparece en la licencia). */
    public static String mostrarCategoria(String categoria) {
        if (categoria == null || categoria.length() < 2) return categoria;
        char ultima = categoria.charAt(categoria.length() - 1);
        return Character.isLetter(ultima) && ultima != 'I'
                ? categoria.substring(0, categoria.length() - 1) + Character.toLowerCase(ultima)
                : categoria;
    }

    public static int edad(LocalDate nacimiento, LocalDate enFecha) {
        return Period.between(nacimiento, enFecha).getYears();
    }

    /**
     * Revisa que el conductor pueda manejar el vehículo durante todo el alquiler.
     * @return null si todo está bien, o el mensaje del problema.
     */
    public static String validarConductor(LocalDate nacimiento, String categoriaLicencia, LocalDate venceLicencia,
                                          String categoriaVehiculo, LocalDate inicio, LocalDate fin) {
        if (nacimiento == null) return "Indica la fecha de nacimiento del conductor.";
        if (edad(nacimiento, inicio) < EDAD_MINIMA)
            return "El conductor debe tener al menos " + EDAD_MINIMA + " años para alquilar un vehículo.";
        if (venceLicencia == null) return "Indica la fecha de vencimiento de la licencia.";
        if (venceLicencia.isBefore(fin))
            return "La licencia de conducir vence antes de que termine el alquiler (" + venceLicencia + ").";
        String requerida = categoriaRequerida(categoriaVehiculo);
        if (normalizarCategoria(categoriaLicencia) == null)
            return "La categoría de licencia no es válida. Usa A-I, A-IIa, A-IIb, A-IIIa, A-IIIb o A-IIIc.";
        if (!categoriaSuficiente(categoriaLicencia, requerida))
            return "Este vehículo requiere licencia " + mostrarCategoria(requerida) + " o superior.";
        return null;
    }

    /** Alquiler con chofer de la agencia: el titular no maneja, solo debe ser mayor de edad. */
    public static String validarTitularConChofer(LocalDate nacimiento, LocalDate inicio) {
        if (nacimiento == null) return "Indica la fecha de nacimiento del titular.";
        if (edad(nacimiento, inicio) < 18) return "El titular de la reserva debe ser mayor de edad.";
        return null;
    }
}

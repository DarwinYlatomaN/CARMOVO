package com.carmovo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consulta de DNI en RENIEC a través de un proveedor externo (por defecto miapi.cloud).
 * Devuelve nombres y apellidos para completar formularios automáticamente.
 * Guarda en memoria las consultas exitosas para no gastar el cupo del token en el mismo DNI.
 */
@Service
public class ConsultaDniServicio {

    private final String token;
    private final String url;
    private final RestTemplate http;
    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    public ConsultaDniServicio(@Value("${carmovo.dni.token:}") String token,
                               @Value("${carmovo.dni.url:https://miapi.cloud/v1/dni/{dni}}") String url) {
        this.token = token == null ? "" : token.trim();
        this.url = url == null || url.isBlank() ? "https://miapi.cloud/v1/dni/{dni}" : url.trim();
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(5000);
        fabrica.setReadTimeout(8000);
        this.http = new RestTemplate(fabrica);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> consultar(String dni) {
        String numero = dni == null ? "" : dni.trim();
        if (!ValidadorDocumentos.dniValido(numero)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI debe tener 8 dígitos.");
        }
        Map<String, Object> guardado = cache.get(numero);
        if (guardado != null) return guardado;
        if (token.isEmpty() || token.startsWith("PEGA_AQUI")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "La consulta de DNI no está configurada (falta el token en application.yml o en CARMOVO_DNI_TOKEN). Escribe los nombres a mano.");
        }
        HttpHeaders cabeceras = new HttpHeaders();
        cabeceras.setBearerAuth(token);
        cabeceras.set(HttpHeaders.ACCEPT, "application/json");
        Map<String, Object> cuerpo;
        try {
            ResponseEntity<Map> r = http.exchange(armarUrl(numero), HttpMethod.GET,
                    new HttpEntity<>(cabeceras), Map.class);
            cuerpo = r.getBody();
        } catch (RestClientResponseException e) {
            int codigo = e.getStatusCode().value();
            if (codigo == 401 || codigo == 403) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "El token de consulta de DNI no es válido o se agotó. Escribe los nombres a mano.");
            }
            if (codigo == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese DNI en RENIEC.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El servicio de RENIEC no respondió. Intenta de nuevo.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo conectar con RENIEC. Revisa tu internet.");
        }
        if (cuerpo == null || Boolean.FALSE.equals(cuerpo.get("success"))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese DNI en RENIEC.");
        }
        // Cada proveedor (miapi.cloud, apiperu.dev, factiliza, decolecta…) envuelve los datos distinto.
        Map<?, ?> d = cuerpo;
        for (String envoltura : new String[]{"datos", "data", "result", "resultado"}) {
            if (cuerpo.get(envoltura) instanceof Map<?, ?> m) { d = m; break; }
        }
        String nombres = titulo(primero(d, "nombres", "nombre", "first_name", "names"));
        String paterno = titulo(primero(d, "ape_paterno", "apellido_paterno", "apellidoPaterno", "first_last_name", "paterno"));
        String materno = titulo(primero(d, "ape_materno", "apellido_materno", "apellidoMaterno", "second_last_name", "materno"));
        if (nombres.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese DNI en RENIEC.");
        }
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("dni", numero);
        resultado.put("nombres", nombres);
        resultado.put("apellidoPaterno", paterno);
        resultado.put("apellidoMaterno", materno);
        resultado.put("apellidos", (paterno + " " + materno).trim());
        resultado.put("nombreCompleto", (nombres + " " + paterno + " " + materno).trim().replaceAll("\\s+", " "));
        if (cache.size() > 2000) cache.clear();
        cache.put(numero, resultado);
        return resultado;
    }

    private String armarUrl(String numero) {
        if (url.contains("{dni}")) return url.replace("{dni}", numero);
        return url.endsWith("/") || url.endsWith("=") ? url + numero : url + "/" + numero;
    }

    private static String primero(Map<?, ?> d, String... claves) {
        for (String c : claves) {
            String v = texto(d.get(c));
            if (!v.isEmpty()) return v;
        }
        return "";
    }

    private static String texto(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    /** "PEREZ DE LA CRUZ" → "Perez De La Cruz" (más legible en el panel). */
    private static String titulo(String v) {
        if (v.isEmpty()) return v;
        StringBuilder sb = new StringBuilder();
        for (String p : v.toLowerCase(java.util.Locale.ROOT).split("\\s+")) {
            if (p.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }
}

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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consulta de RUC en SUNAT con el mismo proveedor y el mismo token que la consulta de DNI (miapi.cloud).
 * Devuelve razón social, dirección fiscal, estado y condición para completar la factura.
 * Guarda en memoria las consultas exitosas para no gastar el cupo del token en el mismo RUC.
 */
@Service
public class ConsultaRucServicio {

    private final String token;
    private final String url;
    private final RestTemplate http;
    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    public ConsultaRucServicio(@Value("${carmovo.dni.token:}") String token,
                               @Value("${carmovo.ruc.url:https://miapi.cloud/v1/ruc/{ruc}}") String url) {
        this.token = token == null ? "" : token.trim();
        this.url = url == null || url.isBlank() ? "https://miapi.cloud/v1/ruc/{ruc}" : url.trim();
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(5000);
        fabrica.setReadTimeout(8000);
        this.http = new RestTemplate(fabrica);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> consultar(String ruc) {
        String numero = ruc == null ? "" : ruc.trim();
        if (!ValidadorDocumentos.rucValido(numero)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUC no es válido: revisa los 11 dígitos.");
        }
        Map<String, Object> guardado = cache.get(numero);
        if (guardado != null) return guardado;
        if (token.isEmpty() || token.startsWith("PEGA_AQUI")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "La consulta de RUC no está configurada. Escribe la razón social y la dirección a mano.");
        }
        HttpHeaders cabeceras = new HttpHeaders();
        cabeceras.setBearerAuth(token);
        cabeceras.set(HttpHeaders.ACCEPT, "application/json");
        Map<String, Object> cuerpo;
        try {
            ResponseEntity<Map> r = http.exchange(armarUrl(numero), HttpMethod.GET, new HttpEntity<>(cabeceras), Map.class);
            cuerpo = r.getBody();
        } catch (RestClientResponseException e) {
            int codigo = e.getStatusCode().value();
            if (codigo == 401 || codigo == 403) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "El token de consulta no es válido o se agotó. Escribe la razón social y la dirección a mano.");
            }
            if (codigo == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese RUC en SUNAT.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El servicio de SUNAT no respondió. Intenta de nuevo.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo conectar con SUNAT. Revisa tu internet.");
        }
        if (cuerpo == null || Boolean.FALSE.equals(cuerpo.get("success"))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese RUC en SUNAT.");
        }
        Map<?, ?> d = cuerpo;
        for (String envoltura : new String[]{"datos", "data", "result", "resultado"}) {
            if (cuerpo.get(envoltura) instanceof Map<?, ?> m) { d = m; break; }
        }
        String razonSocial = primero(d, "razon_social", "razonSocial", "nombre_o_razon_social", "nombre");
        if (razonSocial.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró ese RUC en SUNAT.");
        }
        // El domicilio viene con distinto nombre según el plan del proveedor.
        Map<?, ?> dom = d;
        for (String clave : new String[]{"domiciliado", "domicilio_fiscal", "ubicacion", "domicilio"}) {
            if (d.get(clave) instanceof Map<?, ?> m) { dom = m; break; }
        }
        String direccion = primero(dom, "direccion", "direccion_completa", "domicilio_fiscal");
        List<String> partes = new ArrayList<>();
        if (!direccion.isEmpty()) partes.add(direccion);
        for (String c : new String[]{"distrito", "provincia", "departamento"}) {
            String v = primero(dom, c);
            if (!v.isEmpty() && !direccion.toUpperCase().contains(v.toUpperCase())) partes.add(v);
        }
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("ruc", numero);
        resultado.put("razonSocial", razonSocial);
        resultado.put("direccion", String.join(", ", partes).replaceAll("\\s+", " ").trim());
        resultado.put("estado", primero(d, "estado"));
        resultado.put("condicion", primero(d, "condicion"));
        if (cache.size() > 2000) cache.clear();
        cache.put(numero, resultado);
        return resultado;
    }

    private String armarUrl(String numero) {
        if (url.contains("{ruc}")) return url.replace("{ruc}", numero);
        return url.endsWith("/") || url.endsWith("=") ? url + numero : url + "/" + numero;
    }

    private static String primero(Map<?, ?> d, String... claves) {
        for (String c : claves) {
            Object v = d.get(c);
            String t = v == null || v instanceof Map || v instanceof List ? "" : String.valueOf(v).trim();
            if (!t.isEmpty() && !"-".equals(t)) return t;
        }
        return "";
    }
}
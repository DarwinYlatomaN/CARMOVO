package com.carmovo.modulos.integraciones.identidad;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;

@RestController
@RequestMapping("/api/v1/reniec")
@CrossOrigin(origins = "*")
public class ReniecController {

    @GetMapping("/{dni}")
    public ResponseEntity<?> consultarDni(@PathVariable String dni) {
        try {
           
            String uri = "https://apiperu.dev/api/dni/" + dni;
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            
            // Coloca aquí tu nuevo token de apiperu.dev
            headers.set("Authorization", "Bearer cd5e85b68294e79acb06c76634599215fd15975510b9448e3b0ddbc1ccd38ff2"); 
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
            return ResponseEntity.ok(response.getBody());
            
        } catch (RestClientResponseException e) {
            System.err.println("Error de la API externa: " + e.getStatusCode().value() + " - " + e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode().value()).body(e.getResponseBodyAsString());
            
        } catch (Exception e) {
            System.err.println("Error interno en el servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("{\"error\": \"Fallo de conexión interno\"}");
        }
    }
}
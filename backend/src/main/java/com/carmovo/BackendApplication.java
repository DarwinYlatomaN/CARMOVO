
package com.carmovo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Punto de inicio de CARMOVO. @EnableScheduling activa las tareas automáticas (vencimiento de pagos). */
@SpringBootApplication
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("El backend de Carmovo se ha iniciado correctamente");
    }

}

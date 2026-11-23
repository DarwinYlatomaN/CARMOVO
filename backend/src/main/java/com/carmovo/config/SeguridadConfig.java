package com.carmovo.config;

import com.carmovo.repository.UsuarioRepositorio;
import com.carmovo.service.JwtServicio;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Configuración de Spring Security.
 *
 *  - Sitio público y archivos estáticos: libres.
 *  - Registro, login y recuperación de contraseña del cliente: libres.
 *  - Resto de /api/v1/clientes/** y /api/v1/reservas/**: requieren JWT de cliente.
 *  - Panel administrativo (/admin/**, /api/v1/admin/**): lo protege
 *    AdminAutenticacionInterceptor con sesiones y permisos por rol.
 *
 * La API es "stateless": no se usan cookies de sesión para el cliente, por eso
 * la protección CSRF no aplica a estas rutas.
 */
@Configuration
@EnableWebSecurity
public class SeguridadConfig {

    @Bean
    public SecurityFilterChain cadenaSeguridad(HttpSecurity http, JwtServicio jwtServicio,
                                               UsuarioRepositorio usuarioRepositorio) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                // Permite que el editor del Portal web muestre el sitio dentro de su vista previa (solo mismo dominio).
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reglas -> reglas
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/clientes/registro",
                                "/api/v1/clientes/login",
                                "/api/v1/clientes/recuperar/solicitar",
                                "/api/v1/clientes/recuperar/confirmar").permitAll()
                        .requestMatchers("/api/v1/clientes/**", "/api/v1/reservas/**").hasRole("CLIENTE")
                        .anyRequest().permitAll())
                .exceptionHandling(errores -> errores
                        .authenticationEntryPoint((request, response, ex) ->
                                responderJson(response, 401, "Tu sesión expiró o no es válida. Inicia sesión nuevamente."))
                        .accessDeniedHandler((request, response, ex) ->
                                responderJson(response, 403, "No tienes permiso para realizar esta acción.")))
                .addFilterBefore(new JwtFiltroCliente(jwtServicio, usuarioRepositorio),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Evita que Spring Boot cree un usuario en memoria con contraseña aleatoria:
     * los clientes se autentican con JWT y el personal con el login del panel.
     */
    @Bean
    public UserDetailsService sinUsuariosEnMemoria() {
        return nombre -> {
            throw new UsernameNotFoundException("Autenticación por formulario deshabilitada.");
        };
    }

    private static void responderJson(HttpServletResponse response, int estado, String mensaje) throws IOException {
        response.setStatus(estado);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write("{\"status\":" + estado + ",\"message\":\"" + mensaje + "\"}");
    }
}

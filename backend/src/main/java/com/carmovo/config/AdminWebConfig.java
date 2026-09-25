package com.carmovo.config;

import com.carmovo.modulos.autenticacion.AdminAutenticacionInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminWebConfig implements WebMvcConfigurer {

    private final AdminAutenticacionInterceptor adminAutenticacionInterceptor;

    public AdminWebConfig(AdminAutenticacionInterceptor adminAutenticacionInterceptor) {
        this.adminAutenticacionInterceptor = adminAutenticacionInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAutenticacionInterceptor)
                .addPathPatterns("/api/v1/admin/**", "/api/v1/vehiculos/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}

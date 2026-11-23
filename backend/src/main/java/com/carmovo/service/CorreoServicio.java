package com.carmovo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envío de correos del sistema.
 *
 *  - Con MAIL_HOST configurado (por ejemplo Gmail con "contraseña de aplicación"): envía de verdad.
 *  - Sin configurar: escribe el correo en la consola (útil para pruebas y presentaciones).
 * Un error de correo NUNCA interrumpe una reserva ni un pago.
 */
@Service
public class CorreoServicio {

    private static final Logger log = LoggerFactory.getLogger(CorreoServicio.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String host;
    private final String remitente;

    public CorreoServicio(ObjectProvider<JavaMailSender> mailSender,
                          @Value("${spring.mail.host:}") String host,
                          @Value("${carmovo.correo.remitente:CARMOVO <no-responder@carmovo.com>}") String remitente) {
        this.mailSender = mailSender;
        this.host = host;
        this.remitente = remitente;
    }

    public boolean habilitado() {
        return host != null && !host.isBlank() && mailSender.getIfAvailable() != null;
    }

    public void enviar(String destinatario, String asunto, String cuerpo) {
        if (!habilitado()) {
            log.info("""

                    ================= CORREO (modo consola) =================
                    Para:    {}
                    Asunto:  {}
                    ---------------------------------------------------------
                    {}
                    =========================================================""",
                    destinatario, asunto, cuerpo);
            return;
        }
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            mailSender.getObject().send(mensaje);
            log.info("Correo enviado a {}: {}", destinatario, asunto);
        } catch (RuntimeException e) {
            log.warn("No se pudo enviar el correo a {} ({}): {}", destinatario, asunto, e.getMessage());
        }
    }
}

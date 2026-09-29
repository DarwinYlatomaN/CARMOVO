package com.carmovo.controlador;

import com.carmovo.modulos.usuarios.UsuarioServicio;
import com.carmovo.modulos.usuarios.dto.UsuarioDTO;
import com.carmovo.modulos.usuarios.dto.UsuarioGuardarDTO;
import com.carmovo.modulos.vehiculos.VehiculoServicio;
import java.time.Year;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class VistaController {

    private static final List<String> DEPARTAMENTOS = List.of(
            "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
            "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín",
            "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios",
            "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
    );

    private final UsuarioServicio usuarioServicio;
    private final VehiculoServicio vehiculoServicio;

    public VistaController(UsuarioServicio usuarioServicio, VehiculoServicio vehiculoServicio) {
        this.usuarioServicio = usuarioServicio;
        this.vehiculoServicio = vehiculoServicio;
    }

    @ModelAttribute
    public void agregarDatosComunes(Model model) {
        model.addAttribute("anioActual", Year.now().getValue());
        model.addAttribute("departamentos", DEPARTAMENTOS);
    }

    @GetMapping({"/", "/home", "/home.html"})
    public String home(Model model) {
        model.addAttribute("tituloPagina", "Alquiler de autos | Carmovo");
        return "home";
    }

    @GetMapping({"/categorias", "/categorias.html"})
    public String categorias(Model model) {
        model.addAttribute("tituloPagina", "Categorías de Vehículos | Carmovo");
        return "categorias";
    }

    @GetMapping({"/reservas", "/reservas.html"})
    public String reservas(Model model) {
        model.addAttribute("tituloPagina", "Reserva de Vehículo | Carmovo");
        model.addAttribute("vehiculos", vehiculoServicio.obtenerTodos());
        return "reservas";
    }

    @GetMapping({"/ofertas", "/ofertas.html"})
    public String ofertas(Model model) {
        model.addAttribute("tituloPagina", "Ofertas y Promociones | Carmovo");
        return "ofertas";
    }

    @GetMapping({"/experiencia", "/experiencia.html"})
    public String experiencia(Model model) {
        model.addAttribute("tituloPagina", "Experiencias | Carmovo");
        return "experiencia";
    }

    @GetMapping({"/soporte", "/soporte.html"})
    public String soporte(Model model) {
        model.addAttribute("tituloPagina", "Soporte | Carmovo");
        return "soporte";
    }

    @GetMapping({"/miCuenta", "/miCuenta.html"})
    public String miCuenta(Model model) {
        model.addAttribute("tituloPagina", "Mi Cuenta | Carmovo");
        return "miCuenta";
    }

    @GetMapping({"/login", "/login.html"})
    public String login(Model model) {
        prepararLogin(model);
        return "login";
    }

    @PostMapping("/login")
    public String procesarLogin(@ModelAttribute("loginForm") LoginFormulario loginForm, Model model) {
        prepararLogin(model);
        try {
            UsuarioDTO usuario = usuarioServicio.autenticarCliente(loginForm.getCorreo(), loginForm.getPassword());
            model.addAttribute("usuarioAutenticado", usuario);
        } catch (ResponseStatusException ex) {
            model.addAttribute("errorLogin", mensajeExcepcion(ex, "Correo o contraseña incorrectos."));
        }
        return "login";
    }

    @GetMapping({"/registro", "/registro.html"})
    public String registro(Model model) {
        prepararRegistro(model);
        return "registro";
    }

    @PostMapping("/registro")
    public String procesarRegistro(
            @ModelAttribute("registroForm") UsuarioGuardarDTO registroForm,
            @RequestParam(name = "confirmarContrasena", required = false) String confirmarContrasena,
            Model model
    ) {
        prepararRegistro(model);

        if (registroForm.getContrasena() == null || !registroForm.getContrasena().equals(confirmarContrasena)) {
            model.addAttribute("errorRegistro", "Las contraseñas no coinciden.");
            return "registro";
        }

        try {
            UsuarioDTO usuario = usuarioServicio.registrarCliente(registroForm);
            model.addAttribute("usuarioRegistrado", usuario);
        } catch (ResponseStatusException ex) {
            model.addAttribute("errorRegistro", mensajeExcepcion(ex, "No se pudo registrar la cuenta."));
        }

        return "registro";
    }

    @GetMapping({"/recuperar-password", "/recuperar-password.html"})
    public String recuperarPassword(Model model) {
        model.addAttribute("tituloPagina", "Recuperar Contraseña | Carmovo");
        return "recuperar-password";
    }

    @GetMapping("/thymeleaf-prueba")
    public String mostrarPruebaThymeleaf(Model model) {
        model.addAttribute("tituloPagina", "CARMOVO - Thymeleaf activo");
        model.addAttribute("titulo", "CARMOVO - Thymeleaf activo");
        model.addAttribute("mensaje", "Spring Boot ya está renderizando una vista Thymeleaf correctamente.");
        return "thymeleaf-prueba";
    }

    private void prepararLogin(Model model) {
        model.addAttribute("tituloPagina", "Iniciar Sesión | Carmovo");
        if (!model.containsAttribute("loginForm")) {
            model.addAttribute("loginForm", new LoginFormulario());
        }
    }

    private void prepararRegistro(Model model) {
        model.addAttribute("tituloPagina", "Registro | Carmovo");
        if (!model.containsAttribute("registroForm")) {
            model.addAttribute("registroForm", new UsuarioGuardarDTO());
        }
    }

    private String mensajeExcepcion(ResponseStatusException ex, String mensajePredeterminado) {
        return ex.getReason() == null || ex.getReason().isBlank() ? mensajePredeterminado : ex.getReason();
    }

    public static class LoginFormulario {
        private String correo;
        private String password;

        public String getCorreo() {
            return correo;
        }

        public void setCorreo(String correo) {
            this.correo = correo;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

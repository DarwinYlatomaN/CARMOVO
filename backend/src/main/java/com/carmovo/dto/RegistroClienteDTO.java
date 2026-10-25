
package com.carmovo.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;

public class RegistroClienteDTO {

    @NotBlank(message = "Los nombres son obligatorios.")
    @Pattern(
            regexp = "^(?=.{3,100}$)[\\p{L}]+(?:[ '-][\\p{L}]+)*$",
            message = "Los nombres deben tener al menos 3 caracteres y contener solo letras."
    )
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios.")
    @Pattern(
            regexp = "^(?=.{3,100}$)[\\p{L}]+(?:[ '-][\\p{L}]+)*$",
            message = "Los apellidos deben tener al menos 3 caracteres y contener solo letras."
    )
    private String apellidos;

    @NotBlank(message = "El correo electrónico es obligatorio.")
    @Email(message = "Ingresa un correo electrónico válido.")
    @Pattern(
            regexp = "^[A-Za-z0-9._%+-]+@gmail\\.com$",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "El correo debe terminar en @gmail.com."
    )
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(
            min = 8,
            max = 12,
            message = "La contraseña debe tener entre 8 y 12 caracteres."
    )
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%*_\\-])[^\\s].*[^\\s]$",
            message = "La contraseña debe incluir mayúscula, minúscula, número y símbolo (@, #, $, %, *, _ o -), sin espacios al inicio ni al final."
    )
    private String contrasena;

    @NotBlank(message = "El teléfono es obligatorio.")
    @Pattern(
            regexp = "^9[0-9]{8}$",
            message = "El teléfono debe tener 9 números y comenzar con 9."
    )
    private String telefono;

    @NotBlank(message = "El DNI es obligatorio.")
    @Pattern(
            regexp = "^[0-9]{8}$",
            message = "El DNI debe contener exactamente 8 números."
    )
    private String documento;

    @NotNull(message = "La fecha de nacimiento es obligatoria.")
    @PastOrPresent(
            message = "La fecha de nacimiento no puede ser futura."
    )
    private LocalDate fechaNacimiento;

    @NotBlank(message = "El domicilio es obligatorio.")
    @Size(max = 200, message = "El domicilio es demasiado largo.")
    private String domicilio;

    @NotBlank(message = "El departamento es obligatorio.")
    private String departamento;

    @NotBlank(message = "La provincia es obligatoria.")
    private String provincia;

    @NotBlank(message = "El distrito es obligatorio.")
    private String distrito;

    @NotBlank(message = "El número de licencia es obligatorio.")
    @Pattern(
            regexp = "^[A-Za-z](?:-?[0-9]{6,12})(?:E)?$",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "La licencia debe comenzar con una letra, continuar con su identificador numérico y puede terminar en E."
    )
    private String numeroLicencia;

    @NotBlank(message = "La categoría de licencia es obligatoria.")
    @Pattern(
            regexp = "^A-(I|IIA|IIB|IIIA|IIIB|IIIC)$",
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Selecciona una categoría válida: A-I, A-IIa, A-IIb, A-IIIa, A-IIIb o A-IIIc."
    )
    private String categoriaLicencia;

    @NotNull(message = "La fecha de vencimiento de la licencia es obligatoria.")
    @FutureOrPresent(
            message = "La licencia de conducir no debe estar vencida."
    )
    private LocalDate vencimientoLicencia;

    public RegistroClienteDTO() {
    }

    @AssertTrue(
            message = "Debes tener al menos 18 años para registrarte en CARMOVO."
    )
    public boolean isMayorDeEdad() {
        if (fechaNacimiento == null) {
            return true;
        }

        if (fechaNacimiento.isAfter(LocalDate.now())) {
            return true;
        }

        int edad = Period.between(
                fechaNacimiento,
                LocalDate.now()
        ).getYears();

        return edad >= 18;
    }

    @AssertTrue(
            message = "La contraseña no debe contener tu DNI, nombres, apellidos ni fecha de nacimiento."
    )
    public boolean isContrasenaSinDatosPersonales() {

        if (contrasena == null || contrasena.isBlank()) {
            return true;
        }

        String claveNormalizada = normalizarTexto(contrasena);

        if (documento != null
                && !documento.isBlank()
                && claveNormalizada.contains(documento.trim())) {
            return false;
        }

        if (contieneDatoPersonal(claveNormalizada, nombres)) {
            return false;
        }

        if (contieneDatoPersonal(claveNormalizada, apellidos)) {
            return false;
        }

        if (fechaNacimiento != null) {
            String fechaCompacta = fechaNacimiento.toString().replace("-", "");

            String fechaInversa = String.format(
                    "%02d%02d%04d",
                    fechaNacimiento.getDayOfMonth(),
                    fechaNacimiento.getMonthValue(),
                    fechaNacimiento.getYear()
            );

            if (claveNormalizada.contains(fechaCompacta)
                    || claveNormalizada.contains(fechaInversa)
                    || claveNormalizada.contains(fechaNacimiento.toString())) {
                return false;
            }
        }

        return true;
    }

    private boolean contieneDatoPersonal(String clave, String dato) {
        if (dato == null || dato.isBlank()) {
            return false;
        }

        String datoNormalizado = normalizarTexto(dato);

        if (datoNormalizado.length() >= 3
                && clave.contains(datoNormalizado)) {
            return true;
        }

        String[] partes = datoNormalizado.split("[\\s'-]+");

        for (String parte : partes) {
            if (parte.length() >= 3 && clave.contains(parte)) {
                return true;
            }
        }

        return false;
    }

    private String normalizarTexto(String texto) {
        String normalizado = Normalizer.normalize(
                texto,
                Normalizer.Form.NFD
        );

        return normalizado
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getDomicilio() {
        return domicilio;
    }

    public void setDomicilio(String domicilio) {
        this.domicilio = domicilio;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public String getNumeroLicencia() {
        return numeroLicencia;
    }

    public void setNumeroLicencia(String numeroLicencia) {
        this.numeroLicencia = numeroLicencia;
    }

    public String getCategoriaLicencia() {
        return categoriaLicencia;
    }

    public void setCategoriaLicencia(String categoriaLicencia) {
        this.categoriaLicencia = categoriaLicencia;
    }

    public LocalDate getVencimientoLicencia() {
        return vencimientoLicencia;
    }

    public void setVencimientoLicencia(LocalDate vencimientoLicencia) {
        this.vencimientoLicencia = vencimientoLicencia;
    }
}

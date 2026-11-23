package com.carmovo.dto;

import java.util.Set;

/** Un rol con sus permisos, para la pantalla "Roles y permisos". */
public class RolDTO {
    private Long idPerfil;
    private String nombre;
    private boolean editable;
    private long empleados;
    private Set<String> permisos;
    private boolean deFabrica;

    public boolean isDeFabrica() { return deFabrica; }
    public void setDeFabrica(boolean deFabrica) { this.deFabrica = deFabrica; }

    public Long getIdPerfil() { return idPerfil; }
    public void setIdPerfil(Long idPerfil) { this.idPerfil = idPerfil; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public boolean isEditable() { return editable; }
    public void setEditable(boolean editable) { this.editable = editable; }
    public long getEmpleados() { return empleados; }
    public void setEmpleados(long empleados) { this.empleados = empleados; }
    public Set<String> getPermisos() { return permisos; }
    public void setPermisos(Set<String> permisos) { this.permisos = permisos; }
}

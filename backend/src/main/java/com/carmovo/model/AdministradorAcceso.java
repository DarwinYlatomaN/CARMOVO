package com.carmovo.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "administradores_acceso")
public class AdministradorAcceso {
    @Id
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "es_principal", nullable = false)
    private boolean principal;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "administradores_permisos", joinColumns = @JoinColumn(name = "id_usuario"))
    @Column(name = "codigo", nullable = false, length = 50)
    private Set<String> permisos = new HashSet<>();

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public boolean isPrincipal() { return principal; }
    public void setPrincipal(boolean principal) { this.principal = principal; }
    public Set<String> getPermisos() { return permisos; }
    public void setPermisos(Set<String> permisos) { this.permisos = new HashSet<>(permisos); }
}

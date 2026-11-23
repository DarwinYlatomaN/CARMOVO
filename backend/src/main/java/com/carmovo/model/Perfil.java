package com.carmovo.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "perfiles")
public class Perfil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_perfil")
    private Long idPerfil;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "perfil_opcion",
        joinColumns = @JoinColumn(name = "id_perfil"),
        inverseJoinColumns = @JoinColumn(name = "id_opcion")
    )
    private List<Opcion> opciones;

    /** Módulos que puede usar el rol (códigos de PermisosAdministrativos). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "perfil_permisos", joinColumns = @JoinColumn(name = "id_perfil"))
    @Column(name = "codigo", nullable = false, length = 50)
    private java.util.Set<String> permisos = new java.util.HashSet<>();

    public java.util.Set<String> getPermisos() { return permisos; }
    public void setPermisos(java.util.Set<String> permisos) {
        this.permisos = permisos == null ? new java.util.HashSet<>() : new java.util.HashSet<>(permisos);
    }

    public Perfil() {
    }

    public Long getIdPerfil() {
        return idPerfil;
    }

    public void setIdPerfil(Long idPerfil) {
        this.idPerfil = idPerfil;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public List<Opcion> getOpciones() {
        return opciones;
    }

    public void setOpciones(List<Opcion> opciones) {
        this.opciones = opciones;
    }
}

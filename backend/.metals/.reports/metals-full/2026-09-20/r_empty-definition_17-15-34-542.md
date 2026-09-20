error id: file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/usuarios/Usuario.java:_empty_/Column#
file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/usuarios/Usuario.java
empty definition using pc, found symbol in pc: _empty_/Column#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 249
uri: file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/usuarios/Usuario.java
text:
```scala
package com.carmovo.modulos.usuarios;

import com.carmovo.modulos.roles.Perfil;
import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @@@Column(name = "id_usuario")
    private Long idUsuario;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 120)
    private String correo;

    @Column(nullable = false, length = 255)
    private String contrasena;

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false)
    private Boolean estado = true;

    // Relación con Perfil (Muchos usuarios pueden tener un mismo perfil)
    @ManyToOne
    @JoinColumn(name = "id_perfil", nullable = false)
    private Perfil perfil;

    public Usuario() {}

    // Genera los Getters y Setters
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/Column#
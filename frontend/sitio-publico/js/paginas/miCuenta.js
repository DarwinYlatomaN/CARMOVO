document.addEventListener('DOMContentLoaded', () => {
    
    const modalEditar = document.getElementById('modal-editar-cuenta');
    const modalExito = document.getElementById('modal-exito-actualizacion');
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const formEditarCuenta = document.getElementById('form-editar-cuenta');
    const btnCerrarExito = modalExito ? modalExito.querySelector('.btn-cerrar-exito-cuenta') : null;

  
    const ui = {
        nombre: document.getElementById('lbl-nombre-completo'),
        correo: document.getElementById('lbl-correo'),
        telefono: document.getElementById('lbl-telefono'),
        documento: document.getElementById('lbl-documento'),
        nacimiento: document.getElementById('lbl-nacimiento'),
        licencia: document.getElementById('lbl-licencia'),
        categoria: document.getElementById('lbl-categoria'),
        vence: document.getElementById('lbl-vence'),
        domicilio: document.getElementById('lbl-domicilio')
    };

    const form = {
        nombre: document.getElementById('edit-nombre'),
        apellidos: document.getElementById('edit-apellidos'),
        correo: document.getElementById('edit-correo'),
        telefono: document.getElementById('edit-telefono'),
        documento: document.getElementById('edit-documento'),
        nacimiento: document.getElementById('edit-nacimiento'),
        licencia: document.getElementById('edit-licencia'),
        categoria: document.getElementById('edit-categoria'),
        vence: document.getElementById('edit-vence'),
        domicilio: document.getElementById('edit-domicilio')
    };

    
    const toggleModal = (modal, accion) => {
        if (!modal) return;
        if (accion === 'abrir') {
            modal.classList.remove('oculto');
            modal.classList.add('activo');
        } else {
            modal.classList.remove('activo');
            modal.classList.add('oculto');
        }
    };

    
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', () => {
            // Separa el nombre y apellido
            if (ui.nombre && form.nombre && form.apellidos) {
                const partesNombre = ui.nombre.textContent.split(' ');
                form.nombre.value = partesNombre[0] || '';
                form.apellidos.value = partesNombre.slice(1).join(' ') || '';
            }
            
           
            Object.keys(ui).forEach(key => {
                if (key !== 'nombre' && ui[key] && form[key]) {
                    form[key].value = ui[key].textContent;
                }
            });

            toggleModal(modalEditar, 'abrir');
        });
    }

    
    if (modalEditar) {
        modalEditar.querySelectorAll('.btn-cerrar-modal').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                toggleModal(modalEditar, 'cerrar'); 
            });
        });
        
        modalEditar.addEventListener('click', (e) => { 
            if (e.target === modalEditar) toggleModal(modalEditar, 'cerrar'); 
        });
    }

    
    if (formEditarCuenta) {
        formEditarCuenta.addEventListener('submit', (e) => {
            e.preventDefault();

            
            const nuevoNombreCompleto = `${form.nombre.value} ${form.apellidos.value}`.trim();
            
           
            if (ui.nombre) ui.nombre.textContent = nuevoNombreCompleto;
            Object.keys(ui).forEach(key => {
                if (key !== 'nombre' && ui[key] && form[key]) {
                    ui[key].textContent = form[key].value;
                }
            });

           
            localStorage.setItem('conductorNombre', nuevoNombreCompleto);
            localStorage.setItem('conductorCorreo', form.correo.value);
            localStorage.setItem('conductorTelefono', form.telefono.value);
            localStorage.setItem('conductorDocumento', form.documento.value);

            toggleModal(modalEditar, 'cerrar');
            toggleModal(modalExito, 'abrir'); 
        });
    }

    
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', () => toggleModal(modalExito, 'cerrar'));
    }
});
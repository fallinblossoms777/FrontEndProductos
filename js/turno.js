const API_CLIENTES = "http://localhost:3000/cliente";
const API_TURNOS = "http://localhost:3000/turno";

let clientesData = [];

window.addEventListener('DOMContentLoaded', () => {
    fetch(API_CLIENTES)
        .then(res => res.json())
        .then(clientes => {
            clientesData = clientes; 
            const select = document.getElementById('cliente');
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} (${cliente.email})`;
                select.appendChild(option);
            });

            mostrarNombreCliente();
        });

    document.getElementById('cliente').addEventListener('change', mostrarNombreCliente);
});

window.addEventListener('DOMContentLoaded', () => {
    fetch(API_CLIENTES)
        .then(res => res.json())
        .then(clientes => {
            if (clientes.length > 0) {
                const cliente = clientes[0]; 
                document.getElementById('datosCliente').innerHTML = `
                    <div>Nombre: ${cliente.nombre}</div>
                    <div>Email: ${cliente.email}</div>
                    <div>Teléfono: ${cliente.telefono || '-'}</div>
                    <div>Dirección: ${cliente.direccion || '-'}</div>
                `;
            } else {
                document.getElementById('datosCliente').textContent = "No hay clientes.";
            }
        });
});

document.getElementById('formTurno').addEventListener('submit', async function(e) {
    e.preventDefault();
    const clienteId = document.getElementById('cliente').value;
    const fecha_turno = document.getElementById('fecha_turno').value;

    const ahora = new Date();
    const fechaTurno = new Date(fecha_turno);
    if (fechaTurno < ahora) {
        mostrarMensaje("No se puede reservar un turno en una fecha y hora pasada.", "red");
        return;
    }

    if ((fechaTurno - ahora) > 48 * 60 * 60 * 1000) {
        mostrarMensaje("No se puede reservar un turno con más de 48 horas de anticipación.", "red");
        return;
    }

    const turnos = await fetch(API_TURNOS).then(res => res.json());
    const turnosCliente = turnos
        .filter(t => String(t.clienteId) === String(clienteId))
        .map(t => new Date(t.fecha_turno).getTime());

    turnosCliente.push(fechaTurno.getTime());
    turnosCliente.sort((a, b) => a - b);

    let maxConsecutivos = 1;
    let consecutivosActuales = 1;
    for (let i = 1; i < turnosCliente.length; i++) {
        if (turnosCliente[i] - turnosCliente[i - 1] === 30 * 60 * 1000) {
            consecutivosActuales++;
            if (consecutivosActuales > maxConsecutivos) maxConsecutivos = consecutivosActuales;
        } else {
            consecutivosActuales = 1;
        }
    }
    if (maxConsecutivos > 3) {
        mostrarMensaje("No puedes tener más de 3 turnos consecutivos.", "red");
        return;
    }

    fetch(API_TURNOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, fecha_turno })
    })
    .then(res => res.json().then(data => ({status: res.status, body: data})))
    .then(({status, body}) => {
        if (status === 201) {
            mostrarMensaje("¡Turno reservado con éxito!", "green", true);
            document.getElementById('formTurno').reset();
            document.getElementById('formTurno').style.display = "none";

            const turnoId = body.id || body.turnoId; 
            const carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
            carrito.forEach(producto => {
                fetch("http://localhost:3000/alquiler", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productoId: producto.productoId,
                        casco: producto.casco || 0,
                        chaleco_salvavidas: producto.chaleco_salvavidas || 0,
                        turnoId: turnoId
                    })
                });
            });
            localStorage.removeItem('carritoAlquiler');
        } else {
            mostrarMensaje(body.message || "Error al reservar el turno.", "red");
        }
    })
    .catch(() => {
        mostrarMensaje("Error al conectar con el servidor.", "red");
    });
});

function mostrarNombreCliente() {
    const clienteId = document.getElementById('cliente').value;
    const cliente = clientesData.find(c => String(c.id) === String(clienteId));
    const nombreDiv = document.getElementById('nombreCliente');
    nombreDiv.textContent = cliente ? `Cliente: ${cliente.nombre}` : '';
}

function mostrarMensaje(msg, color, mostrarBoton = false) {
    const div = document.getElementById('mensaje');
    div.innerHTML = `<span style="color:${color};">${msg}</span>`;
    if (mostrarBoton) {
        div.innerHTML += `<br><a href="pago.html" class="boton-turno" style="margin-top:18px;display:inline-block;">Ir a pago</a>`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
    if (carrito.length === 0) {
        alert("Debes agregar al menos un producto al carrito antes de seleccionar un turno.");
        window.location.href = "carrito.html";
        return;
    }
});

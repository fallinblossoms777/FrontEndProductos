const API_PAGOS = "http://localhost:3000/pago";
const API_TURNOS = "http://localhost:3000/turno";
const API_CLIENTES = "http://localhost:3000/cliente";

window.addEventListener('DOMContentLoaded', async () => {
    const clientes = await fetch(API_CLIENTES).then(res => res.json());
    const selectCliente = document.getElementById('clienteId');
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nombre} (${cliente.email})`;
        selectCliente.appendChild(option);
    });

    selectCliente.addEventListener('change', cargarTurnosCliente);

    if (selectCliente.value) {
        cargarTurnosCliente();
    }

    const monto = localStorage.getItem('montoPagar') || "";
    document.getElementById('monto').value = monto;
});

async function cargarTurnosCliente() {
    const clienteId = document.getElementById('clienteId').value;
    const selectTurno = document.getElementById('turnoId');
    selectTurno.innerHTML = "";

    if (!clienteId) return;

    const turnos = await fetch(`${API_TURNOS}?clienteId=${clienteId}`).then(res => res.json());
    const pagos = await fetch(`${API_PAGOS}?clienteId=${clienteId}`).then(res => res.json());
    const turnosPagados = pagos.map(p => String(p.turnoId));
    const turnosSinPagar = turnos.filter(t => !turnosPagados.includes(String(t.id)));

    if (turnosSinPagar.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No hay turnos pendientes de pago";
        selectTurno.appendChild(option);
        document.getElementById('monto').value = "";
        return;
    }

    turnosSinPagar.forEach(turno => {
        const option = document.createElement('option');
        option.value = turno.id;
        option.textContent = `Turno #${turno.id} - ${new Date(turno.fecha_turno).toLocaleString()}`;
        selectTurno.appendChild(option);
    });

    const monto = localStorage.getItem('montoPagar') || "";
    document.getElementById('monto').value = monto;
}

document.getElementById('turnoId').addEventListener('change', () => {
    const monto = localStorage.getItem('montoPagar') || "";
    document.getElementById('monto').value = monto;
});

document.getElementById('formPago').addEventListener('submit', async function(e) {
    e.preventDefault();

    const clienteId = document.getElementById('clienteId').value;
    const turnoId = document.getElementById('turnoId').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const moneda = document.getElementById('moneda').value;
    const metodo_pago = document.getElementById('metodo_pago').value;

    if (metodo_pago === 'efectivo') {
        const turno = await fetch(`${API_TURNOS}/${turnoId}`).then(res => res.json());
        const fechaTurno = new Date(turno.fecha_turno);
        const ahora = new Date();
        const diffHoras = (fechaTurno - ahora) / (1000 * 60 * 60);
        if (diffHoras < 2) {
            mostrarMensajePago("El pago en efectivo debe realizarse al menos 2 horas antes del turno.", "red");
            return;
        }
    }

    fetch(API_PAGOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clienteId,
            turnoId,
            monto,
            moneda,
            metodo_pago
        })
    })
    .then(res => res.json().then(data => ({status: res.status, body: data})))
    .then(({status, body}) => {
        if (status === 201) {
            let advertencia = "";
            if (metodo_pago === "efectivo") {
                advertencia = "Recuerda: Si no pagas en efectivo al menos 2 horas antes del turno, el turno se liberará automáticamente.";
            }
            mostrarMensajePago("¡Pago realizado con éxito!" + advertencia, "green");
            localStorage.removeItem('montoPagar');
        } else {
            mostrarMensajePago(body.error || "Error al realizar el pago.", "red");
        }
    })
    .catch(() => {
        mostrarMensajePago("Error al conectar con el servidor.", "red");
    });
});

function mostrarMensajePago(msg, color) {
    const div = document.getElementById('mensajePago');
    div.textContent = msg;
    div.style.color = color;
}
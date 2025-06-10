const API_TURNOS = "http://localhost:3000/turno";
const API_CANCELACION = "http://localhost:3000/cancelacion";
const API_CLIENTES = "http://localhost:3000/cliente";

function getTurnosCancelados() {
    const json = localStorage.getItem('turnosCancelados');
    return json ? JSON.parse(json) : [];
}

function agregarTurnoCancelado(id) {
    const cancelados = getTurnosCancelados();
    if (!cancelados.includes(id)) {
        cancelados.push(id);
        localStorage.setItem('turnosCancelados', JSON.stringify(cancelados));
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const turnos = await fetch(API_TURNOS).then(res => res.json());
    const select = document.getElementById('turnoId');

    const turnosCancelados = getTurnosCancelados();

    turnos.forEach(turno => {
        if (!turnosCancelados.includes(turno.id.toString())) { 
            const option = document.createElement('option');
            option.value = turno.id;
            option.textContent = `Turno #${turno.id} - ${new Date(turno.fecha_turno).toLocaleString()}`;
            select.appendChild(option);
        }
    });
});

document.getElementById('formCancelar').addEventListener('submit', async function(e) {
    e.preventDefault();
    const turnoId = document.getElementById('turnoId').value;
    const motivoTormenta = document.getElementById('motivoTormenta').value === "si";
    const fecha_cancelacion = new Date().toISOString();

    const option = document.querySelector(`#turnoId option[value='${turnoId}']`);
    let diffHoras = 99999;
    let fechaTurno;
    let mensajeEspecial = "";
    if (option) {
        fechaTurno = new Date(option.textContent.split(' - ')[1]);
        const ahora = new Date();
        diffHoras = (fechaTurno - ahora) / (1000 * 60 * 60);
        if (diffHoras < 2 && !motivoTormenta) {
            mensajeEspecial = 
                "Atención: Está cancelando con menos de 2 horas de anticipación. Solo se le devolverá el 60% del monto abonado.";
        }
    }

    const resp = await fetch(API_CANCELACION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            turnoId,
            fecha_cancelacion,
            cancelacion_tormenta: motivoTormenta
        })
    });

    const data = await resp.json();
    if (resp.ok) {
        let mensaje = data.mensaje || "Turno cancelado correctamente.";
        if (mensajeEspecial) {
            mensaje += " " + mensajeEspecial;
        }
        if (data.detalle) {
            mensaje += " " + data.detalle;
        }

        if (option) {
            option.remove();
        }

        agregarTurnoCancelado(turnoId);

        mostrarMensaje(mensaje, "green");
    } else {
        mostrarMensaje(data.error || "No se pudo cancelar el turno.", "red");
    }
});

function mostrarMensaje(msg, color) {
    const div = document.getElementById('mensajeCancelacion');
    div.textContent = msg;
    div.style.color = color;
}

const params = new URLSearchParams(window.location.search);
const turnoId = params.get('turnoId');
if (turnoId) {
    document.getElementById('turnoId').value = turnoId;
}
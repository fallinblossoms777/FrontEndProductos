const API_CANCELACIONES = "http://localhost:3000/cancelacion";
const API_TURNOS = "http://localhost:3000/turno";
const API_PAGOS = "http://localhost:3000/pago";

document.addEventListener('DOMContentLoaded', async () => {
    const cancelaciones = await fetch(API_CANCELACIONES).then(r => r.json());
    const turnos = await fetch(API_TURNOS).then(r => r.json());
    const pagos = await fetch(API_PAGOS).then(r => r.json());

    const lista = document.getElementById('lista-cancelaciones');
    if (!cancelaciones.length) {
        lista.innerHTML = "<p>No tienes cancelaciones registradas.</p>";
        return;
    }

    let html = "";
    cancelaciones.forEach(canc => {
        const turno = turnos.find(t => t.id == canc.turnoId);
        const pago = pagos.find(p => p.turnoId == canc.turnoId);

        let motivoTexto = "";
        if (canc.cancelacion_tormenta) {
            motivoTexto = "Tormenta (devolución 50%)";
        } else {
            motivoTexto = "Cancelación normal (devolución 60%)";
        }

        html += `<div class="bloque-turno">`;
        html += `<div style="font-weight:bold;">Cancelación #${canc.id}</div>`;
        html += `<div><b>Turno:</b> ${canc.turnoId}</div>`;
        html += `<h3>Turno: ${turno ? new Date(turno.fecha_turno).toLocaleString() : 'Desconocido'}</h3>`;
        html += `<div><b>Fecha de cancelación:</b> ${new Date(canc.fecha_cancelacion).toLocaleString()}</div>`;
        html += `<div><b>Motivo:</b> ${motivoTexto}</div>`;
        if (pago) {
            html += `<div><b>Monto pagado:</b> $${Number(pago.monto).toFixed(2)}</div>`;
        }
        html += `<div><b>Monto devuelto:</b> $${Number(canc.monto_devolucion).toFixed(2)}</div>`;
        html += `</div>`;
    });

    lista.innerHTML = html;
});
const API_ALQUILERES = "http://localhost:3000/alquiler";
const API_PRODUCTOS = "http://localhost:3000/producto";
const API_TURNOS = "http://localhost:3000/turno";
const API_PAGOS = "http://localhost:3000/pago";
const API_CANCELACIONES = "http://localhost:3000/cancelacion";

document.addEventListener('DOMContentLoaded', async () => {
    const [alquileres, productos, turnos, pagos, cancelaciones] = await Promise.all([
        fetch(API_ALQUILERES).then(r => r.json()),
        fetch(API_PRODUCTOS).then(r => r.json()),
        fetch(API_TURNOS).then(r => r.json()),
        fetch(API_PAGOS).then(r => r.json()),
        fetch(API_CANCELACIONES).then(r => r.json())
    ]);

    const lista = document.getElementById('lista-compras');
    if (!alquileres.length) {
        lista.innerHTML = "<p>No tienes compras registradas.</p>";
        return;
    }

    const alquileresPorTurno = {};
    alquileres.forEach(a => {
        if (!alquileresPorTurno[a.turnoId]) alquileresPorTurno[a.turnoId] = [];
        alquileresPorTurno[a.turnoId].push(a);
    });

    let html = "";
    
    Object.keys(alquileresPorTurno).forEach(turnoId => {
        const fueCancelado = cancelaciones.some(c => String(c.turnoId) === String(turnoId));
        if (fueCancelado) return;

        const turno = turnos.find(t => t.id == turnoId);
        if (!turno) return;

        const pago = pagos.find(p => p.turnoId == turnoId);
        let medioPago = "efectivo";
        if (pago && pago.metodo_pago) {
            medioPago = pago.metodo_pago.toLowerCase();
        } else if (alquileresPorTurno[turnoId][0] && alquileresPorTurno[turnoId][0].medio_pago) {
            medioPago = alquileresPorTurno[turnoId][0].medio_pago.toLowerCase();
        }

        const ahora = new Date();
        const fechaTurno = new Date(turno.fecha_turno);
        const diffHoras = (fechaTurno - ahora) / (1000 * 60 * 60);

        if (medioPago === "efectivo" && diffHoras < 2 && diffHoras > 0) {
            html += `<div class="bloque-turno" style="color:#c62828;">
                <b>La compra para el turno del ${fechaTurno.toLocaleString()} fue cancelada automáticamente por falta de pago en efectivo al menos 2 horas antes del inicio.</b>
            </div>`;
            return;
        }
        if (medioPago === "efectivo" && diffHoras <= 0) {
            return;
        }

        html += `<div class="bloque-turno">`;
        html += `<h3>${fechaTurno.toLocaleString()}</h3>`;
        html += `<div><b>Turno N°:</b> ${turnoId}</div>`;
        html += `<div style="margin-bottom:8px;"><b>Monto total pagado:</b> ${pago ? `$${Number(pago.monto).toFixed(2)}` : "$0.00"}</div>`;
        html += `<div><b>Medio de pago:</b> ${medioPago.charAt(0).toUpperCase() + medioPago.slice(1)}</div>`;
        html += `<table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cascos</th>
                    <th>Chalecos</th>
                </tr>
            </thead>
            </body>
        `;
        alquileresPorTurno[turnoId].forEach(a => {
            const prod = productos.find(p => p.id == a.productoId);
            html += `<tr>
                <td>${prod ? prod.tipo : a.productoId}</td>
                <td>${a.casco}</td>
                <td>${a.chaleco_salvavidas}</td>
            </tr>`;
        });
        html += "</tbody></table><br></div>";
    });

    lista.innerHTML = html;
});
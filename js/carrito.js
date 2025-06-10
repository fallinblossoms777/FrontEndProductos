const API_PRODUCTOS = "http://localhost:3000/producto"; 
const API_CLIENTES = "http://localhost:3000/cliente";
const API_ALQUILERES = "http://localhost:3000/alquiler"; 

const PRECIO_CASCO = 5; 
const PRECIO_CHALECO = 3; 

let productos = []; 
let tipoProductoSeleccionado = ""; 

window.addEventListener('DOMContentLoaded', () => {
    fetch(API_PRODUCTOS)
        .then(res => res.json())
        .then(data => {
            productos = data;
            const select = document.getElementById('producto');
            data.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id;
                option.textContent = `${prod.tipo} ($${Number(prod.precio).toFixed(2)})`;
                select.appendChild(option);
            });
        });

    fetch(API_CLIENTES)
        .then(res => res.json())
        .then(clientes => {
            const select = document.getElementById('cliente');

            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} (${cliente.email})`;
                select.appendChild(option);
            });
        });

    document.getElementById('producto').addEventListener('change', mostrarAccesorios);

    mostrarCarrito();
});

function mostrarAccesorios() {
    const prodId = document.getElementById('producto').value;
    const prod = productos.find(p => String(p.id) === String(prodId));
    tipoProductoSeleccionado = prod ? prod.tipo : "";
    document.getElementById('accesorios').style.display =
        (tipoProductoSeleccionado === 'JetSky' || tipoProductoSeleccionado === 'Cuatriciclo') ? '' : 'none';
}

document.getElementById('formAgregar').addEventListener('submit', function(e) {
    e.preventDefault(); 
    const prodId = document.getElementById('producto').value;
    const prod = productos.find(p => String(p.id) === String(prodId));

    const alquiler = {
        productoId: prodId,
        clienteId: document.getElementById('cliente').value,
        fecha_turno: document.getElementById('fecha_turno').value,
        casco: (tipoProductoSeleccionado === 'JetSky' || tipoProductoSeleccionado === 'Cuatriciclo') ? parseInt(document.getElementById('casco').value, 10) : 0,
        chaleco_salvavidas: (tipoProductoSeleccionado === 'JetSky' || tipoProductoSeleccionado === 'Cuatriciclo') ? parseInt(document.getElementById('chaleco_salvavidas').value, 10) : 0,
        nombreProducto: prod.tipo,
        precioBase: Number(prod.precio),
        tipoProducto: prod.tipo
    };

    agregarAlCarrito(alquiler); 
});

function agregarAlCarrito(producto) {
    let carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
    carrito.push(producto); 
    localStorage.setItem('carritoAlquiler', JSON.stringify(carrito)); 

    fetch(API_ALQUILERES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            productoId: producto.productoId,
            casco: producto.casco || 0,
            chaleco_salvavidas: producto.chaleco_salvavidas || 0,
            turnoId: null 
        })
    })
    .then(res => res.json())
    .then(data => {
    })
    .catch(() => {
        alert("Error al guardar el alquiler en la base de datos.");
    });

    alert("Producto agregado al carrito. Puedes ver tu compra en la sección 'Mi compra'.");
}

function mostrarCarrito() {
    let carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
    const contenedor = document.getElementById('carrito');
    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>No hay productos en el carrito.</p>";
        return;
    }

    let resumen = "<ul>";
    let total = 0;

    carrito.forEach(item => {
        let accesorios = 0;
        if (item.tipoProducto === 'JetSky' || item.tipoProducto === 'Cuatriciclo') {
            accesorios = (item.casco * PRECIO_CASCO) + (item.chaleco_salvavidas * PRECIO_CHALECO);
        }
        let subtotal = Number(item.precioBase) + accesorios;
        total += subtotal;

        resumen += `<li>
            <b>${item.nombreProducto}</b>
            ${accesorios ? " | Accesorios: $" + accesorios.toFixed(2) : ""}
            | Subtotal: $${subtotal.toFixed(2)}
        </li>`;
    });
    resumen += "</ul>";

    let descuento = 0;
    if (carrito.length > 1) {
        descuento = total * 0.10;
        resumen += `<p>Descuento por más de un producto: <b>-$${descuento.toFixed(2)}</b></p>`;
    }
    let totalFinal = total - descuento;
    resumen += `<p><b>Total a pagar: $${totalFinal.toFixed(2)}</b></p>`;

    localStorage.setItem('montoPagar', totalFinal.toFixed(2));

    contenedor.innerHTML = resumen;
}

function pagarCarrito() {
    let carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
    let promesas = carrito.map(alquiler =>
        fetch(API_ALQUILERES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alquiler)
        })
    );
    Promise.all(promesas)
        .then(() => {
            localStorage.removeItem('carritoAlquiler');
            mostrarCarrito(); 
            document.getElementById('mensaje').textContent = "¡Alquiler/es realizado/s con éxito!";
            document.getElementById('mensaje').style.color = "green";
        })
        .catch(() => {
            document.getElementById('mensaje').textContent = "Error al conectar con el servidor";
            document.getElementById('mensaje').style.color = "red";
        });
}

mostrarCarrito();

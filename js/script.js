const API_PRODUCTOS = "http://localhost:3000/producto";

const imagenes = {
    'JetSky': 'https://kukuruchos.com/wp-content/uploads/2022/08/skr1.jpeg',
    'Cuatriciclo': 'https://cetrogarmotos.com.ar/wp-content/uploads/mo0535.jpg',
    'Buceo': 'https://m.media-amazon.com/images/I/71LzVNQCG7L._AC_SL1500_.jpg',
    'Tabla Surf Niños': 'https://http2.mlstatic.com/D_NQ_NP_686584-MLU73202222424_122023-O.webp',
    'Tabla Surf Adultos': 'https://acdn.mitiendanube.com/stores/001/102/572/products/producto-vol4-2022-08-25t105950-3431-17027fc9ad814194f516614360068672-1024-1024.png'
};

window.addEventListener('DOMContentLoaded', () => {
    
    fetch(API_PRODUCTOS)
        .then(res => res.json()) 
        .then(productos => {
            const contenedor = document.querySelector('.section'); 
            contenedor.innerHTML = ''; 

            productos.forEach(prod => {
                let html = `
                <article>
                    <img src="${imagenes[prod.tipo] || 'https://via.placeholder.com/150'}" class="foto"> <!-- Mostrar imagen o una genérica -->
                    <h2>${prod.tipo}</h2>
                    <h3>$${Number(prod.precio).toFixed(2)}<br></h3>
                `;

                if (prod.tipo === 'JetSky' || prod.tipo === 'Cuatriciclo') {
                    html += `
                    <form class="form-carrito" data-id="${prod.id}" data-tipo="${prod.tipo}" data-precio="${prod.precio}">
                        <label>Cascos:</label>
                        <input type="number" name="casco" min="0" max="2" value="1"> <!-- Campo para elegir cantidad de cascos -->
                        <span style="font-size:0.95em;color:#00796b;">($5 por casco)</span>
                        <br>
                        <label>Chalecos:</label>
                        <input type="number" name="chaleco_salvavidas" min="0" max="2" value="1"> <!-- Campo para chalecos -->
                        <span style="font-size:0.95em;color:#00796b;">($3 por chaleco)</span>
                        <br>
                        <button type="submit" class="boton-alquilar">Agregar al carrito</button> <!-- Botón del formulario -->
                    </form>
                    `;
                } else {
                    html += `
                    <button class="boton-alquilar btn-carrito" 
                        data-id="${prod.id}" 
                        data-tipo="${prod.tipo}" 
                        data-precio="${prod.precio}">
                        Agregar al carrito
                    </button>`;
                }

                html += `</article>`; 
                contenedor.innerHTML += html; 
            });

            document.querySelectorAll('.form-carrito').forEach(form => {
                form.addEventListener('submit', function(e) {

                    e.preventDefault(); 

                    const prodId = this.dataset.id; 
                    const tipo = this.dataset.tipo; 
                    const precio = Number(this.dataset.precio); 
                    const casco = parseInt(this.casco.value, 10) || 0; 
                    const chaleco = parseInt(this.chaleco_salvavidas.value, 10) || 0;

                    agregarAlCarrito({
                        productoId: prodId,
                        nombreProducto: tipo,
                        precioBase: precio,
                        tipoProducto: tipo,
                        casco, 
                        chaleco_salvavidas: chaleco
                    });
                });
            });
            document.querySelectorAll('.btn-carrito').forEach(btn => {
                btn.addEventListener('click', function() {
                    agregarAlCarrito({
                        productoId: this.dataset.id,
                        nombreProducto: this.dataset.tipo,
                        precioBase: Number(this.dataset.precio),
                        tipoProducto: this.dataset.tipo,
                        casco: 0,
                        chaleco_salvavidas: 0
                    });
                });
            });
        })
        .catch(err => {
            document.querySelector('.section').innerHTML = "<p style='color:red'>No se pudieron cargar los productos.</p>";
            console.error(err); 
        });
});

function agregarAlCarrito(producto) {
    let carrito = JSON.parse(localStorage.getItem('carritoAlquiler')) || [];
    carrito.push(producto);
    localStorage.setItem('carritoAlquiler', JSON.stringify(carrito)); 

    fetch("http://localhost:3000/alquiler", {
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
        console.log("Guardado en alquiler:", data); 
    })
    .catch(err => {
        console.error("Error al guardar alquiler:", err); 
    });

    alert("Producto agregado al carrito.");
}

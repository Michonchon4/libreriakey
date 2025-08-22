const express = require('express');
const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// **IMPORTANTE: Pega tu clave de API de Google aquí**
const genAI = new GoogleGenerativeAI("AIzaSyC7HceaoVLsQnDNBgXHUEF8HDy1kyv8Xf8");

// **IMPORTANTE: Esta línea ya no es necesaria, la gestión de archivos estáticos la hace Netlify**
// app.use(express.static(path.join(__dirname)));

// Configuración de la base de datos
const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

const pool = mysql.createPool(dbConfig);

// Datos de productos (se necesitan en el servidor para que el frontend los solicite)
const allProducts = [
    { id: 'p1', name: "Cuaderno de Puntos", price: 5.99, category: "writing", image: "img/cuaderno_puntos.jpg", description: "Ideal para bocetos y bullet journal.", stock: 20 },
    { id: 'p2', name: "Bolígrafos de Gel", price: 12.50, category: "writing", image: "img/boligrafos_gel.jpg", description: "Tinta suave y colores vibrantes.", stock: 15 },
    { id: 'p3', name: "Lápices de Colores", price: 18.00, category: "writing", image: "img/lapices_colores.jpg", description: "Caja de 24 tonos intensos.", stock: 30 },
    { id: 'p4', name: "Rotuladores de Punta Fina", price: 25.50, category: "writing", image: "img/rotuladores.jpg", description: "Perfectos para contornear y detallar.", stock: 10 },
    { id: 'p5', name: "Set de Pinceles", price: 22.00, category: "writing", image: "img/pinceles.jpg", description: "Variedad de tamaños para todas las técnicas.", stock: 5 },
    { id: 'p6', name: "Kit de Caligrafía", price: 35.00, category: "writing", image: "img/kit_caligrafia.jpg", description: "Incluye plumas, tintas y manual.", stock: 8 },
    { id: 'p7', name: "Carpeta Acordeón", price: 9.99, category: "organization", image: "img/carpeta_acordeon.jpg", description: "12 divisiones para mantener tus documentos en orden.", stock: 25 },
    { id: 'p8', name: "Plumier Metálico", price: 7.00, category: "organization", image: "img/plumier_metalico.jpg", description: "Diseño robusto y minimalista.", stock: 40 },
    { id: 'p9', name: "Caja de Almacenamiento", price: 15.00, category: "organization", image: "img/caja_almacenamiento.jpg", description: "Perfecta para guardar útiles y accesorios.", stock: 18 },
    { id: 'p10', name: "Agenda Anual", price: 20.00, category: "organization", image: "img/agenda_anual.jpg", description: "Planifica tus metas y actividades diarias.", stock: 12 },
    { id: 'p11', name: "Archivador", price: 10.00, category: "organization", image: "img/archivador.jpg", description: "Tamaño A4, con anillas metálicas.", stock: 22 },
    { id: 'p12', name: "Lapicero de Escritorio", price: 8.50, category: "organization", image: "img/lapicero_escritorio.jpg", description: "Organiza tus lápices y bolígrafos.", stock: 35 },
    { id: 'p13', name: "Calculadora Científica", price: 29.99, category: "math", image: "img/calculadora.jpg", description: "Más de 200 funciones y pantalla dual.", stock: 15 },
    { id: 'p14', name: "Juego de Geometría", price: 14.00, category: "math", image: "img/juego_geometria.jpg", description: "Regla, transportador, y compás de precisión.", stock: 28 },
    { id: 'p15', name: "Esferas de Newton", price: 28.00, category: "math", image: "img/esferas_newton.jpg", description: "Un clásico para entender la física.", stock: 7 },
    { id: 'p16', name: "Microscopio", price: 65.00, category: "math", image: "img/microscopio.jpg", description: "Ideal para explorar el mundo microscópico.", stock: 3 },
    { id: 'p17', name: "Globo Terráqueo", price: 45.00, category: "math", image: "img/globo_terraqueo.jpg", description: "Modelo con relieve y mapa político.", stock: 9 },
    { id: 'p18', name: "Lupa de Precisión", price: 11.50, category: "math", image: "img/lupa.jpg", description: "Herramienta esencial para detalles pequeños.", stock: 18 },
    { id: 'p19', name: "Kit Básico Escolar", price: 25.00, category: "kits", image: "img/kit_basico.jpg", description: "Incluye cuadernos, bolígrafos y lápices.", stock: 50 },
    { id: 'p20', name: "Kit de Artista", price: 45.00, category: "kits", image: "img/kit_artista.jpg", description: "Todo lo que necesitas para dibujar y pintar.", stock: 12 },
    { id: 'p21', name: "Kit de Matemáticas", price: 30.00, category: "kits", image: "img/kit_matematicas.jpg", description: "Completo set de herramientas de geometría.", stock: 10 },
    { id: 'p22', name: "Kit Completo", price: 60.00, category: "kits", image: "img/kit_completo.jpg", description: "El kit más grande con todo lo esencial.", stock: 5 }
];

// **NUEVA RUTA para enviar los productos al frontend**
app.get('/api/products', (req, res) => {
    res.json(allProducts);
});

// Rutas de la base de datos (se mantienen sin cambios)
app.post('/guardar_venta_local', async (req, res) => {
    try {
        const { producto, cantidad, total } = req.body;
        const fecha = new Date();
        const query = 'INSERT INTO ventalocal (producto, cantidad, total, fecha) VALUES (?, ?, ?, ?)';
        await pool.execute(query, [producto, cantidad, total, fecha]);
        res.status(201).json({ success: true, message: 'Venta local guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la venta local:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

app.post('/guardar_venta_online', async (req, res) => {
    try {
        const { dni, nombresApellidos, telefono, direccion, productos, cantidadTotal, precioTotal, metodoPago, tarjeta } = req.body;
        const productosJson = JSON.stringify(productos);
        const fechaVenta = new Date();
        const query = 'INSERT INTO ventaonline (dni, nombres_apellidos, numero_telefono, direccion, productos, cantidad_total, precio_total, metodo_pago, tarjeta, fecha_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await pool.execute(query, [dni, nombresApellidos, telefono, direccion, productosJson, cantidadTotal, precioTotal, metodoPago, tarjeta, fechaVenta]);
        res.status(201).json({ success: true, message: 'Venta online guardada con éxito.' });
    } catch (error) {
        console.error('Error al guardar la venta online:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Ruta para el chatbot que se conecta con la IA.
app.post('/chatbot', async (req, res) => {
    const { message } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        const prompt = `Eres un asistente virtual para una librería llamada "Librería Key". Tu propósito es responder a preguntas sobre los productos que vendemos, la moneda que usamos son los soles peruanos. Solo responde a preguntas sobre nuestros productos o temas relacionados. Si te preguntan algo fuera de este contexto, responde amablemente que no puedes ayudar con eso.

        Lista de productos disponibles:
        ${JSON.stringify(allProducts, null, 2)}

        Pregunta del cliente: ${message}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ response: text });
    } catch (error) {
        console.error('Error al conectar con la API de Google:', error.message);
        res.status(500).json({ response: 'Lo siento, hubo un error al conectar con la IA.' });
    }
});

// Nueva ruta para manejar las reservas de productos
app.post('/reservar', async (req, res) => {
    try {
        const { fullName, productName, quantity, email, phone } = req.body;
        const query = 'INSERT INTO reservas (nombre_completo, producto_nombre, cantidad, email, telefono) VALUES (?, ?, ?, ?, ?)';
        await pool.execute(query, [fullName, productName, quantity, email, phone]);
        res.status(200).json({ message: 'Reserva registrada con éxito. Nos pondremos en contacto contigo pronto.' });
    } catch (error) {
        console.error('Error al registrar la reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la reserva.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor de Librería Key corriendo en http://localhost:${port}`);
});

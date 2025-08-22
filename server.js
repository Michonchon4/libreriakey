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

// Servir archivos estáticos del frontend. Esta línea es crucial.
app.use(express.static(path.join(__dirname)));

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'tienda_papeleria'
};

const pool = mysql.createPool(dbConfig);

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

// Datos de productos para que la IA pueda consultarlos
const allProducts = [
    { name: "Cuaderno de Puntos", description: "Ideal para bocetos y bullet journal.", price: 5.99 },
    { name: "Bolígrafos de Gel", description: "Tinta suave y colores vibrantes.", price: 12.50 },
    { name: "Lápices de Colores", description: "Caja de 24 tonos intensos.", price: 18.00 },
    { name: "Rotuladores de Punta Fina", description: "Perfectos para contornear y detallar.", price: 25.50 },
    { name: "Set de Pinceles", description: "Variedad de tamaños para todas las técnicas.", price: 22.00 },
    { name: "Kit de Caligrafía", description: "Incluye plumas, tintas y manual.", price: 35.00 },
    { name: "Carpeta Acordeón", description: "12 divisiones para mantener tus documentos en orden.", price: 9.99 },
    { name: "Plumier Metálico", description: "Diseño robusto y minimalista.", price: 7.00 },
    { name: "Caja de Almacenamiento", description: "Perfecta para guardar útiles y accesorios.", price: 15.00 },
    { name: "Agenda Anual", description: "Planifica tus metas y actividades diarias.", price: 20.00 },
    { name: "Archivador", description: "Tamaño A4, con anillas metálicas.", price: 10.00 },
    { name: "Lapicero de Escritorio", description: "Organiza tus lápices y bolígrafos.", price: 8.50 },
    { name: "Calculadora Científica", description: "Más de 200 funciones y pantalla dual.", price: 29.99 },
    { name: "Juego de Geometría", description: "Regla, transportador, y compás de precisión.", price: 14.00 },
    { name: "Esferas de Newton", description: "Un clásico para entender la física.", price: 28.00 },
    { name: "Microscopio", description: "Ideal para explorar el mundo microscópico.", price: 65.00 },
    { name: "Globo Terráqueo", description: "Modelo con relieve y mapa político.", price: 45.00 },
    { name: "Lupa de Precisión", description: "Herramienta esencial para detalles pequeños.", price: 11.50 },
    { name: "Kit Básico Escolar", description: "Incluye cuadernos, bolígrafos y lápices.", price: 25.00 },
    { name: "Kit de Artista", description: "Todo lo que necesitas para dibujar y pintar.", price: 45.00 },
    { name: "Kit de Matemáticas", description: "Completo set de herramientas de geometría.", price: 30.00 },
    { name: "Kit Completo", description: "El kit más grande con todo lo esencial.", price: 60.00 }
];

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
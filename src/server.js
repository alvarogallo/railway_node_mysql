const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Importa el módulo path

const app = express();
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Para manejar JSON en las solicitudes

const server = http.createServer(app);

// Configurar el servidor Socket.IO para permitir CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Cambia esto si necesitas permitir un origen específico
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Leer el archivo JSON que contiene los canales y tokens
function obtenerCanales() {
    const filePath = path.resolve(__dirname, '../json_from_api_db/senders.json'); // Cambia la ruta aquí
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Endpoint para comprobar la conexión
app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host'); // Obtiene la URL base
    res.send(`Servidor Socket.IO corriendo con CORS en: ${url}`);
});

// Escuchar conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('mensaje', (data) => {
        const { canal, token } = data; // Extraer canal y token del mensaje
        const canales = obtenerCanales();

        // Validar si el canal y el token son válidos
        const validacion = canales.find(c => c.canal === canal && c.token === token);

        if (validacion) {
            console.log('Mensaje recibido:', data);
            socket.emit('respuesta', 'Validación exitosa. Mensaje recibido correctamente.');
        } else {
            console.log('Error de validación:', data);
            socket.emit('respuesta', 'Error: Canal o token inválido.');
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

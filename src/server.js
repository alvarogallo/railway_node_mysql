const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configurar el servidor Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Cargar el archivo JSON una sola vez en el inicio del servidor
const filePath = path.resolve(__dirname, '../json_from_api_db/senders.json');
let canales;

try {
    const data = fs.readFileSync(filePath, 'utf8');
    canales = JSON.parse(data);
    console.log('JSON cargado exitosamente:', canales);
} catch (error) {
    console.error('Error al cargar el archivo JSON:', error);
    process.exit(1); // Salir si el JSON no puede ser cargado
}

// Comprobar conexión
app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host');
    res.send(`Servidor Socket.IO corriendo con CORS en: ${url}`);
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('mensaje', (data) => {
        const { canal, token, evento, mensaje } = data;

        // Obtener la IP del cliente
        const ipDelEnviador = socket.handshake.address;

        // Validar canal, token e IP
        const validacion = canales.find(c => c.canal === canal && c.token === token && c.ip === ipDelEnviador);

        if (validacion) {
            console.log(`Mensaje recibido del evento ${evento}: ${mensaje}`);
            socket.emit('respuesta', {
                mensaje: 'Validación exitosa. Mensaje recibido correctamente.',
                ip: ipDelEnviador,
                evento: evento,
                mensajeRecibido: mensaje
            });
        } else {
            const validacionCanalToken = canales.find(c => c.canal === canal && c.token === token);
            if (validacionCanalToken) {
                console.log('Error de validación: IP no autorizada');
                socket.emit('respuesta', {
                    mensaje: 'Error: IP no autorizada.',
                    ip: ipDelEnviador
                });
            } else {
                console.log('Error de validación: Canal o token inválido');
                socket.emit('respuesta', {
                    mensaje: 'Error: Canal o token inválido.',
                    ip: ipDelEnviador
                });
            }
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

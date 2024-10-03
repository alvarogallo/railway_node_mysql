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

// Leer el archivo JSON que contiene los canales, tokens e IPs
function obtenerCanales() {
    const filePath = path.resolve(__dirname, '../json_from_api_db/senders.json'); // Cambia la ruta aquí si es necesario
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
        const { canal, token, evento, mensaje } = data; // Extraer canal, token, evento y mensaje del mensaje del cliente
        const canales = obtenerCanales();

        // Obtener la IP del cliente
        const ipDelEnviador = socket.handshake.address;

        // Validar si el canal, token e IP son válidos
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
            // Verificar si la IP es la causa del fallo
            const validacionCanalToken = canales.find(c => c.canal === canal && c.token === token);
            if (validacionCanalToken) {
                console.log('Error de validación: IP no autorizada para:', data);
                socket.emit('respuesta', {
                    mensaje: 'Error: IP no autorizada.',
                    ip: ipDelEnviador
                });
            } else {
                console.log('Error de validación: Canal o token inválido para:', data);
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

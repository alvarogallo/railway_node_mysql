const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());  // Habilita CORS para todas las rutas

const server = http.createServer(app);

// Configurar el servidor Socket.IO para permitir CORS
const io = new Server(server, {
    cors: {
        origin: "*",  // Cambia esto si necesitas permitir un origen específico
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Cargar el archivo JSON
const cargarCanales = () => {
    const jsonPath = path.join(__dirname, '../json_from_api_db/senders.json');
    const data = fs.readFileSync(jsonPath);
    return JSON.parse(data);
};

// Almacenar los canales
let canales = cargarCanales();

// Validar el canal
function validarEnviador(canal) {
    const canalExistente = canales.find(c => c.canal === canal);
    if (!canalExistente) {
        return {
            error: 'El canal no existe',
            razon: 'Canal no encontrado en la lista de validadores'
        };
    }
    return { error: '', razon: '' };
}

app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host'); // Obtiene la URL base
    res.send(`Servidor Socket.IO corriendo con CORS en: ${url}`);
});

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('mensaje', (data) => {
        const canal = data.canal; // Obtener el canal enviado desde el cliente
        const validacion = validarEnviador(canal);

        if (validacion.error) {
            console.log('Algun error ha sucedido:', validacion.razon);
            socket.emit('respuesta', validacion.razon); // Enviar la razón al cliente
            return; // Detener la ejecución si hay un error
        }

        console.log('Mensaje recibido:', data.data);
        socket.emit('respuesta', 'Mensaje recibido correctamente');
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

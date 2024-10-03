const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const validarEnviador = require('../validaciones/validar_enviador'); // Importa la función

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

app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host'); // Obtiene la URL base
  res.send(`Servidor Socket.IO corriendo con CORS en: ${url}`);
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data);

    const [error, razon] = validarEnviador(); // Llama a la función de validación

    if (error) {
      console.error('Algun error ha sucedido:', razon);
      socket.emit('respuesta', razon); // Devuelve el mensaje de error
      return; // Termina la ejecución de la función si hay un error
    }

    socket.emit('respuesta', 'Mensaje recibido correctamente');
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

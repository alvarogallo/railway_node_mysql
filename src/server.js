const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());  // Habilita CORS para todas las rutas

const server = http.createServer(app);

// Configurar el servidor Socket.IO para permitir CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8000",  // Cambia esto si necesitas permitir un origen específico
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor Socket.IO corriendo con CORS');
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data);
    socket.emit('respuesta', 'Mensaje recibido correctamente');
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

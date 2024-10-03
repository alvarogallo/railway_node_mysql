const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Servir un mensaje simple para probar
app.get('/', (req, res) => {
  res.send('Servidor Socket.IO corriendo');
});

// Configurar evento para manejar las conexiones de sockets
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado', socket.id);

  // Puedes escuchar eventos específicos aquí
  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido: ', data);
    // Enviar una respuesta al cliente
    socket.emit('respuesta', 'Mensaje recibido en el servidor');
  });

  // Detectar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado', socket.id);
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor Socket.IO corriendo en el puerto ${PORT}`);
});

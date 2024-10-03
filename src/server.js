const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Ruta al archivo JSON de listeners
const listenersPath = path.join(__dirname, '../json_from_api_db/listeners.json');

// Función para validar canal y token
function validarListener(canal, token) {
  try {
    const data = fs.readFileSync(listenersPath, 'utf8');
    const listeners = JSON.parse(data);

    const listenerValido = listeners.find(
      (listener) => listener.canal === canal && listener.token === token
    );

    if (listenerValido) {
      return { error: '', ip: listenerValido.ip };
    } else {
      return { error: 'Canal o token no válidos', ip: null };
    }
  } catch (err) {
    console.error('Error al leer el archivo listeners.json:', err);
    return { error: 'Error en la validación', ip: null };
  }
}

// Ruta de prueba para el servidor
app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host');
  res.send(`Servidor Socket.IO corriendo en: ${url}`);
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Escuchar el evento 'listener' con canal y token
  socket.on('listener', (data) => {
    const { canal, token } = data;

    // Validar canal y token
    const resultadoValidacion = validarListener(canal, token);

    if (resultadoValidacion.error) {
      console.log('Error en la validación:', resultadoValidacion.error);
      socket.emit('respuesta', { mensaje: resultadoValidacion.error });
    } else {
      console.log('Listener válido:', { canal, token, ip: resultadoValidacion.ip });
      socket.emit('respuesta', { mensaje: 'Validación exitosa', ip: resultadoValidacion.ip });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

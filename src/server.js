const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // Middleware para procesar JSON

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

// Cargar el archivo JSON de listeners una vez en memoria
let listeners = [];
try {
  const data = fs.readFileSync(listenersPath, 'utf8');
  listeners = JSON.parse(data);
} catch (err) {
  console.error('Error al cargar el archivo listeners.json:', err);
}

// Función para validar canal y token
function validarListener(canal, token) {
  const listenerValido = listeners.find(
    (listener) => listener.canal === canal && listener.token === token
  );

  if (listenerValido) {
    return { error: '', ip: listenerValido.ip };
  } else {
    return { error: 'Canal o token no válidos', ip: null };
  }
}

// Ruta de prueba para el servidor
app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host');
  res.send(`Servidor Socket.IO corriendo en: ${url}`);
});

// Manejar solicitudes POST y emitir eventos a través de Socket.IO
app.post('/enviar-mensaje', (req, res) => {
  const { canal, token, evento, mensaje } = req.body;

  if (!canal || !token || !evento || !mensaje) {
    return res.status(400).json({ error: 'Faltan parámetros en la solicitud' });
  }

  // Validar el canal y el token
  const resultadoValidacion = validarListener(canal, token);

  if (resultadoValidacion.error) {
    return res.status(400).json({ error: resultadoValidacion.error });
  } else {
    io.to(canal).emit(evento, mensaje); // Enviar el evento y el mensaje al canal correspondiente
    return res.json({ mensaje: 'Evento enviado correctamente' });
  }
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Recibir evento 'enviarEvento' desde el enviador
  socket.on('enviarEvento', (data) => {
    const { canal, token, evento, mensaje } = data;

    // Validar canal y token
    const resultadoValidacion = validarListener(canal, token);

    if (resultadoValidacion.error) {
      console.log('Error en la validación:', resultadoValidacion.error);
      socket.emit('respuesta', { mensaje: resultadoValidacion.error });
    } else {
      console.log('Evento enviado:', { canal, evento, mensaje });
      io.to(canal).emit(evento, mensaje); // Enviar el evento y el mensaje al canal correspondiente
    }
  });

  // Unirse a un canal
  socket.on('unirseCanal', (data) => {
    const { canal, token } = data;

    // Validar canal y token
    const resultadoValidacion = validarListener(canal, token);

    if (resultadoValidacion.error) {
      socket.emit('respuesta', { mensaje: resultadoValidacion.error });
    } else {
      socket.join(canal); // Unirse al canal si es válido
      socket.emit('respuesta', { mensaje: `Te has unido al canal: ${canal}` });
      console.log(`Socket ${socket.id} se unió al canal ${canal}`);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Arrancar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

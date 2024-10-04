const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const validarEnviador = require('../validaciones/validar_enviador'); // Asegúrate de importar correctamente la función

const app = express();
app.use(cors());
app.use(express.json()); // Para interpretar JSON en el cuerpo de la solicitud

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

// Función para validar listeners
function validarListener(canal, token) {
  try {
    const data = fs.readFileSync(listenersPath, 'utf8');
    const listeners = JSON.parse(data);

    const listenerValido = listeners.find(
      (listener) => listener.canal === canal && listener.token === token
    );

    if (listenerValido) {
      return [null, 'Listener válido.'];
    } else {
      return ['listener_invalido', 'Canal o token no válidos para listener.'];
    }
  } catch (err) {
    console.error('Error al leer el archivo listeners.json:', err);
    return ['error_archivo', 'Error en la validación de listeners.'];
  }
}

// Ruta de prueba para el servidor
app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host');
  res.send(`Servidor Socket.IO corriendo en: ${url}`);
});

// Ruta POST para validar enviador y emitir eventos
app.post('/enviar-mensaje', (req, res) => {
  const { canal, token, evento, mensaje } = req.body;
  const ipCliente = req.ip; // Obtener la IP del solicitante

  // Validar canal, token e IP usando validarEnviador
  const [error, razon] = validarEnviador(canal, token, ipCliente);

  if (error) {
    return res.status(400).json({ error, mensaje: razon });
  }

  // Emitir el evento si la validación fue exitosa
  io.to(canal).emit(evento, mensaje);
  res.json({ mensaje: 'Evento enviado correctamente' });
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Recibir evento 'enviarEvento' desde el enviador
  socket.on('enviarEvento', (data) => {
    const { canal, token, evento, mensaje } = data;
    const ipCliente = socket.handshake.address;

    // Validar canal, token e IP usando validarEnviador
    const [error, razon] = validarEnviador(canal, token, ipCliente);

    if (error) {
      console.log('Error en la validación:', razon);
      socket.emit('respuesta', { mensaje: razon });
    } else {
      console.log('Evento enviado:', { canal, evento, mensaje });
      io.to(canal).emit(evento, mensaje); // Enviar el evento y el mensaje al canal correspondiente
    }
  });

  // Unirse a un canal
  socket.on('unirseCanal', (data) => {
    const { canal, token } = data;

    // Validar canal y token para listeners
    const [error, razon] = validarListener(canal, token);

    if (error) {
      socket.emit('respuesta', { mensaje: razon });
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

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

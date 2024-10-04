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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Ruta al archivo JSON de enviadores
const sendersPath = path.join(__dirname, '../json_from_api_db/senders.json');

// Función para validar canal, token e IP del enviador
function validarEnviador(canal, token, ipCliente) {
  try {
    const data = fs.readFileSync(sendersPath, 'utf8');
    const enviadores = JSON.parse(data);

    const enviadorValido = enviadores.find(
      (enviador) => enviador.canal === canal && enviador.token === token
    );

    if (enviadorValido) {
      if (enviadorValido.ip === '0.0.0.0' || enviadorValido.ip === ipCliente) {
        return { error: '', ip: enviadorValido.ip };
      } else {
        return { error: 'IP no autorizada', ip: null };
      }
    } else {
      return { error: 'Canal o token no válidos', ip: null };
    }
  } catch (err) {
    console.error('Error al leer el archivo senders.json:', err);
    return { error: 'Error en la validación', ip: null };
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
  const ipCliente = req.ip;  // Obtener IP del cliente

  // Validar el canal, token y IP
  const resultadoValidacion = validarEnviador(canal, token, ipCliente);

  if (resultadoValidacion.error) {
    res.status(400).json({ error: resultadoValidacion.error });
  } else {
    io.to(canal).emit(evento, mensaje);
    res.json({ mensaje: 'Evento enviado correctamente' });
  }
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Recibir evento 'enviarEvento' desde el enviador
  socket.on('enviarEvento', (data) => {
    const { canal, token, evento, mensaje } = data;
    const ipCliente = socket.handshake.address;  // Obtener la IP del cliente

    // Validar canal, token y IP
    const resultadoValidacion = validarEnviador(canal, token, ipCliente);

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
    const ipCliente = socket.handshake.address;  // Obtener la IP del cliente

    // Validar canal, token y IP
    const resultadoValidacion = validarEnviador(canal, token, ipCliente);

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

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

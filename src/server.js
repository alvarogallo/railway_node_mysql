const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const validarEnviador = require('../validaciones/validar_enviador');

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

const listenersPath = path.join(__dirname, '../json_from_api_db/listeners.json');
const logPath = path.join(__dirname, '../public', 'server_logs.json');

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

function addLog(canal, evento, mensaje) {
  const now = new Date();
  const logEntry = {
    created_at: now.toISOString(),
    canal,
    evento,
    mensaje
  };

  let logs = [];
  if (fs.existsSync(logPath)) {
    const fileContent = fs.readFileSync(logPath, 'utf8');
    logs = JSON.parse(fileContent);
  }

  logs.push(logEntry);

  // Filtrar logs de las últimas 24 horas
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  logs = logs.filter(log => new Date(log.created_at) > oneDayAgo);

  // Limitar a 200 registros si es necesario
  if (logs.length > 200) {
    logs = logs.slice(-200);
  }

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}


// app.get('/', (req, res) => {
//   const url = req.protocol + '://' + req.get('host');
//   res.send(`Servidor Socket.IO corriendo en: ${url}`);
// });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public',  'index.html'));
});

// app.post('/enviar-mensaje', (req, res) => {
//   const { canal, token, evento, mensaje } = req.body;
//   const ipCliente = req.ip;
  
//   const [error, razon] = validarEnviador(canal, token, ipCliente);
  
//   if (error) {
//     return res.status(400).json({ error, mensaje: razon });
//   }
  
//   io.to(canal).emit(evento, mensaje);
//   res.json({ mensaje: 'Evento enviado correctamente' });
// });

app.post('/enviar-mensaje', (req, res) => {
  const { canal, token, evento, mensaje } = req.body;
  const ipCliente = req.ip;
  
  const [error, razon] = validarEnviador(canal, token, ipCliente);
  
  if (error) {
    return res.status(400).json({ error, mensaje: razon });
  }
  
  io.to(canal).emit(evento, mensaje);
  addLog(canal, evento, mensaje);
  res.json({ mensaje: 'Evento enviado correctamente' });
});


io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // socket.on('enviarEvento', (data) => {
  //   const { canal, token, evento, mensaje } = data;
  //   const ipCliente = socket.handshake.address;
    
  //   const [error, razon] = validarEnviador(canal, token, ipCliente);
    
  //   if (error) {
  //     console.log('Error en la validación:', razon);
  //     socket.emit('respuesta', { mensaje: razon });
  //   } else {
  //     console.log('Evento enviado:', { canal, evento, mensaje });
  //     io.to(canal).emit(evento, mensaje);
  //   }
  // });

  socket.on('enviarEvento', (data) => {
    const { canal, token, evento, mensaje } = data;
    const ipCliente = socket.handshake.address;
    
    const [error, razon] = validarEnviador(canal, token, ipCliente);
    
    if (error) {
      console.log('Error en la validación:', razon);
      socket.emit('respuesta', { mensaje: razon });
    } else {
      console.log('Evento enviado:', { canal, evento, mensaje });
      io.to(canal).emit(evento, mensaje);
      addLog(canal, evento, mensaje);
    }
  });

  // socket.on('unirseCanal', (data) => {
  //   const { canal, token } = data;
    
  //   const [error, razon] = validarListener(canal, token);
    
  //   if (error) {
  //     socket.emit('respuesta', { mensaje: razon });
  //   } else {
  //     socket.join(canal);
  //     socket.emit('respuesta', { mensaje: `Te has unido al canal: ${canal}` });
  //     console.log(`Socket ${socket.id} se unió al canal ${canal}`);
  //   }
  // });

  socket.on('unirseCanal', (data) => {
    const { canal, token } = data;
    
    const [error, razon] = validarListener(canal, token);
    
    if (error) {
      socket.emit('respuesta', { mensaje: razon });
    } else {
      socket.join(canal);
      socket.emit('respuesta', { mensaje: `Te has unido al canal: ${canal}` });
      console.log(`Socket ${socket.id} se unió al canal ${canal}`);
      addLog(canal, 'unirseCanal', { socketId: socket.id });
    }
  });

  // socket.on('disconnect', () => {
  //   console.log('Cliente desconectado');
  // });
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
    addLog('system', 'disconnect', { socketId: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

// Variable para determinar qué fuente de datos usar
let cual_usar = 'json_local'; // Valores posibles: 'json_local' o 'json_api'

const listenersPath = path.join(__dirname, '../json_from_api_db/listeners.json');
const sendersPath = path.join(__dirname, '../json_from_api_db/senders.json');
const logPath = path.join(__dirname, '../public', 'server_logs.json');

let listeners = [];
let senders = [];

async function loadData() {
  if (cual_usar === 'json_local') {
    listeners = readLocalData(listenersPath) || [];
    senders = readLocalData(sendersPath) || [];
    console.log('Datos cargados desde archivos locales');
  } else if (cual_usar === 'json_api') {
    const apiData = await fetchDataFromAPI();
    if (apiData) {
      listeners = apiData.listeners || [];
      senders = apiData.senders || [];
      console.log('Datos cargados desde la API');
    } else {
      console.error('Error al cargar datos de la API. Usando datos locales como respaldo.');
      listeners = readLocalData(listenersPath) || [];
      senders = readLocalData(sendersPath) || [];
    }
  }
}

function validarListener(canal, token) {
  const listenerValido = listeners.find(
    (listener) => listener.canal === canal && listener.token === token
  );
  
  if (listenerValido) {
    return [null, 'Listener válido.'];
  } else {
    return ['listener_invalido', 'Canal o token no válidos para listener.'];
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
  try {
    if (fs.existsSync(logPath)) {
      const fileContent = fs.readFileSync(logPath, 'utf8');
      logs = JSON.parse(fileContent);
    } else {
      console.log('Archivo de log no encontrado. Creando uno nuevo.');
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
    console.log('Log agregado exitosamente.');
  } catch (error) {
    console.error('Error al manejar el archivo de log:', error);
  }
}

function addServerRebootLog() {
  addLog('system', 'server_reboot', 'Servidor Rebooted');
}

async function fetchDataFromAPI() {
  try {
    const response = await axios.get('https://apisbotman.unatecla.com/api/SK/json_sockets');
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API:', error);
    return null;
  }
}

function readLocalData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading local file ${filePath}:`, error);
    return null;
  }
}

// Llamar a la función de log de reinicio al iniciar el servidor
addServerRebootLog();

// Cargar datos iniciales
loadData();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public',  'index.html'));
});

app.get('/logs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'logs.html'));
});

app.get('/api/logs', (req, res) => {
  if (fs.existsSync(logPath)) {
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    res.json(logs);
  } else {
    res.json([]);
  }
});

// Nueva ruta para cambiar la fuente de datos
app.post('/set-data-source', (req, res) => {
  const { source } = req.body;
  if (source === 'json_local' || source === 'json_api') {
    cual_usar = source;
    loadData(); // Recargar datos inmediatamente
    res.json({ message: `Fuente de datos cambiada a ${source}` });
  } else {
    res.status(400).json({ error: 'Fuente de datos no válida' });
  }
});

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

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
    addLog('system', 'disconnect', { socketId: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
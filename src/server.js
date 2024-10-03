const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const validarEnviador = require('../validaciones/validar_enviador'); // Importa la función

const app = express();
app.use(cors()); // Habilita CORS para todas las rutas

const server = http.createServer(app);

// Configurar el servidor Socket.IO para permitir CORS
const io = new Server(server, {
  cors: {
    origin: "", // Cambia esto si necesitas permitir un origen específico
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Leer los canales desde el archivo JSON
let canales = [];

// Ruta del archivo JSON
const jsonFilePath = path.join(__dirname, '../json_from_api_db/senders.json');

// Leer el archivo JSON y extraer los canales
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo JSON:', err);
    return;
  }

  try {
    const jsonData = JSON.parse(data);
    // Extraer los canales del JSON
    canales = jsonData.map(item => item.cha || item.can).filter(Boolean);
    console.log('Canales cargados:', canales); // Mostrar los canales cargados
  } catch (parseErr) {
    console.error('Error al parsear el JSON:', parseErr);
  }
});

app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host'); // Obtiene la URL base
  res.send(`Servidor Socket.IO corriendo con CORS en: ${url}`);
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('mensaje', (data) => {
    console.log('Mensaje recibido:', data);

    const canal = data.canal; // Esperamos que el canal venga en el mensaje
    const [error, razon] = validarEnviador(canal, canales); // Llama a la función de validación

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

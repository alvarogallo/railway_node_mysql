// const express = require('express');
// const app = express();
// const port = process.env.PORT || 8080;

// app.get('/', (req, res) => {
//   res.send('Funcionando');
// });

// app.listen(port, () => {
//   console.log(`Servidor corriendo en http://localhost:${port}`);
// });

// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const database = require('./db');

app.get('/', async (req, res) => {
  try {
    const result = await database.query('SELECT NOW() as now');
    res.send(`Funcionando. Hora de la base de datos: ${result[0].now}`);
  } catch (err) {
    console.error(err);
    res.send('Error al conectar con la base de datos');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
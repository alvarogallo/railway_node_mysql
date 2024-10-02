const mysql = require('mysql2');

// Crea la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,  // Host de tu base de datos en Railway
  user: process.env.MYSQLUSER,  // Usuario de tu base de datos
  password: process.env.MYSQLPASSWORD,  // Contraseña de tu base de datos
  database: process.env.MYSQLDATABASE,  // Nombre de la base de datos
  port: process.env.MYSQLPORT  // Puerto de la base de datos
});

// Conéctate a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos como ID ' + connection.threadId);
});

module.exports = connection;

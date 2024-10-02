const mysql = require('mysql2');

// Configurar la conexión directamente en el código
const connection = mysql.createConnection({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'dSrhyoXVNnNhIJfXhFHJemcviwIqDMKe',
  database: 'railway',
  port: 3306
});

// Conéctate a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos como ID ' + connection.threadId);
});

// Ejemplo de una consulta
connection.query('SELECT 1 + 1 AS solution', (error, results) => {
  if (error) {
    console.error('Error en la consulta:', error);
    return;
  }
  console.log('El resultado de la consulta es:', results[0].solution);
});

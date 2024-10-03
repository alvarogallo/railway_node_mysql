<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cliente Socket.IO - Escuchar Eventos</title>
</head>
<body>
    <h1>Cliente Socket.IO</h1>
    <p id="estado">Estado: Desconectado</p>

    <!-- Input para el canal y el token -->
    <label for="canal">Canal:</label>
    <input type="text" id="canal" placeholder="Escribe el canal" value="ais_shipping">
    <br><br>
    <label for="token">Token:</label>
    <input type="text" id="token" placeholder="Escribe el token" value="envidor">
    <br><br>

    <!-- Botón para conectarse al servidor -->
    <button id="conectarServidor">Conectar al Servidor</button>
    <br><br>

    <!-- Input para el evento y mensaje -->
    <label for="evento">Evento:</label>
    <input type="text" id="evento" placeholder="Escribe el evento" value="mi_evento">
    <br><br>
    <label for="mensaje">Mensaje:</label>
    <input type="text" id="mensaje" placeholder="Escribe el mensaje" value="Hola desde cliente">
    <br><br>

    <!-- Botón para enviar mensaje -->
    <button id="enviarMensaje" disabled>Enviar Mensaje</button>
    <p id="respuestaServidor"></p>

    <!-- Incluye el cliente Socket.IO -->
    <script src="https://cdn.socket.io/4.0.1/socket.io.min.js"></script>

    <script>
        const servidor = "http://localhost:3000";  // Cambia si usas servidor remoto
        let socket;

        // Función para conectar al servidor
        function conectar() {
            socket = io(servidor);

            // Actualizar el estado cuando se conecta
            socket.on('connect', () => {
                document.getElementById('estado').textContent = 'Estado: Conectado al servidor';
                document.getElementById('enviarMensaje').disabled = false;
                console.log('Conectado al servidor:', servidor);
            });

            // Manejar la desconexión
            socket.on('disconnect', () => {
                document.getElementById('estado').textContent = 'Estado: Desconectado';
                document.getElementById('enviarMensaje').disabled = true;
                console.log('Desconectado del servidor');
            });

            // Escuchar la respuesta del servidor
            socket.on('respuesta', (data) => {
                document.getElementById('respuestaServidor').textContent = 'Respuesta del servidor: ' + data.mensaje;
                console.log('Respuesta recibida del servidor:', data);
            });
        }

        // Enviar un mensaje al servidor al hacer clic en el botón
        document.getElementById('enviarMensaje').addEventListener('click', () => {
            const canal = document.getElementById('canal').value;
            const token = document.getElementById('token').value;
            const evento = document.getElementById('evento').value;
            const mensaje = document.getElementById('mensaje').value;

            socket.emit('mensaje', { canal, token, evento, mensaje });
            console.log('Mensaje enviado al servidor:', { canal, token, evento, mensaje });
        });

        // Conectar al servidor al hacer clic en el botón "Conectar al Servidor"
        document.getElementById('conectarServidor').addEventListener('click', conectar);
    </script>
</body>
</html>

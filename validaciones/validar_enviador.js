// validaciones/validar_enviador.js

function validarEnviador(canal, canales) {
  // Verifica si el canal existe
  if (!canales.includes(canal)) {
    const error = 'canal_no_encontrado'; // Mensaje de error si el canal no existe
    const razon = `El canal '${canal}' no existe.`;
    return [error, razon];
  }

  // Si el canal existe, no hay error
  const error = ''; 
  const razon = 'Canal válido.'; // Mensaje de razón

  return [error, razon];
}

module.exports = validarEnviador;

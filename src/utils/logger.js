const fs = require('fs');
const path = require('path');

// Carpeta 'logs' en la raíz
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

function logError(msg, context = '') {
  const linea = `[${new Date().toISOString()}] ❌ ERROR${context ? ' [' + context + ']' : ''}: ${msg}\n`;
  fs.appendFileSync(path.join(logsDir, 'errors.log'), linea);
}

function logWarning(msg, context = '') {
  const linea = `[${new Date().toISOString()}] ⚠️ WARNING${context ? ' [' + context + ']' : ''}: ${msg}\n`;
  fs.appendFileSync(path.join(logsDir, 'warnings.log'), linea);
}


module.exports = {
  logError,
  logWarning
};

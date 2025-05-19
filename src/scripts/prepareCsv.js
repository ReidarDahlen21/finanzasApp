const fs = require('fs');
const path = require('path');
const readline = require('readline');

const inputFilePath = path.join(__dirname, '../../Movimientos (20).csv');
const outputFilePath = path.join(__dirname, '../../Movimientos_limpio.csv');

const columnasNumericas = ['Cantidad', 'Precio', 'Importe'];
const columnasFecha = ['Fecha', 'Liquidación'];

// Función para convertir fecha dd/mm/yyyy → yyyy-mm-dd
function normalizarFecha(fecha) {
  const [d, m, y] = fecha.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Procesar línea por línea
(async () => {
  const input = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
  const output = fs.createWriteStream(outputFilePath, { encoding: 'utf8' });

  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  let encabezado = [];
  let esPrimera = true;

  for await (const line of rl) {
    if (!line.trim()) continue; // saltar líneas vacías

    const columnas = line.split(';');

    if (esPrimera) {
      encabezado = columnas;
      output.write(encabezado.join(';') + '\n');
      esPrimera = false;
      continue;
    }

    const fila = columnas.map((valor, index) => {
      const nombreCol = encabezado[index];

      // reemplazar , por . solo en campos numéricos
      if (columnasNumericas.includes(nombreCol)) {
        return valor.replace(',', '.');
      }

      // normalizar fechas
      if (columnasFecha.includes(nombreCol)) {
        return normalizarFecha(valor);
      }

      return valor;
    });

    output.write(fila.join(';') + '\n');
  }

  console.log('✅ Archivo procesado y guardado como Movimientos_limpio.csv');
})();

//este archivo no debería utilizarse más ya que el chequeo de símbolos se agregó en uploadOperations.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pool = require('../config/db');

const inputFile = path.join(__dirname, '../../Movimientos_limpio.csv');

(async () => {
  const tickersSet = new Set();

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity
  });

  let headers = [];
  let indexTicker;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const cols = line.split(';');

    if (!headers.length) {
      headers = cols;
      indexTicker = headers.indexOf('Ticker');
      continue;
    }

    const ticker = cols[indexTicker].trim();

    if (ticker && ticker !== '-' && ticker !== '') {
      tickersSet.add(ticker);
    }
  }

  const tickers = Array.from(tickersSet);
  console.log(`🔍 Tickers detectados en CSV: ${tickers.join(', ')}`);

  // Verificamos cuáles ya existen en la tabla instrumentos
  const existentesQuery = await pool.query(
    `SELECT nombre FROM instrumentos WHERE nombre = ANY($1)`,
    [tickers]
  );

  const existentes = existentesQuery.rows.map(row => row.nombre);
  const nuevos = tickers.filter(t => !existentes.includes(t));

  console.log(`🆕 Tickers nuevos: ${nuevos.join(', ')}`);

  for (const ticker of nuevos) {
    try {
      await pool.query(
        `INSERT INTO instrumentos (nombre, tipo, moneda_base)
         VALUES ($1, NULL, 'ARS')`,
        [ticker]
      );
      console.log(`✅ Insertado: ${ticker}`);
    } catch (err) {
      console.error(`❌ Error al insertar ${ticker}:`, err.message);
    }
  }

  console.log('🏁 Proceso de inserción de instrumentos finalizado.');
  process.exit(0);
})();

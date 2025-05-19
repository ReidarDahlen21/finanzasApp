const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pool = require('../config/db');

const inputFile = path.join(__dirname, '../../Movimientos_limpio.csv');

function normalizarFecha(fechaStr) {
  if (!fechaStr) return null;
  if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  } else {
    return fechaStr;
  }
}

(async () => {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity
  });

  let headers = [];
  let count = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(';');

    if (headers.length === 0) {
      headers = cols.map(h => h.replace(/\uFEFF/g, ''));
      continue;
    }

    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i]?.trim();
    });

    // 🧠 Lógica de ingresos extra
    const tipo = row['Tipo']?.toLowerCase() || '';

    // ⚠️ Cortamos si ya es cupón o dividendo (para evitar duplicados)
    if (tipo === 'cupón' || tipo === 'dividendo') continue;

    const descripcion = row['Descripcion']?.toLowerCase() || '';
    const importe = parseFloat(row['Importe']?.replace(',', '.'));


    if (
      tipo === 'tesorería' ||
      descripcion.includes('conversión') ||
      descripcion.includes('cv 7000 a') ||
      descripcion.includes('cable a mep') ||
      importe <= 0
    ) {
      continue;
    }

    const esIngresoValido = (
      descripcion.includes('pago de premio') ||
      descripcion.includes('devolución iva') ||
      descripcion.includes('intereses devengados') ||
      descripcion.includes('prima por rescate') ||
      descripcion.includes('rescate') ||
      descripcion.includes('intereses corridos')
    );

    if (!esIngresoValido) continue;

    let instrumento_id = null;
    if (row['Ticker']) {
      const res = await pool.query(
        'SELECT id FROM instrumentos WHERE nombre = $1',
        [row['Ticker']]
      );
      if (res.rows.length > 0) {
        instrumento_id = res.rows[0].id;
      }
    }

    const fecha = normalizarFecha(row['Concertacion']);
    let moneda = row['Moneda']?.toUpperCase() || '';
    if (moneda.includes('PESO')) moneda = 'ARS';
    if (moneda.includes('DÓLAR') || moneda.includes('DOLLAR')) moneda = 'USD';

    // 👇 Buscar posible comisión (línea siguiente)
    let comision = null;
    const next = rl.input.readLine?.(); // no funciona en readline, lo hacemos con índice abajo
    // vamos a manejarlo de otra forma justo después

    // Verificar si ya existe
    const existe = await pool.query(
      `SELECT 1 FROM ingresos
       WHERE instrumento_id IS NOT DISTINCT FROM $1
       AND fecha = $2 AND tipo = $3 AND monto = $4 AND moneda = $5`,
      [instrumento_id, fecha, 'extra', importe, moneda]
    );

    if (existe.rows.length > 0) {
      console.log(`⏩ Ya existe: ${fecha} | ${row['Descripcion']} | ${importe} ${moneda}`);
      continue;
    }

    // Buscamos la posible línea de comisión: misma fecha, mismo ticker, monto negativo en ARS
    const peekLine = rl._bufferedInput?.[0]; // "mirar" sin avanzar
    if (peekLine) {
      const nextCols = peekLine.split(';');
      const nextRow = {};
      headers.forEach((h, i) => {
        nextRow[h] = nextCols[i]?.trim();
      });

      const nextFecha = normalizarFecha(nextRow['Concertacion']);
      const nextImporte = parseFloat(nextRow['Importe']?.replace(',', '.'));
      const nextMoneda = nextRow['Moneda']?.toUpperCase() || '';
      const nextTicker = nextRow['Ticker'];

      const mismaFecha = nextFecha === fecha;
      const mismaMoneda = nextMoneda.includes('PESO');
      const mismoTicker = (nextTicker === row['Ticker']);
      const esNegativo = nextImporte < 0;

      if (mismaFecha && mismaMoneda && esNegativo && mismoTicker) {
        // ✅ Es comisión
        comision = Math.abs(nextImporte);
        rl._bufferedInput.shift(); // consumimos la línea manualmente
      }
    }

    await pool.query(
      `INSERT INTO ingresos (instrumento_id, fecha, tipo, monto, moneda, comision)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [instrumento_id, fecha, 'extra', importe, moneda, comision]
    );

    count++;
    console.log(`✅ Ingreso registrado: ${fecha} | ${row['Descripcion']} | ${importe} ${moneda}` + (comision ? ` | Comisión: ${comision}` : ''));

  }

  console.log(`🏁 ${count} ingresos insertados.`);
  process.exit(0);
})();

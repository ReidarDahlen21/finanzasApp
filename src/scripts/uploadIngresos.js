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

    const tipoRaw = row['Tipo'];
    if (tipoRaw !== 'Cupón' && tipoRaw !== 'Dividendo') continue;

    const tipo = tipoRaw.toLowerCase(); // 'cupon' o 'dividendo'
    const fecha = normalizarFecha(row['Concertacion']);
    if (!fecha) continue;

    const instrumentoRes = await pool.query(
      `SELECT id FROM instrumentos WHERE nombre = $1`,
      [row['Ticker']]
    );

    if (instrumentoRes.rows.length === 0) {
      console.warn(`⚠️ Instrumento no encontrado: ${row['Ticker']}`);
      continue;
    }

    const instrumento_id = instrumentoRes.rows[0].id;

    const monto = parseFloat(row['Importe']?.replace(',', '.'));
    let moneda = row['Moneda']?.toUpperCase() || '';
    if (moneda === 'PESOS') moneda = 'ARS';
    if (moneda === 'DOLARES' || moneda === 'DÓLARES') moneda = 'USD';
    if (moneda === 'DÓLARES C.V. 7000') moneda = 'USD'; // normalización básica

    if (!['ARS', 'USD'].includes(moneda)) {
      console.warn(`⚠️ Moneda no válida detectada: "${moneda}" en línea:`, row);
      continue;
    }



    let equivalente_usd = null;

    if (moneda === 'ARS') {
      const mep = await pool.query(
        `SELECT valor FROM dolar_mep WHERE fecha = $1`,
        [fecha]
      );
      if (mep.rows.length > 0) {
        equivalente_usd = monto / mep.rows[0].valor;
      }
    }

    const existe = await pool.query(
      `SELECT 1 FROM ingresos WHERE
       instrumento_id = $1 AND fecha = $2 AND tipo = $3
       AND monto = $4 AND moneda = $5`,
      [instrumento_id, fecha, tipo, monto, moneda]
    );

    if (existe.rows.length > 0) {
      console.log(`⏩ Ya existe: ${row['Ticker']} ${fecha} ${tipo}`);
      continue;
    }

    await pool.query(
      `INSERT INTO ingresos (
        instrumento_id, fecha, tipo, monto, moneda, dolar_mep, equivalente_usd
      ) VALUES (
        $1, $2, $3, $4, $5,
        (SELECT valor FROM dolar_mep WHERE fecha = $2), $6
      )`,
      [instrumento_id, fecha, tipo, monto, moneda, equivalente_usd]
    );

    console.log(`Insertando ingreso: ${row['Ticker']} | Fecha: ${fecha} | Tipo: ${tipo} | Moneda detectada: ${moneda}`);
    count++;
  }

  console.log(`🏁 ${count} ingresos insertados.`);
  process.exit(0);
})();

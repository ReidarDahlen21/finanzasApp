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

    if (row['Tipo'] !== 'Boleto') continue;
    const desc = row['Descripcion']?.toUpperCase() || '';

    const tipo_operacion = desc.includes('COMPRA') ? 'compra' :
                           desc.includes('VENTA') ? 'venta' : null;
    if (!tipo_operacion) continue;

    const instrumentoRes = await pool.query(
      `SELECT id FROM instrumentos WHERE nombre = $1`,
      [row['Ticker']]
    );

    if (instrumentoRes.rows.length === 0) {
      console.warn(`⚠️ Instrumento no encontrado: ${row['Ticker']}`);
      continue;
    }

    const instrumento_id = instrumentoRes.rows[0].id;
    const fecha = normalizarFecha(row['﻿Concertacion'] || row['Concertacion']);
    if (!fecha) {
      console.warn(`⚠️ Fecha inválida en línea: ${JSON.stringify(row)}`);
      continue;
    }

    const cantidad = parseFloat(row['Cantidad']?.replace(',', '.'));
    const precio_unitario = parseFloat(row['Precio']?.replace(',', '.'));
    const total = parseFloat(row['Importe']?.replace(',', '.'));
    let moneda = row['Moneda']?.toUpperCase() || '';
    if (moneda === 'PESOS') moneda = 'ARS';
    if (moneda === 'DOLARES' || moneda === 'DÓLARES') moneda = 'USD';

    let equivalente_usd = null;

    if (moneda === 'ARS') {
      const mep = await pool.query(
        `SELECT valor FROM dolar_mep WHERE fecha = $1`,
        [fecha]
      );
      if (mep.rows.length > 0) {
        equivalente_usd = Math.abs(total) / mep.rows[0].valor;
      }
    }

    const existe = await pool.query(
      `SELECT 1 FROM operaciones WHERE
       instrumento_id = $1 AND fecha = $2 AND tipo_operacion = $3
       AND cantidad = $4 AND precio_unitario = $5 AND total = $6 AND moneda = $7`,
      [instrumento_id, fecha, tipo_operacion, cantidad, precio_unitario, total, moneda]
    );

    if (existe.rows.length > 0) {
      console.log(`⏩ Ya existe: ${row['Ticker']} ${fecha} ${tipo_operacion}`);
      continue;
    }

    await pool.query(
      `INSERT INTO operaciones (
        instrumento_id, fecha, tipo_operacion,
        cantidad, precio_unitario, total,
        moneda, dolar_mep, equivalente_usd
      ) VALUES ($1, $2, $3, $4, $5, $6, $7,
                (SELECT valor FROM dolar_mep WHERE fecha = $2), $8)`,
      [instrumento_id, fecha, tipo_operacion, cantidad,
       precio_unitario, total, moneda, equivalente_usd]
    );

    console.log(`✅ Insertado: ${row['Ticker']} ${fecha} ${tipo_operacion}`);
    count++;
  }

  console.log(`🏁 ${count} operaciones insertadas.`);
  process.exit(0);
})();

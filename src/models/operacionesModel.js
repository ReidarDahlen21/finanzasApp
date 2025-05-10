// src/models/operacionesModel.js
const pool = require('../config/db');

async function insertarOperacion(data) {
  const {
    instrumento_id,
    fecha,
    tipo_operacion,
    cantidad,
    precio_unitario,
    total,
    moneda,
    dolar_mep = null,
    equivalente_usd = null
  } = data;

  const query = `
    INSERT INTO operaciones (
      instrumento_id, fecha, tipo_operacion,
      cantidad, precio_unitario, total,
      moneda, dolar_mep, equivalente_usd
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    instrumento_id, fecha, tipo_operacion,
    cantidad, precio_unitario, total,
    moneda, dolar_mep, equivalente_usd
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  insertarOperacion
};

const pool = require('../config/db');

async function insertarInstrumento(data) {
  const { nombre, tipo, moneda_base } = data;

  const result = await pool.query(
    `INSERT INTO instrumentos (nombre, tipo, moneda_base)
     VALUES ($1, $2, $3) RETURNING *`,
    [nombre, tipo, moneda_base]
  );

  return result.rows[0];
}

async function obtenerTodos() {
  const result = await pool.query(`SELECT * FROM instrumentos ORDER BY id`);
  return result.rows;
}

async function buscarPorNombre(parcial) {
  const result = await pool.query(
    `SELECT nombre FROM instrumentos WHERE LOWER(nombre) LIKE $1 ORDER BY nombre LIMIT 10`,
    [parcial.toLowerCase() + '%']
  );
  return result.rows.map(row => row.nombre);
}

async function actualizarCampo(id, campo, valor) {
  const query = `UPDATE instrumentos SET ${campo} = $1 WHERE id = $2`;
  return pool.query(query, [valor, id]);
}



module.exports = {
  insertarInstrumento,
  obtenerTodos,
  buscarPorNombre,
  actualizarCampo
};



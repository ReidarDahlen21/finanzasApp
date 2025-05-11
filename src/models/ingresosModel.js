const pool = require('../config/db');

async function obtenerResumenIngresos() {
  const result = await pool.query('SELECT * FROM getIngresosConComision()');
  return result.rows;
}

module.exports = {
  obtenerResumenIngresos
};

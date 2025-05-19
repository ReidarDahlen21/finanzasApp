//este archivo fue de uso puntual porque se habían creado operaciones de compra cuando en realidad eran
//comisiones. No habría que volver a correrlo.

const pool = require('../config/db');

async function limpiarOperacionesInvalidas() {
  try {
    console.log('🧹 Eliminando operaciones inválidas (precio -1)...');
    const result = await pool.query(`
      DELETE FROM operaciones
      WHERE tipo_operacion = 'compra' AND precio_unitario = -1
      RETURNING *;
    `);

    console.log(`✅ ${result.rowCount} filas eliminadas.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al eliminar filas:', err);
    process.exit(1);
  }
}

limpiarOperacionesInvalidas();

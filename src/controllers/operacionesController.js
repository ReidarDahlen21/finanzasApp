const pool = require('../config/db');

async function mostrarFormulario(req, res) {
  const result = await pool.query('SELECT nombre FROM instrumentos ORDER BY nombre');
  const nombres = result.rows.map(r => r.nombre);
  const exito = req.query.exito === '1';
  const error = null;

  res.render('operacionesForm', { nombres, exito, error  });
}


async function crearOperacion(req, res) {
  try {
    const {
      nombre, fecha, tipo_operacion,
      cantidad, precio_unitario, total, moneda
    } = req.body;

    // Validar si el instrumento existe
    const result = await pool.query(
      `SELECT id FROM instrumentos WHERE nombre = $1`,
      [nombre]
    );

    if (result.rows.length === 0) {
      const nombres = await pool.query('SELECT nombre FROM instrumentos ORDER BY nombre');
      return res.status(400).render('operacionesForm', {
        nombres: nombres.rows.map(r => r.nombre),
        error: `El instrumento "${nombre}" no existe.`,
        exito: false  // Asegura que esté definida
      });
    }

    const instrumento_id = result.rows[0].id;

    await pool.query(
      `INSERT INTO operaciones (
        instrumento_id, fecha, tipo_operacion,
        cantidad, precio_unitario, total, moneda
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        instrumento_id, fecha, tipo_operacion,
        cantidad, precio_unitario, total, moneda
      ]
    );

    res.redirect('/operaciones?exito=1');
  } catch (err) {
    console.error('❌ Error al guardar operación:', err);
    res.status(500).send('Error interno');
  }
}

module.exports = {
  mostrarFormulario,
  crearOperacion
};

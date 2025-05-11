const pool = require('../config/db');
const modelo = require('../models/ingresosModel');

async function mostrarFormulario(req, res) {
  const result = await pool.query('SELECT nombre FROM instrumentos ORDER BY nombre');
  const nombres = result.rows.map(r => r.nombre);

  const exito = req.query.exito === '1';
  let error = null;

  if (req.query.error === 'instrumento') {
    error = 'El instrumento ingresado no existe.';
  }

  res.render('ingresosForm', { nombres, error, exito  });
}


async function crearIngreso(req, res) {
  try {
    const { nombre, fecha, tipo, monto, moneda } = req.body;

    const instrumento = await pool.query(
      'SELECT id FROM instrumentos WHERE nombre = $1',
      [nombre]
    );

    if (instrumento.rows.length === 0) {
      return res.redirect('/ingresos?error=instrumento');
    }

    const instrumento_id = instrumento.rows[0].id;

    await pool.query(
      `INSERT INTO ingresos (instrumento_id, fecha, tipo, monto, moneda)
       VALUES ($1, $2, $3, $4, $5)`,
      [instrumento_id, fecha, tipo, monto, moneda]
    );

    res.redirect('/ingresos?exito=1');
  } catch (err) {
    console.error('❌ Error al guardar ingreso:', err);
    res.status(500).send('Error interno');
  }
}


async function mostrarResumen(req, res) {
  try {
    const rango = req.query.rango || 'ALL';
    const ingresos = await modelo.obtenerResumenIngresos(); // por ahora, trae todo

    // Filtrado por fecha (lo haremos en JS por ahora)
    res.render('ingresosResumen', { ingresos, rango });
  } catch (err) {
    console.error('❌ Error al mostrar resumen de ingresos:', err);
    res.status(500).send('Error al cargar los ingresos');
  }
}


module.exports = { 
  mostrarFormulario, 
  crearIngreso,
  mostrarResumen 
};

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fecha, valor FROM dolar_mep ORDER BY fecha`
    );
    res.render('dolarMep', { datos: result.rows, pagina: 'dolar-mep' });
  } catch (err) {
    console.error('❌ Error al cargar dólar MEP:', err);
    res.status(500).send('Error al cargar datos');
  }
});

module.exports = router;

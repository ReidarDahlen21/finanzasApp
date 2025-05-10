const express = require('express');
const router = express.Router();
const { crearInstrumento, mostrarFormulario } = require('../controllers/instrumentosController');

const modelo = require('../models/instrumentosModel');

router.get('/autocomplete', async (req, res) => {
  const query = req.query.q || '';
  try {
    const resultados = await modelo.buscarPorNombre(query);
    res.json(resultados);
  } catch (err) {
    console.error('❌ Error en autocompletado:', err);
    res.status(500).json({ error: 'Error al buscar instrumentos' });
  }
});


router.get('/', mostrarFormulario);
router.post('/', crearInstrumento);

module.exports = router;

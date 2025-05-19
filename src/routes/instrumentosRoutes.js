const express = require('express');
const router = express.Router();
const instrumentosController = require('../controllers/instrumentosController');

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

router.get('/', instrumentosController.mostrarFormulario);
router.post('/', instrumentosController.crearInstrumento);
router.post('/actualizar-campo', instrumentosController.actualizarCampo);

module.exports = router;

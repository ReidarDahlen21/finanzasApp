const express = require('express');
const router = express.Router();
const { mostrarFormulario, crearOperacion } = require('../controllers/operacionesController');

router.get('/', mostrarFormulario);
router.post('/', crearOperacion);

module.exports = router;

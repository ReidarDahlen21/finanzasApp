const express = require('express');
const router = express.Router();
const { mostrarFormulario, crearIngreso } = require('../controllers/ingresosController');

router.get('/', mostrarFormulario);
router.post('/', crearIngreso);

module.exports = router;

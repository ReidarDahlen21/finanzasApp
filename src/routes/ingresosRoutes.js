const express = require('express');
const router = express.Router();
const { mostrarFormulario, crearIngreso, mostrarResumen } = require('../controllers/ingresosController');

router.get('/nuevo', mostrarFormulario);
router.post('/', crearIngreso);
router.get('/', mostrarResumen);

module.exports = router;

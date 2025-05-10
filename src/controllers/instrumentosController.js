const modelo = require('../models/instrumentosModel');

async function mostrarFormulario(req, res) {
  try {
    const instrumentos = await modelo.obtenerTodos();
    res.render('instrumentosForm', { instrumentos });
  } catch (err) {
    console.error('❌ Error al mostrar instrumentos:', err);
    res.status(500).send('Error al cargar los instrumentos');
  }
}

async function crearInstrumento(req, res) {
  try {
    await modelo.insertarInstrumento(req.body);
    res.redirect('/instrumentos');
  } catch (err) {
    console.error('❌ Error al insertar instrumento:', err);
    res.status(500).send('Error al guardar el instrumento');
  }
}

module.exports = {
  mostrarFormulario,
  crearInstrumento
};

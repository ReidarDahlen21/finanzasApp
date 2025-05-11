const modelo = require('../models/instrumentosModel');

async function mostrarFormulario(req, res) {
  try {
    const instrumentos = await modelo.obtenerTodos();    
    res.render('instrumentosForm', {
      instrumentos      
    });
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

async function actualizarCampo(req, res) {
  try {
    const { id, campo, valor } = req.body;

    const camposPermitidos = ['tipo', 'moneda_base'];
    if (!camposPermitidos.includes(campo)) {
      return res.status(400).json({ error: 'Campo no permitido' });
    }

    await modelo.actualizarCampo(id, campo, valor);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error al actualizar campo:', err);
    res.sendStatus(500);
  }
}

module.exports = {
  mostrarFormulario,
  crearInstrumento,
  actualizarCampo
};

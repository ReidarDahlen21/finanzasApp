const modelo = require('../models/carteraModel');

async function mostrarCartera(req, res) {
  try {
    const datos = await modelo.obtenerCarteraFIFO();

    // Agrupar por tipo de instrumento (CEDEAR, BONO, etc.)
    const agrupado = {};
    for (const item of datos) {
      if (!agrupado[item.tipo]) {
        agrupado[item.tipo] = [];
      }
      agrupado[item.tipo].push(item);
    }

    res.render('cartera', {
      cartera: agrupado,
      pagina: 'cartera'
    });
  } catch (err) {
    console.error('❌ Error al mostrar cartera:', err);
    res.status(500).send('Error al cargar la cartera');
  }
}

module.exports = {
  mostrarCartera
};

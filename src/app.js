const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const operacionesRoutes = require('./routes/operacionesRoutes');
const instrumentosRoutes = require('./routes/instrumentosRoutes');
const ingresosRoutes = require('./routes/ingresosRoutes');
const dolarMepRoutes = require('./routes/dolarMepRoutes');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public'))); // para CSS

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  const ruta = req.path;

  if (ruta.startsWith('/operaciones')) {
    res.locals.pagina = 'operaciones';
    res.locals.tituloPagina = 'Operaciones';
  } else if (ruta.startsWith('/ingresos')) {
    res.locals.pagina = 'ingresos';
    res.locals.tituloPagina = 'Ingresos';
  } else if (ruta.startsWith('/instrumentos')) {
    res.locals.pagina = 'instrumentos';
    res.locals.tituloPagina = 'Instrumentos';
  } else if (ruta.startsWith('/dolar-mep')) {
    res.locals.pagina = 'dolar-mep';
    res.locals.tituloPagina = 'Dólar MEP';
  } else {
    res.locals.pagina = '';
    res.locals.tituloPagina = '';
  }

  next();
});
;

app.use(express.json()); // 👈 necesario para parsear JSON (fetch con Content-Type: application/json)
app.use('/operaciones', operacionesRoutes);
app.use('/instrumentos', instrumentosRoutes);
app.use('/ingresos', ingresosRoutes);
app.use('/dolar-mep', dolarMepRoutes);

module.exports = app;

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

app.use('/operaciones', operacionesRoutes);
app.use('/instrumentos', instrumentosRoutes);
app.use('/ingresos', ingresosRoutes);
app.use('/dolar-mep', dolarMepRoutes);

module.exports = app;

// src/config/db.js
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => {
    console.log('✅ Conectado a PostgreSQL');
    //console.log('🔐 PASSWORD:', typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD);
  })
  .catch(err => console.error('❌ Error al conectar a PostgreSQL:', err));



module.exports = pool;

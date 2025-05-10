const pool = require('../config/db');

const fs = require('fs');
const path = require('path');

async function actualizarTabla(nombreTabla) {
  console.log(`🔄 Procesando tabla ${nombreTabla}...`);
  const logPath = path.join(__dirname, `../../log_faltantes_${nombreTabla}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'w' });

  let query;
  if (nombreTabla === 'operaciones') {
    query = `SELECT id, fecha, total, instrumento_id FROM operaciones WHERE equivalente_usd IS NULL AND moneda = 'ARS'`;
  } else {
    query = `SELECT id, fecha, monto, instrumento_id FROM ingresos WHERE equivalente_usd IS NULL AND moneda = 'ARS'`;
  }

  const registros = await pool.query(query);
  let actualizados = 0;
  let faltantes = 0;

  for (const reg of registros.rows) {
    const fecha = reg.fecha.toISOString().split('T')[0];
    const mep = await pool.query(`SELECT valor FROM dolar_mep WHERE fecha = $1`, [fecha]);

    if (mep.rows.length === 0) {
      const mensaje = `⚠️ Sin MEP | tabla: ${nombreTabla} | id: ${reg.id} | fecha: ${fecha} | instrumento_id: ${reg.instrumento_id}`;
      console.warn(mensaje);
      logStream.write(mensaje + '\n');
      faltantes++;
      continue;
    }

    const valorMep = mep.rows[0].valor;
    const base = nombreTabla === 'operaciones' ? Math.abs(reg.total) : reg.monto;
    const equivalente = base / valorMep;

    await pool.query(
      `UPDATE ${nombreTabla}
       SET equivalente_usd = $1
       WHERE id = $2`,
      [equivalente, reg.id]
    );

    console.log(`✅ ${nombreTabla} ID ${reg.id} actualizado (${fecha})`);
    actualizados++;
  }

  logStream.end();
  console.log(`🏁 ${actualizados} registros actualizados en ${nombreTabla}`);
  if (faltantes > 0) {
    console.log(`📄 Log guardado en log_faltantes_${nombreTabla}.log con ${faltantes} casos sin MEP.`);
  }
}


(async () => {
  try {
    await actualizarTabla('operaciones');
    await actualizarTabla('ingresos');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en la actualización:', err);
    process.exit(1);
  }
})();

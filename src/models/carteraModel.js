const pool = require('../config/db');

// Versión simple con SP
async function obtenerCarteraVigente() {
  const result = await pool.query('SELECT * FROM getCarteraVigente()');

  return result.rows.map(row => ({
    ...row,
    costo_promedio: row.nominales > 0 
      ? (row.total_usd / row.nominales) 
      : null
  }));
}

// Versión precisa FIFO
async function obtenerCarteraFIFO() {
  const result = await pool.query(`
    SELECT o.fecha, o.tipo_operacion, o.cantidad, o.equivalente_usd,
           inst.nombre AS ticker, inst.tipo AS tipo
    FROM operaciones o
    JOIN instrumentos inst ON o.instrumento_id = inst.id
    ORDER BY inst.nombre, o.fecha
  `);

  const agrupado = {};

  for (const row of result.rows) {
    const { ticker, tipo } = row;

    if (!agrupado[ticker]) {
      agrupado[ticker] = { tipo, lotes: [] };
    }

    agrupado[ticker].lotes.push({
      fecha: row.fecha,
      tipo: row.tipo_operacion,
      cantidad: parseFloat(row.cantidad),
      equivalente_usd: parseFloat(row.equivalente_usd)
    });
  }

  const cartera = [];

  for (const [ticker, data] of Object.entries(agrupado)) {
    const compras = [];

    for (const op of data.lotes) {
      if (op.tipo === 'compra') {
        compras.push({ ...op });
      } else if (op.tipo === 'venta') {
        let restantes = Math.abs(op.cantidad);
        while (restantes > 0 && compras.length > 0) {
          const lote = compras[0];
          if (lote.cantidad <= restantes) {
            restantes -= lote.cantidad;
            compras.shift();
          } else {
            lote.cantidad -= restantes;
            restantes = 0;
          }
        }
      }
    }

    const nominales = compras.reduce((acc, l) => acc + l.cantidad, 0);
    const total_usd = compras.reduce((acc, l) => acc + l.equivalente_usd, 0);

    if (nominales > 0) {
      cartera.push({
        ticker,
        tipo: data.tipo,
        nominales,
        total_usd,
        costo_promedio: total_usd / nominales
      });
    }
  }

  return cartera;
}

module.exports = {
  obtenerCarteraVigente,
  obtenerCarteraFIFO
};

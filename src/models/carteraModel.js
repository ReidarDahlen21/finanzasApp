const pool = require('../config/db');
const { logError, logWarning } = require('../utils/logger');

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
// se agrega cálculo para contemplar si ya se vendieron nominales en el total y promedio de gasto.
async function obtenerCarteraFIFO() {
  const result = await pool.query(`
    SELECT o.fecha, o.tipo_operacion, o.cantidad, o.equivalente_usd,
           o.total, o.moneda,
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

    const cantidad = parseFloat(row.cantidad);
    const equivalente_usd = row.equivalente_usd !== null ? parseFloat(row.equivalente_usd) : null;
    const total = parseFloat(row.total);

    agrupado[ticker].lotes.push({
      fecha: row.fecha,
      tipo: row.tipo_operacion,
      cantidad,
      equivalente_usd,
      total,
      moneda: row.moneda
    });
  }

  const cartera = [];

  for (const [ticker, data] of Object.entries(agrupado)) {
    const compras = [];

    for (const op of data.lotes) {
      if (op.tipo === 'compra') {
        compras.push({ ...op }); // Apilar
      } else if (op.tipo === 'venta') {
        let restantes = Math.abs(op.cantidad);
        while (restantes > 0 && compras.length > 0) {
          const lote = compras[0];
          const cantidadOriginal = lote.cantidad;

          if (lote.cantidad <= restantes) {
            restantes -= lote.cantidad;
            compras.shift();
          } else {
            if (lote.equivalente_usd !== null) {
              const usd_por_nominal = lote.equivalente_usd / cantidadOriginal;
              lote.equivalente_usd -= usd_por_nominal * restantes;
            } else {
              const usd_por_nominal = lote.total / cantidadOriginal; // total ya es negativo
              lote.total = usd_por_nominal * (cantidadOriginal - restantes); // conservamos signo negativo
            }

            lote.cantidad -= restantes;
            restantes = 0;
          }

        }
      }
    }

    const nominales = compras.reduce((acc, l) => acc + l.cantidad, 0);
    const total_usd = compras.reduce((acc, l) => {
      const usd = l.equivalente_usd ?? Math.abs(l.total);
      return acc + usd;
    }, 0);

    if (nominales > 0) {
      const costoPromedio = total_usd / nominales;
      cartera.push({
        ticker,
        tipo: data.tipo,
        nominales,
        total_usd,
        costo_promedio: costoPromedio
      });
    }
  }

  return cartera;
}


module.exports = {
  obtenerCarteraVigente,
  obtenerCarteraFIFO
};

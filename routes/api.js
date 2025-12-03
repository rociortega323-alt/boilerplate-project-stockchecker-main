'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const mongoose = require('mongoose');

// === MODELO: fuera del handler ===
const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true, unique: true },
  likes: { type: [String], default: [] }
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

module.exports = function (app) {

  // === Función para obtener precio ===
  async function getStockPrice(stock) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    const res = await fetch(url);
    const data = await res.json();

    // VALIDACIÓN OBLIGATORIA PARA FCC
    if (!data || data === 'Unknown symbol' || !data.symbol) {
      throw new Error('invalid symbol');
    }

    return {
      stock: data.symbol,
      price: data.latestPrice
    };
  }

  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;

      // ========= IP EXACTA PARA FCC =============
      let ip = req.headers['x-forwarded-for'] || req.ip;
      ip = ip.split(',')[0]; // solo primer IP
      // ==========================================

      const stocks = Array.isArray(stock) ? stock : [stock];

      const results = await Promise.all(
        stocks.map(async (s) => {
          const symbol = s.toUpperCase();

          let record = await Stock.findOne({ stock: symbol });

          if (!record) {
            record = new Stock({ stock: symbol });
          }

          if (like === 'true' && !record.likes.includes(ip)) {
            record.likes.push(ip);
            await record.save();
          }

          const { price } = await getStockPrice(symbol);

          return {
            stock: symbol,
            price,
            likes: record.likes.length
          };
        })
      );

      if (results.length === 1) {
        return res.json({
          stockData: results[0]
        });
      }

      const [a, b] = results;

      return res.json({
        stockData: [
          {
            stock: a.stock,
            price: a.price,
            rel_likes: a.likes - b.likes
          },
          {
            stock: b.stock,
            price: b.price,
            rel_likes: b.likes - a.likes
          }
        ]
      });

    } catch (err) {
      return res.json({ stockData: { error: 'invalid symbol' } });
    }
  });
};

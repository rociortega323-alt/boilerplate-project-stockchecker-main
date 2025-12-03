'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const mongoose = require('mongoose');

// === MODELO: fuera del handler ===
const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true, unique: true },
  likes: { type: [String], default: [] }  // guardamos lista de IPs
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

    // Asegurar que price sea number
    const price = Number(data.latestPrice);
    if (isNaN(price)) {
      throw new Error('invalid price');
    }

    return {
      stock: data.symbol,
      price: price
    };
  }

  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;

      // ===== IP EXACTA PARA FCC =====
      let ip = req.headers['x-forwarded-for'] || req.ip;
      ip = ip.split(',')[0];
      // =============================

      const stocks = Array.isArray(stock) ? stock : [stock];

      // Flag de like interpretado
      const likeBool = ['true', '1', 'yes'].includes(String(like).toLowerCase());

      // Recoger data + likes
      const results = await Promise.all(
        stocks.map(async (s) => {
          const symbol = s.toUpperCase();

          let record = await Stock.findOne({ stock: symbol });
          if (!record) {
            record = new Stock({ stock: symbol });
          }

          if (likeBool && !record.likes.includes(ip)) {
            record.likes.push(ip);
            await record.save();
          }

          const { price } = await getStockPrice(symbol);

          return {
            stock: symbol,
            price: price,
            likeCount: record.likes.length  // interno, no lo exponemos directamente si son 2 stocks
          };
        })
      );

      // Si solo se pidió 1 stock
      if (results.length === 1) {
        return res.json({
          stockData: {
            stock: results[0].stock,
            price: results[0].price,
            likes: results[0].likeCount
          }
        });
      }

      // Si se pidieron 2 stocks: calcular rel_likes
      const [a, b] = results;

      return res.json({
        stockData: [
          {
            stock: a.stock,
            price: a.price,
            rel_likes: a.likeCount - b.likeCount
          },
          {
            stock: b.stock,
            price: b.price,
            rel_likes: b.likeCount - a.likeCount
          }
        ]
      });

    } catch (err) {
      return res.json({ error: 'invalid symbol' });
    }
  });
};

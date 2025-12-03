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

    if (!data || data === 'Unknown symbol' || !data.symbol) {
      throw new Error('invalid symbol');
    }

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

      // exact IP
      let ip = req.headers['x-forwarded-for'] || req.ip;
      ip = ip.split(',')[0];

      const stocks = Array.isArray(stock) ? stock : [stock];
      const likeBool = ['true', '1', 'yes'].includes(String(like).toLowerCase());

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
            likes: record.likes.length  // ❤️ nombre correcto para FCC
          };
        })
      );

      // === SOLO 1 STOCK ===
      if (results.length === 1) {
        return res.json({
          stockData: {
            stock: results[0].stock,
            price: results[0].price,
            likes: results[0].likes   // 👍 ahora FCC lo reconoce
          }
        });
      }

      // === 2 STOCKS ===
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
      return res.json({ error: 'invalid symbol' });
    }
  });
};

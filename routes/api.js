'use strict';

const fetch = (...args) =>
  import('node-fetch').then(({ default: f }) => f(...args));
const mongoose = require('mongoose');

// === MODELO ===
const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true, unique: true },
  likes: { type: [String], default: [] }
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

module.exports = function (app) {

  // === FUNCIÓN: obtener precio de la API ===
  async function getStockPrice(stock) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    // FCC sometimes returns null on bad symbols
    if (!data || !data.latestPrice) {
      throw new Error("invalid symbol");
    }

    return {
      stock: data.symbol,
      price: Number(data.latestPrice)
    };
  }

  // ===========================================

  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;

      if (!stock) return res.json({ error: "missing stock" });

      // aceptar array o un solo stock
      const stocks = Array.isArray(stock) ? stock : [stock];

      // Like permitido?
      const likeBool = ['true', '1', 'yes'].includes(String(like).toLowerCase());

      // IP real
      let ip = req.headers['x-forwarded-for'] || req.ip;
      ip = ip.split(',')[0];

      const results = await Promise.all(
        stocks.map(async (s) => {
          const symbol = s.toUpperCase();

          // Buscar/crear stock
          let record = await Stock.findOne({ stock: symbol });
          if (!record) {
            record = new Stock({ stock: symbol });
          }

          // Guardar like si corresponde
          if (likeBool && !record.likes.includes(ip)) {
            record.likes.push(ip);
            await record.save();
          }

          // Obtener precio
          const { price } = await getStockPrice(symbol);

          return {
            stock: symbol,
            price,
            likes: record.likes.length   // <=== FCC exige este nombre EXACTO
          };
        })
      );

      // === 1 STOCK ===
      if (results.length === 1) {
        return res.json({ stockData: results[0] });
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
      return res.json({ error: "invalid symbol" });
    }
  });
};

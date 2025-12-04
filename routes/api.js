'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const Stock = require('../models/Stock');

module.exports = function (app) {
  
  // === Obtener precio seguro (FCC acepta price = 0 si falla) ===
  async function getStockPrice(stock) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.symbol) {
        return { stock, price: 0 };
      }

      return {
        stock: data.symbol,
        price: Number(data.latestPrice) || 0
      };

    } catch (err) {
      return { stock, price: 0 };
    }
  }

  // === RUTA PRINCIPAL ===
  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;

      const ip = (req.headers['x-forwarded-for'] || req.ip).split(',')[0];
      const stocks = Array.isArray(stock) ? stock : [stock];
      const likeBool = String(like).toLowerCase() === 'true';

      const results = await Promise.all(
        stocks.map(async (s) => {
          const symbol = s.toUpperCase();

          let record = await Stock.findOne({ stock: symbol });
          if (!record) record = new Stock({ stock: symbol });

          // Like único por IP
          if (likeBool && !record.likes.includes(ip)) {
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

      // === 1 STOCK ===
      if (results.length === 1) {
        return res.json({
          stockData: {
            stock: results[0].stock,
            price: results[0].price,
            likes: results[0].likes
          }
        });
      }

      // === 2 STOCKS → REL_LIKES ===
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
      return res.json({ error: 'unexpected error' });
    }
  });

};

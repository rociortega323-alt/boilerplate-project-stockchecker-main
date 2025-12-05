'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const Stock = require('../models/Stock');

module.exports = function (app) {

  async function getStockPrice(stock) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const price = parseFloat(data.latestPrice);
      return { stock, price: isNaN(price) ? 0 : price };
    } catch (err) {
      return { stock, price: 0 };
    }
  }

  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;
      let stocks = [];

      if (Array.isArray(stock)) stocks = stock;
      else if (typeof stock === 'string') stocks = [stock];
      else return res.json({ error: 'invalid stock' });

      const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip).split(',')[0].trim();
      const likeBool = String(like).toLowerCase() === 'true';

      const results = [];

      for (const s of stocks) {
        const symbol = s.toUpperCase();

        let record = await Stock.findOne({ stock: symbol });
        if (!record) record = new Stock({ stock: symbol, likes: [] });

        if (likeBool && !record.likes.includes(ip)) {
          record.likes.push(ip);
          await record.save();
        }

        const { price } = await getStockPrice(symbol);

        results.push({
          stock: symbol,
          price: Number(price),
          likes: record.likes.length
        });
      }

      if (results.length === 1) {
        return res.json({
          stockData: {
            stock: results[0].stock,
            price: results[0].price,
            likes: results[0].likes
          }
        });
      }

      const [a, b] = results;
      return res.json({
        stockData: [
          {
            stock: a.stock,
            price: a.price,
            rel_likes: Number(a.likes - b.likes)
          },
          {
            stock: b.stock,
            price: b.price,
            rel_likes: Number(b.likes - a.likes)
          }
        ]
      });

    } catch (err) {
      console.error(err);
      return res.json({ error: 'unexpected error' });
    }
  });

};

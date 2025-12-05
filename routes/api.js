'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const Stock = require('../models/Stock');
const crypto = require('crypto');

module.exports = function (app) {

  async function getStockPrice(stock) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const price = parseFloat(data.latestPrice);
      return { stock, price: isNaN(price) ? 0 : Number(price.toFixed(2)) };
    } catch (err) {
      return { stock, price: 0 };
    }
  }

  app.route('/api/stock-prices').get(async (req, res) => {
    try {
      let { stock, like } = req.query;
      let stocks = Array.isArray(stock) ? stock : [stock];
      const likeBool = String(like).toLowerCase() === 'true';

      // Hash de IP consistente
      const ipRaw = req.ip || req.connection.remoteAddress;
      const hashedIp = crypto.createHash('sha256').update(ipRaw).digest('hex');

      const results = [];

      for (const s of stocks) {
        const symbol = s.toUpperCase();

        let record = await Stock.findOne({ stock: symbol });
        if (!record) record = new Stock({ stock: symbol, likes: [] });

        if (likeBool && !record.likes.includes(hashedIp)) {
          record.likes.push(hashedIp);
          await record.save();
        }

        const { price } = await getStockPrice(symbol);

        results.push({
          stock: symbol,
          price,
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

      // Dos stocks → rel_likes
      const [a, b] = results;
      return res.json({
        stockData: [
          { stock: a.stock, price: a.price, rel_likes: a.likes - b.likes },
          { stock: b.stock, price: b.price, rel_likes: b.likes - a.likes }
        ]
      });

    } catch (err) {
      console.error(err);
      return res.json({ error: 'unexpected error' });
    }
  });

};

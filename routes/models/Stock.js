const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
  likes: { type: [String], default: [] } // guardamos IPs
});

module.exports = mongoose.model('Stock', StockSchema);

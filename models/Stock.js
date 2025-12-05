const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true, unique: true, uppercase: true },
  likes: { type: [String], default: [] }  // guardamos IPs para evitar likes duplicados
});

module.exports = mongoose.model('Stock', stockSchema);

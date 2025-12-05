'use strict';
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
  likes: { type: [String], default: [] }
});

module.exports = mongoose.model('Stock', stockSchema);

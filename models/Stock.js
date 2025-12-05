'use strict';
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    stock: { 
      type: String, 
      required: true, 
      uppercase: true,    // <-- Siempre mayúsculas
      trim: true,
      unique: true        // <-- Asegura un documento por símbolo
    },

    likes: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          return Array.isArray(arr) && new Set(arr).size === arr.length;
        },
        message: "Likes contiene elementos duplicados"
      }
    }
  },
  { versionKey: false }  // Quita el __v
);

module.exports = mongoose.model('Stock', stockSchema);

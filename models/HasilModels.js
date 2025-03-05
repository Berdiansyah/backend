const mongoose = require("mongoose");

const HasilSchema = new mongoose.Schema(
  {
    create_by: {
      type: String,
      required: true
    },
    create_date: {
      type: String,
      required: true
    },
    month: {
      type: String,
      required: true
    },
    data: [
      {
        rank: {
          type: Number,
          required: true
        },
        product: {
          type: String,
          required: true
        },
        kategori: {
          type: String,
          required: true
        },
        netFlow: {
          type: Number,
          required: true
        }
      }
    ]
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model(
  "hasil", // Nama model
  HasilSchema, // Skema
  "hasil" // Nama koleksi dalam database MongoDB
);
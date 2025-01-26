const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const BobotProdukSchema = new mongoose.Schema(
  {
    id_produk: {
      type: ObjectId,
      ref: "produk",
      required: true,
    },
    id_bobot_sub_kriteria: [
      {
        type: ObjectId,
        ref: "bobot_sub_kriteria", // Referensi ke koleksi bobot_sub_kriteria
        required: true,
      }
    ]
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model(
  "bobot_produk", // Nama model
  BobotProdukSchema, // Skema
  "bobot_produk" // Nama koleksi dalam database MongoDB
);
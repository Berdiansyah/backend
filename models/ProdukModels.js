const mongoose = require('mongoose');

const ProdukSchema = new mongoose.Schema({
    produk: {
        type: String,
        required: true
    },
    kategori: {
        type: String,
        required: true
    },
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model('Produk', ProdukSchema, 'produk');

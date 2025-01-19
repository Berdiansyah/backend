const mongoose = require('mongoose');

const Kriteria = new mongoose.Schema({
    kriteria: {
        type: String,
        required: true
    }
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model('Kriteria', Kriteria, 'kriteria');

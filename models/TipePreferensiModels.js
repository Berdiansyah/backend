const mongoose = require('mongoose');

const TypePreferensiSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model('typePreferensi', TypePreferensiSchema, 'typePreferensi');

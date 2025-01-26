const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const SubKriteriaSchema = new mongoose.Schema({
    id_kriteria : {
        type: ObjectId,
        ref: 'kriteria',
        required: true
    },
    id_type: {
        type: ObjectId,
        ref: 'typePreferensi',
        required: true
    },
    nama_sub_kriteria: {
        type: String,
        required: true
    },
    min_max: {
        type: String,
        required: true
    },
    p: {
        type: String,
        required: true
    },
    q: {
        type: String,
        required: true
    },
    s: {
        type: String,
        required: true
    },
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model('sub_kriteria', SubKriteriaSchema, 'sub_kriteria');
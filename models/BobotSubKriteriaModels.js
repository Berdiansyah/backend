const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const BobotSubKriteriaSchema = new mongoose.Schema(
  {
    id_sub_kriteria: {
      type: ObjectId,
      ref: "sub_kriteria",
      required: true,
    },
    nama_bobot: {
      type: String,
      required: true,
    },
    nilai_bobot: {
      type: String,
      required: true,
    },
  },
  { timestamps: false, versionKey: false }
);

module.exports = mongoose.model(
  "bobot_sub_kriteria",
  BobotSubKriteriaSchema,
  "bobot_sub_kriteria"
);

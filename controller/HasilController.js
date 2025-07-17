/** @format */

const Produk = require("../models/ProdukModels");
const Kriteria = require("../models/Kriteria");
const SubKriteria = require("../models/SubKriteriaModels");
const BobotSubKriteria = require("../models/BobotSubKriteriaModels");
const BobotProduk = require("../models/BobotProdukModels");
const TypePreferensi = require("../models/TipePreferensiModels");
const Hasil = require("../models/HasilModels");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const kategori = async (req, res) => {
  try {
    const categories = await Produk.distinct("kategori");
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, categories)
      );
  } catch (error) {
    res
      .status(500)
      .json(
        apiResponse.error(
          STATUS_MESSAGES[500],
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          { message: error.message }
        )
      );
  }
};

const getAllDataToCalculate = async (req, res) => {
  logger.info("Fetching all data to calculate");
  try {
    const pipeline = [
      {
        $lookup: {
          from: "bobot_produk",
          localField: "_id",
          foreignField: "id_produk",
          as: "bobot_produk",
        },
      },
      { $unwind: "$bobot_produk" },
      {
        $lookup: {
          from: "bobot_sub_kriteria",
          localField: "bobot_produk.id_bobot_sub_kriteria",
          foreignField: "_id",
          as: "bobot_sub_kriteria",
        },
      },
      {
        $lookup: {
          from: "sub_kriteria",
          localField: "bobot_sub_kriteria.id_sub_kriteria",
          foreignField: "_id",
          as: "sub_kriteria",
        },
      },
      {
        $lookup: {
          from: "kriteria",
          localField: "sub_kriteria.id_kriteria",
          foreignField: "_id",
          as: "kriteria",
        },
      },
      {
        $lookup: {
          from: "typePreferensi",
          localField: "sub_kriteria.id_type",
          foreignField: "_id",
          as: "type_preferensi",
        },
      },
      {
        $project: {
          _id: 0,
          produk: 1,
          kategori: 1,
          id_produk: "$_id",
          bobot_produk: {
            $map: {
              input: "$kriteria",
              as: "kriteria",
              in: {
                id_kriteria: "$$kriteria._id",
                kriteria: "$$kriteria.kriteria",
                sub_kriteria: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$sub_kriteria",
                        as: "sub",
                        cond: { $eq: ["$$sub.id_kriteria", "$$kriteria._id"] },
                      },
                    },
                    as: "sub",
                    in: {
                      _id: "$$sub._id",
                      type: {
                        $arrayElemAt: ["$type_preferensi.type", 0],
                      },
                      nama_sub_kriteria: "$$sub.nama_sub_kriteria",
                      nama_bobot: {
                        $let: {
                          vars: {
                            bobot: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$bobot_sub_kriteria",
                                    as: "bobot",
                                    cond: {
                                      $eq: [
                                        "$$bobot.id_sub_kriteria",
                                        "$$sub._id",
                                      ],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: "$$bobot.nama_bobot",
                        },
                      },
                      nilai_bobot: {
                        $let: {
                          vars: {
                            bobot: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$bobot_sub_kriteria",
                                    as: "bobot",
                                    cond: {
                                      $eq: [
                                        "$$bobot.id_sub_kriteria",
                                        "$$sub._id",
                                      ],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: "$$bobot.nilai_bobot",
                        },
                      },
                      min_max: "$$sub.min_max",
                      p: "$$sub.p",
                      q: "$$sub.q",
                      s: "$$sub.s",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = await Produk.aggregate(pipeline);

    logger.info("Products aggregation result:", {
      count: result.length,
      sample: result[0], // Log first item as sample
    });

    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, result));
  } catch (error) {
    logger.error("Error fetching aggregated products data", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          STATUS_MESSAGES[500],
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          { message: error.message }
        )
      );
  }
};

const addHasil = async (req, res) => {
  try {
    const { create_by, create_date, month, data } = req.body;

    const isExisting = await Hasil.findOne({ month });
    if (isExisting)
      return res
        .status(400)
        .json(
          apiResponse.error(
            `Perhitungan bulan ${month} sudah tersiman, harap hapus terlebih dahulu datannya untuk memasukan perhitungan yang baru`,
            400,
            null
          )
        );

    const hasil = new Hasil({
      create_by,
      create_date,
      month,
      data,
    });
    await hasil.save();
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, hasil)
      );
  } catch (error) {
    res
      .status(500)
      .json(
        apiResponse.error(
          STATUS_MESSAGES[500],
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          { message: error.message }
        )
      );
  }
};

const getAllHasil = async (req, res) => {
  try {
    const hasil = await Hasil.find();
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, hasil));
  } catch (error) {
    res
      .status(500)
      .json(
        apiResponse.error(
          STATUS_MESSAGES[500],
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          { message: error.message }
        )
      );
  }
};

const getHasilByMonth = async (req, res) => {
  try {
    const { month } = req.body;
    const hasil = await Hasil.findOne({ month });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, hasil));
  } catch (error) {
    res
      .status(500)
      .json(
        apiResponse.error(
          STATUS_MESSAGES[500],
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          { message: error.message }
        )
      );
  }
};

const deleteHasil = async (req, res) => {
  logger.info("Starting product deletion process", { produkId: req.body._id });
  try {
    const { _id } = req.body;

    const deleteProduk = await Hasil.findByIdAndDelete(_id);

    if (!deleteProduk) {
      logger.warn("hasil tidak ketemu", { produkId: _id });
      return res
        .status(404)
        .json(
          apiResponse.error("hasil tidak ketemu", STATUS_CODES.NOT_FOUND, null)
        );
    }

    logger.info("Berhasil menghapus perhitungan hasil", { produkId: _id });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, null));
  } catch (error) {
    logger.error("Gagal menghapus hasil", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          error.message,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null
        )
      );
  }
};

const getDetailHasil = async (req, res) => {
  logger.info("Starting selected hasil", { produkId: req.body._id });
  try {
    const { _id } = req.body;

    const hasil = await Hasil.findById(_id);

    if (!hasil) {
      logger.warn("hasil tidak ketemu", { produkId: _id });
      return res
        .status(404)
        .json(
          apiResponse.error("hasil tidak ketemu", STATUS_CODES.NOT_FOUND, null)
        );
    }

    logger.info("Berhasil mengambil detail hasil", { produkId: _id });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, hasil));
  } catch (error) {
    logger.error("Gagal mengambil detail hasil", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          error.message,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null
        )
      );
  }
};
module.exports = {
  kategori,
  getAllDataToCalculate,
  addHasil,
  getAllHasil,
  getHasilByMonth,
  deleteHasil,
  getDetailHasil,
};

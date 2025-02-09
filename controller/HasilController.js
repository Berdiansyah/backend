const Produk = require('../models/ProdukModels');
const Kriteria = require('../models/Kriteria');
const SubKriteria = require('../models/SubKriteriaModels');
const BobotSubKriteria = require('../models/BobotSubKriteriaModels');
const BobotProduk = require('../models/BobotProdukModels');
const TypePreferensi = require('../models/TipePreferensiModels');
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const kategori = async(req, res) =>{
  try {
    const categories = await Produk.distinct('kategori');
    res.status(200).json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, categories));
  } catch (error) {
    res.status(500).json(apiResponse.error(STATUS_MESSAGES[500], STATUS_CODES.INTERNAL_SERVER_ERROR, { message: error.message }));
  }
}

const getAllDataToCalculate = async(req, res) => {
  logger.info("Fetching all data to calculate");
  try {
      const pipeline = [
          {
              $lookup: {
                  from: "bobot_produk",
                  localField: "_id",
                  foreignField: "id_produk",
                  as: "bobot_produk"
              }
          },
          { $unwind: "$bobot_produk" },
          {
              $lookup: {
                  from: "bobot_sub_kriteria",
                  localField: "bobot_produk.id_bobot_sub_kriteria",
                  foreignField: "_id",
                  as: "bobot_sub_kriteria"
              }
          },
          {
              $lookup: {
                  from: "sub_kriteria",
                  localField: "bobot_sub_kriteria.id_sub_kriteria",
                  foreignField: "_id",
                  as: "sub_kriteria"
              }
          },
          {
              $lookup: {
                  from: "kriteria",
                  localField: "sub_kriteria.id_kriteria",
                  foreignField: "_id",
                  as: "kriteria"
              }
          },
          {
              $lookup: {
                  from: "typePreferensi",
                  localField: "sub_kriteria.id_type",
                  foreignField: "_id",
                  as: "type_preferensi"
              }
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
                                              cond: { $eq: ["$$sub.id_kriteria", "$$kriteria._id"] }
                                          }
                                      },
                                      as: "sub",
                                      in: {
                                          _id: "$$sub._id",
                                          type: {
                                              $arrayElemAt: [
                                                  "$type_preferensi.type",
                                                  0
                                              ]
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
                                                                      cond: { $eq: ["$$bobot.id_sub_kriteria", "$$sub._id"] }
                                                                  }
                                                              },
                                                              0
                                                          ]
                                                      }
                                                  },
                                                  in: "$$bobot.nama_bobot"
                                              }
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
                                                                      cond: { $eq: ["$$bobot.id_sub_kriteria", "$$sub._id"] }
                                                                  }
                                                              },
                                                              0
                                                          ]
                                                      }
                                                  },
                                                  in: "$$bobot.nilai_bobot"
                                              }
                                          },
                                          min_max: "$$sub.min_max",
                                          p: "$$sub.p",
                                          q: "$$sub.q",
                                          s: "$$sub.s"
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      ];

      const result = await Produk.aggregate(pipeline);

      logger.info("Products aggregation result:", {
          count: result.length,
          sample: result[0] // Log first item as sample
      });

      res.status(200).json(apiResponse.success(
          STATUS_MESSAGES[200], 
          STATUS_CODES.OK, 
          result
      ));

  } catch (error) {
      logger.error("Error fetching aggregated products data", {
          error: error.message,
          stack: error.stack,
      });
      res.status(500).json(
          apiResponse.error(
              STATUS_MESSAGES[500], 
              STATUS_CODES.INTERNAL_SERVER_ERROR, 
              { message: error.message }
          )
      );
  }
}

module.exports = { kategori,getAllDataToCalculate }
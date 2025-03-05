const BobotProduk = require("../models/BobotProdukModels");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getFormattedProdukData = async (req, res) => {
  logger.info("Fetching all Bobot Produk");
  try {
    logger.info("start bobotProdukData");
    const bobotProdukData = await BobotProduk.find()
      .populate({
        path: "id_produk",
        select: "produk kategori",
      })
      .populate({
        path: "id_bobot_sub_kriteria",
        populate: {
          path: "id_sub_kriteria",
          populate: {
            path: "id_kriteria",
            select: "kriteria ",
          },
        },
      });
    logger.info("end bobotProdukData");

    // Format data for treeTable
    const formattedResponse = bobotProdukData.map((bobotProduk) => {
      // Create product level data
      const productData = {
        key: bobotProduk.id_produk._id,
        data: {
          name: bobotProduk.id_produk.produk,
          kategori: bobotProduk.id_produk.kategori,
        },
        children: [],
      };

      // Group by kriteria
      const kriteriaMap = new Map();

      bobotProduk.id_bobot_sub_kriteria.forEach((bobot) => {
        const kriteria = bobot.id_sub_kriteria.id_kriteria;
        const kriteriaId = kriteria._id.toString();

        if (!kriteriaMap.has(kriteriaId)) {
          // Create kriteria level data
          kriteriaMap.set(kriteriaId, {
            key: kriteriaId,
            data: {
              name: kriteria.kriteria,
            },
            children: [],
          });
          productData.children.push(kriteriaMap.get(kriteriaId));
        }

        // Add sub-kriteria level data
        kriteriaMap.get(kriteriaId).children.push({
          key: bobot._id,
          data: {
            id_produk: bobotProduk.id_produk._id,
            name: bobot.id_sub_kriteria.nama_sub_kriteria,
            nama_bobot: bobot.nama_bobot,
            nilai_bobot: bobot.nilai_bobot,
          },
        });
      });

      return productData;
    });

    logger.info("Bobot Produk query result:", {
      count: formattedResponse.length,
      data: formattedResponse,
    });

    res
      .status(200)
      .json(
        apiResponse.success(
          STATUS_MESSAGES[200],
          STATUS_CODES.OK,
          formattedResponse
        )
      );
  } catch (error) {
    logger.error("Error fetching all Bobot Produk", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const getBobotProdukbyId = async (req, res) => {
  logger.info("Fetching bobot produk by id", {
    id: req.body._id,
  });
  try {
    const bobotProdukData = await BobotProduk.findOne({
      id_produk: req.body._id,
    });

    if (!bobotProdukData) {
      logger.error("Bobot Produk not found", {
        id: req.body._id,
      });
      return res
        .status(404)
        .json(
          apiResponse.error(STATUS_MESSAGES[404], STATUS_CODES.NOT_FOUND, null)
        );
    }

    logger.info("Bobot Produk query result:", bobotProdukData);
    res
      .status(200)
      .json(
        apiResponse.success(
          STATUS_MESSAGES[200],
          STATUS_CODES.OK,
          bobotProdukData
        )
      );
  } catch (error) {
    logger.error("Error fetching Bobot Produk by id", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const addBobotProduk = async (req, res) => {
  try {
    const { id_produk, id_bobot_sub_kriteria } = req.body;
    // Check if a record with the same product already exists
    const existingBobotProduk = await BobotProduk.findOne({
      id_produk: id_produk,
    });

    if (existingBobotProduk) {
      // Check if any of the sub-kriteria weights already exist
      // const duplicateSubKriteria =
      //   existingBobotProduk.id_bobot_sub_kriteria.some((existingId) =>
      //     id_bobot_sub_kriteria.includes(existingId.toString())
      //   );

      // if (duplicateSubKriteria) {
      //   return res
      //     .status(400)
      //     .json(
      //       apiResponse.error(
      //         "Bobot produk dan bobot sub kriteria untuk produk ini sudah ada",
      //         400,
      //         null
      //       )
      //     );
      // }

      // If no duplicate, append new sub-kriteria to existing record
      // existingBobotProduk.id_bobot_sub_kriteria.push(...id_bobot_sub_kriteria);
      // await existingBobotProduk.save();

      // return res
      //   .status(200)
      //   .json(
      //     apiResponse.success(
      //       "Bobot sub kriteria berhasil ditambahkan",
      //       200,
      //       existingBobotProduk
      //     )
      //   );
      return res
      .status(400)
      .json(
        apiResponse.error(
          "Bobot produk dan bobot sub kriteria untuk produk ini sudah ada",
          400,
          null
        )
      );
    }

    // If no existing record, create new
    const newBobotProduk = new BobotProduk({
      id_produk,
      id_bobot_sub_kriteria,
    });
    await newBobotProduk.save();

    res
      .status(201)
      .json(
        apiResponse.success(
          STATUS_MESSAGES[201],
          STATUS_CODES.CREATED,
          newBobotProduk
        )
      );
  } catch (error) {
    logger.error("Error adding Bobot Produk", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const updateBobotProduk = async (req, res) => {
  logger.info("Starting kriteria update process", {
    id: req.body._id,
  });
  try {
    const { _id, id_produk, id_bobot_sub_kriteria } = req.body;

    // Check if a record with the same product already exists
    const existingBobotProduk = await BobotProduk.findOne({
      id_produk: id_produk,
    });

    if (existingBobotProduk) {
      const duplicateSubKriteria =
        existingBobotProduk.id_bobot_sub_kriteria.some((existingId) =>
          id_bobot_sub_kriteria.includes(existingId.toString())
        );

      if (duplicateSubKriteria) {
        return res
          .status(400)
          .json(
            apiResponse.error(
              "Bobot produk dan bobot sub kriteria untuk produk ini sudah ada",
              400,
              null
            )
          );
      }

      const updateBobotProduk = await BobotProduk.findByIdAndUpdate(
        _id,
        {
          id_produk,
          id_bobot_sub_kriteria,
        },
        { new: true }
      );

      const data = {
        _id: updateBobotProduk._id,
        id_produk: updateBobotProduk.id_produk,
        id_bobot_sub_kriteria: updateBobotProduk.id_bobot_sub_kriteria,
      };

      logger.info("Bobot Produk updated successfully", data);
      res
        .status(200)
        .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data));
    }
  } catch (error) {
    logger.error("Error in Bobot Produk update", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const deleteBobotProduk = async (req, res) => {
  try {
    const { _id } = req.body;
    await BobotProduk.findByIdAndDelete(_id);
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, null));
  } catch (error) {
    logger.error("Error deleting Bobot Produk", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

module.exports = {
  getFormattedProdukData,
  getBobotProdukbyId,
  addBobotProduk,
  updateBobotProduk,
  deleteBobotProduk,
};

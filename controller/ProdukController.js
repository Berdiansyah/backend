const Produk = require("../models/ProdukModels");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getAllProduk = async (req, res) => {
  logger.info("Fetching all products");
  try {
    const produk = await Produk.find();
    logger.info("Products query result:", {
      count: produk.length,
      data: produk
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, produk));
  } catch (error) {
    logger.error("Error fetching all products", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const addProduk = async (req, res) => {
  logger.info("Starting product registration process", {
    nama: req.body.produk,
  });
  try {
    const { produk, kategori } = req.body;

    const addProduk = await Produk.create({
      produk,
      kategori,
    });

    const data = {
      _id: addProduk._id,
      produk: addProduk.produk,
      kategori: addProduk.kategori
    };

    logger.info("Product registered successfully", data);
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, data)
      );
  } catch (error) {
    logger.error("Error in product registration", {
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

const editProduk = async (req, res) => {
  logger.info("Starting product edit process", { produkId: req.body._id });
  try {
    const { _id, produk, kategori } = req.body;

    const updateProduk = await Produk.findByIdAndUpdate(
      _id,
      {
        produk,
        kategori,
      },
      { new: true }
    );

    if (!updateProduk) {
      logger.warn("Product not found", { produkId: _id });
      return res
        .status(404)
        .json(
          apiResponse.error("Product not found", STATUS_CODES.NOT_FOUND, null)
        );
    }

    const data = {
      _id: updateProduk._id,
      produk: updateProduk.produk,
      kategori: updateProduk.kategori,
    };

    logger.info("Product edited successfully", data);
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data));
  } catch (error) {
    logger.error("Error editing product", {
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

const deletedProduk = async (req, res) => {
  logger.info("Starting product deletion process", { produkId: req.body._id });
  try {
    const { _id } = req.body;

    const deleteProduk = await Produk.findByIdAndDelete(_id);

    if (!deleteProduk) {
      logger.warn("Product not found", { produkId: _id });
      return res
        .status(404)
        .json(
          apiResponse.error("Product not found", STATUS_CODES.NOT_FOUND, null)
        );
    }

    logger.info("Product deleted successfully", { produkId: _id });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, null));
  } catch (error) {
    logger.error("Error deleting product", {
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

module.exports = {getAllProduk,addProduk,editProduk,deletedProduk};

const TypePreferensi = require("../models/TipePreferensiModels");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getAllTypePreferensi = async (req, res) => {
  logger.info("Fetching all type preferensi");
  try {
    const typePreferensi = await TypePreferensi.find();
    logger.info("Type preferensi query result:", {
      count: typePreferensi.length,
      data: typePreferensi
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, typePreferensi));
  } catch (error) {
    logger.error("Error fetching all type preferensi", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const addTypePreferensi = async (req, res) => {
  logger.info("Starting type preferensi registration process", {
    nama: req.body.type,
  });
  try {
    const { type } = req.body;

    const addTypePreferensi = await TypePreferensi.create({
      type,
    });

    const data = {
      _id: addTypePreferensi._id,
      type: addTypePreferensi.type,
    };

    logger.info("Type preferensi registered successfully", data);
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, data)
      );
  } catch (error) {
    logger.error("Error in type preferensi registration", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          error.message,
          500,
          null
        )
      );
  }
};

const updateTypePreferensi = async (req, res) => {
  logger.info("Starting type preferensi update process", {
    id: req.body._id,
  });
  try {
    const { _id, type } = req.body;

    const updateTypePreferensi = await TypePreferensi.findByIdAndUpdate(_id, {
      type,
    });

    const data = {
      _id: updateTypePreferensi._id,
      type: updateTypePreferensi.type,
    };

    logger.info("Type preferensi updated successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data)
      );
  } catch (error) {
    logger.error("Error in type preferensi update", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          error.message,
          500,
          null
        )
      );
  }
}

const deleteTypePreferensi = async (req, res) => {  
  logger.info("Starting type preferensi delete process", {
    id: req.body._id,
  });
  try {
    const { _id } = req.body;

    const deleteTypePreferensi = await TypePreferensi.findByIdAndDelete(_id);

    const data = {
      _id: deleteTypePreferensi._id,
      type: deleteTypePreferensi.type,
    };

    logger.info("Type preferensi deleted successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK,  null)
      );
  } catch (error) {
    logger.error("Error in type preferensi delete", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json(
        apiResponse.error(
          error.message,
          500,
          null
        )
      );
  }
}

module.exports = {
  getAllTypePreferensi,
  addTypePreferensi,
  updateTypePreferensi,
  deleteTypePreferensi
};
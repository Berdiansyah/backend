const Kriteria = require("../models/Kriteria");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getAllKriteria = async (req, res) => {
  logger.info("Fetching all kriteria");
  try {
    const kriteria = await Kriteria.find();
    logger.info("Kriteria query result:", {
      count: kriteria.length,
      data: kriteria
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, kriteria));
  } catch (error) {
    logger.error("Error fetching all kriteria", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
}

const addKriteria = async (req, res) => {
  logger.info("Starting kriteria registration process", {
    kriteria: req.body.kriteria,
  });
  try {
    const { kriteria } = req.body;

    const existingKriteria = await Kriteria.findOne({ kriteria });
    if (existingKriteria) return res.status(400).json(apiResponse.error(`Kriteria ${kriteria} sudah di masukan`, 400, null));

    const addKriteria = await Kriteria.create({
      kriteria
    });

    const data = {
      _id: addKriteria._id,
      kriteria: addKriteria.kriteria,
    };

    logger.info("Kriteria registered successfully", data);
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, data)
      );
  } catch (error) {
    logger.error("Error in kriteria registration", {
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

const updateKriteria = async (req, res) => {  
  logger.info("Starting kriteria update process", {
    kriteria: req.body.kriteria,
  });
  try {
    const { _id ,kriteria } = req.body;

    const existingKriteria = await Kriteria.findOne({ kriteria });
    if (existingKriteria) return res.status(400).json(apiResponse.error(`Kriteria ${kriteria} sudah di masukan`, 400, null));

    const updateKriteria = await Kriteria.findByIdAndUpdate(_id, {
      kriteria
    },{new:true});

    const data = {
      _id: updateKriteria._id,
      kriteria: updateKriteria.kriteria,
    };

    logger.info("Kriteria updated successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data)
      );
  } catch (error) {
    logger.error("Error in kriteria update", {
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

const deleteKriteria = async (req, res) => {
  logger.info("Starting kriteria delete process", {
    kriteriaId: req.body._id,
  });
  try {
    const { _id } = req.body;

    const deleteKriteria = await Kriteria.findByIdAndDelete(_id);

    if (!deleteKriteria) {
      logger.warn("Kriteria not found", { kriteriaId: _id });
      return res
        .status(404)
        .json(
          apiResponse.error("Kriteria not found", STATUS_CODES.NOT_FOUND, null)
        );
    }

    const data = {
      _id: deleteKriteria._id,
      kriteria: deleteKriteria.kriteria,
    };

    logger.info("Kriteria deleted successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, null)
      );
  } catch (error) {
    logger.error("Error in kriteria delete", {
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

module.exports = { getAllKriteria, addKriteria, updateKriteria, deleteKriteria };
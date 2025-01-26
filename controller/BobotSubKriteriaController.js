const BobotSubKriteria = require("../models/BobotSubKriteriaModels");
//template
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getAllBobotSubKriteria = async (req, res) => {
  logger.info("Fetching all Bobot Sub Kriteria");
  try {
    const bobotSubKriteria = await BobotSubKriteria.find();
    logger.info("Bobot Sub Kriteria query result:", {
      count: bobotSubKriteria.length,
      data: bobotSubKriteria
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, bobotSubKriteria));
  } catch (error) {
    logger.error("Error fetching all Bobot Sub Kriteria", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
}

const addBobotSubKriteria = async (req, res) => {
  logger.info("Starting Bobot Sub Kriteria registration process", {
    nama: req.body.bobot,
  });
  try {
    const { id_sub_kriteria ,nama_bobot, nilai_bobot } = req.body;

    const addBobotSubKriteria = await BobotSubKriteria.create({
      id_sub_kriteria ,
      nama_bobot, 
      nilai_bobot
    });

    const data = {
      _id: addBobotSubKriteria._id,
      id_sub_kriteria: addBobotSubKriteria.id_sub_kriteria,
      nama_bobot: addBobotSubKriteria.nama_bobot,
      nilai_bobot: addBobotSubKriteria.nilai_bobot,
    };

    logger.info("Bobot Sub Kriteria registered successfully", data);
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, data)
      );
  } catch (error) {
    logger.error("Error in Bobot Sub Kriteria registration", {
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

const updateBobotSubKriteria = async (req, res) => {
  logger.info("Starting Bobot Sub Kriteria update process", {
    id: req.body._id,
  });
  try {
    const { _id, id_sub_kriteria, nama_bobot, nilai_bobot } = req.body;

    const bobotSubKriteria = await BobotSubKriteria.findByIdAndUpdate(_id ,{ 
      id_sub_kriteria, nama_bobot, nilai_bobot 
    },
      { new: true }
    );

    const data = {
      _id: bobotSubKriteria._id,
      id_sub_kriteria: bobotSubKriteria.id_sub_kriteria,
      nama_bobot: bobotSubKriteria.nama_bobot,
      nilai_bobot: bobotSubKriteria.nilai_bobot,
    };

    logger.info("Bobot Sub Kriteria updated successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data)
      );
  } catch (error) {
    logger.error("Error updating Bobot Sub Kriteria", {
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

const deleteBobotSubKriteria = async (req, res) => {
  logger.info("Starting Bobot Sub Kriteria delete process", {
    id: req.body._id,
  });
  try {
    const { _id } = req.body;
    const bobotSubKriteria = await BobotSubKriteria.findByIdAndDelete(_id);

    logger.info("Bobot Sub Kriteria deleted successfully", _id);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, null)
      );
  } catch (error) {
    logger.error("Error deleting Bobot Sub Kriteria", {
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
  getAllBobotSubKriteria,
  addBobotSubKriteria,
  updateBobotSubKriteria,
  deleteBobotSubKriteria
};
const SubKriteria = require("../models/SubKriteriaModels");
const Kriteria = require("../models/Kriteria");
const TypePreferensi = require("../models/TipePreferensiModels");
//template 
const apiResponse = require("../utils/ApiResponse");
const STATUS_CODES = require("../constants/StatusCode");
const STATUS_MESSAGES = require("../constants/Message");
const logger = require("../utils/Logger");

const getAllSubKriteria = async (req, res) => {
  logger.info("Fetching all sub kriteria with Kriteria and typePreferensi");

  try {
    // Fetch Kriteria data
    const KriteriaData = await Kriteria.find(); // Koleksi Kriteria
    logger.info("Fetched Kriteria data", { count: KriteriaData.length });

    // Fetch sub-kriteria data
    const subKriteriaData = await SubKriteria.find(); // Koleksi sub-kriteria
    logger.info("Fetched sub-kriteria data", { count: subKriteriaData.length });

    // Fetch typePreferensi data
    const typePreferensiData = await TypePreferensi.find(); // Koleksi typePreferensi
    logger.info("Fetched typePreferensi data", { count: typePreferensiData.length });

    // Map typePreferensi untuk akses cepat berdasarkan id
    const typeMap = new Map();
    typePreferensiData.forEach((type) => {
      typeMap.set(type._id.toString(), type.type); // Assuming `type` is the type name
    });

    // Transform kategori data into TreeTable structure
    const treeData = KriteriaData.map((kategori, kategoriIndex) => {
      const children = subKriteriaData
        .filter((subKriteria) => subKriteria.id_kriteria.toString() === kategori._id.toString())
        .map((subKriteria, subIndex) => ({
          key: `${kategoriIndex}-${subIndex}`, // Unique key
          data: {
            _id: subKriteria._id,
            name: subKriteria.nama_sub_kriteria,
            type: typeMap.get(subKriteria.id_type.toString()) || "Unknown", // Get type name or "Unknown"
            min_max: subKriteria.min_max,
            p: subKriteria.p,
            q: subKriteria.q,
            s: subKriteria.s,
          },
        }));

      return {
        key: `${kategoriIndex}`, // Unique key for kategori
        data: {
          name: kategori.kriteria, // Assuming `nama_kategori` exists in kategori
          type: "",
          min_max: "",
          p: "",
          q: "",
          s: "",
        },
        children,
      };
    });

    // Send response
    res.status(200).json(
      apiResponse.success(
        STATUS_MESSAGES[200],
        STATUS_CODES.OK,
        treeData
      )
    );
  } catch (error) {
    logger.error("Error fetching all sub kriteria with kategori and typePreferensi", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
};

const getSubKriteriaById = async (req, res) => {

  logger.info("Fetching sub kriteria by id", {
    id: req.body._id,
  });
  try {
    const subKriteria = await SubKriteria.findById(req.body._id);

    if (!subKriteria) {
      logger.error("Sub Kriteria not found", {
        id: req.body._id,
      });
      return res
        .status(404)
        .json(
          apiResponse.error(
            STATUS_MESSAGES[404],
            STATUS_CODES.NOT_FOUND,
            null
          )
        );
    }

    logger.info("Sub Kriteria query result:", subKriteria);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, subKriteria)
      );
  } catch (error) {
    logger.error("Error fetching sub kriteria by id", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
}

const getSubKriteriaNonFormated = async (re,res) => {
  logger.info("Fetching all sub kriteria");
  try {
    const subKriteria = await SubKriteria.find();
    logger.info("sub Kriteria query result:", {
      count: subKriteria.length,
      data: subKriteria
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, subKriteria));
  } catch (error) {
    logger.error("Error fetching all sub kriteria", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
}

const getSubKriteriaLength = async (re,res) => {
  logger.info("Fetching all sub kriteria");
  try {
    const subKriteria = (await SubKriteria.find()).length;
    logger.info("sub Kriteria query result:", {
      count: subKriteria.length,
      data: subKriteria
    });
    res
      .status(200)
      .json(apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, subKriteria));
  } catch (error) {
    logger.error("Error fetching all sub kriteria", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json(apiResponse.error(error.message, 500, null));
  }
}

const addSubKriteria = async (req, res) => {
  logger.info("Starting sub kriteria registration process", {
    nama: req.body.sub_kriteria,
  });
  try {
    const { id_kriteria, id_type, nama_sub_kriteria, min_max, p, q, s } = req.body;

    const existingSubKriteria = await SubKriteria.findOne({id_kriteria, id_type, nama_sub_kriteria});
    if (existingSubKriteria) return res.status(400).json(apiResponse.error(`Sub Kriteria ${nama_sub_kriteria} sudah di terdapat di sistem`, 400, null));

    const addSubKriteria = await SubKriteria.create({
      id_kriteria,
      id_type,
      nama_sub_kriteria,
      min_max,
      p,
      q,
      s
    });

    const data = {
      _id: addSubKriteria._id,
      id_kriteria: addSubKriteria.id_kriteria,
      id_type: addSubKriteria.id_type,
      nama_sub_kriteria: addSubKriteria.nama_sub_kriteria,
      min_max: addSubKriteria.min_max,
      p: addSubKriteria.p,
      q: addSubKriteria.q,
      s: addSubKriteria.s
    };

    logger.info("Sub Kriteria registered successfully", data);
    res
      .status(201)
      .json(
        apiResponse.success(STATUS_MESSAGES[201], STATUS_CODES.CREATED, data)
      );
  } catch (error) {
    logger.error("Error in sub kriteria registration", {
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

const updateSubKriteria = async (req, res) => {
  logger.info("Starting sub kriteria update process", {
    id: req.body._id,
  });
  try {
    const { _id, id_kriteria, id_type, nama_sub_kriteria, min_max, p, q, s } = req.body;

    const updateSubKriteria = await SubKriteria.findByIdAndUpdate( _id, {
      id_kriteria,
      id_type,
      nama_sub_kriteria,
      min_max,
      p,
      q,
      s
    });

    const data = {
      _id: updateSubKriteria._id,
      id_kriteria: updateSubKriteria.id_kriteria,
      id_type: updateSubKriteria.id_type,
      nama_sub_kriteria: updateSubKriteria.nama_sub_kriteria,
      min_max: updateSubKriteria.min_max,
      p: updateSubKriteria.p,
      q: updateSubKriteria.q,
      s: updateSubKriteria.s
    };

    logger.info("Sub Kriteria updated successfully", data);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, data)
      );
  } catch (error) {
    logger.error("Error in sub kriteria update", {
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

const deleteSubKriteria = async (req, res) => {  
  logger.info("Starting sub kriteria delete process", {
    id: req.body._id,
  });
  try {
    const { _id } = req.body;

    const deleteSubKriteria = await SubKriteria.findByIdAndDelete(_id);

    logger.info("Sub Kriteria deleted successfully", deleteSubKriteria);
    res
      .status(200)
      .json(
        apiResponse.success(STATUS_MESSAGES[200], STATUS_CODES.OK, deleteSubKriteria)
      );
  } catch (error) {
    logger.error("Error in sub kriteria delete", {
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

module.exports = { getAllSubKriteria, getSubKriteriaById, addSubKriteria, updateSubKriteria, deleteSubKriteria, getSubKriteriaNonFormated, getSubKriteriaLength };
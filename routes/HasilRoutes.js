const express = require('express');
const router = express.Router();
const hasilController = require('../controller/HasilController');

router.get('/getKategori', hasilController.kategori);
router.get('/getPlainData', hasilController.getAllDataToCalculate);

module.exports = router;
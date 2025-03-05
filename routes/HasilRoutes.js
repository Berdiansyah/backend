const express = require('express');
const router = express.Router();
const hasilController = require('../controller/HasilController');

router.get('/getKategori', hasilController.kategori);
router.get('/getPlainData', hasilController.getAllDataToCalculate);
router.post('/addHasil', hasilController.addHasil); 
router.get('/getAllHasil', hasilController.getAllHasil);
router.get('/getHasilByMonth', hasilController.getHasilByMonth);
router.delete('/deleteHasil', hasilController.deleteHasil);

module.exports = router;
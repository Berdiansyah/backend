const express = require('express');
const router = express.Router();
const hasilController = require('../controller/HasilController');

router.get('/getKategori', hasilController.kategori);
router.get('/getPlainData', hasilController.getAllDataToCalculate);
router.post('/addHasil', hasilController.addHasil); 
router.get('/getAllHasil', hasilController.getAllHasil);
router.post('/getHasilByMonth', hasilController.getHasilByMonth);
router.delete('/deleteHasil', hasilController.deleteHasil);
router.post('/getDetailHasil', hasilController.getDetailHasil);

module.exports = router;
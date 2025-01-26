const express = require('express');
const router = express.Router();
const bobotProdukController = require('../controller/BobotProdukController');

router.get('/getAllBobotProduk', bobotProdukController.getFormattedProdukData);
router.post('/getBobotProdukById', bobotProdukController.getBobotProdukbyId);
router.post('/addBobotProduk', bobotProdukController.addBobotProduk);
router.put('/updateBobotProduk', bobotProdukController.updateBobotProduk);
router.delete('/deleteBobotProduk', bobotProdukController.deleteBobotProduk);

module.exports = router;
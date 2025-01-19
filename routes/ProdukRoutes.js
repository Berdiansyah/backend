const express = require('express');
const router = express.Router();
const produkController = require('../controller/ProdukController');

router.get('/getAllProduk', produkController.getAllProduk);
router.post('/addProduk', produkController.addProduk);
router.put('/editProduk', produkController.editProduk);
router.delete('/deleteProduk', produkController.deletedProduk);

module.exports = router;
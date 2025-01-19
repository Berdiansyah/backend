const express = require('express');
const router = express.Router();
const kriteriaController = require('../controller/KriteriaController');

router.get('/getAllKriteria', kriteriaController.getAllKriteria);
router.post('/addKriteria', kriteriaController.addKriteria);
router.put('/editKriteria', kriteriaController.updateKriteria);
router.delete('/deleteKriteria', kriteriaController.deleteKriteria);

module.exports = router;

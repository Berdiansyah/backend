const express = require('express');
const router = express.Router();
const subKriteriaController = require('../controller/SubKriteriaController');

router.get('/getAllSubKriteria', subKriteriaController.getAllSubKriteria);
router.get('/getAllSubKriteriaNonFormated', subKriteriaController.getSubKriteriaNonFormated);
router.post('/getSubKriteriaById', subKriteriaController.getSubKriteriaById);
router.post('/addSubKriteria', subKriteriaController.addSubKriteria);
router.put('/editSubKriteria', subKriteriaController.updateSubKriteria);
router.delete('/deleteSubKriteria', subKriteriaController.deleteSubKriteria);

module.exports = router;
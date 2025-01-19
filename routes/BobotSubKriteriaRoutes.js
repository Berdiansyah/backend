const express = require('express');
const router = express.Router();
const bobotSubKriteriaController = require('../controller/BobotSubKriteriaController');

router.get('/getAllBobotSubKriteria', bobotSubKriteriaController.getAllBobotSubKriteria);
router.post('/addBobotSubKriteria', bobotSubKriteriaController.addBobotSubKriteria);
router.put('/editBobotSubKriteria', bobotSubKriteriaController.updateBobotSubKriteria);
router.delete('/deleteBobotSubKriteria', bobotSubKriteriaController.deleteBobotSubKriteria);

module.exports = router;
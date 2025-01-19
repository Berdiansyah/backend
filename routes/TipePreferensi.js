const express = require('express');
const router = express.Router();
const tipePreferensiController = require('../controller/TipePreferensiController');

router.get('/getAllTypePreferensi', tipePreferensiController.getAllTypePreferensi);
router.post('/addTypePreferensi', tipePreferensiController.addTypePreferensi);
router.put('/editTypePreferensi', tipePreferensiController.updateTypePreferensi);
router.delete('/deleteTypePreferensi', tipePreferensiController.deleteTypePreferensi);


module.exports = router;
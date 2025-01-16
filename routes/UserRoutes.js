const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');

router.get('/getUser', userController.getUser);
router.get('/getAllUser', userController.getAllUsers);
router.post('/register', userController.register);
router.put('/editUser', userController.editUser);
router.delete('/deleteuser', userController.deleteUser);

module.exports = router;
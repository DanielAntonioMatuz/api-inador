var express = require('express');
var messageController = require('../controllers/MessageController');


var api = express.Router();

api.post('/mensaje/enviar',messageController.send);
api.get('/mensajes/:de/:para',messageController.data_msm)

module.exports = api;


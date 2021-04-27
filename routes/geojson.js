var express = require('express');
var geoController = require('../controllers/geo');


var api = express.Router();

api.post('/geo/locate',geoController.send);
api.get('/geo/:idUser/:idLocate',geoController.data_geo)
api.put('/geo-update-location/:id', geoController.updateGeolocation);


module.exports = api;


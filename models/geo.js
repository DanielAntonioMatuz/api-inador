// models/geo.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var hoy = new Date();
var fecha = hoy.getDate() + '-'+(hoy.getMonth()+1) + '-' + hoy.getFullYear();
var hora = hoy.getHours() + ':' + hoy.getMinutes() + '+' + hoy.getSeconds();
var fullTime = fecha + ' ' + hora;

var GeoSchema = Schema({
    idUser: {type: Schema.ObjectId,ref:'user'},
    idLocate: {type: Schema.ObjectId, ref: 'user'},
    lat: String,
    long: String,
    createAt: {type: Date, default:Date.now()}
});

// Export the model
module.exports = mongoose.model('Geo', GeoSchema);

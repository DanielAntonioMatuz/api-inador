var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geouserSchema = Schema({

    de: {type: Schema.ObjectId,ref:'user'},
    para: {type: Schema.ObjectId, ref: 'user'},
    msm: String,
    createAt: {type: Date, default:Date.now()}


})

module.exports = mongoose.model('geouser', geouserSchema);

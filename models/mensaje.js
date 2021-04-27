var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = Schema({

    de: {type: Schema.ObjectId,ref:'user'},
    para: {type: Schema.ObjectId, ref: 'user'},
    msm: String,
    createAt: {type: Date, default:Date.now()}


})

module.exports = mongoose.model('message', messageSchema);

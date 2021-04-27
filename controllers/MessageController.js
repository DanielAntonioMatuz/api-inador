var Message = require('../models/mensaje');

function send(req,res) {
    let data = req.body;

    var message = new Message();
    message.de = data.de;
    message.para = data.para;
    message.msm = data.msm;

    message.save((err, message_save) => {
        if(err){
            res.status(500).send({message: 'Error en el servidor'});
        } else {
            if(message_save){
                res.status(200).send({message: message_save});
            }
        }
    })
}


function data_msm(req, res) {
    var data = req.body;
    var de = req.params['de'];
    var para = req.params['para'];

    const filtro = {
        '$or' : [
            { '$and': [
                    {
                        'para': de
                    },{
                        'de': para
                    }
                ]
            },{
                '$and': [
                    {
                        'para': para
                    }, {
                        'de': de
                    }
                ]
            },
        ]
    };

    Message.find(filtro).sort({createAt:1}).exec(function (err, messages) {
        if(messages){
            res.status(200).send({messages: messages});
        } else {
            res.status(404).send({message: 'No hay ningun mensaje entre estos usuarios'});
        }
    });
}


module.exports = {
    send,
    data_msm
}

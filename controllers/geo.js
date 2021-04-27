var Geo = require('../models/geo');

function send(req,res) {
    let data = req.body;

    var geoData = new Geo();
    geoData.idUser = data.idUser;
    geoData.idLocate = data.idLocate;
    geoData.lat = data.lat;
    geoData.long = data.long;

    geoData.save((err, geo_save) => {
        if(err){
            res.status(500).send({message: 'Error en el servidor'});
        } else {
            if(geo_save){
                res.status(200).send({message: geo_save});
            }
        }
    })
}


function data_geo(req, res) {
    var data = req.body;
    var idUser = req.params['idUser'];
    var idLocate = req.params['idLocate'];

    const filtro = {
        '$or' : [
            { '$and': [
                    {
                        'idLocate': idUser
                    },{
                        'idUser': idLocate
                    }
                ]
            },{
                '$and': [
                    {
                        'idLocate': idLocate
                    }, {
                        'idUser': idUser
                    }
                ]
            },
        ]
    };

    Geo.find(filtro).sort({createAt:1}).exec(function (err, geoData) {
        if(geoData){
            res.status(200).send({geodata: geoData});
        } else {
            res.status(404).send({message: 'No hay ningun geoData entre estos usuarios'});
        }
    });
}


function updateGeolocation(req, res) {
    const userId = req.params.id;
    console.log(req.params.id);
    const update = req.body;



        Geo.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición.' });
            if (!userUpdated)
                return res
                    .status(404)
                    .send({ message: 'No se ha podido actualizar el usuario.' });
            return res.status(200).send({ geoData: userUpdated });
        });



}


module.exports = {
    send,
    data_geo,
    updateGeolocation
}

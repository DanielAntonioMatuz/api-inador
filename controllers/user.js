'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication =require('../models/publication');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

//Métodos de pruebas
function home (req, res)  {
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
}
 

function pruebas (req, res) {
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
}

//Registro de Usuario
function saveUser(req,res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname && params.nick && params.email && params.password){
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        user.imageBackground = null;
        user.description = null;
        user.date = null;
        user.location = null;
        user.cellphone = null;
        user.estado = false;

        User.find({
            $or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}
            ]
        }).exec((err, users) => {
            if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'});

            if(users && users.length >= 1){
                return res.status(200).send({message: 'El usuario que intenta registrar ya existe'})
            } else {
                //Cifrar contrasena
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, userStored) => {
                        if(err) return res.status(500).send({message: 'Error al guardar el usuario'})

                        if(userStored){
                            res.status(200).send({user: userStored });
                        } else {
                            res.status(404).send({message: 'No se ha registrado el usuario'})
                        }
                    });
                });

            }
        })

        
    } else {
        res.status(200).send({
            message: "Envia todos los campos necesarios"
        });
    }
}

//Loging Usuario
function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    if(params.gettoken){
                        //devolver y Generar token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        //devolver datos del usuario
                        user.password = undefined;
                        return res.status(200).send({user})
                    }
                    
                } else {
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
            });
        } else {
            return res.status(404).send({message: 'El usuario no se ha podido identifcar en el servidor'})
        }
    })

}

// Conseguir datos de un Usuario

function getUser(req, res) {
    var userId = req.params.id;
    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });
        if (!user) return res.status(404).send({ message: 'El usuario no existe' });
        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
}



async function followThisUser(identity_user_id, user_id) {
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id }).exec()
            .then((following) => {
                return following;
            })
            .catch((err) => {
                return handleError(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id }).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err) => {
                return handleError(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch (e) {
        console.log(e);
    }
}

//Devolver un listado de usuarios paginado
function getUsers(req, res){
    var identity_user_id = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!users) return res.status(404). send({message: 'No hay usuarios disponibles'});
        followUserIds(identity_user_id).then((value)=>{

            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                page: Math.ceil(total/itemsPerPage)
            });
        });
    });
}

async function followUserIds(user_id){
    try{
        var following= await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec()
            .then((follows)=>{return follows;}).catch((err)=>{return handleError(err)});

        var followed= await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec()
            .then((follows)=>{return follows;}).catch((err)=>{return handleError(err)});

        //Procesar following Ids
        var following_clean = [];
        following.forEach((follow)=>{
            following_clean.push(follow.followed);
        });

        //Procesar followed Ids
        var followed_clean = [];
        followed.forEach((follow)=>{
            followed_clean.push(follow.user);
        });
        return{
            following: following_clean,
            followed: followed_clean
        }

    }catch(e){
        console.log(e);
    }
}

// Quienses nos siguen y quienes seguimos
function getCounters(req, res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
    }

    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });
}

// lista la cntidad de seguimientos, seguidores y publicaciones
const getCountFollow = async (user_id) => {
    try{
        let following = await Follow.countDocuments({"user": user_id},(err, result) => {
            return result
        });
        let followed = await Follow.countDocuments({"followed": user_id}).then(count => count);
        let publications = await Publication.countDocuments({"user": user_id}).then(count => count);
        //let publications = await Publication.countDocuments({"publication": user_id}).then(count => count);
        return {
            following,
            followed,
            publications: publications
        }
    } catch(e){
        console.log(e);
    }
}

//Actualizar los datos del usuario
function updateUser(req, res) {
    const userId = req.params.id;
    const update = JSON.parse(req.body.user);

    // borrar la contraseña
    delete update.password;

    // comprobamos que el usuario modifique sus datos
    if (userId !== req.user.sub) {
        return res.status(500).send({
            message: 'No tiene permisos suficiente para modificar los datos.'
        });
    }
    User.find({ $or: [{ email: update.email }, { nick: update.nick }] }).exec((err,users)=>{
        var userExiste = false;
        users.forEach((user)=>{
            if(user && user._id != userId) {
                userExiste = true;
            }
        });
        console.log('sha'+userExiste);
        if(userExiste){
            console.log('entra');
            return res.status(404).send({message:'Los datos ya están en uso.'});
        }
        // mongoose me devuelve el objeto user original, por lo cual le tengo que pasar un tercer parametro.(new:true)
        // para que me vuelva el objeto userUpdated actualizado.
        User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición.' });
            if (!userUpdated)
                return res
                    .status(404)
                    .send({ message: 'No se ha podido actualizar el usuario.' });
            return res.status(200).send({ user: userUpdated });
        });
    });


}

//Subir archivos de imagen/avatar de usuario

function uploadImage(req, res){
    var userId = req.params.id;



    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];
        console.log(file_name);

        var ext_split = file_name.split('\.');
        console.log(ext_split);

        var file_ext = ext_split[1];
        console.log(file_ext);

        if(userId !== req.user.sub){
            return removeFilesUploads(res, file_path, 'No tienes permiso de editar los datos del usuario');
        }

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpge' || file_ext == 'gif'){
            //Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdate)=> {
                if(err) return res.status(500).send({message: 'Error en la peticion'});

                if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

                return res.status(200).send({user: userUpdate});
            })
        } else {
            return removeFilesUploads(res, file_path, 'Extension no valida');
        }

    } else {
        return res.status(200).send({message: 'No se han subido imagenes'})
    }
}

function removeFilesUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    } )
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    }))
}


function get_user(req, res){
    let id = req.params['id'];

    User.findById(id, (err, user) => {
        if(err){
            res.status(500).send({message: 'Error en el servidor'});
        } else {
            if(user){
                res.status(200).send({user:user});
            } else {
                res.status(500).send({message:'No existe un usuario con ese ID'});
            }
        }
    })
}

function get_users(req, res){
    User.find((err,users)=> {
        if(err){
            res.status(500).send({message: 'Error en el servidor'});
        } else {
            if(users){
                res.status(200).send({users: users});
            } else {
                res.status(500).send({message: 'No existe ningun usuario'});
            }
        }
    })
}


function update_foto(req, res){
    let id = req.params['id'];

    if(req.files.image){
        let image_path = req.files.image.path;
        let name = image_path.split('\\');
        let image_name = name[2];

        User.findByIdAndUpdate(id, {image: image_name}, function(err, user_update){
            if(err){
                res.status(500).send({message: 'Error en el servidor'});
            } else {
                if(user_update){
                    res.status(200).send({user: user_update});
                } else {
                    res.status(500).send({message: 'No se encontro el usuario'});
                }
            }
        })

    } else {
        res.status(404).send({message: 'No subiste la imagen'});
    }

}


/*const gc = new Storage({
    keyFilename: path.join(__dirname, "../inductive-choir-245217-927719a3318f.json" ),
    projectId: 'inductive-choir-245217'
})

gc.getBuckets().then(x => console.log(x));

const tlintBucket = gc.bucket('tlint-data-server');*/



function get_img(req, res){
    var img = req.params['img'];

    if(img != "null"){
        var path_img = './uploads/users/'+img;
        res.status(200).sendFile(path.resolve(path_img));

    } else {
        console.log('no hay imagen');
        var path_img = './uploads/users/default.png';
        res.status(200).sendFile(path.resolve(path_img));
    }
}

function editar_config(req, res){
    var id = req.params['id'];
    var data = req.body;
    console.log(data);
    if(req.files.image){
        if(data.password){

            console.log('I');

            bcrypt.hash(data.password, null, null, function (err,hash) {

                let image_path = req.files.image.path;
                let name = image_path.split('\\');
                let image_name = name[2];

                if(err){
                    res.status(500).send({message: 'Error en el servidor'});
                } else {
                    User.findByIdAndUpdate(id, {name: data.name, surname: data.surname ,password: hash, image:image_name, cellphone: data.cellphone
                        ,description: data.description, date: data.date, estado: data.estado, role: data.role, location: data.location }, (err, user_data)=>{
                        if(user_data){
                            res.status(200).send({user:user_data});
                        }
                    });
                }
            })
        } else {
            console.log('II');
            let image_path = req.files.image.path;
            let name = image_path.split('\\');
            let image_name = name[2];

            User.findByIdAndUpdate(id, {name: data.name, surname: data.surname , image:image_name, cellphone: data.cellphone
                ,description: data.description, date: data.date, estado: data.estado, role: data.role, location: data.location }, (err, user_data)=>{
                if(user_data){
                    res.status(200).send({user:user_data});
                }
            });

        }
    } else {
        if(data.password){

            bcrypt.hash(data.password, null, null, function (err,hash) {

                if(err){
                    res.status(500).send({message: 'Error en el servidor'});
                } else {
                    User.findByIdAndUpdate(id, {name: data.name, surname: data.surname ,password: hash, cellphone: data.cellphone
                        ,description: data.description, date: data.date, estado: data.estado, role: data.role, location: data.location }, (err, user_data)=>{
                        if(user_data){
                            res.status(200).send({user:user_data});
                        }
                    });
                }
            })
        } else {
            console.log('IV');
            User.findByIdAndUpdate(id, {name: data.name, surname: data.surname , cellphone: data.cellphone
                ,description: data.description, date: data.date, estado: data.estado, role: data.role, location: data.location }, (err, user_data)=>{
                if(user_data){
                    res.status(200).send({user:user_data});
                }
            });
        }
    }
}

function activar_estado(req,res){
    var id = req.params['id'];

    User.findByIdAndUpdate({_id:id},{estado:true},(err,estado_update) =>{
        if(!err){
            if(estado_update){
                res.status(200).send({user: estado_update});
            }else{
                res.status(500).send({message:"Usuario no encontrado"});
            }
        }else{
            res.status(500).send({message:"Error en el servidor"});
        }
    })
}

function desactivar_estado(req,res){
    var id = req.params['id'];

    User.findByIdAndUpdate({_id:id},{estado:false},(err,estado_update) =>{
        if(!err){
            if(estado_update){
                res.status(200).send({user: estado_update});
            }else{
                res.status(500).send({message:"Usuario no encontrado"});
            }
        }else{
            res.status(500).send({message:"Error en el servidor"});
        }
    })
}


module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile,
    get_user,
    get_users,
    update_foto,
    get_img,
    editar_config,
    activar_estado,
    desactivar_estado
}

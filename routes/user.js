'use strict'

var express = require('express');
var UseController = require('../controllers/user');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();
var multiparty = require('connect-multiparty');
var path = multiparty({uploadDir: './uploads/users'});

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'});

api.get('/home', UseController.home);
api.get('/pruebas', md_auth.ensureAuth, UseController.pruebas);
api.post('/register', UseController.saveUser);
api.post('/login', UseController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UseController.getUser);
api.get('/counters/:id?', md_auth.ensureAuth, UseController.getCounters);
api.get('/users/:page?', md_auth.ensureAuth, UseController.getUsers);
api.put('/update-user/:id', md_auth.ensureAuth, UseController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UseController.uploadImage);
api.get('/get-image-user/:imageFile', UseController.getImageFile);
api.get('/usuario/:id', UseController.get_user);
api.get('/usuarios', UseController.get_users);
api.put('/usuario/activar/:id',UseController.activar_estado);
api.put('/usuario/desactivar/:id',UseController.desactivar_estado);
api.put('/usuario/editar/image/:id', path, UseController.update_foto);
api.get('/usuario/img/:img', UseController.get_img);
api.put('/usuario/editar/:id', path, UseController.editar_config);


module.exports = api;

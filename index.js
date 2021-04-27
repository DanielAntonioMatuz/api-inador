
const bodyParser = require("body-parser")

var bodyparser = require('body-parser');
var mongoose =  require('mongoose');
var port = process.env.PORT || 3800;
var express = require('express');

var user_routes = require('./routes/user');
var message_routes = require('./routes/message');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var geo_routes = require('./routes/geojson');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
io.set('origins', '*:*');

io.on('connection', function(socket){
    socket.on('save-message',function (new_msm) {
        io.emit('new-message',{message: new_msm});
    })

    socket.on('save-user', function(user){
        io.emit('new-user', {user:user});
    });

    socket.on('save-users',function(users){
        io.emit('new-users',{users})
    })

});

mongoose.connect('mongodb://localhost:27017/curso_mean_social', (err)=> {  //Cambiar a la BD de Tlint
    if(err){
        throw err;
    } else {
        console.log('Conectado a la DB');
        server.listen(port, function(){
            console.log('Estado conectado al puerto ' + port);
        })
    }
});

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());

app.use((req,res,next)=>{
    res.header('Content-Type: application/json');
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods','GET, PUT, POST, DELETE, OPTIONS');
    res.header('Allow','GET, PUT, POST, DELETE, OPTIONS');
    next();
});

//routes
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', geo_routes);

//export
module.exports = app;

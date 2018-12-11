const http = require('http');
// const nodeDispatcher = require('node-dispatcher-with-check-token');
const nodeDispatcher = require('./../../Npm_packet/node-dispatcher-with-check-token');
const dispatcher = nodeDispatcher.Dispatcher;
const mymongo = nodeDispatcher.Mongo;
// const dispatcher = require('mio_dispatcher_v2.js');
const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = http.createServer(function(req, res) {
    // let header = {"Content-Type" : 'text/html;charset=utf-8'};
    // res.writeHead(200, header);
    // res.end("questa è la risorsa richiesta");

    dispatcher.dispatch(req, res);
});

const privateKey = fs.readFileSync('./keys/private.key', 'UTF-8');
server.listen(1337, '127.0.0.1');
console.log('Server in ascolto sulla porta 1337');

// DEFINIZIONE DI LISTENER

dispatcher.addListener('POST', '/api/login', function(req, res) {
    const reqUser = req['POST'];
    mymongo.setUri('mongodb://127.0.0.1:27017');
    mymongo.getFindOne(req, res, 'persons', 'persons', {mail: reqUser['mail']}, 1, function(req, res, errMongo, dbUser, client) {
        if (dbUser && 'pwd' in dbUser) {
            dispatcher.bcryptCompare(req, res, reqUser['pwd'], dbUser['pwd'], () => {
                const token = {
                    token: dispatcher.generateToken({
                        _id: dbUser['_id'],
                        mail: dbUser['mail'],
                        nome: dbUser['nome'],
                    },
                    Math.floor(Date.now() / 1000) + 60,
                    privateKey
                    ),
                };
                client.close();
                dispatcher.sendJson(req, res, null, token);
            });
        } else {
            dispatcher.sendError(req, res, {code: 401, message: 'errore: Username non valido', error: true});
        }
    });
});
// dispatcher.addListener('POST', '/api/login', function(req, res) {
//     const reqUser = req['POST'];
//     mymongo.setUri('mongodb://127.0.0.1:27017');
//     mymongo.getFind(req, res, 'persons', 'persons', {'find': {mail: reqUser['mail']}}, function(req, res, errMongo, dbData, client) {
//         if (errMongo) {
//             dispatcher.sendError(req, res, {code: 503, message: 'errore: connessione al db', error: true});
//             client.close();
//         } else {
//             if (dbData && dbData.length > 0 && 'pwd' in dbData[0]) {
//                 const dbUser = dbData[0];
//                 dispatcher.bcryptCompare(req, res, reqUser['pwd'], dbUser['pwd'], () => {
//                     const token = {
//                         token: dispatcher.generateToken({
//                             _id: dbUser['_id'],
//                             mail: dbUser['mail'],
//                             nome: dbUser['nome'],
//                         },
//                         Math.floor(Date.now() / 1000) + 60,
//                         privateKey
//                         ),
//                     };
//                     client.close();
//                     dispatcher.sendJson(req, res, null, token);
//                 });
//             } else {
//                 dispatcher.sendError(req, res, {code: 401, message: 'errore: Username non valido', error: true});
//             }
//         }
//     });
// });

// dispatcher.addListener('POST', '/api/login', function(req, res) {
//     mongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true}, function(err, client) {
//         if (err) {
//             dispatcher.sendError(req, res, {
//                 code: 500,
//                 message: 'errore di connessione al db',
//             });
//         } else {
//             const db = client.db('persons');
//             const collection = db.collection('persons');

//             const reqUser = req['POST'];
//             // collection.find(req["GET"]).sort({"name" : 1}).toArray(function (err, data){
//             collection.findOne({mail: reqUser['mail']}, function(err, dbUser) {
//                 if (err) {
//                     dispatcher.sendError(req, res, {code: 503, message: 'errore: connessione al db'});
//                 } else {
//                     if (dbUser != undefined &&Object.prototype.hasOwnProperty.call(dbUser, 'pwd')) {
//                         bcrypt.compare(reqUser['pwd'], dbUser['pwd'], (err, result) => {
//                             if (err) {
//                                 dispatcher.sendError(req, res, {code: 500, message: 'errore: bcrypt compare'});
//                             } else {
//                                 if (!result) {
//                                     dispatcher.sendError(req, res, {code: 401, message: 'errore: Password non valida'});
//                                 } else {
//                                     /** un ora di validita */
//                                     const token = {
//                                         token: dispatcher.generateToken({
//                                             _id: dbUser['_id'],
//                                             mail: dbUser['mail'],
//                                             nome: dbUser['nome'],
//                                         },
//                                         Math.floor(Date.now() / 1000) + 60,
//                                         privateKey
//                                         ),
//                                     };
//                                     dispatcher.sendJson(req, res, err, token);
//                                 }
//                             }
//                         });
//                     } else {
//                         dispatcher.sendError(req, res, {code: 401, message: 'errore: Username non valido'});
//                     }
//                 }
//                 client.close();
//             });
//         }
//     }
//     );
// });

dispatcher.addListener('GET', ['/index.html', '/'], function(req, res) {
    // eslint-disable-next-line prefer-const
    let result = dispatcher.checkToken(req, res, privateKey);
    result !== undefined ? result : {'error': 1, 'massage': 'undefined token error', 'code': 500};
    if ('code' in result) {
        switch (result['code']) {
        case 200:
            res.setHeader('Set-Cookie', 'token=' + result['token'] + ';max-age=' + (60 * 60 * 24 * 3)+';Path=/');
            dispatcher.sendPage(req, res, './static/index.html');
            break;
        default:
        case 401:
            dispatcher.sendPage(req, res, './static/login.html');
            break;
        case 403:
            dispatcher.sendPage(req, res, './static/login.html');
            break;
        case 500:
            dispatcher.sendPage(req, res, './static/login.html');
            break;
        }
    }
});

dispatcher.addListener('GET', '/api/test', function(req, res) {
    // eslint-disable-next-line prefer-const
    let result = dispatcher.checkToken(req, res, privateKey);
    result !== undefined ? result : {'error': 1, 'massage': 'undefined token error', 'code': -1};
    if ('code' in result) {
        switch (result['code']) {
        case -1:
            dispatcher.sendJson(req, res, result);
            break;
        case 200:
            res.setHeader('Set-Cookie', 'token=' + result['token'] + ';max-age=' + (60 * 60 * 24 * 3)+';Path=/');
            mymongo.setUri('mongodb://127.0.0.1:27017');
            mymongo.getFind(req, res, 'persons', 'persons', {}, 1, (req, res, err, data, client) => {
                console.log('ed: ',err, data);
                dispatcher.sendJson(req, res, err, {
                    prova: 'sajioasjf',
                    find : data
                });
                client.close();
            })
            break;
        default:
        case 401:
            dispatcher.sendJson(req, res, {code: 401, message: 'must have token', error: true});
            break;
        case 403:
            dispatcher.sendJson(req, res, {code: 403, message: 'bad token', error: true});
            break;
        case 500:
            dispatcher.sendJson(req, res, {code: 500, message: 'internal server error', error: true});
            break;
        }
    } else {
        dispatcher.sendJson(req, res, {code: 500, message: 'internal server error tkn', error: true});
    }
});

dispatcher.addListener('GET', '/favicon.ico', function(req, res) {
    fs.readFile('./static/icon.ico', function(err, data) {
        if (!err) {
            const header = {'Content-Type': 'image/x-icon'};
            res.writeHead(200, header);
            res.end(data);
        }
    });
});

// dispatcher.showList();

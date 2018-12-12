const url = require('url');
const fs = require('fs');
const mime = require('mime');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;

/**
 * @typedef {object} Error
 * @property {bool} error
 * @property {string} message
 * @property {intager} code
 */
/**
 * @typedef {object} readFileSync
 * @property {bool} error
 * @property {string} message
 * @property {string} file
 */

/**
  * @callback verifyTokenSendResponse
  * @param {object} req
  * @param {object} res
  * @param {object} result
  */
/**
 * @callback getConnection
 * @param {object} req
 * @param {object} res
 * @param {object} client
 */
/**
 * @callback mongoCallback
 * @param {object} req
 * @param {object} res
 * @param {object} error
 * @param {object} data
 * @param {object} client
 */
const Dispatcher = function() {
    this.prompt = 'Dispatch >> >> >> ';
    this.list = {'GET': {}, 'POST': {}, 'DELETE': {}, 'PUT': {}, 'PATCH': {}};
};

Dispatcher.prototype.addListener = function(method, resource, callback) {
    if (Array.isArray(resource)) {
        resource.forEach((value, index, arr) => {
            this.list[method][value] = callback;
        });
    } else {
        this.list[method][resource] = callback;
    }
};

Dispatcher.prototype.showList = function() {
    for (const method in this.list) {
        for (const risorsa in this.list[method]) {
            console.log(method + ': ' + risorsa);
        }
    }
};

Dispatcher.prototype.dispatch = function(req, res) {
    const metodo = req.method.toUpperCase();
    if (metodo == 'GET') {
        this.innerDispatch(req, res);
    } else {
        this.parsePostParameters(req, res);
    }
};

Dispatcher.prototype.parsePostParameters = function(req, res) {
    let value = '';
    // arrivo di dati in chunk
    req.on('data', (data) => {
        value += data;
    });

    // fine di ricezione dei chunk
    req.on('end', () => {
        // req["POST"] = require("querystring").parse(value);
        req[req.method.toUpperCase()] = JSON.parse(value);
        this.innerDispatch(req, res);
    });
};

Dispatcher.prototype.innerDispatch = function(req, res) {
    const metodo = req.method.toUpperCase();
    const parsedUrl = url.parse(req.url, false);
    const risorsa = parsedUrl.pathname;

    console.log(this.prompt + metodo + ' -> ' + risorsa);

    // req.GET = parsedUrl.query;

    req['GET'] = JSON.parse(decodeURIComponent(parsedUrl.query));


    for (const key in req[metodo]) {
        console.log(key + ':' + req[metodo][key]);
    }

    if (this.list[metodo].hasOwnProperty(risorsa)) {
        const callback = this.list[metodo][risorsa];
        callback(req, res);
    } else {
        this.staticListener(req, res);
    }
};

Dispatcher.prototype.errorListener = function(req, res) {
    const resource = url.parse(req.url, true).pathname;

    if (resource.substr(0, 4) == '/api') {
        this.sendErrorString(req, res);
    } else {
        fs.readFile('./static/error.html', (err, data) => {
            if (err) {
                this.sendErrorString(req, res);
            } else {
                const header = {'Content-Type': 'text/html;charset=utf-8'};
                res.writeHead(200, header);
                res.end(data);
            }
        });
    }
};
/**
 * for 404 error
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {object} headers
 */
Dispatcher.prototype.sendErrorString = function(req, res, headers) {
    headers = (headers !== null) ? headers : {'Content-Type': 'text-plain;charset=UTF-8'};
    res.writeHead(404, headers);
    res.end('Risorsa non trovata');
};

Dispatcher.prototype.staticListener = function(req, res) {
    let risorsa = url.parse(req.url, true).pathname;

    if (risorsa == '/') {
        risorsa = '/index.html';
    }
    const fileName = './static' + risorsa;

    fs.readFile(fileName, (err, data) => {
        if (err) {
            this.errorListener(req, res);
        } else {
            const header = {'Content-Type': mime.getType(fileName)+';charset=utf-8'};
            res.writeHead(200, header);
            res.end(data);
        }
    });
};


/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {Error} err
 * @param {object} headers
 */
Dispatcher.prototype.sendError = function(req, res, err, headers) {
    const header = (headers !== null) ? headers : {'Content-Type': 'text/plain;charset=utf-8'};
    res.writeHead(err.code, header);
    res.end(err.message);
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {Error} err
 * @param  {object} data
 * @param {object} headers
 */
Dispatcher.prototype.sendJson = function(req, res, err, data, headers) {
    if (err && 'error' in err && err['error']) {
        this.sendError(req, res, err);
    } else {
        const header = (headers !== null) ? headers : {'Content-Type': 'application/json'};
        res.writeHead(200, header);
        res.end(JSON.stringify(data));
    }
};
/**
 * @param  {object} request - server request
 * @return {object} cookies - key : value
 */
Dispatcher.prototype.parseCookies = function(request) {
    const list = {};
    const rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} path
 * @param  {object} headers
 */
Dispatcher.prototype.sendPage = function(req, res, path, headers) {
    fs.readFile(path, 'UTF-8', (err, page) => {
        const header = (headers) ? headers : {'Content-Type': 'text/html;charset=utf-8'};
        res.writeHead(err ? 404 : 200, header);
        err ? res.end() : res.end(page);
    });
};
/**
 * @param  {object} data
 * @param  {number} exp
 * @param  {string} signature
 * @return {string} jwt
 */
Dispatcher.prototype.generateToken = function(data, exp, signature) {
    if (!exp) {
        exp = Math.floor(Date.now() / 1000) + 60;
    }
    return jwt.sign({...data, exp}, signature);
};
/**
 * @param  {string} path
 * @param  {string} encoding
 * @return {readFileSync} objectFile
 */
Dispatcher.prototype.readFileSync = function(path, encoding) {
    return fs.existsSync(path) ? {'file': fs.readFileSync(path, encoding), 'error': 0}
        : {'error': 1, 'message': `file doesn't exists at this ${path}`, 'file': ''};
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} signature
 * @param {string} regenerationTime
 * @return {object} result
 */
/**
 * @param  {object} req - server request
 * @return {string} token - string that contains token
 */
Dispatcher.prototype.getLoginToken = function(req) {
    const cookie = this.parseCookies(req);
    if (cookie && 'token' in cookie) {
        return cookie['token'];
    } else {
        return '';
    }
};
/**
* @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} signature - privateKey
 * @param  {int} regenerationTime
 * @return {Error} error - if there insn't error object have token property
 */
Dispatcher.prototype.checkToken = function(req, res, signature, regenerationTime) {
    const token = this.getLoginToken(req);
    if (!token && token != '') {
        return {error: 1, message: 'missing token', code: 401};
    } else {
        return jwt.verify(token, signature, (error, data) => {
            if (error) {
                return {error: 1, message: 'fail match', code: 403};
            } else {
                regenerationTime = regenerationTime ? regenerationTime : Math.floor(Date.now() / 1000) + 60;
                const token = this.generateToken(data, regenerationTime, signature);
                return {error: 0, token, code: 200};
            }
        });
    }
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} firstString
 * @param  {string} secondString
 * @param  {function} callback
 */
Dispatcher.prototype.bcryptCompare = function(req, res, firstString, secondString, callback) {
    bcrypt.compare(firstString, secondString, (err, result) => {
        if (err) {
            this.sendError(req, res, {code: 500, message: 'errore: bcrypt compare', error: 1});
        } else {
            if (!result) {
                this.sendError(req, res, {code: 401, message: 'errore: Password non valida', error: 1});
            } else {
                /** un ora di validita */
                callback();
            }
        }
    });
};

/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} privateKey - privateKey
 * @param  {verifyTokenSendResponse} callback - (req, res, result)
 */
Dispatcher.prototype.verifyTokenSendResponse = function(req, res, privateKey, callback) {
    const result = this.checkToken(req, res, privateKey);
    if (result === null) {
        this.sendError(req, res, {'error': 1, 'message': 'undefined token error', 'code': 500});
    } else {
        if ('code' in result) {
            switch (result['code']) {
            case 200:
                res.setHeader('Set-Cookie', 'token=' + result['token'] + ';max-age=' + (60 * 60 * 24 * 3)+';Path=/');
                callback(req, res, result);
                break;
            default:
            case 401:
                this.sendJson(req, res, {code: 401, message: 'must have token', error: true});
                break;
            case 403:
                this.sendJson(req, res, {code: 403, message: 'bad token', error: true});
                break;
            case 500:
                this.sendJson(req, res, {code: 500, message: 'internal server error', error: true});
                break;
            }
        } else {
            this.sendJson(req, res, {code: 500, message: 'internal server error tkn', error: true});
        }
    }
};

module.exports.Dispatcher = new Dispatcher();

const MongoND = function() {
    this.uri = '';
};
/**
 * @param  {string} uri
 */
MongoND.prototype.setUri = function setUri(uri) {
    if (uri) {
        this.uri = uri;
    } else {
        this.uri = '';
    }
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {getConnection} callback - req,res,callback
 */
MongoND.prototype.getConnection = function(req, res, callback) {
    if (this.uri == '') {
        Dispatcher.prototype.sendError.call(MongoND, req, res, {code: '500', message: 'errore: manca la stringa di connesione al connesione al db', error: 1});
    } else {
        mongoClient.connect(this.uri, {useNewUrlParser: true}, function(err, client) {
            if (err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {code: '500', message: 'errore connesione al db', error: 1});
            } else {
                callback(req, res, client);
            }
        });
    }
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.getFind = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);
        const find = (query && 'find' in query) ? query['find'] : {};
        const sort = (query && 'sort' in query) ? query['sort'] : {};
        const limit = (query && 'limit' in query) ? query['limit'] : 0;
        const skip = (query && 'skip' in query) ? query['skip'] : 0;
        const project = (query && 'project' in query) ? query['project'] : {};

        collection.find(find).project(project).sort(sort).skip(skip).limit(limit).toArray(function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione find', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.getFindOne = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);

        collection.findOne(query, function(err, result) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione findOne', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, result, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.getAggregate = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);

        collection.aggregate(query).toArray(function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione aggregate', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.getDelete = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);

        collection.removeMany(query, function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione removeMany', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.insertOne = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);

        collection.insertOne(query, function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione insertOne', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.updateMany = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);
        const filter = (query && 'filter' in query) ? query['filter'] : {};
        const action = (query && 'action' in query) ? query['action'] : {};

        collection.updateMany(filter, action, function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione updateMany', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};
/**
 * @param  {object} req - server request
 * @param  {object} res - server response
 * @param  {string} dbName - database name
 * @param  {string} dbColletion - database collection name
 * @param  {object} query - query object
 * @param {bool} errorHandling - bool for errorHandling
 * @param  {mongoCallback} callback - callback (req, res, err, data, client)
 */
MongoND.prototype.replaceOne = function(req, res, dbName, dbColletion, query, errorHandling, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);
        const filter = (query && 'filter' in query) ? query['filter'] : {};
        const newDocument = (query && 'newDocument' in query) ? query['newDocument'] : {};
        collection.replaceOne(filter, newDocument, {'upsert': true}, function(err, data) {
            if (errorHandling && err) {
                Dispatcher.prototype.sendError.call(MongoND, req, res, {
                    code: '500', message: 'errore esequzione replaceOne', error: 1,
                });
                client.close();
            } else {
                callback(req, res, err, data, client);
            }
        });
    });
};

module.exports.Mongo= new MongoND();

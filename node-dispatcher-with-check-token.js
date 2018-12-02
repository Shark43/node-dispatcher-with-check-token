const url = require("url");
const fs = require("fs");
const mime = require("mime");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
let Dispatcher = function () {
    this.prompt = "Dispatch >> >> >> ";
    this.list = { "GET" : {}, "POST" : {}, "DELETE" : {}, "PUT" : {}, "PATCH" : {}}
};

Dispatcher.prototype.addListener = function (method, resource, callback) {
    if (Array.isArray(resource)) {
        resource.forEach((value, index, arr) => {
            this.list[method][value] = callback;
        });
    } else{
        this.list[method][resource] = callback;
    }
};

Dispatcher.prototype.showList = function() {
for (let method in this.list){
    for(let risorsa in this.list[method]){
        console.log(method + ": " + risorsa);
    }
}
};

Dispatcher.prototype.dispatch = function (req, res) {
    var metodo = req.method.toUpperCase();
    if (metodo == "GET")
        this.innerDispatch(req, res);
    else {
        this.parsePostParameters(req, res);
    }
};

Dispatcher.prototype.parsePostParameters = function (req, res){
    var value = "";
    //arrivo di dati in chunk
    req.on("data", (data) => {
        value += data;
    });

    //fine di ricezione dei chunk 
    req.on("end", () => {
        //req["POST"] = require("querystring").parse(value);
        req[req.method.toUpperCase()] = JSON.parse(value);
        this.innerDispatch(req, res);
    });
};

Dispatcher.prototype.innerDispatch = function (req, res) {
  var metodo = req.method.toUpperCase();
  var parsedUrl = url.parse(req.url, false);
  var risorsa = parsedUrl.pathname;

  console.log(this.prompt + metodo + " -> " + risorsa);

  //req.GET = parsedUrl.query;

  req["GET"] = JSON.parse(decodeURIComponent(parsedUrl.query));


  for(let key in req[metodo]){
      console.log(key + ":" + req[metodo][key]);
  }

  if(this.list[metodo].hasOwnProperty(risorsa)){
      let callback = this.list[metodo][risorsa];
      callback(req, res);
  } else{
      this.staticListener(req, res);
  }
};

Dispatcher.prototype.errorListener = function (req, res) {
    var resource = url.parse(req.url, true).pathname;

    if(resource.substr(0,4) == "/api"){
        this.sendErrorString(req, res);
    }else{
        fs.readFile("./static/error.html", (err, data) => {
            if(err){
                this.sendErrorString(req, res);
            }else{
                let header = {"Content-Type" : 'text/html;charset=utf-8'};
                res.writeHead(200, header);
                res.end(data);
            }
        });
    }
};

Dispatcher.prototype.sendErrorString = function (req, res) {
    let header = {"Content-Type" : 'text-plain;charset=UTF-8'};
    res.writeHead(200, header);
    res.end("Risorsa non trovata");
};

Dispatcher.prototype.staticListener = function (req, res){
    var risorsa = url.parse(req.url, true).pathname;

    var fileName;
    if(risorsa == "/")
        risorsa = "/index.html";
    fileName = "./static" + risorsa;

    fs.readFile(fileName,  (err, data) => {
        if(err){
            this.errorListener(req, res);
        }else{
            let header = {"Content-Type" : mime.getType(fileName)+";charset=utf-8"};
            res.writeHead(200, header);
            res.end(data);
        }
    });
};


Dispatcher.prototype.sendError = function sendError(req, res, err) {
    const header = {'Content-Type': 'text/plain;charset=utf-8'};
    res.writeHead(err.code, header);
    res.end(err.messageCode);
}

Dispatcher.prototype.sendJson = function sendJson(req, res, err, data) {
    if (err) {
        sendError(req, res, err);
    } else {
        const header = {'Content-Type': 'application/json'};
        res.writeHead(200, header);
        res.end(JSON.stringify(data));
    }
}

Dispatcher.prototype.parseCookies = function parseCookies(request) {
    const list = {};
    const rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

Dispatcher.prototype.sendPage = function sendPage(req, res, path) {
    fs.readFile(path, 'UTF-8', (err, page) => {
        const header = {'Content-Type': 'text/html;charset:UTF-8'};
        res.writeHead(200, header);
        res.end(page);
    });
}
/**
 * @param  {object} data
 * @param  {number} exp
 * @param  {string} signature
 * @returns {string} jwt
 */
Dispatcher.prototype.generateToken = function generateToken(data, exp, signature) {
    if(!exp){
        exp = 0;
    }
    return jwt.sign({ ...data, exp}, signature);
}
/**
 * Chack token and return an object with
 * {
 *  err : bool
 *  code : intager
 *  message: string
 * }
 * @param  {object} request
 * @param  {object} response
 * @param  {string} signature
 * @returns {} result
 */
Dispatcher.prototype.checkToken = function checkToken(req, res, signature) {
    const cookie = this.parseCookies(req);
    if (!(Object.hasOwnProperty.call(cookie, 'token') && cookie['token'])) {
        return {err: 1, message: 'missing token', code: 401};
    } else {
        return jwt.verify(cookie['token'], signature, (err, data) => {
            if (err) {
                return {err: 1, message: 'fail match', code: 403};
            } else {
                const token = this.generateToken(data, Math.floor(Date.now() / 1000) + 60, signature);
                return {err: 0, token, code: 200};
            }
        });
    }
}

// var disp = new Dispatcher();
//
// disp.list.GET.push({"res": "dd", "cal": "cal"});
// disp.showList();

module.exports.Dispatcher = new Dispatcher();

let MongoND = function () {
    this.uri = '';
};
MongoND.prototype.setUri = function setUri(uri) {
    if(uri){
        this.uri = uri;
    }else {
        this.uri = '';
    }
}
MongoND.prototype.getConnection = function getConnection(req, res, callback) {
    mongoClient.connect(this.uri, {useNewUrlParser: true}, function(err, client) {
        if (err) {
            sendError(req, res, {code: "500", messageCode: "errore connesione al db"});
        } else {
            callback(req, res, client);
        }
    });
};

MongoND.prototype.getFind = function getFind(req, res, dbName, dbColletion, query, callback) {
    this.getConnection(req, res, (req, res, client) => {
        const db = client.db(dbName);
        const collection = db.collection(dbColletion);

        if(query){
            let find=('find' in query) ? query['find'] : {};
            let sort=('sort' in query) ? query['sort'] : {};
            let limit=('limit' in query) ? query['limit'] : 0;
            let skip=('skip' in query) ? query['skip'] : 0;
            let project=('project' in query) ? query['project'] : {};
        }
        //console.log('find', find);
        collection.find(find).project(project).sort(sort).skip(skip).limit(limit).toArray(function(err, data) {
            callback(req, res, err, data, client);
        });
    });
};

module.exports.Mongo= new MongoND();

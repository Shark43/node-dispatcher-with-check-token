const url = require('url');
const fs = require('fs');
const mime = require('mime');
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
    //NUOVO
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

Dispatcher.prototype.sendErrorString = function(req, res) {
    const header = {'Content-Type': 'text-plain;charset=UTF-8'};
    res.writeHead(200, header);
    res.end('Risorsa non trovata');
};

Dispatcher.prototype.staticListener = function(req, res) {
    let risorsa = url.parse(req.url, true).pathname;

    let fileName;
    if (risorsa == '/') {
        risorsa = '/index.html';
    }
    fileName = './static' + risorsa;

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

// var disp = new Dispatcher();
//
// disp.list.GET.push({"res": "dd", "cal": "cal"});
// disp.showList();

module.exports = new Dispatcher();

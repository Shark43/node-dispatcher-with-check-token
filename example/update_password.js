const mongoClient = require('mongodb').MongoClient;
const bcrpt = require('bcrypt');
const async = require('async');

mongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true}, function(err, client) {
    if (err) {
        console.log('errore conessione al db');
    } else {
        const db = client.db('persons');
        const collection = db.collection('persons');
        collection.find({}).toArray((err, data) => {
            async.forEach(data, (item, callback) => {
                const regex = /^\$2[ayb]\$.{56}$/gm;
                if (!regex.exec(item['pwd'])) {
                    item['pwd'] = bcrpt.hashSync(item['pwd'], 10) || '';
                    collection.updateOne({'_id': item['_id']}, {'$set': {'pwd': item['pwd']}}, (err) => {
                        callback(err);
                    });
                } else {
                    callback(0);
                }
            }, (err) => {
                if (err) {
                    console.log('operazione interrotta');
                } else {
                    console.log('operazione eseguita correttamente');
                }
                client.close();
            });
        });
    }
});

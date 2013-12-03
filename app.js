var fs = require('fs');
var Q = require('q');
var express = require('express');
var app = express();

app.use(express.bodyParser());

var dataStore = JSON.parse(fs.readFileSync('data.json', { encoding: 'utf-8' }));

var dbVersion = 0;

var writeFile = Q.denodeify(fs.writeFile);

function saveDataStore() {
    var myVersion = ++dbVersion;
    setTimeout(function() {
        if (myVersion === dbVersion) {
            console.log('Writing version ' + myVersion);
            writeFile('data.json', JSON.stringify(dataStore, null, 2));
        } else {
            console.log('My version = ' + myVersion + ' but latest is ' + dbVersion);
        }
    }, 3000);
}

app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

app.get('/db/:ns/:id', function(req, res) {
    res.send(200, dataStore[req.params.ns] &&
             dataStore[req.params.ns][req.params.id]);
});

app.get('/db/:ns/:k/:v', function(req, res) {
    var answer = [];
    var subset = dataStore[req.params.ns];
    if (subset) {
        var keys = Object.keys(subset);
        for (var i in keys) {
            if (subset[keys[[i]]][req.params.k] == req.params.v) {
                answer.push(keys[i]);
            }
        }
    }
    res.send(200, answer);
});

app.put('/db/:ns/:id', function(req, res) {
    dataStore[req.params.ns] = dataStore[req.params.ns] || {};
    dataStore[req.params.ns][req.params.id] = req.body;
    saveDataStore();
    res.send(202);
});

app.delete('/db/:ns/:id', function(req, res) {
    dataStore[req.params.ns] &&
        delete dataStore[req.params.ns][req.params.id];
    saveDataStore();
    res.send(202);
});

app.listen(63446);
console.log('Listening on port 63446');

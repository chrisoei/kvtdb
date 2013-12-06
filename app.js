var fs = require('fs');
var Q = require('q');
var express = require('express');
var app = express();

app.use(express.json({ strict: false }));
app.use(express.urlencoded());

var dataStore;

if (fs.existsSync('data.json')) {
    dataStore = JSON.parse(fs.readFileSync('data.json', { encoding: 'utf-8' }));
} else {
    dataStore = {};
}

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
    res.header('Access-Control-Allow-Methods', 'PUT, DELETE');
    next();
});

app.get('/db/get/*', function(req, res, next) {
    var result = dataStore;
    var path = req.params[0].split('/');
    while ((d = path.shift()) && result) {
        result = result[d];
    }
   res.json(result);
});

app.put('/db/set/*', function(req, res, next) {
   console.log(req);
    var ptr = dataStore;
    var path = req.params[0].split('/');
    var last = path.pop();
    while ((d = path.shift())) {
        if (typeof ptr[d] !== 'object') {
            ptr[d] = {};
        }
        ptr = ptr[d];
    }
    ptr[last] = req.body;
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

var _ = require('lodash');
var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var express = require('express');
var app = express();

app.use(express.json({
    strict: false,
    limit: '50mb'
}));

app.use(express.urlencoded({
    limit: '50mb'
}));

var dataStore;

if (fs.existsSync('data.json')) {
    dataStore = JSON.parse(fs.readFileSync('data.json', {
        encoding: 'utf-8'
    }));
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
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    res.header('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
    next();
});

app.get('/db/get/*', function(req, res, next) {
    var result = dataStore;
    var path = req.params[0].split('/');
    while ((d = path.shift()) && result) {
        result = result[d];
    }
    if (req.query) {
        _.forEach([ 'Content-Type', 'Cache-Control', 'Expires' ], function(h) {
            if (req.query[h]) {
                res.header(h, req.query[h]);
            }
        });

        res.send(200, result);
    } else {
        res.json(result);
    }
});

app.get('/db/keys/*', function(req, res, next) {
    var result = dataStore;
    var path = req.params[0].split('/');
    while ((d = path.shift()) && result) {
        result = result[d];
    }
    res.json(Object.keys(result));
});

app.get('/db/search/*', function(req, res, next) {
    var result = [];
    var ptr = dataStore;
    var path = req.params[0].split('/');
    var searchValue = path.pop();
    assert(path.pop() === '*', 'Search field should be an asterisk');
    while ((d = path.shift()) && ptr) {
        ptr = ptr[d];
    }
    var possibleKeys = Object.keys(ptr);
    for (var i = 0; i < possibleKeys.length; i++) {
        if (ptr[possibleKeys[i]] == searchValue) {
            result.push(possibleKeys[i]);
        }
    }
    res.json(result);
});

app.put('/db/set/*', function(req, res, next) {
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

app.delete('/db/del/*', function(req, res) {
    var ptr = dataStore;
    var path = req.params[0].split('/');
    var last = path.pop();
    while ((d = path.shift())) {
        if (typeof ptr[d] !== 'object') {
            res.send(202);
            return;
        }
        ptr = ptr[d];
    }
    delete ptr[last];
    saveDataStore();
    res.send(202);
});

app.listen(63446);
console.log('Listening on port 63446');

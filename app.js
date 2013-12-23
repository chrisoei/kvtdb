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


function starDate(dt) {
    var d = dt || new Date();
    var y = d.getUTCFullYear();
    var t0 = Date.UTC(y, 0, 1, 0, 0, 0, 0);
    var t1 = Date.UTC(y + 1, 0, 1, 0, 0, 0, 0);
    var t = Date.UTC(
        y,
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds());
    var sd = y + (t - t0) / (t1 - t0);
    return {
        "canonical": sd.toFixed(15),
        "short": sd.toFixed(3)
    };
}

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
    var ptr1 = dataStore;
    var path = req.params[0].split('/');
    var searchValue = path.pop();
    var star = path.indexOf('*');
    assert(star >= 0, 'Search field should be an asterisk');
    for (var j = 0; j < star; j++) {
      ptr1 = ptr1[path[j]] || {};
    }
    var possibleKeys = Object.keys(ptr1);
    for (var i = 0; i < possibleKeys.length; i++) {
        var ptr2 = ptr1[possibleKeys[i]] || {};
        for (j = star + 1; j < path.length; j++) {
            ptr2 = ptr2[path[j]] || {};
        }
        if (ptr2 instanceof Array) {
            if (ptr2.indexOf(searchValue) >= 0) {
                result.push(possibleKeys[i]);
            }
        } else {
            if (ptr2 == searchValue) {
                result.push(possibleKeys[i]);
            }
        }
    }
    res.json(result);
});

app.post('/db/snapshot', function(req, res, next) {
    var sd = starDate().canonical;
    console.log('Snapshotting ' + dbVersion + ' at ' + sd);
    writeFile('data-' + sd + '.json', JSON.stringify(dataStore, null, 2));
    res.send(202);
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

app.put('/db/push/*', function(req, res, next) {
    var ptr = dataStore;
    var path = req.params[0].split('/');
    var last = path.pop();
    while ((d = path.shift())) {
        if (typeof ptr[d] !== 'object') {
            ptr[d] = {};
        }
        ptr = ptr[d];
    }
    ptr[last] = ptr[last] || [];
    ptr[last].push(req.body);
    if (req.query.unique) {
        ptr[last] = _.uniq(ptr[last]);
    }
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

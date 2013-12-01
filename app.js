var fs = require('fs');
var Q = require('q');
var express = require('express');
var app = express();

app.use(express.bodyParser());

var dataStore = {};

var writeFile = Q.denodeify(fs.writeFile);

function saveDataStore() {
  return writeFile('data.json', JSON.stringify(dataStore, null, 2));
}

app.get('/media/:ns/:id', function(req, res) {
    res.send(200, dataStore[req.params.ns] &&
             dataStore[req.params.ns][req.params.id]);
});

app.put('/media/:ns/:id', function(req, res) {
    dataStore[req.params.ns] = dataStore[req.params.ns] || {};
    dataStore[req.params.ns][req.params.id] = req.body;
    saveDataStore().done(function() { res.send(201); });
});

app.delete('/media/:ns/:id', function(req, res) {
    dataStore[req.params.ns] &&
        delete dataStore[req.params.ns][req.params.id];
    saveDataStore().done(function() { res.send(204); });
});

app.listen(63446);
console.log('Listening on port 63446');

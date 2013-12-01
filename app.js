var Q = require('q');
var express = require('express');
var app = express();

app.use(express.bodyParser());

var dataStore = {};

app.get('/media/:ns/:id', function(req, res) {
    dataStore[req.params.ns] &&
        res.send(dataStore[req.params.ns][req.params.id]);
});

app.put('/media/:ns/:id', function(req, res) {
    dataStore[req.params.ns] = dataStore[req.params.ns] || {};
    dataStore[req.params.ns][req.params.id] = req.body;
    res.send();
});

app.listen(63446);
console.log('Listening on port 63446');

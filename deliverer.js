// Delivery server.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var BASE = process.env.DOMAIN;

var app = require('express').createServer();
var signer = require('./signer');

app.get('/get/:email/:key/:file', function(req, res){
    var url = BASE + '/' + req.param('file') + '?email=' + req.param('email');
    var url = signer.signURL(url, new Date(Date.now() + 60000.0));
    res.redirect(url);
});

app.listen(8000);
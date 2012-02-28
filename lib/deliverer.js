// Delivery server.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var express = require('express');
var signer = require('./signer');

function Deliverer(config, authorizer){
    var app = express.createServer();

    app.get(/^\/([^\/]+)\/([^\/]+)\/(.+)$/, function(req, res){
        var email = req.params[0];
        var key = req.params[1];
        var file = req.params[2];
        authorizer.access(email, key, file, function(err){
            if (err){
                res.write(err);
                res.end();
                return;
            }
            var url = config.cloudfront.domain + '/' + file + '?email=' + email;
            var url = signer.signURL(url, new Date(Date.now() + config.deliverer.expireTime * 1000.0));
            res.redirect(url);
        })
    });

    app.listen(config.deliverer.port);
}

module.exports.Deliverer = Deliverer;

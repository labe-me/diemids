// Delivery server.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var BASE = process.env.CLOUDFRONT_DOMAIN;
var redis = require('redis');
var app = require('express').createServer();
var signer = require('./signer');
var authorizer = require('./authorizer');
var store = new authorizer.RedisStore(redis.createClient());
var auth = new authorizer.Authorizer(store);

// auth.add("myemail@foo.com", "XXXKEYYYY", "sub/.*", function(){});

app.get(/^\/get\/([^\/]+)\/([^\/]+)\/(.+)$/, function(req, res){
    var email = req.params[0];
    var key = req.params[1];
    var file = req.params[2];
    auth.access(email, key, file, function(err){
        if (err){
            res.write(err);
            res.end();
            return;
        }
        var url = BASE + '/' + file + '?email=' + email;
        var url = signer.signURL(url, new Date(Date.now() + 60000.0));
        res.redirect(url);
    })
});

app.listen(8000);

var httpsOptions = {
    key:fs.readFileSync('certs/delivery-key.pem'),
    cert:fs.readFileSync('certs/delivery-cert.pem')
}
var https = require('express').createServer();

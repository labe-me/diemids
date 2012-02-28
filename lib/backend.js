// Backend HTTPS server.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var express = require('express');
var fs = require('fs');

function Backend(config, authorizer){
    this.config = config;

    this.app = express.createServer({
        key:fs.readFileSync(config.backend.keyFile),
        cert:fs.readFileSync(config.backend.certFile),
    });

    this.app.use(express.bodyParser());

    function checkSecret(req, res, next){
        if (req.param('secret') != config.backend.secret)
            return next(new Error('Access denied'));
        next();
    }

    /*
      POST /auth
      Content-Type: application/json
      { 'email':'dummy@example.com', 'reg':'Product/.*', 'secret':'BACKEND_SECRET' }

      Returns:
      { 'email':'dummy@example.com', 'key':'XXXXXXXXXXXXX' }
    */
    this.app.post('/auth', checkSecret, function(req, res){
        var email = req.param('email');
        var reg = req.param('reg');
        if (reg == null || reg == '')
            return res.json({ error:"Missing reg parameter" });
        authorizer.add(email, reg, function(err, key){
            if (err){
                res.json({ error:err });
                return;
            }
            res.json({ email:email, key:key });
        });
    });

    /*
      DELETE /auth
      Content-Type: application/json
      { 'email':'dummy@example.com', 'key':'XXXXXXXXXXXX', 'secret':'BACKEND_SECRET' }

      Returns:
      { 'email':'dummy@example.com', 'key':'XXXXXXXXXXXX', 'disabled':'true' }

      Note: Calling DELETE another time will restore the right.
      { 'email':'dummy@example.com', 'key':'XXXXXXXXXXXX' }

    */
    this.app.del('/auth', checkSecret, function(req, res){
        var email = req.param('email');
        var key = req.param('key');
        authorizer.toggle(email, key, function(err, disabled){
            if (err){
                res.json({ error:err });
                return;
            }
            res.json({ key:key, email:email, disabled:disabled });
        });
    });

    this.app.listen(config.backend.port);
}

module.exports.Backend = Backend;
//
// play with paypal digital goods payments
//
// This is a test application working with the paypal sandbox.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var config = require('../config');
var paypal = require('./paypal');
paypal.USER = config.paypal.user;
paypal.PASS = config.paypal.pass;
paypal.SIGNATURE = config.paypal.signature;

// we create the same cart between each requests but usually 
// it should be stored either in the session or into some 
// database (see below).
function createDummyCart(){
    var result = new paypal.Cart();
    result.currencyCode = "EUR";
    result.addItem({
        name: "My item name",
        desc: "This is a super description.",
        amount: 0.99
    }, 1);
    return result;
}

var express = require('express');

var app = express.createServer();
app.use(express.logger());
app.set('view options', { layout:false });

app.get('/', function(req, res){
    res.render('product.jade', { bought:false });
});

app.post('/pp-buy', function(req, res){
    var cart = createDummyCart();
    cart.setExpressCheckout({
        returnURL:"http://localhost:3000/pp-success",
        cancelURL:"http://localhost:3000/pp-cancel"
    }, function(err, token, redirectUrl){
        if (err)
            throw err;
        // It might be a good idea to store the cart with the token (or inside the session).
        res.redirect(redirectUrl);
    });
});

app.get('/pp-success', function(req, res){
    // There we could retrieve the cart using the token (or from the session).
    var cart = createDummyCart();
    cart.doExpressCheckoutPayment(
        req.param("token", null),
        req.param('PayerID', null),
        function(err, paypalResponse){
            if (err)
                throw err;
            // That's it, we the payment is ok and we should have the money
            // This goes in the small paypal frame, we might prefer to have a nice page.
            res.render('product.jade', { bought:true });
        }
    );
});

app.get('/pp-cancel', function(req, res){
    res.render('product.jade', { bought:false, cancelled:true });
});

app.listen(3000);
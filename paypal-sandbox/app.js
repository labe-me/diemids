// Play with paypal digital goods payments
//
// This is a test application working with the paypal sandbox.
//
// Author: Laurent Bedubourg <laurent@labe.me>

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

// shows the product page with a paypal buy button.
app.get('/', function(req, res){
    res.render('product.jade', { bought:false });
});

// called by the user to initiate a paypal checkout.
app.post('/pp-buy', function(req, res){
    var cart = createDummyCart();
    cart.setExpressCheckout({
        returnURL:"http://localhost:3000/pp-success",
        cancelURL:"http://localhost:3000/pp-cancel"
    }, function(err, token, redirectUrl){
        if (err)
            throw err;
        if (redirectUrl == null)
            throw "PayPal setExpressCheckout redirectUrl is null";
        // It might be a good idea to store the cart with the token (or inside the session).
        res.redirect(redirectUrl);
    });
});

// user is redirected to this page after success.
app.get('/pp-success', function(req, res){
    // There we could retrieve the cart using the token (or from the session).
    var cart = createDummyCart();
    cart.doExpressCheckoutPayment(
        req.param("token", null),
        req.param('PayerID', null),
        function(err, paypalResponse){
            if (err)
                throw err;
            // a good idea to store the transaction here before requesting more data
            paypal.getTransactionDetails(paypalResponse.PAYMENTINFO_0_TRANSACTIONID, function(err, data){
                if (err)
                    throw err;

                var customerEmail = data.EMAIL;

                // TODO: call DIEMIDS backend

                // TODO: send confirmation email with download links

                // TODO: show confirmation message

                // That's it, we the payment is ok and we should have the money
                // This goes in the small paypal frame, we might prefer to have a nice page.
                res.render('product.jade', { bought:true, email:customerEmail });
            });
        }
    );
});

// user cancelled transaction.
app.get('/pp-cancel', function(req, res){
    res.render('product.jade', { bought:false, cancelled:true });
});

app.listen(3000);
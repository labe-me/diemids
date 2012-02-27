exports.USER = null;
exports.PASS = null;
exports.SIGNATURE = null;
exports.API_HOST = "api-3t.sandbox.paypal.com";
exports.INCONTEXT_URL = "https://www.sandbox.paypal.com/incontext";
if (process.env.NODE_ENV == "production"){
    module.exports.API_HOST = "api-3t.paypal.com";
    module.exports.INCONTEXT_URL = "https://www.paypal.com/incontext";
}

var querystring = require('querystring');
var https = require('https');
var sprintf = require("sprintf").sprintf;
var util = require('util');

function moneyToString(amount){
    return sprintf("%.2f", amount);
}

function getError(o){
    if (o.ACK != "Failure")
        return null;
    if (o.L_SHORTMESSAGE0 != null)
        return o.L_SHORTMESSAGE0;
    return "Paypal error.";
}

function runAPICall(nvps, callback) {
    var postdata = querystring.stringify(nvps);
    var options = {
        host:module.exports.API_HOST,
        post:443,
        path:"/nvp",
        method:"POST",
        headers:{
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": postdata.length
        }
    };
    var r = https.request(options, function(res){
        var data = '';
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            var dec = querystring.parse(data);
            if (dec == null){
                callback("Unable to decode PayPal result");
                console.log("PayPal result error: "+data);
            }
            else
                callback(null, dec);
        });
    });
    r.on('error', callback);
    r.write(postdata);
    r.end();
}

var Cart = function(){
    this.amount = 0.0;
    this.currencyCode = "USD";
    this.items = [];
}

Cart.prototype.addItem = function(item, qty){
    if (qty == null)
        qty = 1;
    this.amount += item.amount * qty;
    this.items.push({
        name:item.name,
        desc:item.desc,
        amount:item.amount,
        qty:qty,
        category:"Digital"
    });
}

Cart.prototype.toPayPalVars = function(){
    var res = {
        "VERSION": "65.1",
        "REQCONFIRMSHIPPING": "0",
        "NOSHIPPING": "1",
        "USER": module.exports.USER,
        "PWD": module.exports.PASS,
        "SIGNATURE": module.exports.SIGNATURE,
        "PAYMENTREQUEST_0_AMT": moneyToString(this.amount),
        "PAYMENTREQUEST_0_CURRENCYCODE": this.currencyCode,
        "PAYMENTREQUEST_0_ITEMAMT": moneyToString(this.amount)
    };
    for (var i=0; i<this.items.length; ++i){
        var item = this.items[i];
        res["L_PAYMENTREQUEST_0_NAME"+i] = item.name;
        res["L_PAYMENTREQUEST_0_DESC"+i] = item.desc;
        res["L_PAYMENTREQUEST_0_AMT"+i] = moneyToString(item.amount);
        res["L_PAYMENTREQUEST_0_QTY"+i] = item.qty;
        res["L_PAYMENTREQUEST_0_ITEMCATEGORY"+i] = "Digital";
    }
    return res;
}

Cart.prototype.setExpressCheckout = function(params, callback){
    var vars = this.toPayPalVars();
    vars.METHOD = "SetExpressCheckout";
    vars.RETURNURL = params.returnURL;
    vars.CANCELURL = params.cancelURL;
    runAPICall(vars, function(err, paypalResponse){
        if (err)
            return callback(err);
        if ((paypalResponse.ACK != "Success" && paypalResponse.ACK != "SuccessWithWarning") || paypalResponse.TOKEN == null)
            return callback(getError(paypalResponse));
        callback(null, module.exports.INCONTEXT_URL+"?token="+paypalResponse.TOKEN);
    });
}

Cart.prototype.doExpressCheckoutPayment = function(token, PayerID, callback){
    if (token == null || PayerID == null)
        return callback("Invalid request parameters.");
    var vars = this.toPayPalVars();
    vars.METHOD = "DoExpressCheckoutPayment";
    vars.TOKEN = token;
    vars.PAYERID = PayerID;
    runAPICall(vars, function(err, paypalResponse){
        if (err)
            return callback(err);
        if ((paypalResponse.ACK != "Success" && paypalResponse.ACK != "SuccessWithWarning") || paypalResponse.TOKEN == null)
            return callback(getError(paypalResponse));
        callback(null, paypalResponse.TOKEN);
    });
}

module.exports.Cart = Cart;
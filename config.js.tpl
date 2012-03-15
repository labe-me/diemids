// This is a configuration template for DIE-MIDS.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var config = {
};

// Your public CloudFront domain name.
config.cloudfront = {
    domain: "download.example.com"
};

// the delivery service port. 
// this service generates signed URL after ensuring that the access URL is correct.
config.deliverer = {
    port: 80, // the delivery server port (you may prefer to proxy things through nginx)
    expireTime: 60 // expiration time of signed URLs
};

// the backend is used to give rights to user from your shop
// you have to generate ssl key and cert since the backend runs through ssl. 
config.backend = {
    port: 8001,
    keyFile: 'certs/delivery-key.pem', 
    certFile: 'certs/delivery-cert.pem',
    secret: 'MySecretPassword', // change this
};

// this is used by the paypal test, more documentation and plugins should come soon.
config.paypal = {
    user: "paypalseller",
    pass: "1234567890",
    signature: "AAAAAAFFFFFFFFCCCCCCCCCCCQQQQQ-XXXXXXX"
};

module.exports = config;

// This is a configuration template for DIE-MIDS.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var fs = require('fs');

var config = {
};

// Your public CloudFront domain name.
config.cloudfront = {
    domain: "http://download.example.com",
};

// Configuration for the URL signer.
config.signer = {
    keyPairId: "AMAZON-KEY-PAIR-ID",
    privateKey: fs.readFileSync("certs/aws-cloudfront-pk-AMAZON-KEY-PAIR-ID.pem", "UTF-8"),
};

// The delivery service,
// This service generates signed URL after ensuring that the access URL is correct.
config.deliverer = {
    url: "http://127.0.0.1:80", // the public URL for this service (used by app.js)
    port: 80, // the delivery server port (you may prefer to proxy things through nginx)
    expireTime: 60 // expiration time of signed URLs
};

// The backend is used to give rights to user from your shop
// you have to generate ssl key and cert since the backend runs through ssl.
config.backend = {
    url: "https://127.0.0.1:8001", // the public URL of this service (used by app.js)
    port: 8001, // the backend ssl port
    keyFile: 'certs/delivery-key.pem', // ssl key
    certFile: 'certs/delivery-cert.pem', // ssl cert
    secret: 'MySecretPassword', // change this now!!!!
};

// This is used by the paypal test, more documentation and plugins should come soon.
config.paypal = {
    user: "paypalseller",
    pass: "1234567890",
    signature: "AAAAAAFFFFFFFFCCCCCCCCCCCQQQQQ-XXXXXXX"
};

// Where to store authorizations.
// diemids only support redis at this very time but creating a custom store is really easy.
config.store = {
    type: "redis"
};

module.exports = config;

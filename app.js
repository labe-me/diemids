var config = {};
config.cloudfront = {
    domain: process.env.CLOUDFRONT_DOMAIN
};
config.deliverer = {
    port:8000,
    expireTime:60
};
config.backend = {
    port:8001,
    keyFile:'certs/delivery-key.pem',
    certFile:'certs/delivery-cert.pem',
    secret:process.env.BACKEND_SECRET
};

var diemids = require("./lib");
var redis = require('redis').createClient();
var store = new diemids.RedisStore(redis);
var auth = new diemids.Authorizer(store);
var deliverer = new diemids.Deliverer(config, auth);
var backend = new diemids.Backend(config, auth);

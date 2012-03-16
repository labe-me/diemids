var config = require('./config');
var diemids = require("./lib");
var store = null;
if (config.store.type == "redis"){
    var redis = require('redis').createClient();
    store = new diemids.RedisStore(redis);
}
var auth = new diemids.Authorizer(store);
var deliverer = new diemids.Deliverer(config, auth);
var backend = new diemids.Backend(config, auth);

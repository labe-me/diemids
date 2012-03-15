var config = require('./config');
var diemids = require("./lib");
var redis = require('redis').createClient();
var store = new diemids.RedisStore(redis);
var auth = new diemids.Authorizer(store);
var deliverer = new diemids.Deliverer(config, auth);
var backend = new diemids.Backend(config, auth);

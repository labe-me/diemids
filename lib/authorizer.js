// Delivery authority.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var crypto = require('crypto');
var KEY_BASE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function Authorizer(store){
    this.store = store;
}

// TODO: May be a unique KEY based on email+regexp+KEY_SECRET and check that there's only one occurence in the database
Authorizer.prototype.generateKey = function(email, regexp, callback){
    crypto.pbkdf2(email+regexp+Date.now(), "Some salt "+Math.random()*999999, 4, 12, function(err, k){
        if (err)
            return callback(err);
        var key = "";
        for (var i=0; i<k.length; ++i){
            var ki = k.charCodeAt(i) % KEY_BASE.length;
            key += KEY_BASE.charAt(ki);
        }
        callback(null, key);
    });
}

Authorizer.prototype.add = function(email, regexp, callback){
    var self = this;
    this.generateKey(email, regexp, function(err, key){
        if (err)
            return callback(err);
        self.store.set(
            (email+"#"+key),
            {email:email, reg:regexp, key:key, date:new Date()},
            function(err){
                if (err)
                    return callback(err);
                return callback(null, key);
            }
        );
    })
}

Authorizer.prototype.access = function(email, key, file, callback){
    var id = (email+"#"+key);
    var entry = this.store.get(id, function(err, entry){
        if (err)
            return callback(err);
        if (entry == null)
            return callback("Access denied");
        if (entry.disabled)
            return callback("Access denied");
        var reg = new RegExp('^'+entry.reg+'$', 'i');
        if (!reg.test(file))
            return callback("Access denied");
        callback(null);
    });
}

Authorizer.prototype.toggle = function(email, key, callback){
    var self = this;
    var id = (email+"#"+key);
    var entry = this.store.get(id, function(err, entry){
        if (err)
            return callback(err);
        if (entry == null)
            return callback(id+" not found");
        entry.disabled = !entry.disabled;
        self.store.set(id, entry, function(err){
            if (err)
                return callback(err);
            return callback(err, entry.disabled);
        });
    });
}

// ---------------------------------------------------------------------------

function RedisStore(client){
    this.redis = client;
}

RedisStore.prototype.set = function(key, value, callback){
    var self = this;
    if (value.disabled == false){
        delete value.disabled;
        self.redis.hdel(key, "disabled", function(err, n){
            self.redis.hmset(key, value, callback);
        });
    }
    else
        self.redis.hmset(key, value, callback);
}

RedisStore.prototype.get = function(key, callback){
    this.redis.hgetall(key, callback);
}

// ---------------------------------------------------------------------------

function MemoryStore(){
    this.data = [];
}

MemoryStore.prototype.set = function(key, value, callback){
    this.data[key] = value;
    callback(null);
}

MemoryStore.prototype.get = function(key, callback){
    if (this.data[key] == null)
        return callback("Object "+key+" not found in MemoryStore.");
    callback(null, this.data[key]);
}

module.exports.Authorizer = Authorizer;
module.exports.MemoryStore = MemoryStore;
module.exports.RedisStore = RedisStore;
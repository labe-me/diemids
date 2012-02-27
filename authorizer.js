// Delivery authority.
//
// Author: Laurent Bedubourg <laurent@labe.me>

function Authorizer(store){
    this.store = store;
}

Authorizer.prototype.add = function(email, key, regexp, callback){
    this.store.set((email+"#"+key).toLowerCase(), {email:email, reg:regexp}, callback);
}

Authorizer.prototype.access = function(email, key, file, callback){
    var entry = this.store.get((email+"#"+key).toLowerCase(), function(err, entry){
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

// ---------------------------------------------------------------------------

function RedisStore(client){
    this.redis = client;
}

RedisStore.prototype.set = function(key, value, callback){
    this.redis.hmset(key, value, callback);
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
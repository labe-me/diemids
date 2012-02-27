// Delivery authority.
//
// Author: Laurent Bedubourg <laurent@labe.me>

function Authorizer(store){
    this.store = store;
}

Authorizer.prototype.add = function(email, key, regexp, callback){
    this.store.set(email+"#"+key, {email:email, reg:regexp}, callback);
}

Authorizer.prototype.access = function(email, key, file, callback){
    var entry = this.store.get(email+"#"+key, function(err, entry){
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


function MemoryStore(){
    this.data = [];
}

MemoryStore.prototype.set = function(key, value, callback){
    this.data[key.toLowerCase()] = value;
    callback(null);
}

MemoryStore.prototype.get = function(key, callback){
    if (this.data[key.toLowerCase()] == null)
        return callback("Object "+key.toLowerCase()+" not found in MemoryStore.");
    callback(null, this.data[key.toLowerCase()]);
}

module.exports.Authorizer = Authorizer;
module.exports.MemoryStore = MemoryStore;
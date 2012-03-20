var http = require('http');
var https = require('https');

JSON.request = function(method, urlStr, o, cb){
    if (cb == null && typeof o == 'function'){
        cb = o;
        o = null;
    }
    var s = require('url').parse(urlStr);
    s.method = method;
    s.headers = {"Content-Type":"application/json"};
    var f = function(res){
        var content = "";
        res.on('data', function(d){
            content += d;
        });
        res.on('end', function(){
            try {
                var result = JSON.parse(content);
                cb(null, result);
            }
            catch(e){
                cb(new Error("Received non JSON reply: "+content), null);
            }
        });
    }
    var r = null;
    if (s.protocol == 'http:')
        r = http.request(s, f);
    else if (s.protocol == 'https:')
        r = https.request(s, f);
    else
        return cb(new Error('Unsuported protocol '+s.protocol));
    r.on('error', cb)
    r.write(JSON.stringify(o));
    r.end();
}

JSON.get = function(urlStr, o, cb){
    JSON.request("GET", urlStr, o, cb);
}
JSON.post = function(urlStr, o, cb){
    JSON.request("POST", urlStr, o, cb);
}
JSON.put = function(urlStr, o, cb){
    JSON.request("PUT", urlStr, o, cb);
}
JSON.del = function(urlStr, o, cb){
    JSON.request("DELETE", urlStr, o, cb);
}

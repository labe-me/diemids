//
// Sign CloudFront URL.
//
// Expects env vars KEY_PAIR_ID and PEM_FILE to be defined.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var crypto = require('crypto');
var fs = require('fs');

var KEY_PAIR_ID = null;
var PRIVATE_KEY = null;

function getKey(){
    if (PRIVATE_KEY == null){
        KEY_PAIR_ID = process.env.KEY_PAIR_ID;
        PRIVATE_KEY = fs.readFileSync(process.env.PEM_FILE, "UTF-8");
    }
    return PRIVATE_KEY;
}

function getKeyId(){
    return KEY_PAIR_ID;
}

function signURL(url, expireDate){
    var stamp = Math.round(expireDate.getTime() / 1000.0);
    var json = JSON.stringify({
        "Statement":[{
            "Resource":url,
            "Condition":{"DateLessThan":{"AWS:EpochTime":stamp}}
        }]
    });
    var signature = crypto.createSign("sha1").update(json).sign(getKey(), 'base64');
    var result = url;
    if (result.indexOf("?") == -1)
        result += "?";
    else
        result += "&";
    result += "Expires="+stamp+"&Signature="+signature+"&Key-Pair-Id="+getKeyId();
    return result;
}

module.exports.signURL = signURL;


if (require.main == module){
    var url = process.argv[2];
    var exp = parseInt(process.argv[3]);
    var dat = new Date(new Date().getTime() + exp*1000.0);
    console.log(dat);
    var res = signURL(url, dat);
    console.log(res);
}
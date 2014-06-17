//
// Sign CloudFront URL.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var crypto = require('crypto');

function signURL(keyPairId, key, url, expireDate){
    var stamp = Math.round(expireDate.getTime() / 1000.0);
    var json = JSON.stringify({
        "Statement":[{
            "Resource":url,
            "Condition":{"DateLessThan":{"AWS:EpochTime":stamp}}
        }]
    });
    var signature = crypto.createSign("sha1").update(json).sign(key, 'base64');
    var result = url;
    if (result.indexOf("?") == -1)
        result += "?";
    else
        result += "&";
    result += "Expires="+stamp+"&Signature="+signature+"&Key-Pair-Id="+keyPairId;
    return result;
}

module.exports.signURL = signURL;
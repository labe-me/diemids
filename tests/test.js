// Test Backend (manually:).
//

require('diemids/lib/json-request');

var n = Math.round(Math.random()*999999);

JSON.post(
    "https://127.0.0.1:8001/auth",
    { email:'dummy'+n+'@example.com', reg:"sub/.*", secret:"example" },
    function(err, res){
        if (err)
            return console.log("ERROR", err);
        console.log('http://127.0.0.1:8000/'+res.email+'/'+res.key+'/sub/sc0002.png');
    }
);

/*
JSON.del(
    "https://127.0.0.1:8001/auth",
    { email:'dummy@example.com', key:'ouhfoEFBog4I', secret:'example' },
    function(err, res){
        if (err)
            return console.log(err);
        console.log(res);
    }
);
*/

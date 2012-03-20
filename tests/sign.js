// Command line URL signer.
//
// Author: Laurent Bedubourg <laurent@labe.me>

var program = require('commander');
var signer = require("diemids").Signer;

program
    .version("0.0.1")
    .usage("--keyPairId <KEY_PAIR_ID> --privateKey <AWS_CLOUDFRONT_PK_PEM_FILEPATH> --expireSeconds <NUMBER> --url <URL_TO_SIGN>")
    .option('--keyPairId <keyPairId>','Your Amazon Key Pair ID.')
    .option('--privateKey <privateKey>','Your Amazon Private Key (.pem) file path.')
    .option('--expireSeconds <expireSeconds>','The signed URL expire time.')
    .option('--url <url>','The url to sign')
;

program.parse(process.argv);

var res = signer.signURL(
    program.keyPairId,
    require('fs').readFileSync(program.privateKey),
    program.url,
    new Date(new Date().getTime() + parseInt(program.expireSeconds) * 1000.0)
);
console.log(res);
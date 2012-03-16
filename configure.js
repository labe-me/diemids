//
// DIE-MIDS AWS configuration.
//
// The only way to get what we want is to talk using AWS API.
//
// Author: Laurent Bedubourg <laurent@labe.me>
//

var inspect = function(){}
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var s3Service = awssum.load('amazon/s3');
var cloudfrontService = awssum.load('amazon/cloudfront');
var program = require('commander');
var Sync = require('sync');

program
    .version("0.0.1")
    .usage("[options] setup")
    .option('--verbose', 'Add some traces here and there.')
    .option('--id <id>', 'Your Amazon Web Services id.')
    .option('--key <key>', 'Your Amazon Web Services access key.')
    .option('--sec <secure>', 'Your Amazon Web Services secure code.')
    .option('--bucket [bucket]', 'The S3 Bucket name you wish to create (example: get.mydomain.com).')
    .option('--region [aws-region]', 'The location of your S3 Bucket ('+amazon.EU_WEST_1+', '+amazon.US_EAST_1+', '+amazon.US_WEST_1+', …).', amazon.EU_WEST_1)
    .option('--domain <domain>', 'The public domain name to use to deliver files (example: get.mydomain.com).')
;

program
    .command("setup")
    .description("Configure Amazon Web Services to setup a secure delivery system.\nThis command will create:\n- a private S3 Bucket,\n- a CloudFront distribution with restricted signed URL access,\n- the associated CloudFront Origin Access Identity.\nThis command also setup ACLs and rights so you have nearly nothing to do except configuring your DNS server (optional) and put the files you wish to serve on S3.")
    .action(function(){
        var s3 = new s3Service(program.key, program.sec, program.id, program.region);
        var cloudfront = new cloudfrontService(program.key, program.sec, program.id, amazon.US_EAST_1);
        Sync(function(){
            try {
                if (program.verbose)
                    inspect = console.log;
                console.log("* Create S3 Private Bucket '%s' in AWS '%s' datacenter", program.bucket, program.region);
                var result = s3.CreateBucket.sync(s3, { BucketName:program.bucket });
                inspect(result);

                console.log("* Creating CloudFront Origin Access Identity");
                var options = {
                    OriginAccessId:"OAI-"+program.bucket,
                    Comments:"OAI For "+program.bucket,
                    CallerReference:"REF"+Math.random()*99999
                };
                var result = cloudfront.CreateOai.sync(cloudfront, options);
                inspect(result);
                var cfOaiId = result.Body.CloudFrontOriginAccessIdentity.Id;
                var cfOaiS3CanonicalUserId = result.Body.CloudFrontOriginAccessIdentity.S3CanonicalUserId;

                console.log("* Creating CloudFront distribution for the bucket");
                var options = {
                    S3OriginDnsName : program.bucket+'.s3.amazonaws.com',
                    S3OriginOriginAccessIdentity: "origin-access-identity/cloudfront/"+cfOaiId,
                    Comment: 'Distribution for '+program.bucket,
                    Cname : program.domain,
                    Enabled : 'true',
                    CallerReference:"REF"+Math.random()*99999,
                    TrustedSignersSelf : 1,
                    DefaultRootObject: "index.html",
                };
                var result = cloudfront.CreateDistribution.sync(cloudfront, options);
                inspect(result);
                var cfDomain = result.Body.Distribution.DomainName;

                console.log("* Putting Bucket policy");
                var options = {
                    BucketName: program.bucket,
                    BucketPolicy: {
	                    "Version": "2008-10-17",
	                    "Id": "PolicyForCloudFrontPrivateContent",
	                    "Statement": [{
			                "Sid":" Grant a CloudFront Origin Identity access to support private content",
			                "Effect":"Allow",
			                "Principal":{
			                    "CanonicalUser":cfOaiS3CanonicalUserId
			                },
			                "Action":"s3:GetObject",
			                "Resource":"arn:aws:s3:::"+program.bucket+"/*"
		                }]
                    }
                };
                var result = s3.PutBucketPolicy.sync(s3, options);
                inspect(result);
                console.log("* All done, it may take a few minutes for your configuration to be fully ready.")

                console.log("\n* Information of interest:\n");

                console.log("  - Your CloudFront public domain is: %s", cfDomain);
                console.log("    The domain has been configured to work with %s", program.domain);
                console.log("    Please add a CNAME pointing to %s in your DNS configuration", cfDomain);
                console.log("    Example:");
                console.log("    %s 900 IN CNAME %s\n", program.domain.split(".").shift(), cfDomain);

                console.log("  - …");
            }
            catch(e){
                console.log("ERROR:");
                console.log(e);
            }
        });
    });

program.parse(process.argv);
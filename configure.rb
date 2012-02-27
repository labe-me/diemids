# ruby configure.rb --key=AKIAJUUDKFMXDVGDETBA --sec=w8Bef4Ba5RqR7b+XHPfuC7i2venzkLpqY91+Cwlp --buk=t5.labe.me
# php sign.php APKAJD7NA5SRFY5XMTKA ~/aws-cloudfront-pk-APKAJD7NA5SRFY5XMTKA.pem "http://d6ip2vu15e2u2.cloudfront.net/sc0001.png?email=fnicaise@thinkslow.org" 2592000

require 'rubygems'
require 'right_aws'
require 'getoptlong'

options = GetoptLong.new(
  [ '--key', '-k', GetoptLong::REQUIRED_ARGUMENT ],
  [ '--sec', '-s', GetoptLong::REQUIRED_ARGUMENT ],
  [ '--buk', '-b', GetoptLong::REQUIRED_ARGUMENT ]
)

key = ENV['AWS_ACCESS_KEY_ID']
sec = ENV['AWS_SECRET_ACCESS_KEY']
buk = nil

options.each do |opt, arg|
  case opt
    when '--key'
      key = arg
    when '--sec'
      sec = arg
    when '--buk'
      buk = arg
  end
end

log = Logger.new(STDERR)
log.level = Logger::DEBUG

if true then
  s3 = RightAws::S3Interface.new(key, sec, {:logger => log})
  #s3bucket = s3.bucket(buk)
  #puts "### s3bucket="
  #puts s3bucket.inspect
  bucket_acl = s3.get_acl(buk);
  puts "### s3bucket acl="
  puts bucket_acl.inspect
  exit
end

if false then
  acf = RightAws::AcfInterface.new(key, sec, {:logger => log})
  acf.list_distributions().each do |d|
    puts d.inspect
  end
  acf.list_origin_access_identities().each do |d|
    puts d.inspect
  end
  exit
end

if true then
  # create bucket
  #s3 = RightAws::S3Interface.new(key, sec, {:logger => log})
  s3 = RightAws::S3.new(key, sec, {:logger => log})
  s3bucket = s3.bucket(buk, true, 'private', :location => :eu)
  puts "### s3bucket="
  puts s3bucket.inspect

  # create cloudfront identity
  cf = RightAws::AcfInterface.new(key, sec, {:logger => log})
  cf_oai = cf.create_origin_access_identity("OAI for #{buk}")
  puts "### cf_oai="
  puts cf_oai.inspect

  # grant rights to cloudfront
  RightAws::S3::Grantee.new(s3bucket, cf_oai[:s3_canonical_user_id], 'FULL_CONTROL', :apply)

  # create cloudfront distribution for the bucket
  dns = buk + ".s3.amazonaws.com";
  oai = cf_oai[:location].gsub("https://cloudfront.amazonaws.com/2010-11-01/", "")
  cf_dist = cf.create_distribution({
                                     :comment => "Distribution for #{buk}",
                                     :s3_origin => {
                                       :dns_name => dns,
                                       :origin_access_identity => oai
                                     },
                                     :enabled => true
                                   })
  puts "### cf_dist="
  puts cf_dist.inspect
  cf_url = cf_dist[:domain_name]

  # setting signer permissions
  config = cf.get_distribution_config(cf_dist[:aws_id])
  puts "### old dist config="
  puts config.inspect

  config[:trusted_signers] = ['self']
  cf.set_distribution_config(cf_dist[:aws_id], config)

  config = cf.get_distribution_config(cf_dist[:aws_id])
  puts "### new dist config="
  puts config.inspect


  dd = cf.get_distribution(cf_dist[:aws_id])
  puts "### dist inspection="
  puts dd.inspect

  key = dd[:active_trusted_signers][0][:key_pair_ids][0]
  puts "Signature config : Key-Pair-Id=#{key}"
  puts "Your cloudfront secure domain is: #{cf_url}"

  puts "Go to https://console.aws.amazon.com/s3/home select you bucket, clic properties, Permissions tab, Add Bucket Policy, Copy the following policy so CloudFront will be able to access each file in your bucket without having to set each file ACL:"
  puts <<END
{
	"Version":"2008-10-17",
	"Id":"PolicyForCloudFrontPrivateContent",
	"Statement":[{
			"Sid":" Grant a CloudFront Origin Identity access to support private content",
			"Effect":"Allow",
			"Principal":{
			"CanonicalUser":"#{cf_oai[:s3_canonical_user_id]}"
			},
			"Action":"s3:GetObject",
			"Resource":"arn:aws:s3:::#{buk}/*"
		}
	]
}
END

  put "After that you might have to wait a few minutes so the CloudFront distribution is Deployed and ready to serve"

  put "Upload files to your S3 bucket either using the AWS console or the AWS command line tool or some library on the net."

  put <<END
Distribute signed URLs to your customers.

For instance, if you PUT file.zip of your bucket, it's URL will be http://#{cf_url}/file.zip.

You can add custom parameters to your URL which will be required to retrieve the file.

For instance the customer's email so he know that the URL is for him and not someone else.

http://#{cf_url}/file.zip?email=customer@example.com

Now you have to sign this URL so the customer can use it.

php sign.php #{key} your-aws-cloudfront-pk-#{key}.pem "http://#{cf_url}/file.zip?email=customer@example.com" 2592000

where:

- #{key} is the key id amazon gave you in the Access Credentials / Key Pair section
- your-aws-cloudfront-pk-#{key}.pem is the path to the private key generated in the Access  Credentials / Key Pair section
- "http://#{cf_url}/file.zip?email=customer@example.com" the URL you want to sign
- 2592000 the expire time for this signed URL in seconds from now (30 days here)

END

end

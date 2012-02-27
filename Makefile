start-server:
	PEM_FILE=/Users/lbedubourg/aws-cloudfront-pk-APKAJD7NA5SRFY5XMTKA.pem \
	KEY_PAIR_ID=APKAJD7NA5SRFY5XMTKA \
	CLOUDFRONT_DOMAIN=http://d6ip2vu15e2u2.cloudfront.net \
	node deliverer.js
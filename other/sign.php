<?php

define('KEY_PAIR_ID', $argv[1]);
define('PEM_FILE', $argv[2]);
$url = $argv[3];
$timeout = $argv[4];

echo getSignedURL($url, $timeout);
echo "\n";

function getSignedURL($resource, $timeout)
{
	//This comes from key pair you generated for cloudfront
	$keyPairId = KEY_PAIR_ID;

	$expires = time() + $timeout; //Time out in seconds
	$json = '{"Statement":[{"Resource":"'.$resource.'","Condition":{"DateLessThan":{"AWS:EpochTime":'.$expires.'}}}]}';

	//Read Cloudfront Private Key Pair
	$fp=fopen(PEM_FILE,"r");
	$priv_key=fread($fp,8192);
	fclose($fp);

	//Create the private key
	$key = openssl_get_privatekey($priv_key);
    echo "SRC=$priv_key\n";
    echo "KEY=$key\n";
	if(!$key)
	{
		echo "<p>Failed to load private key!</p>";
		return;
	}

	//Sign the policy with the private key
	if(!openssl_sign($json, $signed_policy, $key, OPENSSL_ALGO_SHA1))
	{
		echo '<p>Failed to sign policy: '.openssl_error_string().'</p>';
		return;
	}

	//Create url safe signed policy
	$base64_signed_policy = base64_encode($signed_policy);
	$signature = str_replace(array('+','=','/'), array('-','_','~'), $base64_signed_policy);

	//Construct the URL
	if (strpos($resource,'?') == -1)
		$url = $resource.'?';
	else
		$url = $resource.'&';
	$url = $url . 'Expires='.$expires.'&Signature='.$signature.'&Key-Pair-Id='.$keyPairId;
	return $url;
}

?>

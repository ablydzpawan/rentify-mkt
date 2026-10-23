<?php

define('RFQ_CURL_URL', 'http://rfqs.seockers.com/record-rfqs.php?passkey=fatbit2014');
ini_set('memory_limit', '-1');
if (substr_count($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') && false) {
    ob_start('ob_gzhandler');
} else {
    ob_start();
}

if (PHP_SESSION_NONE == session_status()) {
    session_start();
}

// error_reporting(E_ALL ^ E_NOTICE);
error_reporting(E_ALL);
ini_set('display_errors', '1');
$protocol = (!empty($_SERVER['HTTPS']) && 'off' !== $_SERVER['HTTPS'] || 443 == $_SERVER['SERVER_PORT']) ? 'https://' : 'http://';
$server_url = $protocol . $_SERVER['HTTP_HOST'] . '/';

if ('localhost' == $_SERVER['SERVER_NAME'] || '192.' == substr($_SERVER['SERVER_NAME'], 0, 4) || (strpos($_SERVER['HTTP_HOST'], '.4demo.website') > 0) || (strpos($_SERVER['HTTP_HOST'], '.4livedemo.com') > 0)) {
    define('CONF_WEBROOT_URL', $server_url);
    // Add 4livedemo Captcha V3 Keys
    define('CONF_HIDDEN_RECAPTCHA_SITEKEY', '6LdhitUUAAAAAOc6zajn7iYscHFouzNzdkGm5maM');
    define('CONF_HIDDEN_RECAPTCHA_SECRETKEY', '6LdhitUUAAAAACVdj9W-MJGJQgRXNQqbPQqUUiyA');


} else {
    define('CONF_WEBROOT_URL', '/');
    define('CONF_HIDDEN_RECAPTCHA_SITEKEY', '6Ld0nfwtAAAAAKKqj9qMkgEDVJuXKsBS_hPWGGWv');
    define('CONF_HIDDEN_RECAPTCHA_SECRETKEY', '6Ld0nfwtAAAAAHRJuyxzBW0XUNuzioESWHzLk3nL');
}

define('RFQ_MAIL_RECIEVERS_TO', 'atul.arora@fatbit.com,sales@fatbit.com');
define('RFQ_MAIL_RECIEVERS_CC', 'w3me@outlook.com,fatbitleadscheck@gmail.com');
define('ERROR_MAIL_CC', 'jasbir.singh@fatbit.marketing,bhavik.gandhi@fatbit.team');

define('ADMIN_FROM', 'sales@fatbit.com');
define('ADMIN_FROM_NAME', 'Rentify Team');

define('RFQ_SUGGEST_FORM_MAIL_RECIEVERS_TO', 'abhinandan.changotra@fatbit.in,sandeepkumar@ablysoft.com,connect@fatbit.com,jasbir.singh@fatbit.com,sukhminder.lamba@fatbit.in');

define('API_KEY', '4d822b82-f1ce-411a-aa00-a98272dd610c');
define('HUBSPOT_PRIVATEAPP_KEY', '');
// HUBSPOT PORTAL ID AND OWNER ID
define('PORTAL_ID', '2865881');
define('OWNER_ID', '18720279');

define('DEFAULT_TIMEZONE', 'Asia/Kolkata');

// HUBSPOT ENDPOINTS
define('CONTACT_ENDPOINT', 'https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/');
define('CONTACT_VERIFY_EMAIL_ENDPOINT', 'https://api.hubapi.com/contacts/v1/contact/email/');
define('DEAL_ENDPOINT', 'https://api.hubapi.com/deals/v1/deal?hapikey=');

define('DEAL_ENDPOINT_NEW', 'https://api.hubapi.com/deals/v1/deal');

// HUBSPOT close date of deal
define('CLOSE_DATE', '+1 month');
define('DEAL_TITLE', ' - Request For Proposal ');
// HUBSPOT constants ends

define('CONF_ROOT_PROJECT_PATH', dirname(__DIR__) . DIRECTORY_SEPARATOR);

define('SMTP_HOST', 'rentify.com');
define('SMTP_PORT', '465');
define('SMTP_USER_NAME', 'demo@rentify.com');
define('SMTP_PASSWORD', '');


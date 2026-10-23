<?php
require_once __DIR__ . '/application-top.php';

define('CONF_END_DOMAIN', 'https://analytics.fatbit.com');
define('CONF_API_IS_BANNED_IP', CONF_END_DOMAIN . '/api/is_banned_ip');
define('CONF_API_GET_VISITOR_ID', CONF_END_DOMAIN . '/api/get_visitor_id');
define('CONF_API_GET_VISIT_ID', CONF_END_DOMAIN . '/api/get_visit_id_for_valid_visit');
define('CONF_API_TRACK_PAGE', CONF_END_DOMAIN . '/api/track_page');

$queryStringData = getDataFromQueryString();

$referrerPage = $queryStringData['referrer'];
$browsedUrl = $queryStringData['url'];
$options = $queryStringData['options'];

$siteId = extractSiteId($options['acc']);
$customVar = (isset($options['custom']))?$options['custom']:'';

if ($siteId == 0 || isVisitorIPBanned($siteId)) {
    renderImage();
}

if (isset($_SESSION['visitor'])) {
    $visitor = intval($_SESSION['visitor']);
} elseif (isset($_COOKIE['visitor'])) {
    $visitor = intval($_COOKIE['visitor']);
} else {

    $visitor = getVisitorIdFromAnalytics();

    if(!$visitor) {
        renderImage();
    }

    $_SESSION['visitor'] = $visitor;
}

if (isset($_SESSION['visits'][$siteId])) {
    $visitId = $_SESSION['visits'][$siteId];
} else {

    $visitId = getValidVisitIdFromAnalytics($visitor, $browsedUrl, $siteId, $referrerPage);

    if(!$visitId) {
        renderImage();
    }
    $_SESSION['visits'] = $_SESSION['visits'] ?? [];

    $_SESSION['visits'][$siteId] = $visitId;

    setcookie('visitor', $visitor, time()+15552000);
}

/** Add browsed url in tracking info at analytics tool [ **/
$endPointResponse = callCurl(CONF_API_TRACK_PAGE, array(
    'visit_id' => $visitId,
    'landing_page' => $browsedUrl,
    'referrer' => $referrerPage,
    'custom_var' => $customVar,
));
/** ] Add browsed url in tracking info at analytics tool **/

renderImage();

function renderImage()
{
    exit;
}


function getDataFromQueryString()
{
    $data = [];
    $data['referrer'] = $_GET['r'];
    $data['url'] = $_GET['l'];

    $arr = explode(',', $_GET['o']);
    while (count($arr) > 0) {
        $key = $arr[0];
        array_shift($arr);
        $val = $arr[0];
        array_shift($arr);
        $data['options'][$key] = $val;
    }

    return $data;
}

function extractSiteId($acc)
{
    $arr = explode('-', $acc);
    if (!is_numeric($arr[1])) {
        return 0;
    }
    return intval($arr[1]);
}

function isVisitorIPBanned($siteId)
{
    /** Check if visitor IP is Banned [ **/
    $endPointResponse = callCurl(CONF_API_IS_BANNED_IP, array(
    	'user_ip' => $_SERVER['REMOTE_ADDR'],
    	'site_id' => $siteId
    ));

    if(!isset($endPointResponse['response']['is_banner_ip']) || $endPointResponse['response']['is_banner_ip'] == 1) {
        return true;
    }

    return false;
}

function getVisitorIdFromAnalytics()
{
    /** Get Vistor Id from analytics tool [ **/
    $endPointResponse = callCurl(CONF_API_GET_VISITOR_ID, [], 'GET');

    if(!isset($endPointResponse['response']['visitor_id']) || empty($endPointResponse['response']['visitor_id'])) {
        return false;
    }

    return $endPointResponse['response']['visitor_id'];
    /** ] Get Vistor Id from analytics tool **/
}

function getValidVisitIdFromAnalytics($visitor = '', $browsedUrl = '', $siteId = '', $referrerPage = '')
{

    /** Check if this visit is valid, if yes then won visit id [ **/
    $endPointResponse = callCurl(CONF_API_GET_VISIT_ID, array(
        'visit_visitor_id' => $visitor,
        'landing_page' => $browsedUrl,
        'visit_site_id' => $siteId,
        'visit_ip' => $_SERVER['REMOTE_ADDR'],
        'visit_browser' => $_SERVER['HTTP_USER_AGENT'],
        'visit_source' => $referrerPage,
    ));

    if(!isset($endPointResponse['response']['is_valid_visit']) || $endPointResponse['response']['is_valid_visit'] == 0) {
        return false;
    }

    if(!isset($endPointResponse['response']['visit_id']) || empty($endPointResponse['response']['visit_id'])) {
        return false;
    }
    /** ] Check if this visit is valid, if yes then won visit id **/

    return $endPointResponse['response']['visit_id'];
}

function callCurl($endPoint, $requestData, $method = 'POST')
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endPoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    if ($method == 'PUT') {
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Content-Length: ' . strlen($requestData)));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');

        $requestData = json_encode($requestData);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $requestData);
    }

    if ($method == 'POST') {
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $requestData);
    }

    $response = curl_exec($ch);
    $response = json_decode($response, true);
    
    @curl_close($ch);

    return $response;
}

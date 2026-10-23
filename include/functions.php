<?php
require_once __DIR__ . '/application-top.php';
function sendSmtpMail($to, $subject, $body, $from, $from_name, $cc = array(), $bcc = array(), $addReplyTo = array(), $attachments = array(), $priority = 0)
{
    require_once __DIR__ . '/PHPMailer/PHPMailerAutoload.php';
    $mail = new PHPMailer();
    $mail->IsSMTP();
    $mail->Mailer = "smtp";
    // $mail->SMTPSecure ="tls";  //when we use yokart smtp
    $mail->SMTPSecure = "ssl";
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER_NAME;
    $mail->Password =  SMTP_PASSWORD;
    $mail->Timeout = 10;
    $mail->IsHTML(true);

    if (is_array($to)) {
        foreach ($to as $key => $emailData) {
            if (isset($emailData['email']) && isset($emailData['name'])) {
                $mail->AddAddress($emailData['email'], $emailData['name']);
            } elseif (isset($emailData['email'])) {
                $mail->AddAddress($emailData['email']);
            } else {
                $mail->AddAddress($emailData);
            }
        }
    } else {
        $emails = explode(', ', $to);
        foreach ($emails as $key => $val) {
            $mail->AddAddress($val);
        }
    }
    
    $mail->From = $from;
    if (!empty($from_name)) {
        $mail->FromName = $from_name;
    }
    $mail->Subject = $subject;

    if ($cc) {
        foreach ($cc as $ccEmail) {
            $mail->addCC($ccEmail);
        }
    }
    if ($bcc) {
        foreach ($bcc as $bccEmail) {
            $mail->addBCC($bccEmail);
        }
    }

    if ($addReplyTo) {
        foreach ($addReplyTo as $replyToEmail) {
            $mail->addReplyTo($replyToEmail);
        }
    }

    $mail->Body = $body;

    if (!empty($attachments)) {
        foreach ($attachments as $attachment) {
            $mail->AddAttachment($attachment['file'], $attachment['filename']);
        }
    }

    if (!empty($Priority)) {
        $mail->Priority = (int)$priority;
    }


    if (!$mail->Send()) {
        return false;
    } else {
        return true;
    }
}

function sendJsonResponse($message = "", $status = 0, $data = "")
{
    echo json_encode(array('message' => $message, 'status' => $status, 'data' => $data));
    die();
}


function checkRequriedFields($requriedField = [], $post_data = [], &$error = '')
{
    $empty_fields = [];
    $checkCaptcha  =  false;
    if (empty($requriedField)) {
        $error = "Fields are required";
        return false;
    }
    if (isset($requriedField['g-recaptcha-response'])) {
        $checkCaptcha = true;
    }

    foreach ($requriedField as $key => $value) {
        if (!array_key_exists($value, $post_data) || $post_data[$value] == "") {
            $empty_fields[] = $value;
        }
    }
    if ($checkCaptcha && !verifyCaptcha($post_data)) {
        $empty_fields[] = "captcha";
    }

    if (!empty($empty_fields)) {
        $fields = implode(',', $empty_fields) . " field is requried";
        sendJsonResponse($fields);
    }
    return true;
}

function sendMailToUser($post = [])
{
    $your_email = $post['email'];
    $name = $post['name'];
    $userBody = 'Dear ' . $name . ',<br /><br />
								Thank you for connecting with Rentify.<br /><br />
								One of our experts from the business team will get in touch with you shortly to discuss your requirements.<br /><br />
								Have a nice day!<br /><br />
								Regards,<br />
								Rentify Team<br />
								(FATbit Technologies)<br />
								skype: fatbit.com || Ph: +1 469 844 3346';
    $userSubject = 'Thank you for showing your interest in Rentify';
    sendSmtpMail($your_email, $userSubject, $userBody, ADMIN_FROM, ADMIN_FROM_NAME, null, null, [ADMIN_FROM]);
}

function sendDataOnHubSpot($posted_data, $lead_rfq_number)
{
    include_once __DIR__ . '/classes/HubspotApi.php';
    $extraData['lead_rfq_number'] = $lead_rfq_number;
    $_SESSION['testimonial_sent'] = '';
    $hubspotApi = new HubspotApi($posted_data, $extraData);
    $dealId = $hubspotApi->run();
    if (!empty($dealId)) {
        // for analytics data in http://hubspot.com
        $_SESSION['Deal_Id_To_Update_HubDeal'] = $dealId;
        $_SESSION['Lead_RFQ_Number_To_Update_HubDeal'] = $lead_rfq_number;
    }
    $_SESSION['Lead_RFQ_Number'] = $lead_rfq_number;
    unset($posted_form);
    return true;
}

function verifyCaptcha($post)
{
    if (empty($_POST['g-recaptcha-response'])) {
        return false;
    }
    $captcha = $_POST['g-recaptcha-response'];
    $secret   = CONF_RECAPTCHA_SECRETKEY;
    $response = file_get_contents(
        "https://www.google.com/recaptcha/api/siteverify?secret=" . $secret . "&response=" . $captcha . "&remoteip=" . $_SERVER['REMOTE_ADDR']
    );
    // use json_decode to extract json response
    $response = json_decode($response);
    if ($response->success === false) {
        return false;
    }
    return true;
}

function sendMailToAdmin($posted_form, $lead_rfq_number, $attachment = [], $custumSubject = "", $Mailto = "")
{
    $strBody = '';
    $schedule_msg = '';
    $from = 'sales@fatbit.com';
    $cc = [];
    $to = [];
    $bcc = [];
    $attachmentEmail = $attachment;
    $cc = explode(',', RFQ_MAIL_RECIEVERS_CC);
    $Mailto = (!empty($Mailto)) ?  $Mailto : RFQ_MAIL_RECIEVERS_TO;
    $to = explode(',', $Mailto);
    if (!empty($posted_form['role'])) {
        $schedule_msg .= "\nRole : " . $posted_form['role'];
        $schedule_msg .= ' ';
    }
    if (!empty($posted_form['email']) && strlen(strstr($posted_form['email'], "dummyid")) > 0) {
        $cc[] = "login@dummyid.com";
    }
    foreach ($posted_form as $key => $value) {
        if ('g-recaptcha-response' == $key || 'request_demo_form' == $key || 'request_form' == $key || 'submit' == $key || 'confirm' == $key || 'hiddenRecaptcha' == $key) {
            continue;
        }
        if (strlen(strstr($key, 'date_Preference')) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace('_', ' ', $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= ' ';
        }
        if (strlen(strstr($key, 'time_Preference')) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace('_', ' ', $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= ' ';
        }
        if (strlen(strstr($key, 'interest')) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace('_', ' ', $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= ' ';
        }

        if (strlen(strstr($key, 'time_slot')) > 0) {
            $schedule_msg .= ucwords(str_replace('_', ' ', $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, 'time_zone')) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace('_', ' ', $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= ' ';
        }

        if (!is_array($value)) {
            $strBody .= '<tr>
					 <td width="33%"><font color="#f35D14" size="2" face="Tahoma">' . ucwords(str_replace('_', ' ', $key)) . ' : </font></td>';
            if ('time' == substr($key, 0, 4)) {
                $strBody .= '<td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . nl2br(stripslashes($value)) . '</font></td>
					</tr>';
            } else {
                $strBody .= '<td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . nl2br(stripslashes($value)) . '</font></td>
					 </tr>';
            }
        } else {
            $strBody .= '<tr>
						 <td width="33%"><font color="#f35D14" size="2" face="Tahoma">' . ucwords(str_replace('_', ' ', $key)) . ' : </font></td>
						 <td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . implode($value, ', ') . '</font></td>
						 </tr>';
        }
    }
    if (!empty($posted_form['preffered_demo_medium'])) {
        $schedule_msg .= "\n" . ucwords(str_replace('_', ' ', 'preffered_demo_medium')) . ':- ' . nl2br(stripslashes($posted_form['preffered_demo_medium']));
        $schedule_msg .= ' ';
    }

    $strBody .= '<tr>
			<td width="33%"><font color="#f35D14" size="2" face="Tahoma">Lead Number : </font></td>
			<td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . $lead_rfq_number . '</font></td>
			</tr>
			<tr>
			<td width="33%"><font color="#f35D14" size="2" face="Tahoma">IP Address : </font></td>
			<td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . $_SERVER['REMOTE_ADDR'] . '</font></td>
			</tr>
			<tr>
			<td width="33%"><font color="#f35D14" size="2" face="Tahoma">Page URL : </font></td>';
    if (!empty($_SERVER['HTTP_REFERER'])) {

        $strBody .= '<td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . $_SERVER['HTTP_REFERER'] . '</font></td>';
    }
    $strBody .= '</tr>';

    $messageBody = '<table width="100%" border="0" cellspacing="0" cellpadding="0">' . $strBody . '<tr>
			<td height="22" colspan="2"><hr size="1" /></td>
			</tr>
			<tr>
				<td height="22" colspan="2" ><font color="#ff0000" size="-1" face="Times New Roman, Times, serif">
					<strong>Note :</strong> Requested date and time are as per ' . ((!empty($posted_form['time_zone'])) ? ' [ ' . $posted_form['time_zone'] . '].' : 'India') . 'Time Zone .</font>
				</td>
			</tr>
			<tr>
			<td height="22" colspan="2" align="center"><font color="#333333" size="-1" face="Times New Roman, Times, serif">&copy; ' . date('Y') . ' FATbit.com</font></td>
			</tr>';
    if (!empty($_COOKIE['user_referred_by'])) {
        $messageBody .= '<tr>
							<td height="22" colspan="2" align="center"><font color="#333333" size="-1" face="Times New Roman, Times, serif">Referred By: ' . $_COOKIE['user_referred_by'] . '</font></td>
						</tr>';
    }
    $messageBody .= '</table>';
    $message = (!empty($posted_form['message'])) ? $posted_form['message'] : '';
    $_POST['description'] = $message . ' ' . $schedule_msg;
    $name = $posted_form['name'];

    $subject = 'Rentify - Contact Form Submitted by ' . $name . ' on ' . date('d F, Y');
    if (!empty($custumSubject)) {
        $subject = $custumSubject;
    }
    $emailResult = sendSmtpMail($to, $subject, $messageBody, $from, "Rentify Team", $cc, $bcc, [$posted_form['email']], $attachmentEmail, 4);
}

function send_request_via_curl($posturl, $content)
{
    $path = "../RFQ_TMP_FILES";
    $days = 7;
    $results = scandir($path);
    foreach ($results as $result) {
        if ($result === '.' or $result === '..') continue;
        if (is_file($path . '/' . $result)) {
            $fileName = $path . '/' . $result;
            $fileTime = filemtime($fileName);
            $fileTimeDate = date("F d Y H:i:s", $fileTime);
            $oneMonthBackDate = strtotime("-" . $days . " days");
            if ($oneMonthBackDate > $fileTime) {
                @unlink($fileName);
            }
        }
    }
    $url = $posturl;
    foreach ($content as $key => $value) {
        if ((strtoupper($key) != "SUBMIT") && (strtoupper($key) != "SECURITY_CODE") && (strtoupper($key) != "RFQ_SHORT_FORM") && (strtoupper($key) != "CHECK_SECURITY_CODE")) {
            if (is_array($value))
                $fields[$key] = implode(",", ($value));
            else
                $fields[$key] = $value;
        }
    }
    //open connection
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, count($fields));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function run_curl($endpoint = '', $post_data = false, $post_json = array(), $authorization = "")
{
    $ch = @curl_init();
    if ($post_data) {
        @curl_setopt($ch, CURLOPT_POST, $post_data);
        @curl_setopt($ch, CURLOPT_POSTFIELDS, $post_json);
    }
    @curl_setopt($ch, CURLOPT_URL, $endpoint);
    if ($authorization != "") {
        @curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', $authorization]);
    } else {
        @curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    @curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = @curl_exec($ch);
    $status_code = @curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_errors = curl_error($ch);
    @curl_close($ch);
    return json_decode($response);
}

if (!function_exists("getLocationInfoByIp")) {
    function getLocationInfoByIp($ipAddr = '')
    {
        $client  = @$_SERVER['HTTP_CLIENT_IP'];
        $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
        $remote  = @$_SERVER['REMOTE_ADDR'];
        $output  = array('country' => '', 'city' => '', 'country_code' => '', 'state' => '');
        if (!empty($ipAddr) && filter_var($ipAddr, FILTER_VALIDATE_IP)) {
            $ip = $ipAddr;
        } elseif (filter_var($client, FILTER_VALIDATE_IP)) {
            $ip = $client;
        } elseif (filter_var($forward, FILTER_VALIDATE_IP)) {
            $ip = $forward;
        } else {
            $ip = $remote;
        }
        $ip_data = @json_decode(file_get_contents("http://www.geoplugin.net/json.gp?ip=" . $ip));
        if ($ip_data && $ip_data->geoplugin_countryName != null) {
            $output = array(
                "city"           => @$ip_data->geoplugin_city,
                "state"          => @$ip_data->geoplugin_regionName,
                "country"        => @$ip_data->geoplugin_countryName,
                "country_code"   => @$ip_data->geoplugin_countryCode,
            );
        }
        return $output;
    }
}

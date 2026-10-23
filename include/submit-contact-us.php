<?php
if (!isset($_SESSION)) {
    session_start();
}
require_once __DIR__ . '/functions.php';

$isContactForm = !empty($_POST['contactform']) && $_POST['contactform'] !== 'false';
$posted_form = $_POST;
$name = (isset($_POST['name']) && !empty($_POST['name'])) ? $_POST['name'] : 'Anonymous';
$email = $_POST['email'];
$phone = (isset($_POST['phone']) && !empty($_POST['phone'])) ? $_POST['phone'] : '';
$message = (isset($_POST['message']) && !empty($_POST['message'])) ? $_POST['message'] : '';
$error = false;
$robotErrorMsg = false;
$strBody = '';
$schedule_msg = '';

if ($isContactForm === true) {
    if (empty($name) || empty($email) || empty($message)) {
        $error = true;
    }
} else {
    if (empty($email)) {
        $error = true;
    }
}

$isEmailValid = true;
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $isEmailValid = false;
}
if ($isContactForm === true) {
    if (!isset($_POST['g_recaptcha_response'])) {
        $robotErrorMsg = true;
    } else {
        $response = json_decode(file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=" . CONF_HIDDEN_RECAPTCHA_SECRETKEY . "&response=" . $_POST['g_recaptcha_response'] . "&remoteip=" . $_SERVER['REMOTE_ADDR']), true);
        if ($response['success'] == false) {
            $robotErrorMsg = true;
        }
    }
}
$lead_rfq_number = date("ymdhis");
if ($error) {
    if ($isContactForm === true) {
        $message = 'Please fill all the required fields';
    } else {
        $message = 'Please fill email field';
    }
    if (!$isEmailValid) {
        $message = 'Invalid email format';
    }
    $result = false;
} else if ($robotErrorMsg && $isContactForm === true) {
    $message = 'Robot verification failed, please try again';
    $result = false;
} else {
    unset($posted_form['g_recaptcha_response']);
    unset($posted_form['submit']);
    unset($posted_form['contactform']);
    foreach ($posted_form as $key => $value) {
        if (!is_array($value)) {
            if (strlen(strstr($key, "describe")) > 0) {
                $strBody .= '<tr>
				   <td width="33%"><font color="#f35D14" size="2" face="Tahoma">Looking to Build a Solution for : </font></td>
				   <td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . nl2br(stripslashes($value)) . '</font></td>
				   </tr>';
            } else {
                $strBody .= '<tr>
                    <td width="33%"><font color="#f35D14" size="2" face="Tahoma">' . ucwords(str_replace("_", " ", $key)) . ' : </font></td>
                    <td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . nl2br(stripslashes($value)) . '</font></td>
                    </tr>';
            }
        } else {
            $strBody .= '<tr>
                <td width="33%"><font color="#f35D14" size="2" face="Tahoma">' . ucwords(str_replace("_", " ", $key)) . ' : </font></td>
                <td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . implode(",", $value) . '</font></td>
                </tr>';
        }
        if (strlen(strstr($key, "describe")) > 0) {
            $schedule_msg .= "\n" . 'Looking to Build a Solution for:- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, "job_role")) > 0) {
            $schedule_msg .= "\n" . 'Role/Job-Level:- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, "also_interested_in")) > 0) {
            $schedule_msg .= "\n" . 'Also Looking for:- ' . nl2br(implode(", ", $value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, "your_industry")) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace("_", " ", $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, "target_audience")) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace("_", " ", $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
        if (strlen(strstr($key, "timeline")) > 0) {
            $schedule_msg .= "\n" . ucwords(str_replace("_", " ", $key)) . ':- ' . nl2br(stripslashes($value));
            $schedule_msg .= '';
        }
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
                    <td width="33%"><font color="#f35D14" size="2" face="Tahoma">Page URL : </font></td>
                    <td width="67%" height="22"><font color="#333333" size="-1" face="Tahoma">' . ($_SERVER['HTTP_REFERER'] ?? '') . '</font></td>
                </tr>';
    $messageBody = '<table width="100%" border="0" cellspacing="0" cellpadding="0">' . $strBody . '
                <tr>
                    <td height="22" colspan="2"><hr size="1" /></td>
                </tr>
                <tr>
                    <td height="22" colspan="2" ><font color="#ff0000" size="-1" face="Times New Roman, Times, serif"><strong>Note :</strong> Requested date and time are as per Indian Standard Time.</font></td>
                </tr>
                <tr>
                   <td height="22" colspan="2" align="center"><font color="#333333" size="-1" face="Times New Roman, Times, serif">&copy; ' . date('Y') . ' Yorent.com</font></td>
				</tr>';

    $messageBody .= '</table>';
    $mailSubject = "Rentify - Contact Form Submitted by " . $name . " on " . date("d F, Y");
    $cc = [];
    foreach (explode(',', RFQ_MAIL_RECIEVERS_CC) as $cc_emails) {
        if (filter_var($cc_emails, FILTER_VALIDATE_EMAIL)) {
            $cc[] = $cc_emails;
        }
    }
    if (strlen(strstr($email, "dummyid")) > 0) {
        $cc[] = "products@dummyid.com";
    }
    $to = [];
    foreach (explode(',', RFQ_MAIL_RECIEVERS_TO) as $to_emails) {
        if (filter_var($to_emails, FILTER_VALIDATE_EMAIL)) {
            $to[] = $to_emails;
        }
    }
    $resultEmail = sendSmtpMail($to, $mailSubject, $messageBody,  ADMIN_FROM, ADMIN_FROM_NAME, $cc);

    /* if ($resultEmail) { */

    $thankyouMailSubject = "Thank You, We have received your request- Rentify";
    $messageHeading = 'Thank you for showing interest in Rentify - Rental Ecosystem';
    $thanksMailBody = '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;500;600;700;800;900&display=swap" rel="stylesheet"><div style="font-family: "Montserrat", sans-serif;" font-size:15px !important;>Hi ' . $name . ',
                <br /><br />
                ' . $messageHeading . '
                <br /><br />
                This is a confirmation email that our team has received your request. A dedicated solution expert will get in touch with you to give a complete overview of Rentify and answer all your queries. 
                <br /><br />
                <div>
                    <img src="https://www.yo-rent.com/images/telephone.png" alt="Rentify telephone Logo" height="16" width="16">&nbsp;<span>+1 469 844 3346</span>
                </div>
                <div>
                    <img src="https://www.yo-rent.com/images/email.png" alt="Rentify email Logo" height="16" width="16">&nbsp;&nbsp;<span><a href="mailto:sales@fatbit.com">sales@fatbit.com</a></span>
                </div>
                <br />
                <div>
                    <a href="https://www.facebook.com/YoRentScript" target="_blank" style="text-decoration: none;">
                        <img src="https://www.yo-rent.com/images/facebook-square.png" style="border-radius:5px">
                    </a>
                    <a href="https://twitter.com/yo_rent" target="_blank" style="text-decoration: none;">
                        <img src="https://www.yo-rent.com/images/twitter-square.png" style="border-radius:5px">
                    </a>
                    <a href="https://www.instagram.com/yorentsoftware/" target="_blank" style="text-decoration: none;">
                        <img src="https://www.yo-rent.com/images/instagram-square.png" style="border-radius:5px">
                    </a>
                </div>
                </div>
                ';

    $thankyouMailSent = sendSmtpMail($email, $thankyouMailSubject, $thanksMailBody, ADMIN_FROM, ADMIN_FROM_NAME, NULL, NULL, [ADMIN_FROM]);

    $rfq_subject = $mailSubject;

    /* HUBSPOT API */
    $email = $_POST['email'];
    $firstname = (isset($_POST['name']) && !empty($_POST['name'])) ? $_POST['name'] : 'Anonymous';
    $text_message = (isset($_POST['message']) && !empty($_POST['message'])) ? $_POST["message"] : '';
    $phone = (isset($_POST['phone']) && !empty($_POST['phone'])) ? $_POST["phone"] : '';
    $website = '';

    $authorization = "Authorization: Bearer " . HUBSPOT_PRIVATEAPP_KEY;
    $endpoint = CONTACT_VERIFY_EMAIL_ENDPOINT . $email . '/profile';
    $result = run_curl($endpoint, false, [], $authorization);

    $date = new DateTime();
    $current_date = $date->format('Y-m-d');
    $date->modify(CLOSE_DATE);

    if (isset($result)) {
        $arr = array(
            'properties' => array(
                array(
                    'property' => 'email',
                    'value' => $email
                ),
                array(
                    'property' => 'firstname',
                    'value' => $firstname
                ),
                array(
                    'property' => 'phone',
                    'value' => $phone
                ),
                array(
                    'property' => 'message',
                    'value' => $text_message
                ),
            )
        );

        $post_json = json_encode($arr);
        $endpoint = CONTACT_ENDPOINT . $email . '/';
        $user_id = 0;
        if (isset($result->vid) && intval($result->vid) > 0) {
            $user_id = $result->vid;
        } else {
            $result = run_curl($endpoint, true, $post_json, $authorization);
            if (isset($result) && isset($result->vid)) {
                $user_id = $result->vid;
            }
        }

        if ($user_id > 0) {
            $common_message = $text_message . ' ' . $schedule_msg;
            $visitorLocation = getLocationInfoByIp($_SERVER['REMOTE_ADDR']);
            /* 	define $rfq_subject	 */
            $arr_deal = array(
                'associations' =>
                array(
                    'associatedVids' => array($user_id)
                ),
                'portalId' => PORTAL_ID,
                'properties' => array(
                    array(
                        'name' => 'dealname',
                        'value' => $rfq_subject
                    ),
                    array(
                        'name' => 'client_name',
                        'value' => $firstname
                    ),
                    array(
                        'name' => 'description',
                        'value' => $common_message
                    ),
                    array(
                        'name' => 'dealstage',
                        'value' => 'b4f0f349-95c5-4cb3-b2bb-63186cfedaf3'
                    ),
                    array(
                        'name' => 'deal_added_by_email',
                        'value' => $email
                    ),
                    array(
                        'name' => 'pipeline',
                        'value' => 'default'
                    ),
                    array(
                        'name' => 'phone_number',
                        'value' => $phone
                    ),
                    array(
                        'name' => 'hubspot_owner_id',
                        'value' => OWNER_ID
                    ),
                    array(
                        'name' => 'closedate',
                        'value' => $date->getTimestamp() * 1000
                    ),
                    array(
                        'name' => 'lead_number',
                        'value' => $lead_rfq_number
                    ),
                    array(
                        'name' => 'deal_mode',
                        'value' => 'RFQ'
                    ),
                    array(
                        'name' => 'referring_url',
                        'value' => ($_SERVER['HTTP_REFERER'] ?? '')
                    ),
                    array(
                        'name' => 'deal_ip_address',
                        'value' => $_SERVER['REMOTE_ADDR']
                    ),
                    array(
                        'name' => 'dealtype',
                        'value' => 'newbusiness'
                    ),
                    array(
                        'name' => 'deal_ip_city',
                        'value' => $visitorLocation['city']
                    ),
                    array(
                        'name' => 'deal_ip_state',
                        'value' => $visitorLocation['state']
                    ),
                    array(
                        'name' => 'deal_ip_country',
                        'value' => $visitorLocation['country']
                    ),
                    array(
                        'name' => 'deal_ip_country_code',
                        'value' => $visitorLocation['country_code']
                    )
                )
            );

            $post_json = json_encode($arr_deal);
            $result = run_curl(DEAL_ENDPOINT_NEW, true, $post_json, $authorization);
            if (!isset($result)) {
                $error = 'Deal is not created';
            } elseif (!empty($result->dealId)) {
                $_SESSION["Deal_Id_To_Update_HubDeal"] = $result->dealId;
                $_SESSION['Lead_RFQ_Number_To_Update_HubDeal'] = $lead_rfq_number;
            }
        } else {
            $error = 'Deal is not created';
        }
    } else {
        $error = 'Not able to get the result';
    }

    if ($error != '') {
        sendSmtpMail('mb@fatbit.com', 'Error on form submission Rentify', $error . ' ' . json_encode($_REQUEST), 'info@dummyid.com', 'Rentify Team', [ERROR_MAIL_CC]);
    }
    /* API */

    $message = 'Your Request has been submitted successfully';
    $result = true;
    if (!$resultEmail && $error != '') {
        $message = 'Something is wrong! Email is not sent';
        $result = false;
    } else {
        $message = 'Your Request has been submitted successfully';
        $result = true;
    }
}
$_SESSION["Lead_RFQ_Number"] = $lead_rfq_number;

$data = [];
$data['success'] = $result;
$data['message'] = $message;
$data['contactform'] = $isContactForm;
echo json_encode($data);

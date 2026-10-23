<?php
require_once __DIR__ . '/../application-top.php';

 class HubspotApi
 {

	private $userId = 0;
	private $userEmail = '';
	private $userName = '';
	private $userPhone = '';
	private $subject = '';
	private $message = '';
	private $website = '';
	private $leadRfqNumber = '';
	private $description = '';
	private $isTryDemoDeal = false;

	public function __construct($postedData, $extraData = array())
	{
        $this->userEmail = (!empty($postedData["email"])) ? $postedData["email"]: '';
		$this->userName = (!empty($postedData["name"])) ? $postedData["name"]: '';
		$this->userPhone = (!empty($postedData["phone"])) ? $postedData["phone"]: '';
		$this->subject = (!empty($postedData["subject"])) ? $postedData["subject"]: $this->getSubject($postedData);
		$this->message =  (!empty($postedData["message"])) ? $postedData["message"]: '';
        $this->website =   (!empty($postedData["website_if_any"])) ? $postedData["website_if_any"]: '';
        $this->description =  (!empty($postedData["description"])) ? $postedData["description"]: '';
        $this->isTryDemoDeal =  (!empty($postedData["try_demo_lead"])) ? true : false;
        $this->leadRfqNumber = (!empty($extraData['lead_rfq_number'])) ? $extraData["lead_rfq_number"]: '';
    }

	private function getSubject($postedData)
	{
        $subject = "YoRent - Request For Proposal Submitted by " . $postedData['name'] . " on " . date("d F, Y");
		return $subject;
	}

	private function getContactRequestData()
	{
		$requestData = array(
			'properties' => array(
				array(
					'property' => 'email',
					'value' => $this->userEmail
				),
				array(
					'property' => 'firstname',
					'value' => $this->userName
				),
                array(
                    'property' => 'website',
                    'value' => $this->website
                ),
                array(
                    'property' => 'phone',
                    'value' => $this->userPhone
                ),
				array(
					'property' => 'message',
					'value' => $this->message
				)
			)
		);
        if( $this->isTryDemoDeal ) {
                $requestData['properties'][] =  array(
					'property' => 'is_try_demo',
					'value' => 1
				);
        }

		$jsonRequestData = json_encode($requestData);
		return $jsonRequestData;
	}

	private function getDealRequestData()
	{
		$date = new DateTime();
		$date->modify(CLOSE_DATE);
        include_once __DIR__ . '/../functions.php';
        $visitorLocation = getLocationInfoByIp($_SERVER['REMOTE_ADDR']);
		$requestData =  array(
			'associations' =>
				array(
					'associatedVids' => array($this->userId)
				),
			'portalId' => PORTAL_ID,
			'properties' => array(
				array(
					'name' => 'dealname',
					'value' => $this->subject
				),
				array(
					'name' => 'client_name',
					'value' => $this->userName
				),
				array(
					'name' => 'description',
					'value' => $this->description
				),
				array(
					'name' => 'dealstage',
					'value' => 'b4f0f349-95c5-4cb3-b2bb-63186cfedaf3'
				),
				array(
					'name' => 'deal_added_by_email',
					'value' => $this->userEmail
				),
				array(
					'name' => 'pipeline',
					'value' => 'default'
				),
				array(
					'name' => 'phone_number',
					'value' => $this->userPhone
				),
                array(
                    'name' => 'website',
                    'value' => $this->website
                ),
                array(
                    'name' => 'deal_mode',
                    'value' => 'RFQ'
                ),
				array(
					'name' => 'hubspot_owner_id',
					'value' => OWNER_ID
				),
				array(
					'name' => 'closedate',
					'value' => $date->getTimestamp()*1000
				),
                array(
                    'name' => 'lead_number',
                    'value' => $this->leadRfqNumber
                ),
				array(
					'name' => 'referring_url',
					'value' => $_SERVER['HTTP_REFERER']
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
                ),

			)
		);

		$jsonRequestData = json_encode($requestData);
		return $jsonRequestData;
	}

	/* HUBSPOT API */
	public function run()
	{
		if (empty($this->userEmail) || empty($this->userName)) {
			return false;
		}
		$endpoint = CONTACT_VERIFY_EMAIL_ENDPOINT.$this->userEmail.'/profile?hapikey=' . HUBSPOT_PRIVATEAPP_KEY;
		$result  = $this->callCurl($endpoint);
		if (!$result) {
			$error = 'API(CONTACT_VERIFY_EMAIL_ENDPOINT) -> Contact Verify Email Request has some issue!';
			$this->sendMailForError($error);
			return false;
		}

		$contactRequestData = $this->getContactRequestData();
		if (isset($result->vid) &&  intval($result->vid) > 0) {
			$this->userId = $result->vid;
            if(!empty($result->properties->try_demo_detail->value) &&  $this->isTryDemoDeal ) {
                $message  = $result->properties->try_demo_detail->value;
                $contactRequestData = json_decode($contactRequestData,true);
                $contactRequestData['properties'][]  =   array(
                  'property' => 'try_demo_detail',
                  'value' => $message."\n".$this->message
              );
              $contactRequestData = json_encode($contactRequestData);
            }
			$this->userId = $result->vid;
			$endpoint = CONTACT_ENDPOINT.$this->userEmail.'/?hapikey=' . HUBSPOT_PRIVATEAPP_KEY;
			$result  = $this->callCurl($endpoint, true, $contactRequestData);
		} else {
            if( $this->isTryDemoDeal ) {
                $contactRequestData = json_decode($contactRequestData,true);
                $contactRequestData['properties'][]  =   array(
                  'property' => 'try_demo_detail',
                  'value' => $this->message
              );
               $contactRequestData = json_encode($contactRequestData);
            }
			$endpoint = CONTACT_ENDPOINT.$this->userEmail.'/?hapikey=' . HUBSPOT_PRIVATEAPP_KEY;
			$result  = $this->callCurl($endpoint, true, $contactRequestData);
			if(isset($result) && isset($result->vid)){
				$this->userId = $result->vid;
			}else{
				$endpoint = CONTACT_VERIFY_EMAIL_ENDPOINT.$this->userEmail.'/profile?hapikey=' . HUBSPOT_PRIVATEAPP_KEY;
				$result  = $this->callCurl($endpoint);
				$this->userId = $result->vid;
			}
		}
		if (intval($this->userId) < 1) {
			$error = 'API(CONTACT_ENDPOINT) -> Deal is not created';
			$this->sendMailForError($error);
			return false;
		}
        if($this->isTryDemoDeal) {
            return true;
        }
		$dealRequestData = $this->getDealRequestData();
		$endpoint = DEAL_ENDPOINT . HUBSPOT_PRIVATEAPP_KEY;
		$result  = $this->callCurl($endpoint,true, $dealRequestData);
		if (!isset($result->dealId)) {
			$error = 'Deal is not created';
			 $this->sendMailForError($error);
			return false;
		}

		return $result->dealId;
	}

	private function sendMailForError($error)
	{
		$headers = "MIME-Version: 1.0" . "\r\n";
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
		$headers .= 'From: Yorent <info@dummyid.com>'. "\r\n";
		$headers .= 'Cc: jasbir.singh@fatbit.marketing,bhavik.gandhi@fatbit.team' . "\r\n";

		mail('mb@fatbit.com','Error on form submission',$error.' '.json_encode($_REQUEST), $headers);
	}

	private function callCurl( $endpoint = '' , $post_data = false, $post_json = array() )
	{
		$ch = @curl_init();

		if( $post_data ){
			@curl_setopt($ch, CURLOPT_POST, $post_data);
			@curl_setopt($ch, CURLOPT_POSTFIELDS, $post_json);
		}

		@curl_setopt($ch, CURLOPT_URL, $endpoint);
		@curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
		@curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$response = @curl_exec($ch);
		$status_code = @curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$curl_errors = curl_error($ch);
		@curl_close($ch);
		return json_decode($response);
	}

 }

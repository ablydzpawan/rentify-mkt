<?php
if (!empty($_POST)) {
    include_once __DIR__ . '/include/submit-contact-us.php';
    exit('');
}
?>
<!-- <form name="emailform" method="post" id="emailform"> -->
    <div class="banner-form">
        <div class="banner-form__inner">
            <input type="email" name="email" id="notify-email" placeholder="Please enter your email id">
            <button class="btn" type="submit" name="notifybtnsubmit" id="submit-btn-notify" onclick="submitNotifyForm(this);">Notify Me</button>
        </div>
    </div>
<!-- </form> -->
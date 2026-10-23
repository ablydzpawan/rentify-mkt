var allow_submit = false;
var contact_submit_confirmed = false; 

document.addEventListener('submit', function (e) {
    if (e.target.id !== 'contactForm') return;
    if (contact_submit_confirmed) {
        contact_submit_confirmed = false;
        return; 
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    submitContactForm();
}, true);

function captcha_filled() {
    allow_submit = true;
    $('.g-recaptcha').removeClass('custom_error');
    $('.js-g-recaptcha-message').text("");

};

function captcha_expired() {
    allow_submit = false;
    $('.g-recaptcha').addClass('custom_error');
    $('.js-g-recaptcha-message').text("Please validate your reCAPTCHA.");

};

function submitContactForm(e) {
    var errorFlag = false;
    var container = $('.form-contact');
    container.find('.form-control--required').each(function (index) {
        $(this).removeClass('error');
        if ($(this).next('i').length > 0 && $(this).next('i').hasClass('error')) {
            $(this).next('i').removeClass('error');
        }
        if ($(this).next('.form-error').length > 0 && $(this).next('.form-error').hasClass('show')) {
            $(this).next('.form-error').removeClass('show');
        }
    });
    container.find('.form-control--required').each(function (index) {
        if ($(this).val() == '' || $(this).val() == null) {
            $(this).addClass('error');
            $(this).next('.form-error').addClass('show');
            errorFlag = true;
        }
        if ($(this).attr('name') == 'email') {
            if (!isEmail($(this).val())) {
                $(this).addClass('error');
                errorFlag = true;
            }
        }
        if ($(this).attr('name') == 'phone') {
            var regx = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            var data = $(this).val();
            if (!data.match(regx)) {
                $(this).addClass('error');
                errorFlag = true;
            }
        }
    });
    if (errorFlag) {
        $('.error').eq(0).focus();
        return false;
    }
    if (!allow_submit) {
        $('.g-recaptcha').addClass('custom_error');
        $('.js-g-recaptcha-message').text("Please validate your reCAPTCHA.");
        $('#g_recaptcha').focus();
        return false;
    }
    var v = grecaptcha.getResponse();
    if (v.length == 0) {
        alert("You can't leave Captcha Code empty");
        return false;
    }
    $('.loader-blk').addClass('show-loader');
    $('#submit-btn').attr("disabled", true);

    var formData = {
        name: ($("#contact-first-name").val() + " " + $("#contact-surname").val()).trim(),
        email: $("#contact-email").val(),
        message: $("#contact-message").val(),
        contactform: $("#contactform").val(),
        g_recaptcha_response: v,
    };

    $.ajax({
        type: "POST",
        url: "include/submit-contact-us.php", 
        data: formData,
        dataType: "json",
        encode: true,
    }).done(function (data) {
        $('#submit-btn').removeAttr("disabled");
        grecaptcha.reset();
        allow_submit = false;
        if (data.success == true) {
            contact_submit_confirmed = true;
            document.getElementById('contactForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
            $('#contact-submit-text').text(data.message).show();
            setTimeout(function () {
                $('#contact-submit-text').hide();
            }, 3000);
        }
    });
};

function submitNotifyForm() {
    var email = $('#notify-email').val();
    if (email == '') {
        $('#email-submit-text').text('Email is required');
        $('#email-submit-text').show();
        return;
    }
    if (!isEmail(email)) {
        $('#email-submit-text').text('Email is not valid');
        $('#email-submit-text').show();
        return;
    }
    $('#email-submit-text').hide();
    var formData = {
        email: $("#notify-email").val(),
        contactform: false
    };
    $('#notify-email').text('');
    $('#notify-email').val('');
    $('#submit-btn-notify').attr("disabled", true);
    $.ajax({
        type: "POST",
        url: "include/submit-contact-us.html", 
        data: formData,
        dataType: "json",
        encode: true,
    }).done(function (data) {
        $('#email-submit-text').text(data.message);
        $('#email-submit-text').show();
        setTimeout(function() {
            $('#email-submit-text').hide();
        }, 3000);
        $('#submit-btn-notify').removeAttr("disabled");
    });
};
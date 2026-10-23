function isEmail(email) {
    var regex = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,14}\b$/i;
    return regex.test(email);
};
$(document).ready(() => {
    $('#name').keyup(function () {
        if ($(this).val() == '' || $(this).val() == null) {
            $(this).addClass('error');
            $(this).next('.form-error').addClass('show');
        } else {
            $(this).removeClass('error');
            $(this).next('.form-error').removeClass('show');
        }
    });
    $('#email').keyup(function () {
        if ($(this).val() == '' || $(this).val() == null) {
            $(this).addClass('error');
            $(this).next('.form-error').addClass('show');
        } else {
            if (!isEmail($(this).val())) {
                $(this).addClass('error');
                $(this).next('.form-error').addClass('show');
            } else {
                $(this).removeClass('error');
                $(this).next('.form-error').removeClass('show');
            }
        }
    });
    $('#phone').keyup(function () {
        if ($(this).val() == '' || $(this).val() == null) {
            $(this).addClass('error');
            $(this).next('.form-error').addClass('show');
        } else {
            var regx = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            var data = $(this).val();
            if (!data.match(regx)) {
                $(this).addClass('error');
                $(this).next('.form-error').addClass('show');
            } else {
                $(this).removeClass('error');
                $(this).next('.form-error').removeClass('show');
            }
        }
    });
    $('#message').keyup(function () {
        if ($(this).val() == '' || $(this).val() == null) {
            $(this).addClass('error');
            $(this).next('.form-error').addClass('show');
        } else {
            $(this).removeClass('error');
            $(this).next('.form-error').removeClass('show');
        }
    });
});

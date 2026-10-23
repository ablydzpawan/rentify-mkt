var ASLQn_interval = setInterval(function() {
    if(document.readyState === 'complete') {
        clearInterval(ASLQn_interval);
        callASLQn();
    }    
});

function callASLQn(){
        (function() {
            var o = _asplq || [];
            var e = encodeURIComponent;
            var q = 'r=' + e(document.referrer) + '&o=' + e(o) + '&l=' + e(document.location.href);
            var u = '/aspla.gif?';
            var i = new Image(1, 1);
            i.src = u + q;
        })();

}    


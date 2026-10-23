<script>
    var _asplq = _asplq || [];

    var ASLQ_interval = setInterval(function() {
        if(document.readyState === 'complete') {
            clearInterval(ASLQ_interval);
            callASLQ();
        }    
    });
function callASLQ(){
    _asplq.push(['acc','A-42']);
    _asplq.push(['act','track']);
    <?php

    if(isset($_SESSION['Lead_RFQ_Number']))
    {
        echo '_asplq.push(["custom","LEAD-'.$_SESSION["Lead_RFQ_Number"].'"])';
        unset($_SESSION['Lead_RFQ_Number']); // unset it here as this file is included in thank-you.php
    }
    ?>    
    (function() { var aspla = document.createElement('script');
        aspla.type = 'text/javascript';
        aspla.async = true;
        aspla.src = 'js/aspla.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(aspla, s);
    })();
}

</script>

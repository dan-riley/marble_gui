//! Deprecated function used for displaying dynamic voltage changes
$(document).ready(function () {
    function animate($that, percentage) {
        if (!$that.hasClass('fill')) return;
        $that.removeClass('fill');
        var percent_text = $that.find("p")[0];

        percentage = percentage || 0;
        var percentage_initial = parseFloat(percent_text.innerText),
            percentage_current = percentage_initial,
            interval = 1.0;
        if (percentage_current > percentage){
            interval *= -1;
        }
        else if (percentage_current < percentage){
            
        }
        else{
            return;
        }
        

        var interval_gradient = setInterval(function () {
            console.log(percentage_current);
            $that.css(
                'background',
                'linear-gradient(#a0c884 ' + (100 - percentage_current) + '%,#426e1f ' + (100 - percentage_current) + '%)'
            );
            // if (percentage_current > percentage){
                percentage_current += interval;
            // }
            // else if (percentage_current < percentage){
            //     percentage_current += interval;
            // }
            
            percent_text.innerText = percentage_current.toString();
            if (percentage_current == percentage) clearInterval(interval_gradient);
        }, 5);

        $that.addClass('fill');
    };

    $('body').on('click', '.fill',function () {
        var $that = $(this);
        var percentage = $that.attr('data-fill');
        setTimeout(function () {
            animate($that, percentage)
        }, 400);
        if ($that.attr('data-fill') == 64){
            $that.attr('data-fill','30');
        }
        else{
            $that.attr('data-fill','64');
        }
        
    });
});
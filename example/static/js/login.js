$(document).ready(function() {
    $('#form1').on('submit', (e) => {
        e.preventDefault(); // annulla evento submit
        $('input.login').css('border-color', '');
        const user = {
            'mail': $('input[name=txtUtente').val(),
            'pwd': $('input[name=txtPassword').val(),
        };
        const ajaxRequest = inviaRichiesta('/api/login', 'POST', user);
        ajaxRequest.done((data, textStatus, jqXHR) => {
            document.cookie = 'token='+data['token']+';max-age='+(60*60*24*3);
            window.location.href = 'index.html';
        });
        ajaxRequest.fail((jqXHR, textStatus, errorThrown) => {
            switch (jqXHR['status']) {
                case 401:
                    console.log(401, 'Unauthorized');
                    $('input.login').css('border-color', 'red');
                    // window.location.href = './../login.html';
                    break;
                case 403:
                    console.log(403, 'Unauthorized');
                    $('input.login').css('border-color', 'red');
                    // window.location.href = './../login.html';
                    break;
                default:
                    console.log(jqXHR['status'], textStatus, errorThrown);
                    $('input.login').css('border-color', 'red');
                    alert(jqXHR['status'], textStatus, errorThrown);
                    break;
            }
        });
        // inviaRichiesta('/api/login', 'POST', user, (data) => {
        //     /*
        //     const date = new Date();
        //     date.setDate(date.getDate() + 3);
        //     document.cookie = 'token='+data['token']+';expires='+date;
        //     */
        //     document.cookie = 'token='+data['token']+';max-age='+(60*60*24*3);
        //     window.location.href = 'index.html';
        // });
    });
});

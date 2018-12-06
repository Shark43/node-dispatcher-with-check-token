$(document).ready(function() {
    $('#btnGet').on('click', (e) => {
        const ajaxRequest = inviaRichiesta('/api/test', 'GET', {});
        ajaxRequest.done((data, textStatus, jqXHR) => {
            // const token = jqXHR.getResponseHeader('Authorization');
            // document.cookie = 'token='+token+';max-age='+(60*60*24*3);
            // console.log('DATA/TOKEN', data, token);
            console.log(data);
        });
        ajaxRequest.fail((jqXHR, textStatus, errorThrown) => {
            switch (jqXHR['status']) {
                case 401:
                    console.log(401, 'Unauthorized');
                    window.location.href = './../login.html';
                    break;
                case 403:
                    console.log(403, 'Unauthorized');
                    window.location.href = './../login.html';
                    break;
                default:
                    console.log(jqXHR['status'], textStatus, errorThrown);
                    alert(jqXHR['status'], textStatus, errorThrown);
                    break;
            }
        });
        // inviaRichiesta('/api/test', 'GET', {}, (data, text_status, request) => {
        //     const token = request.getResponseHeader('Authorization');
        //     document.cookie = 'token='+token+';max-age='+(60*60*24*3);
        //     /* if (Object.hasOwnProperty.call(data, data['token'])) {
        //         document.cookie = 'token='+data['token']+';max-age='+(60*60*24*3);
        //     }*/
        //     console.log('DATA/TOKEN', data, token);
        // });
    });
});

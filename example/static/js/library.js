function inviaRichiesta(_url, method, params) {
    return $.ajax({

        type: method,

        url: _url,

        dataType: 'json',

        contentType: 'application/json;charset= UTF-8',

        data: JSON.stringify(params),

        timeout: 3600,

        // beforeSend: function(request) {
        //     const cookie = parseCookies(document);
        //     if (cookie && 'token' in cookie) {
        //         request.setRequestHeader('Authorization', cookie['token']);
        //     }
        // }
    });
}
// function inviaRichiesta(_url, method, params, callback) {
//     $.ajax({

//         type: method,

//         url: _url,

//         dataType: 'json',

//         contentType: 'application/json;charset= UTF-8',

//         data: JSON.stringify(params),

//         timeout: 3600,

//         success: callback,

//         beforeSend: function(request) {
//             const cookie = parseCookies(document);
//             if (cookie && 'token' in cookie) {
//                 request.setRequestHeader('Authorization', cookie['token']);
//             }
//         },

//         error: function(jqXHR, test_status, str_error) {
//             switch (jqXHR['status']) {
//             case 401:
//                 console.log(401, 'Unauthorized');
//                 window.location.href = './../login.html';
//                 break;
//             case 403:
//                 console.log(403, 'Unauthorized');
//                 window.location.href = './../login.html';
//                 break;
//             default:
//                 console.log(jqXHR['status'], str_error, test_status);
//                 alert(jqXHR['status'], str_error, test_status);
//                 break;
//             }
//         },

//     });
// }

function parseCookies(doc) {
    const list = {};
    const rc = doc.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}


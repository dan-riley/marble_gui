var SERVER_ROOT = 'http://localhost:8000';
$.ajaxSetup({
    beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer subttesttoken123');
        xhr.setRequestHeader('Content-Type', 'application/json');
    },
    error: function (_, error) {
        //console.log(error);
    }
});
// local machine testing
// var SCORING_SERVER_ROOT = 'http://localhost:8000';
// var MAP_SERVER_ROOT = 'http://localhost:8001';

// safety research
// Alpha Course
var SCORING_SERVER_ROOT = 'http://10.100.1.200:8000';
var MAP_SERVER_ROOT = 'http://10.100.1.201:8000';

// experimental
// Beta Course
// var SCORING_SERVER_ROOT = 'http://10.100.2.200:8000';
// var MAP_SERVER_ROOT = 'http://10.100.2.201:8000';

$.ajaxSetup({
    beforeSend: function (xhr) {
        // xhr.setRequestHeader('Authorization', 'Bearer tokentokentoken1');
        xhr.setRequestHeader('Authorization', 'Bearer 1JDrvQA8GUtUF22a');
        xhr.setRequestHeader('Content-Type', 'application/json');
    },
    error: function (_, error) {
        console.log(error);
    }
});

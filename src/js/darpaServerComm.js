var ipaddress, token;
var SCORING_SERVER_ROOT = 'http://10.100.1.200:8000';
var ros = new ROSLIB.Ros({
    url: "ws://localhost:9090"
});

var ip_param = new ROSLIB.Param({
    ros: ros,
    name: "ipaddress"
});
ip_param.get(function(param){
    ipaddress = param;
    SCORING_SERVER_ROOT = 'http://' + ipaddress + ':8000';
    console.log(param);
});

var token_param = new ROSLIB.Param({
    ros: ros,
    name: "token"
});
token_param.get(function(param){
    token = param;
    console.log(param);
});

// local machine testing
// var SCORING_SERVER_ROOT = 'http://localhost:8000';
// var MAP_SERVER_ROOT = 'http://localhost:8001';

// safety research
// Alpha Course
// var SCORING_SERVER_ROOT = 'http://10.100.1.200:8000';
// var MAP_SERVER_ROOT = 'http://10.100.1.201:8000';

// experimental
// Beta Course
// var SCORING_SERVER_ROOT = 'http://10.100.2.200:8000';
// var MAP_SERVER_ROOT = 'http://10.100.2.201:8000';

$.ajaxSetup({
    beforeSend: function (xhr) {
        // xhr.setRequestHeader('Authorization', 'Bearer tokentokentoken1');
        // xhr.setRequestHeader('Authorization', 'Bearer 1JDrvQA8GUtUF22a');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Content-Type', 'application/json');
    },
    error: function (_, error) {
        console.log(error);
    }
});

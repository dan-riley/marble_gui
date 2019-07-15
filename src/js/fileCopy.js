
/** Function for establishing ssh connection to host and transferring file to specific directory */

$(document).ready(function () {
    $('#TransferFile').click(function () {
        var path, node_ssh, ssh, fs;
        
        fs = require('fs');
        path = require('path');
        node_ssh = require('node-ssh');
        ssh = new node_ssh();

        // var SubmitBtn = $(e.target);

        // Gets location of file on local machine
        var srcFile = document.getElementById('_file').files[0].path;
        // var srcFile = '/home/bmchale/Desktop/Install_Log/log.txt'

        // Gets directory that file will be transferred to on remote machine
        var destDir = document.getElementById('dest_dir').value;
        // var destDir = '/export/Home/bmchale/Desktop/log.txt'

        // Gets name of user on remote machine to transfer to
        var User = document.getElementById('user').value;
        // var User = 'dsop109';

        // Gets IP address of remote machine to transfer to
        var Host = document.getElementById('host').value;
        // var Host = 'bmchale';

        // Gets password for user on remote machine
        var Password = document.getElementById('password').value;
        // var Password = '';

        // Establishes ssh connection
        ssh.connect({
                host: Host,
                username: User,
                // privateKey: '/home/bmchale/.ssh/id_rsa'
                password: Password
            })
            .then(function () {
                ssh.putFile(srcFile, destDir).then(function () {
                    console.log("File has been transferred from " + srcFile + " to " + destDir);
                }, function (error) {
                    console.log("Something's wrong");
                    console.log(error);
                });
            });
        // var headers = {
        //     'Authorization' : 'Bearer flux230{showroom'
        // }
        // var X4_twist = new ROSLIB.Message({
        //     linear: {
        //       x: 0.1,
        //       y: 0.2,
        //       z: 0.3
        //     },
        //     angular: {
        //       x: -0.1,
        //       y: -0.2,
        //       z: -0.3
        //     }
        //   });
        // var http = new HTTP("http://httpbin.org/headers", X4_twist);
        // http.requestHTTP();
    });
});
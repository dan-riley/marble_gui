var prev_time = []
window.openPage = function (pageName, elmnt, color, /* k */ ) {
    // Hide all elements with class="tabcontent" by default */
    var tabcontent, tablinks;

    // Attempts at unsubscribing from all topics when the tab is switched
    // Meant to reduce load of data being sent to the gui
    try {
        var OdomSubLength = global_tabManager.get_Tab_OdomSub().length;
        for (let i = 0; i < OdomSubLength; i++) {
            global_tabManager.Tab_OdomSub[i].unsubscribe();
            // Tab_CmdVelSub[i].unsubscribe();
            global_tabManager.Tab_BatterySub[i].unsubscribe();
            global_tabManager.Tab_ControlSub[i].unsubscribe();
            console.log("Unsubscribing... ")
        }
    } catch {

    }

    if (arguments.length > 3) {
        var k = arguments[3];

        // TODO: Create way of resetting data completely on chart
        // global_tabManager.Tab_OdomChart[k].data.datasets.forEach((dataset) => {
        //     dataset.data = [];
        // });

        ///\brief Subscriber to Odometry Topic for Vehicle. Grabs information and assigns it to chart
        global_tabManager.Tab_OdomSub[k].subscribe(function (message) {
            // window.setTimeout(function(){
            global_tabManager.Tab_OdomMsg[k] = message;
            var date = new Date();
            var now_time = date.getTime() / 1000;
            var time = global_tabManager.Tab_OdomMsg[k].header.stamp.secs + global_tabManager.Tab_OdomMsg[k].header.stamp.nsecs * 0.000000001;
            ROS_clock = time;
            var min_time;
            var diff_time = 5;


            if (now_time - prev_time[k] >= 0.05 || prev_time[k] == null) {
                time >= diff_time ? min_time = time - diff_time : min_time = 0;
                // var json = {x: global_tabManager.Tab_OdomMsg[k].pose.pose.position.x, y: global_tabManager.Tab_OdomMsg[k].pose.pose.position.y};
                var vel_data = [];

                // linear x
                vel_data[0] = {
                    x: time,
                    y: global_tabManager.Tab_OdomMsg[k].twist.twist.linear.x
                };

                // addData(document.getElementById(robot_name[k]).querySelector("[id='odometry']"), "", json);
                // document.getElementById("Robot_Pages").querySelector("[id='" + robot_name[k] + "']").querySelector("[class='info']").innerHTML = "<p> linear_x: " + global_tabManager.Tab_OdomMsg[k].twist.twist.linear.x + "</p>";
                if (global_tabManager.Tab_OdomChart[k].data.datasets[0].data.length >= 1000) {
                    let length = global_tabManager.Tab_OdomChart[k].data.datasets.length;
                    for (let j = 0; j < length; j++) {
                        global_tabManager.Tab_OdomChart[k].data.datasets[j].data.shift();
                    }

                    // global_tabManager.Tab_OdomChart[k].data.datasets[1].data.shift();
                }
                // chart.data.labels.push(label);

                if (global_tabManager.global_vehicleType[k] == "Ground Vehicle") {
                    // angular z
                    vel_data[1] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.angular.z
                    };

                } else if (global_tabManager.global_vehicleType[k] == "Air Vehicle") {

                    //linear y, linear z, angular
                    vel_data[1] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.linear.y
                    };
                    vel_data[2] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.linear.z
                    };
                    vel_data[3] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.angular.x
                    };
                    vel_data[4] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.angular.y
                    };
                    vel_data[5] = {
                        x: time,
                        y: global_tabManager.Tab_OdomMsg[k].twist.twist.angular.z
                    };
                }
                let dataset_length = global_tabManager.Tab_OdomChart[k].data.datasets.length / 2;

                for (let j = 0; j < dataset_length; j++) {
                    global_tabManager.Tab_OdomChart[k].data.datasets[j].data.push(vel_data[j]);
                }

                global_tabManager.Tab_OdomChart[k].options.scales.xAxes[0].ticks.max = time;
                global_tabManager.Tab_OdomChart[k].options.scales.xAxes[0].ticks.min = min_time;

                // Y-axis linear values
                // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.max = -5;
                // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.min = 5;
                // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.display = true; // TODO: Get rid of and fix issue where ticks dissapear after chart update


                // Y-axis angular values
                global_tabManager.Tab_OdomChart[k].options.scales.yAxes[1].ticks.max = 3.14;
                global_tabManager.Tab_OdomChart[k].options.scales.yAxes[1].ticks.min = -3.14;

                global_tabManager.Tab_OdomChart[k].update();

                prev_time[k] = now_time;
            }
            // },100);
        });
        ///\brief Subscriber to Odometry Topic for Vehicle. Grabs information and assigns it to chart
        // Tab_CmdVelSub[k].subscribe(function (message) {
        //     // window.setTimeout(function(){
        //     var date = new Date();
        //     var now_time = date.getTime()/1000;
        //     var time = ROS_clock;//message.header.stamp.secs + message.header.stamp.nsecs * 0.000000001;
        //     var min_time;
        //     var diff_time = 5;
        //     if (now_time - prev_time[k] >= 0.05 || prev_time[k] == null) {
        //         time >= diff_time ? min_time = time - diff_time : min_time = 0;
        //         // var json = {x: message.pose.pose.position.x, y: message.pose.pose.position.y};
        //         var vel_data = [];
        //         vel_data[0] = {
        //             x: time,
        //             y: message.linear.x
        //         };

        //         if (global_tabManager.Tab_OdomChart[k].data.datasets[0].data.length >= 1000) {
        //             let length = global_tabManager.Tab_OdomChart[k].data.datasets.length;
        //             for (let j = 0; j < length; j++){
        //                 global_tabManager.Tab_OdomChart[k].data.datasets[j].data.shift();
        //             }

        //             // global_tabManager.Tab_OdomChart[k].data.datasets[1].data.shift();
        //         }
        //         // chart.data.labels.push(label);

        //         if (global_tabManager.global_vehicleType[k] == "Ground Vehicle"){
        //             vel_data[1] = {
        //                 x: time,
        //                 y: message.angular.z
        //             };

        //         } else if (global_tabManager.global_vehicleType[k] == "Air Vehicle"){
        //             vel_data[1] = {
        //                 x: time,
        //                 y: message.linear.y
        //             };
        //             vel_data[2] = {
        //                 x: time,
        //                 y: message.linear.z
        //             };
        //             vel_data[3] = {
        //                 x: time,
        //                 y: message.angular.x
        //             };
        //             vel_data[4] = {
        //                 x: time,
        //                 y: message.angular.y
        //             };
        //             vel_data[5] = {
        //                 x: time,
        //                 y: message.angular.z
        //             };
        //         }
        //         let dataset_length = global_tabManager.Tab_OdomChart[k].data.datasets.length/2;

        //         for (let j = 0; j < dataset_length; j++){
        //             global_tabManager.Tab_OdomChart[k].data.datasets[j+dataset_length].data.push(vel_data[j]);
        //         }

        //         global_tabManager.Tab_OdomChart[k].options.scales.xAxes[0].ticks.max = time;
        //         global_tabManager.Tab_OdomChart[k].options.scales.xAxes[0].ticks.min = min_time;

        //         // Y-axis linear values
        //         // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.max = -5;
        //         // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.min = 5;
        //         // global_tabManager.Tab_OdomChart[k].options.scales.yAxes[0].ticks.display = true; // TODO: Get rid of and fix issue where ticks dissapear after chart update

        //         // Y-axis angular values
        //         global_tabManager.Tab_OdomChart[k].options.scales.yAxes[1].ticks.max = 3.14;
        //         global_tabManager.Tab_OdomChart[k].options.scales.yAxes[1].ticks.min = -3.14;

        //         global_tabManager.Tab_OdomChart[k].update();

        //         prev_time[k] = now_time;
        //     }
        //     // },100);
        // });

        // Changes voltage value on vehicle tab
        global_tabManager.Tab_BatterySub[k].subscribe(function (message) {
            // console.log(message);
            var battery = document.getElementsByClassName("battery_voltage")[0];
            battery.innerText = "Voltage: " + message.data;
        });
        // Changes vehicle control status on vehicle tab
        global_tabManager.Tab_ControlSub[k].subscribe(function (message) {
            // console.log(message);
            var ctrStatus = document.getElementsByClassName("control_status")[0];
            
            switch(message.data){
                case 0:
                    ctrStatus.innerText = "Status: On Ground";
                    ctrStatus.style.backgroundColor = "grey";
                    ctrStatus.style.border = "grey";
                    break;
                case 1:
                    ctrStatus.innerText = "Status: Takeoff";
                    ctrStatus.style.backgroundColor = "yellow";
                    ctrStatus.style.border = "yellow";
                    break;
                case 2:
                    ctrStatus.innerText = "Status: Hover";
                    ctrStatus.style.backgroundColor = "yellow";
                    ctrStatus.style.border = "yellow";
                    break;
                case 3:
                    ctrStatus.innerText = "Status: Turn";
                    ctrStatus.style.backgroundColor = "green";
                    ctrStatus.style.border = "green";
                    break;
                case 4:
                    ctrStatus.innerText = "Status: Trajectory";
                    ctrStatus.style.backgroundColor = "green";
                    ctrStatus.style.border = "green";
                    break;
                case 5:
                    ctrStatus.innerText = "Status: Landing";
                    ctrStatus.style.backgroundColor = "yellow";
                    ctrStatus.style.border = "yellow";
                    break;
                default:
                    ctrStatus.innerText = "Status: Unknown";
                    ctrStatus.style.backgroundColor = "red";
                    ctrStatus.style.border = "red";
                    break;


            }

        });

        // Subscriber to point cloud topic for vehicle that publishes to darpa server
        global_tabManager.Tab_PointCloudSub[k].subscribe(function (msg) {
            var date = new Date();

            var now_time = date.getTime() / 1000;
            let objJsonB64 = Buffer.from(msg.data).toString("base64");
            msg.header.stamp = now_time;
            msg.data = objJsonB64;
            msg.header.frame_id = "darpa";
            data = {
                type: "PointCloud2",
                msg: msg
            };
            // console.log(data);
            if (now_time - prev_time[k] >= 0.05 || prev_time[k] == null) {
                $.post(SERVER_ROOT + "/map/update/", JSON.stringify(data))
                .done(function(json) {
                    // var artifact_page = document.getElementById("Artifact_Page");
                    // this.artifact_tracker = artifact_page.querySelector("[robot_name = '" + name + "']");
                    console.log(json);

                });
                prev_time[k] = now_time;
            }
        });

    }

    // Sets all tabs to be hidden
    tabcontent = document.getElementsByClassName("tabcontent");
    let tabcontentLength = tabcontent.length;
    for (let i = 0; i < tabcontentLength; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tablink");
    let tablinksLength = tablinks.length;
    for (let i = 0; i < tablinksLength; i++) {
        tablinks[i].style.backgroundColor = "";
    }

    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";

    // Add the specific color to the button used to open the tab content
    elmnt.style.backgroundColor = color;

    var universal_page = document.getElementById("Universal_Page");
    universal_page.style.backgroundColor = color;
}
$(document).ready(function () {

});


var prev_time = []

function subscribe_to_all_robot_topics(k) {
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

    // Update voltage value on vehicle tab
    global_tabManager.Tab_BatterySub[k].subscribe(function (message) {
        var battery = document.getElementsByClassName("battery_voltage")[0];
        battery.innerText = "Voltage: " + Math.round( message.data * 10 ) / 10;
    });

    // Update vehicle control status on vehicle tab
    global_tabManager.Tab_ControlSub[k].subscribe(function (message) {
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

    function darpa_msg_from_ros_msg(msg, type){
        var now = new Date();
        var now_time = now.getTime() / 1000;
        let objJsonB64 = Buffer.from(msg.data).toString("base64");
        msg.header.stamp = now_time;
        msg.data = objJsonB64;
        msg.header.frame_id = "darpa";
        data = {
            type: type,
            msg: msg
        };
        return JSON.stringify(data)
    }

    var last_cloud_report_success = "never";

    // Subscriber to point cloud topic for vehicle that publishes to darpa server
    global_tabManager.Tab_PointCloudSub[k].subscribe(function (msg) {   
        var now = new Date();
        var now_time = now.getTime() / 1000;     
        if (now_time - prev_time[k] >= 0.05 || prev_time[k] == null) {
            $.post(SERVER_ROOT + "/map/update/", darpa_msg_from_ros_msg(msg, "PointCloud2"))
            .done(function(json, statusText, xhr) {
                if(xhr.status == 200){
                    last_cloud_report_success = new Date();
                    $('#mapping_cloud_report_last_sent_raw').text(Math.round(now/100)/10);
                }
                else{
                    console.log("error in sending /map/update PointCloud to DARPA server");
                    console.log(statusText);
                    console.log(xhr);
                }

            });
            prev_time[k] = now_time;
        }
    });

    setInterval(function(){ 
        if(last_cloud_report_success != "never"){
            var now = new Date();
            $('#mapping_cloud_report_last_sent_secs_ago').text(
                Math.round(
                    (now - last_cloud_report_success)/1000
                ) + ' seconds ago');
        }
    }, 1000);

    var last_grid_report_success = "never";

    // Subscriber to occupancy grid topic for vehicle that publishes to darpa server
    global_tabManager.Tab_OccupancyGridSub[k].subscribe(function (msg) {
        var now = new Date();
        var now_time = now.getTime() / 1000;
        if (now_time - prev_time[k] >= 0.05 || prev_time[k] == null) {
            $.post(SERVER_ROOT + "/map/update/", darpa_msg_from_ros_msg(msg, "OccupancyGrid"))
            .done(function(json, statusText, xhr) {
                if(xhr.status == 200){
                    last_grid_report_success = new Date();
                    $('#mapping_grid_report_last_sent_raw').text(Math.round(now/100)/10);
                }
                else{
                    console.log("error in sending /map/update occupancyGrid to DARPA server");
                    console.log(statusText);
                    console.log(xhr);
                }

            });
            prev_time[k] = now_time;
        }
    });

    setInterval(function(){ 
        if(last_grid_report_success != "never"){
            var now = new Date();
            $('#mapping_grid_report_last_sent_secs_ago').text(
                Math.round(
                    (now - last_grid_report_success)/1000
                ) + ' seconds ago');
        }
    }, 1000);

}

window.openPage = function (pageName, k=-1 ){
    // Hide all elements with class="tabcontent" by default */
    var tabcontent;

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
    
    if (k >= 0) {

        // TODO: Create way of resetting data completely on chart
        // global_tabManager.Tab_OdomChart[k].data.datasets.forEach((dataset) => {
        //     dataset.data = [];
        // });

        subscribe_to_all_robot_topics(k);
    }

    // Sets all tabs to be hidden
    tabcontent = document.getElementsByClassName("tabcontent");
    let tabcontentLength = tabcontent.length;
    for (let i = 0; i < tabcontentLength; i++) {
        tabcontent[i].style.display = "none";
    }
    
    // show what page we are on in navigation
    $('.active').removeClass('active');
    $('#' + pageName + '_nav_link').addClass('active');


    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";

}
$(document).ready(function () {

});


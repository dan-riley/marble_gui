var STATUS = {
    0: "On Ground",
    1: "Takeoff",
    2: "Hover",
    3: "Turn",
    4: "Trajectory",
    5: "Landing"
}

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


        if (now_time - global_tabManager.prev_time[k] >= 0.05 || global_tabManager.prev_time[k] == null) {
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

            global_tabManager.prev_time[k] = now_time;
        }
        // },100);
    });

    // Update voltage value on vehicle tab
    global_tabManager.Tab_BatterySub[k].subscribe(function (message) {
        $('#' + global_tabManager.robot_name[k] + '_voltage').text(Math.round( message.data * 10 ) / 10);
    });

    // Update vehicle control status on vehicle tab
    global_tabManager.Tab_ControlSub[k].subscribe(function (message) {
        $('#' + global_tabManager.robot_name[k] + '_status').text(STATUS[message.data]);
    });
}

window.openPage = function (pageName, k=-1 ){
    // Hide all elements with class="tabcontent" by default */
    var tabcontent;

    // Attempts at unsubscribing from all topics when the tab is switched
    // Meant to reduce load of data being sent to the gui
    // try {
    //     var OdomSubLength = global_tabManager.get_Tab_OdomSub().length;
    //     for (let i = 0; i < OdomSubLength; i++) {
    //         global_tabManager.Tab_OdomSub[i].unsubscribe();
    //         // Tab_CmdVelSub[i].unsubscribe();
    //         global_tabManager.Tab_BatterySub[i].unsubscribe();
    //         global_tabManager.Tab_ControlSub[i].unsubscribe();
    //         console.log("Unsubscribing... ")
    //     }
    // } catch {

    // }
    
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

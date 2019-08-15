var ANALYZE_TOPICS_LIST_INTERVAL = 2000;

function send_signal_to(robot_name, signal, value) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: "/" + robot_name + "/" + signal,
        messageType: "std_msgs/Bool"
    });
    var msg = new ROSLIB.Message({
        data: value
    });
    Topic.publish(msg);
}

function send_string_to(robot_name, signal, text) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: "/" + robot_name + "/" + signal,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: text
    });
    Topic.publish(msg);
}

class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_TaskSub = [];
        this.Tab_OdomSub = [];
        this.Tab_OdomChart = [];
        this.Tab_BatterySub = [];
        this.Tab_ControlSub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_ArtifactImgSub = [];
        this.Tab_VehicleStatusSub = [];
        this.Tab_PointCloudSub = [];
        this.Tab_PoseArraySub = [];
        this.Tab_OccupancyGridSub = [];
        this.Tab_CmdVelSub = [];
        this.Tab_OdomMsg = [];
        // Tab_BatteryMsg;
        // Tab_CmdVelMsg;

        this.global_vehicleType = [];
	this.tasks = [];
        this.global_vehicleArtifactsList = [];
        this.prev_time = [];
        this.fusedArtifacts = new Artifact('Base', 0);

        this.rows = 0;
        this.robot_name = [];
        this.time_since_last_msg = [];
        this.tabs_robot_name = [];
        this.x = 0;
        this.tabs = document.getElementById("Robot_Tabs");
        this.pages = document.getElementById("Robot_Pages");
        this.artifact_tracker = document.getElementById("Artifact_Page");

        this.publishersClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/publishers',
            serviceType: 'rosapi/Publishers'
        });

        this.fullColors = [];
        // var colors = ['rgba(255,0,0,1.0)', 'rgba(0,255,0,1.0)', 'rgba(0,0,255, 1.0)', 'rgba(128,128,0, 1.0)', 'rgba(128,0,128, 1.0)', 'rgba(0,128,128, 1.0)']
        this.colors = ['rgba(128,0,0,', 'rgba(0,128,0,', 'rgba(0,0,128,', 'rgba(128,128,0,', 'rgba(128,0,128,', 'rgba(0,128,128,', 'rgba(255,0,0,', 'rgba(0,255,0,', 'rgba(0,0,255,', 'rgba(0,255,255,', 'rgba(255,0,255,', 'rgba(2555,255,0,', 'rgba(0,0,0,']
        this.colorsLength = this.colors.length;
        for (let k = 0; k < this.colorsLength; k++) {
            this.fullColors[k] = this.colors[k] + "1.0)";
        }

        this.i = 0;

        window.setInterval(this.get_TopicsFromROS, ANALYZE_TOPICS_LIST_INTERVAL);
    }
    remove_tab(name) {
        var content = document.getElementById("Robot_Pages").querySelector("[id='" + name + "']");
        content.parentNode.removeChild(content);
        content = null;
        var tab = document.getElementById("Robot_Tabs").querySelector("[id='" + name + "']");
        tab.parentNode.removeChild(tab);
        tab = null;
    }

    //\brief Function for searching topics list for robot namespaces and adding those robots to the current robot name
    // list if they are not there already
    search_robots() {
        var _this = global_tabManager;
        var patt = /\d\d/;
        for (let i = 0; i < topicsList.length; i++) {
            let name = topicsList[i].split('/')[1];
            var handled_names = [];

            if (handled_names.indexOf(name) == -1) {
                if (patt.test(name) && (name != 'S01')) {
                    if (_this.robot_name.indexOf(name) == -1) {
                        _this.robot_name.push(name);
                        _this.tabs_robot_name.push(name);
                        _this.x++;
                    }

                }
                handled_names.push(name);
            }
        }

        let curr_robot_length = _this.robot_name.length; // Length of entire robots seen over all time after function

        // report robot as "disconnect" if it was previously discovered but we are no longer
        // receiving messages from it.
        let now = new Date();
        for (let i = 0; i < curr_robot_length; i++) {
            var status_dom = $('#connection_status_' + _this.robot_name[i]);
            if (now - _this.time_since_last_msg[i] < ANALYZE_TOPICS_LIST_INTERVAL + 1000) {
                status_dom.html('<font color="green">Connected</font>');
            }
            else {
                status_dom.html('<font color="red">Disconnected</font>');
            }

	    var task_dom = $('#task_status_' + _this.robot_name[i]);
	    var task = global_tabManager.tasks[i];
	    if (task == "Home") {
	        task_dom.html('<font color="yellow">Going Home</font>');
	    } else if (task == "Report") {
	        task_dom.html('<font color="yellow">Reporting</font>');
	    } else if (task == "Explore") {
	        task_dom.html('<font color="green">Exploring</font>');
	    } else {
		if (task == undefined) task = '';
	        task_dom.html('<font color="red">' + task + '</font>');
	    }

        }

        for (_this.i; _this.i < curr_robot_length; _this.i++) {
            _this.add_tab();
        }
    }

    // Function for adding additional vehicle tabs to gui, it will add whenever a vehicle with ROS topic ending in odometry is found
    add_tab() {
        let n = this.i;
        console.log("Tab: " + this.robot_name[n]);

        let input_str;

        // TODO: Remove and change all references to subT sim specific topics, change them to follow subT colorado format
        /* Establishes topics for specific robot and clarifies how many datasets should be used for chart */
        let titles_data = [];
        let robot_name_front1 = this.robot_name[n].charAt(0);
        let robot_name_front2 = this.robot_name[n].substring(0, 2);
        if (true) {//robot_name_front2 == "X1" || robot_name_front2 == "X2" || robot_name_front1 == "G" || this.robot_name[n] == "HUSKY_SIM") {
            this.global_vehicleType[n] = "Ground Vehicle";
            titles_data = ['linear_x', 'angular_z', 'cmd_linear_x', 'cmd_angular_z'];
        } else if (robot_name_front2 == "X3" || robot_name_front2 == "X4" || robot_name_front1 == "A" || this.robot_name[n] == "DJI_SIM") {
            this.global_vehicleType[n] = "Air Vehicle";
            // titles_data contains the name of each dataset that is represented on the robots chart
            titles_data = ['linear_x', 'linear_y', 'linear_z', 'angular_x', 'angular_y', 'angular_z', 'cmd_linear_x', 'cmd_linear_y', 'cmd_linear_z', 'cmd_angular_x', 'cmd_angular_y', 'cmd_angular_z'];
        } else {
            console.log(this.robot_name[n] + " is not recognized by this application...")
            return;
        }

        let TaskTopic = {
            topic: "/" + this.robot_name[n] + "/task_update",
            messageType: "std_msgs/String"
        };
        let OdomTopic = {
            topic: "/" + this.robot_name[n] + "/odometry",
            messageType: "nav_msgs/Odometry"
        };
        let CmdVelTopic = "/" + this.robot_name[n] + "/cmd_vel";
        let CmdPosTopic = {
            topic: "/" + this.robot_name[n] + "/current_goal",
            messageType: "geometry_msgs/PoseStamped"
        };
        let BatteryTopic = {
            topic: "/" + this.robot_name[n] + "/battery_status",
            messageType: "std_msgs/Float32"
        };
        let ControlTopic = {
            topic: "/" + this.robot_name[n] + "/control_status",
            messageType: "std_msgs/UInt8"
        };
        let ArtifactTopic = {
            // topic: "/artifact_record",  // For use when artifact detection is on ground station
            // topic: "/" + this.robot_name[n] + "/artifact_record",
            topic: "/" + this.robot_name[n] + "/artifact_array/relay",
            messageType: "marble_artifact_detection_msgs/ArtifactArray"
        };
        let ArtifactImgTopic = {
            // topic: "/artifact_record",  // For use to save images on ground station
            // topic: "/" + this.robot_name[n] + "/located_artifact_img",
            topic: "/" + this.robot_name[n] + "/located_artifact_img/relay",
            messageType: "marble_artifact_detection_msgs/ArtifactImg"
        };
        let VehicleStatusTopic = {
            topic: "/" + this.robot_name[n] + "/status", //TODO: change to vehicle_status
            messageType: "marble_common_msgs/VehicleStatus"
        }
        let PointCloudTopic = {
            topic: "/" + this.robot_name[n] + "/pc2_out",
            // topic: "/octomap_point_cloud_occupied",
            messageType: "sensor_msgs/PointCloud2"
        };

        this.Tab_TaskSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: TaskTopic.topic,
            messageType: TaskTopic.messageType
        });
        this.Tab_OdomSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: OdomTopic.topic,
            messageType: OdomTopic.messageType
        });
        this.Tab_BatterySub[n] = new ROSLIB.Topic({
            ros: ros,
            name: BatteryTopic.topic,
            messageType: BatteryTopic.messageType
        });
        this.Tab_ControlSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ControlTopic.topic,
            messageType: ControlTopic.messageType
        });
        this.Tab_ArtifactSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ArtifactTopic.topic,
            messageType: ArtifactTopic.messageType
        });
        this.Tab_ArtifactImgSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ArtifactImgTopic.topic,
            messageType: ArtifactImgTopic.messageType
        });
        this.Tab_VehicleStatusSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: VehicleStatusTopic.topic,
            messageType: VehicleStatusTopic.messageType
        });
        this.Tab_PointCloudSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: PointCloudTopic.topic,
            messageType: PointCloudTopic.messageType
        });
        this.Tab_PoseArraySub[n] = new ROSLIB.Topic({
            ros: ros,
            name: "/" + this.robot_name[n] + "/explored_edges",
            messageType: "geometry_msgs/PoseArray"
        });
        this.Tab_OccupancyGridSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: "/" + this.robot_name[n] + "/map",
            messageType: "nav_msgs/OccupancyGrid"
        });
        var date = new Date();
        var now_time = date.getTime() / 1000;
        global_tabManager.prev_time[n] = now_time;

        function darpa_msg_from_ros_msg(msg, type) {
            var now = new Date();
            var now_time = now.getTime() / 1000;
            let objJsonB64 = Buffer.from(msg.data).toString("base64");
            msg.header.stamp = now_time;
            msg.data = objJsonB64;
            msg.header.frame_id = "darpa";
            var data = {
                type: type,
                msg: msg
            };
            return JSON.stringify(data)
        }

        var last_cloud_report_success = "never";

	global_tabManager.Tab_TaskSub[n].subscribe(function (msg) {
            // Save our current time to update connection status
            // The service call isn't reliable!
            global_tabManager.time_since_last_msg[n] = new Date();
	    global_tabManager.tasks[n] = msg.data
        });

        // Subscriber to point cloud topic for vehicle that publishes to darpa server
        global_tabManager.Tab_PointCloudSub[n].subscribe(function (msg) {
            var now = new Date();
            var now_time = now.getTime() / 1000;
            if (now_time - global_tabManager.prev_time[n] >= 0.05 || global_tabManager.prev_time[n] == null) {
                if(connected_to_darpa){
                    $.post(SERVER_ROOT + "/map/update/", darpa_msg_from_ros_msg(msg, "PointCloud2"))
                        .done(function (json, statusText, xhr) {
                            if (xhr.status == 200) {
                                last_cloud_report_success = new Date();
                                $('#mapping_cloud_report_last_sent_raw').text(Math.round(now / 100) / 10);
                            }
                            else {
                                console.log("error in sending /map/update PointCloud to DARPA server");
                                console.log(statusText);
                                console.log(xhr);
                            }

                        });
                    global_tabManager.prev_time[n] = now_time;
                }
            }
        });

        setInterval(function () {
            if (last_cloud_report_success != "never") {
                var now = new Date();
                $('#mapping_cloud_report_last_sent_secs_ago').text(
                    Math.round(
                        (now - last_cloud_report_success) / 1000
                    ) + ' seconds ago');
            }
        }, 1000);

        var last_grid_report_success = "never";

        // Subscriber to occupancy grid topic for vehicle that publishes to darpa server
        global_tabManager.Tab_OccupancyGridSub[n].subscribe(function (msg) {
            var now = new Date();
            var now_time = now.getTime() / 1000;
            if (now_time - global_tabManager.prev_time[n] >= 0.05 || global_tabManager.prev_time[n] == null) {
                if(connected_to_darpa){
                    $.post(SERVER_ROOT + "/map/update/", darpa_msg_from_ros_msg(msg, "OccupancyGrid"))
                        .done(function (json, statusText, xhr) {
                            if (xhr.status == 200) {
                                last_grid_report_success = new Date();
                                $('#mapping_grid_report_last_sent_raw').text(Math.round(now / 100) / 10);
                            }
                            else {
                                console.log("error in sending /map/update occupancyGrid to DARPA server");
                                console.log(statusText);
                                console.log(xhr);
                            }

                        });
                    global_tabManager.prev_time[n] = now_time;
                }
            }
        });

        setInterval(function () {
            if (last_grid_report_success != "never") {
                var now = new Date();
                $('#mapping_grid_report_last_sent_secs_ago').text(
                    Math.round(
                        (now - last_grid_report_success) / 1000
                    ) + ' seconds ago');
            }
        }, 1000);

        var last_telem_report_success = "never";

        // Subscriber to pose array topic for vehicle that publishes to darpa server
        global_tabManager.Tab_PoseArraySub[n].subscribe(function (msg) {
            var now = new Date();
            var now_time = now.getTime() / 1000;
            if (now_time - global_tabManager.prev_time[n] >= 0.05 || global_tabManager.prev_time[n] == null) {
                if(connected_to_darpa){
                    $.post(SERVER_ROOT + "/state/update/", JSON.stringify(msg))
                        .done(function (json, statusText, xhr) {
                            if (xhr.status == 200) {
                                last_telem_report_success = new Date();
                                $('#telemetry_report_last_sent_raw').text(Math.round(now / 100) / 10);
                            }
                            else {
                                console.log("error in sending /state/update PoseArray to DARPA server");
                                console.log(statusText);
                                console.log(xhr);
                            }

                        })
                        .fail(function (a, b, c) {
                            //console.log("error reporting pose array: " + c);
                        });
                    global_tabManager.prev_time[n] = now_time;
                }
            }
        });

        setInterval(function () {
            if (last_telem_report_success != "never") {
                var now = new Date();
                $('#telemetry_report_last_sent_secs_ago').text(
                    Math.round(
                        (now - last_telem_report_success) / 1000
                    ) + ' seconds ago');
            }
        }, 1000);

        // Creating tab at top of screen for selecting robot view
        $('#Robot_Tabs').prepend(`
            <li class="nav-item" id="` + this.robot_name[n] + `_nav_link" robot_name="` + this.robot_name[n] + `">
                <a  class="nav-link" onclick="window.openPage('` + this.robot_name[n] + `', ` + n + `)" >
                    ` + this.robot_name[n] + `
                    <br><span id="connection_status_` + this.robot_name[n] + `"></span>
                    <br><span id="task_status_` + this.robot_name[n] + `"></span>
                </a>
            </li>`);

        // Creating information stored within the tab
        var tab_content = document.createElement("DIV");
        tab_content.setAttribute("id", this.robot_name[n]);
        tab_content.setAttribute("class", "tabcontent");

        // Generate topics for each robot and subscribe
        var sub = document.createElement("DIV");
        sub.setAttribute("class", "info");

        // Set unique ID so octomap_viewer can reference it for 3D visualization
        var viewer_row = document.createElement("DIV");
        viewer_row.setAttribute("class", "card")
        var viewer = document.createElement("DIV");
        viewer.setAttribute("class", "octomap_viewer");
        viewer.innerHTML = `
            <dom-bind id="t">
                <template is="dom-bind">
                    <ros-websocket auto id="websocket"ros="{{ros}}"url="ws://localhost:9090"></ros-websocket>
                    <ros-rviz id="` + this.robot_name[n] + `_rviz" ros="{{ros}}"websocket-url="ws://localhost:9090"></ros-rviz>
                </template>
            </dom-bind>`.trim();

        viewer_row.appendChild(viewer);

        /* Chart needs a dedicated DIV wrapper for ONLY the chart */
        var chart_wrap = document.createElement("DIV");
        this.applyCSS(chart_wrap, {
            position: "relative",
            height: "50vh",
            width: "100%",
            margin: "auto"
        });

        /* Charts for displaying current speed of vehicles */
        var chart = document.createElement("canvas");
        chart.setAttribute("id", "odometry");
        chart.setAttribute("class", "");
        chart.width = 400;
        chart.height = 400;

        // Create chart frame
        var ctx = chart.getContext("2d");
        this.Tab_OdomChart[n] = new Chart(ctx, {
            responsive: true,
            type: 'scatter',
            title: {
                display: true,
                text: 'Vehicle Odometry vs Commanded Inputs'
            },
            data: {
                datasets: []
            },
            options: {
                maintainAspectRatio: false,
                // events: [],
                scales: {
                    yAxes: [{
                        id: 'linear',
                        position: 'left',
                        ticks: {
                            // beginAtZero: true,
                            max: 5,
                            min: -5,
                            display: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Linear Velocity (m/s)'
                        },
                        display: true
                    }, {
                        id: 'angular',
                        position: 'right',
                        ticks: {
                            // beginAtZero: true,
                            max: 3.14,
                            min: -3.14,
                            display: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Angular Rate (Rad/s)'
                        },
                        display: true
                    }],
                    xAxes: [{
                        ticks: {
                            // autoskip: false,
                            beginAtZero: true,
                            min: 0,
                            maxRotation: 0,
                            minRotation: 0
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Time (seconds)'
                        }
                        // display: true
                    }]
                },
                chartArea: {
                    backgroundColor: 'rgba(255, 255, 255, 1.0)'
                }
            }
        });

        /* Create datasets for ros topics we are subscibed to and then push those datasets to the chart */
        var titles_dataLength = titles_data.length
        for (let k = 0; k < titles_dataLength; k++) {
            let Color = this.colors[(n + k + 1) % this.colorsLength];
            let _hidden = false;
            let yaxis_id = "linear";
            if (Color + "1.0)" == this.fullColors[n]) Color = this.colors[(n + k + 2) % this.colorsLength];
            if (~titles_data[k].indexOf("angular")) {
                _hidden = true;
                yaxis_id = "angular";
            }
            let newData = {
                label: titles_data[k],
                backgroundColor: Color + '1.0)',
                data: [],
                yAxisID: yaxis_id,

                pointBackgroundColor: Color + '0.5)',
                pointBorderColor: Color + '0.5)',
                pointRadius: 1,
                pointHoverRadius: 1,
                borderColor: Color + '0.5)',

                borderWidth: 4,
                fill: false,
                tension: 0,
                showLine: true,

                hidden: _hidden
            };
            this.Tab_OdomChart[n].data.datasets.push(newData);
        }
        this.Tab_OdomChart[n].update();

        var top_card = document.createElement("DIV");
        top_card.setAttribute("class", "card");

        var top_card_header = document.createElement("DIV");
        top_card_header.setAttribute("class", "card-header");
        top_card_header.innerText = global_tabManager.robot_name[n];

        var top_card_body = document.createElement("DIV");
        top_card_body.setAttribute("class", "card-body");

        top_card.appendChild(top_card_header);
        top_card.appendChild(top_card_body);

        var battery_voltage = document.createElement("P");
        battery_voltage.innerHTML = `Voltage: <span id="` + global_tabManager.robot_name[n] + `_voltage"></span>`;
        var control_status = document.createElement("P");
        control_status.innerHTML = `Status: <span id="` + global_tabManager.robot_name[n] + `_status"></span>`;
        top_card_body.appendChild(control_status);
        top_card_body.appendChild(battery_voltage);

        var radio_btn = document.createElement("BUTTON");
        radio_btn.setAttribute("type", "button");
        radio_btn.setAttribute("class", "btn btn-success btn-space");
        radio_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "radio_enable_cmd", true) };
        radio_btn.innerText = "Radio Reset";

        var estop_btn = document.createElement("BUTTON");
        estop_btn.setAttribute("type", "button");
        estop_btn.setAttribute("class", "btn btn-danger btn-space");
        estop_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "estop_cmd", true) };
        estop_btn.innerText = "Emergency Stop";

	var estop_off_btn = document.createElement("BUTTON");
        estop_off_btn.setAttribute("type", "button");
        estop_off_btn.setAttribute("class", "btn btn-success btn-space");
        estop_off_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "estop_cmd", false) };
        estop_off_btn.innerText = "Emergency Stop Disabled";

	var stop_btn = document.createElement("BUTTON");
        stop_btn.setAttribute("type", "button");
        stop_btn.setAttribute("class", "btn btn-danger btn-space");
        stop_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "estop", true) };
        stop_btn.innerText = "Stop Vehicle";

        var startup_btn = document.createElement("BUTTON");
        startup_btn.setAttribute("type", "button");
        startup_btn.setAttribute("class", "btn btn-success btn-space");
        startup_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "estop", false) };
        startup_btn.innerText = "Start Mission";

	// estop_status  sw_state (1=stop -- the estop!, 0=go), radio_state (0=go/enabled)
        // var restart_btn = document.createElement("BUTTON");
        // restart_btn.setAttribute("type", "button");
        // restart_btn.setAttribute("class", "btn btn-primary btn-space");
        // restart_btn.onclick = function () { send_signal_to(global_tabManager.robot_name[n], "restart", "true") };
        // restart_btn.innerText = "Restart Vehicle";

        var home_btn = document.createElement("BUTTON");
        home_btn.setAttribute("type", "button");
        home_btn.setAttribute("class", "btn btn-danger btn-space");
        home_btn.onclick = function () { send_string_to(global_tabManager.robot_name[n], "task", "Home") };
        home_btn.innerText = "Return Home";

        var explore_btn = document.createElement("BUTTON");
        explore_btn.setAttribute("type", "button");
        explore_btn.setAttribute("class", "btn btn-success btn-space");
        explore_btn.onclick = function () { send_string_to(global_tabManager.robot_name[n], "task", "Explore") };
        explore_btn.innerText = "Explore";

        top_card_body.appendChild(radio_btn);
        top_card_body.appendChild(estop_btn);
        top_card_body.appendChild(estop_off_btn);
        top_card_body.appendChild(stop_btn);
        top_card_body.appendChild(startup_btn);
        // top_card_body.appendChild(restart_btn);
        top_card_body.appendChild(home_btn);
        top_card_body.appendChild(explore_btn);

        chart_wrap.appendChild(chart);

        tab_content.appendChild(top_card);
        tab_content.appendChild(chart_wrap);
        tab_content.appendChild(viewer_row);

        $('#Robot_Pages').prepend(tab_content);

        create_viewer(this.robot_name[n]);

        var robot_artifact_container = document.createElement("DIV");
        robot_artifact_container.setAttribute("class", "col-sm-12");
        robot_artifact_container.setAttribute("robot_name", this.robot_name[n]);
        var robot_artifact_titles = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "title");
        // robot_artifact_titles.innerHTML = '<span id="robot_name" class="badge badge-secondary col-sm-1" style="text-align: center">' + this.robot_name[n] + '</span>' +
        robot_artifact_titles.innerHTML = '<span class="col-sm-1"> </span>' +
            '<span id="type" class="badge badge-secondary col-sm-2" style="text-align: center"><b>Type</b></span>' +
            '<span id="confidence" class="badge badge-secondary col-sm-1" style="text-align: center"><b>Confidence</b></span>' +
            '<span id="position" class="badge badge-secondary col-sm-3" style="text-align: center"><b>Position</b></span>' +
            '<span class="badge badge-secondary col-sm-2" style="text-align: center"><b>DARPA</b></span>' +
            '<span class="badge badge-secondary col-sm-2" style="text-align: center"><b>Image</b></span>';


        var robot_artifact_header = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "header");
        robot_artifact_header.innerHTML = '<span class="badge badge-secondary col-sm-12"><b>' + this.robot_name[n] + '</b></span>';

        robot_artifact_container.appendChild(robot_artifact_header);
        robot_artifact_container.appendChild(robot_artifact_titles);
        // Artifact rows get created by the artifact handler now

        // Creates a DIV element that is placed either on the left or right side of the screen depending on how many robots there currently are
        if (n % 2 == 0) {
            this.rows++;
            let row_artifact_containers = document.createElement("DIV");
            row_artifact_containers.setAttribute("class", "row");
            row_artifact_containers.setAttribute("row_id", this.rows);
            row_artifact_containers.appendChild(robot_artifact_container);
            this.artifact_tracker.appendChild(row_artifact_containers);
        } else {
            let row_artifact_containers = this.artifact_tracker.querySelector("[row_id = '" + this.rows + "']");
            row_artifact_containers.appendChild(robot_artifact_container);
        }
        // this.artifact_tracker.appendChild(robot_artifact_container);
        // Sets up all objects for vehicle artifact manager
        this.global_vehicleArtifactsList[n] = new Artifact(this.robot_name[n], n);

        this.Tab_ArtifactSub[n].subscribe(function (msg) {
            // if (JSON.stringify(msg.artifacts) != JSON.stringify(global_tabManager.global_vehicleArtifactsList[n].get_artifactsList())) {
            global_tabManager.global_vehicleArtifactsList[n].set_artifacts(msg.artifacts);
            // }

        });
        this.Tab_ArtifactImgSub[n].subscribe(function (msg) {
            // if (JSON.stringify(msg.artifacts) != JSON.stringify(global_tabManager.global_vehicleArtifactsList[n].get_artifactsList())) {
            global_tabManager.global_vehicleArtifactsList[n].save_image(msg);
            // }

        });

        // Subscriber that handles distributing all vehicle status information to their relevant topics
        this.Tab_VehicleStatusSub[n].subscribe(function (msg) {
            global_tabManager.Tab_ArtifactSub[n].publish(msg.artifact_array);
            global_tabManager.Tab_BatterySub[n].publish(msg.battery_voltage);
            global_tabManager.Tab_ControlSub[n].publish(msg.control_status);
        });
    }
    get_vehicleArtifactsList(n) {
        return this.global_vehicleArtifactsList[n];
    }
    get_Tab_OdomSub() {
        return this.Tab_OdomSub;
    }
    /**
     * Function to convert JSON to CSS
     *
     * @param {*} el
     * @param {*} styles
     * @returns
     */
    applyCSS(el, styles) {
        for (var prop in styles) {
            if (!styles.hasOwnProperty || styles.hasOwnProperty(prop)) {
                el.style[prop] = styles[prop];
            }
        }
        return el;
    }

    get_TopicsFromROS() {
        update_topics_list(global_tabManager.search_robots);
    }
}
/* Plugin designed to fill the chart with white */
Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
});

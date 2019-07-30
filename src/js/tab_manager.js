class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_OdomSub = [];
        this.Tab_OdomChart = [];
        this.Tab_BatterySub = [];
        this.Tab_ControlSub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_ArtifactImgSub = [];
        this.Tab_VehicleStatusSub = [];
        this.Tab_PointCloudSub = [];
        this.Tab_CmdVelSub = [];
        this.Tab_OdomMsg = [];
        // Tab_BatteryMsg;
        // Tab_CmdVelMsg;

        this.global_vehicleType = [];
        this.global_vehicleArtifactsList = [];

        this.rows = 0;
        this.robot_name = [];
        this.tabs_robot_name = [];
        this.x = 0;
        this.tabs = document.getElementById("Robot_Tabs");
        this.pages = document.getElementById("Robot_Pages");
        this.artifact_tracker = document.getElementById("Artifact_Page");

        this.fullColors = [];
        // var colors = ['rgba(255,0,0,1.0)', 'rgba(0,255,0,1.0)', 'rgba(0,0,255, 1.0)', 'rgba(128,128,0, 1.0)', 'rgba(128,0,128, 1.0)', 'rgba(0,128,128, 1.0)']
        this.colors = ['rgba(128,0,0,', 'rgba(0,128,0,', 'rgba(0,0,128,', 'rgba(128,128,0,', 'rgba(128,0,128,', 'rgba(0,128,128,', 'rgba(255,0,0,', 'rgba(0,255,0,', 'rgba(0,0,255,', 'rgba(0,255,255,', 'rgba(255,0,255,', 'rgba(2555,255,0,', 'rgba(0,0,0,']
        this.colorsLength = this.colors.length;
        for (let k = 0; k < this.colorsLength; k++) {
            this.fullColors[k] = this.colors[k] + "1.0)";
        }
        let topicsLength = topicsList.length;
        console.log("Starting Tab Creation...");
        for (let i = 0; i < topicsLength; i++) {
            // assume it is namespacing if there are 2 consecutive numbers ex. /G01/odometry has "01"
            var patt = new RegExp("/\d{2}/");
            let name = topicsList[i].split('/')[1];
            if (patt.test(name)) {
                if (this.robot_name.indexOf(name) == -1) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
            } 
        }
        this.prebuilt_tabs_N = 3; //Number of tabs that gui launches with before adding vehicles
        this.w = 100 / (this.x + this.prebuilt_tabs_N);
        this.i = 0;
        for (this.i; this.i < this.x; this.i++) {
            this.add_tab();
        }
        var custom = this.tabs.querySelector("[id='defaultOpen']");
        custom.style.width = this.w + "%";
        var file = this.tabs.querySelector("[id='FileTab']");
        file.style.width = this.w + "%";
        var file = this.tabs.querySelector("[id='Artifact_InfoTab']");
        file.style.width = this.w + "%";

        window.setInterval(this.get_TopicsFromROS, 2000);
    }
    remove_tab(name) {
        var content = document.getElementById("Robot_Pages").querySelector("[id='" + name + "']");
        content.parentNode.removeChild(content);
        content = null;
        var tab = document.getElementById("Robot_Tabs").querySelector("[id='" + name + "']");
        tab.parentNode.removeChild(tab);
        tab = null;
    }
    hide_tab(name) {
        // let n = this.i;
        this.tabs.querySelector("[robot_name = " + name + "]").style.display = 'none';
        // this.w--;

        // Remove robot name from robot names tab list
        var index = this.tabs_robot_name.indexOf(name);
        this.tabs_robot_name.splice(index,1);
        console.log("Hiding Tab: " + name);
    }
    unhide_tab(name) {
        this.tabs.querySelector("[robot_name = " + name + "]").style.display = 'block';
        
        this.tabs_robot_name.push(name);
        console.log("Unhiding Tab: " + name);
    }

    //\brief Function for searching topics list for robot namespaces and adding those robots to the current robot name
    // list if they are not there already
    search_robots() {
        let topicsLength = topicsList.length;
        let prev_robot_length = this.robot_name.length; // Length of entire robots seen over all time before function
        let temp_robot_names = [];
        let temp_n = 0;
        for (let i = 0; i < topicsLength; i++) {
            if (topicsList[i].includes("odometry")) {
                let name = topicsList[i].split('/')[1];
                if (temp_robot_names.indexOf(name) == -1) {
                    temp_robot_names.push(name);
                }
                temp_n++;
                if (this.robot_name.indexOf(name) == -1) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
                else if (this.tabs_robot_name.indexOf(name) == -1) {
                    this.unhide_tab(name);
                } 
                else {
  
                }
            } else if (topicsList[i].includes("vehicle_status")) {
                let name = topicsList[i].split('/')[1];
                temp_robot_names.push(name);
                temp_n++;
                if (this.robot_name.indexOf(name) == -1 && !this.robot_name.includes(name)) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
            }
        }

        let tab_flag = false; // Keeps track of if a change is made to the tabs that are currently displayed
        let curr_robot_length = this.robot_name.length; // Length of entire robots seen over all time after function
        for (let i = 0; i < curr_robot_length; i++) {
            if (temp_robot_names.indexOf(this.robot_name[i]) == -1 && this.tabs_robot_name.indexOf(this.robot_name[i]) != -1) {
                this.hide_tab(this.robot_name[i]);
                tab_flag = true;
            }
        }
        if (curr_robot_length > prev_robot_length) {
            for (this.i; this.i < curr_robot_length; this.i++) {
                this.add_tab();
                tab_flag = true;
            }
        } 

        if (tab_flag) {
            this.fix_tabs(); // Adjusts tab size on screen
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
        let robot_name_front2 = this.robot_name[n].substring(0,2);
        if (true){//robot_name_front2 == "X1" || robot_name_front2 == "X2" || robot_name_front1 == "G" || this.robot_name[n] == "HUSKY_SIM") {
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
            topic: "/" + this.robot_name[n] + "/artifact_record",
            messageType: "marble_artifact_detection_msgs/ArtifactArray"
        };
        let ArtifactImgTopic = {
            // topic: "/artifact_record",  // For use to save images on ground station
            topic: "/" + this.robot_name[n] + "/artifact_image",
            messageType: "marble_artifact_detection_msgs/ArtifactImg"
        };
        let VehicleStatusTopic = {
            topic: "/" + this.robot_name[n] + "/status", //TODO: change to vehicle_status
            messageType: "marble_common_msgs/VehicleStatus"
        }
        let PointCloudTopic = {
            topic: "/" + this.robot_name[n] + "/octomap_point_cloud_occupied",
            // topic: "/octomap_point_cloud_occupied",
            messageType: "sensor_msgs/PointCloud2"
        };

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
        
        // ! Include if you want to send desired positions to robots
        input_str = "position_x: <input id='position_x' type='text' placeholder='0'> position_y: <input id='position_y' type='text' placeholder='0'> position_z: <input id='position_z' type='text' placeholder='0'>" +
            "<br><input type='submit' value='Publish Position'> <input id='topic' type='hidden' value='" + CmdPosTopic.topic + "'> <input id='type' type='hidden' value='" + CmdPosTopic.messageType + "'>";
        //!

        // Creating tab at top of screen for selecting robot view
        var tab_link = document.createElement("BUTTON");
        tab_link.setAttribute("class", "tablink");
        // tab_link.onclick = function(){window.openPage(this.robot_name[n],tab_link, this.fullColors[n], n);}
        tab_link.setAttribute("onclick", "window.openPage('" + this.robot_name[n] + "', this, '" + this.fullColors[n] + "', " + n + ")");
        tab_link.setAttribute("robot_name", this.robot_name[n]);
        tab_link.setAttribute("visible", "true");
        tab_link.style.backgroundColor = this.fullColors[n % this.fullColors.length];
        tab_link.innerText = this.robot_name[n];

        tab_link.style.width = this.w + "%";
        this.tabs.prepend(tab_link);

        // Creating information stored within the tab
        var tab_content = document.createElement("DIV");
        tab_content.setAttribute("id", this.robot_name[n]);
        tab_content.setAttribute("class", "tabcontent");
        tab_content.style.backgroundColor = this.fullColors[n];

        var wrapper1 = document.createElement("DIV");
        wrapper1.setAttribute("class", "row");


        var cmdVel_form = document.createElement("FORM");

        // Setups classes for cmd form on each robots tab. Also adds function that publishes data when the submit button is clicked on the form
        cmdVel_form.setAttribute("class", "cmdVel_form col-sm-2");
        cmdVel_form.setAttribute("onsubmit", "window.pubTopicMsg(this);return false;");

        cmdVel_form.innerHTML = input_str;

        // Generate topics for each robot and subscribe
        var sub = document.createElement("DIV");
        sub.setAttribute("class", "info");

        // Set unique ID so octomap_viewer can reference it for 3D visualization
        var viewer = document.createElement("DIV");
        viewer.setAttribute("id", this.robot_name[n] + "_viewer")
        viewer.setAttribute("class", "octomap_viewer")

        /* Chart needs a dedicated DIV wrapper for ONLY the chart */
        var chart_wrap = document.createElement("DIV");
        // chart_wrap.style.display = "block";
        chart_wrap.setAttribute("class", "col-sm-10");
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

        Chart.defaults.global.defaultFontColor = "rgba(255, 255, 255, 1.0)";

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


        var wrapper2 = document.createElement("DIV");
        wrapper2.setAttribute("class", "row");

        function send_signal_to(robot_name, signal){
            var Topic = new ROSLIB.Topic({
                ros: ros,
                name: "/" + robot_name + "/" + signal,
                messageType: "std_msgs/Bool"
            });
            var msg = new ROSLIB.Message({
                data: true
            });
            Topic.publish(msg);
        }

        var estop_btn = document.createElement("BUTTON");
        estop_btn.setAttribute("type", "button");
        estop_btn.setAttribute("class", "btn btn-danger emergency_stop");
        estop_btn.onclick = function () {
            send_signal_to(global_tabManager.robot_name[n], "estop")
        };
        estop_btn.innerText = "Stop Vehicle";

        var startup_btn = document.createElement("BUTTON");
        startup_btn.setAttribute("type", "button");
        startup_btn.setAttribute("class", "click-btn");
        startup_btn.style.backgroundColor = "green";
        startup_btn.style.border = "green";
        startup_btn.style.color = "white";
        startup_btn.onclick = function () {
            send_signal_to(global_tabManager.robot_name[n], "startup")
        };
        startup_btn.innerText = "Start Vehicle";

        var restart_btn = document.createElement("BUTTON");
        restart_btn.setAttribute("type", "button");
        restart_btn.setAttribute("class", "click-btn");
        restart_btn.style.backgroundColor = "blue";
        restart_btn.style.border = "blue";
        restart_btn.style.color = "white";
        restart_btn.onclick = function () {
            send_signal_to(global_tabManager.robot_name[n], "restart")
        };
        restart_btn.innerText = "Restart Vehicle";



        wrapper2.appendChild(estop_btn);
        wrapper2.appendChild(startup_btn);
        wrapper2.appendChild(restart_btn);

                // var batteryLevel = "<div class='ldBar' data-preset='circle' data-stroke='data:ldbar/res,gradient(0,1,#eb8,#ad6,#c94)' data-stroke-width='15' data-value='100' style='width:100%;height:130px'></div>";
        // var other = "<div class='meter'><span id='" + this.robot_name[n] + "_battery' style='width: 100%'></span></div>";
        var other = "<div class='circle fill' data-fill='64'><p class='circle-text'>0%</p></div>";
        var battery_voltage = document.createElement("SPAN");
        battery_voltage.setAttribute("class", "badge badge-secondary battery_voltage");
        battery_voltage.style.fontSize = "30px";
        battery_voltage.innerText = "Voltage: ";

        var control_status = document.createElement("SPAN");
        control_status.setAttribute("class", "badge badge-secondary control_status");
        control_status.style.fontSize = "30px";
        control_status.innerText = "Status: ";
        
        chart_wrap.appendChild(control_status);
        chart_wrap.appendChild(battery_voltage);
        // wrapper2.innerHTML += other;


        chart_wrap.appendChild(chart);

        wrapper1.appendChild(cmdVel_form);
        wrapper1.appendChild(chart_wrap);


        tab_content.appendChild(wrapper1);
        tab_content.appendChild(wrapper2);
        tab_content.appendChild(viewer);



        this.pages.prepend(tab_content);

        create_viewer(this.robot_name[n]);

        var robot_artifact_container = document.createElement("DIV");
        robot_artifact_container.setAttribute("class", "col-sm-6");
        robot_artifact_container.setAttribute("robot_name", this.robot_name[n]);
        var robot_artifact_titles = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "title");
        // robot_artifact_titles.innerHTML = '<span id="robot_name" class="badge badge-secondary col-sm-1" style="text-align: center">' + this.robot_name[n] + '</span>' +
        robot_artifact_titles.innerHTML = '<span id="artifact_row_id" class="badge badge-secondary col-sm-1" style="text-align: center"><b>ID</b></span>' +
            '<span id="type" class="badge badge-secondary col-sm-3" style="text-align: center"><b>Type</b></span>' +
            '<span id="confidence" class="badge badge-secondary col-sm-2" style="text-align: center"><b>Confidence</b></span>' +
            '<span id="position" class="badge badge-secondary col-sm-3" style="text-align: center"><b>Position</b></span>' +
            '<span class="badge badge-secondary col-sm-2" style="text-align: center"><b>DARPA</b></span>' +
            '<span class="badge badge-secondary col-sm-1" style="text-align: center"><b>Image</b></span>';


        var robot_artifact_header = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "header");
        robot_artifact_header.innerHTML = '<span class="badge badge-secondary col-sm-12"><b>' + this.robot_name[n] + '</b></span>';

        robot_artifact_container.appendChild(robot_artifact_header);
        robot_artifact_container.appendChild(robot_artifact_titles);
        for (let i = 0; i < ARTIFACT_ARR_LEN; i++) {
            let robot_artifact_tracker = document.createElement("DIV");
            robot_artifact_tracker.setAttribute("class", "row");
            robot_artifact_tracker.setAttribute("artifact_id", parseFloat(i));
            console.log(JSON.stringify({x: 0.00, y: 0.00, z: 0.00}) );
            // robot_artifact_tracker.innerHTML = '<span id="robot_name" class="badge badge-secondary col-sm-1" style="text-align: center">' + this.robot_name[n] + '</span>' +
            robot_artifact_tracker.innerHTML = '<span id="artifact_row_id" class="badge badge-secondary col-sm-1" style="text-align: center">' + i + '</span>' +
                '<span contenteditable="true" id="type" class="badge badge-secondary col-sm-3" style="text-align: center; min-height: 1px;" value="undefined"> undefined </span>' +
                '<span contenteditable="true" id="confidence" class="badge badge-secondary col-sm-2" style="text-align: center" value="0.00">0.00</span>' +
                "<span contenteditable='true' id='position' class='badge badge-secondary col-sm-3' style='text-align: center' value='" + JSON.stringify({x: 0.00, y: 0.00, z: 0.00}) + "'>{x: 0.00 y: 0.00 z: 0.00}</span>";
            // '<button class="col-sm-1">Yes</button>' +
            // '<button class="col-sm-1">No</button>';
            let robot_artifact_tracker_yes = document.createElement("BUTTON");
            robot_artifact_tracker_yes.setAttribute("class", "col-sm-2");
            robot_artifact_tracker_yes.innerText = "Submit";
            robot_artifact_tracker_yes.onclick = function () {
                global_tabManager.global_vehicleArtifactsList[n].submit_artifact(global_tabManager.global_vehicleArtifactsList, i);
            };

            // let robot_artifact_tracker_no = document.createElement("BUTTON");
            // robot_artifact_tracker_no.setAttribute("class", "col-sm-2");
            // robot_artifact_tracker_no.innerText = "No";
            // robot_artifact_tracker_no.onclick = function () {
            //     global_tabManager.global_vehicleArtifactsList[n].skip_artifact(true);
            // };
            let robot_artifact_image_container = document.createElement("DIV");
            robot_artifact_image_container.setAttribute("class", "badge badge-secondary col-sm-1 popup");
            robot_artifact_image_container.setAttribute("id", "image");
            robot_artifact_image_container.innerText = "No Image";

            robot_artifact_tracker.appendChild(robot_artifact_tracker_yes);
            robot_artifact_tracker.appendChild(robot_artifact_image_container);
            // robot_artifact_tracker.appendChild(robot_artifact_tracker_no);

            robot_artifact_container.appendChild(robot_artifact_tracker);
        }
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
        this.global_vehicleArtifactsList[n] = new Artifact(this.robot_name[n]);

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
    fix_tabs() {
        // this.tabs.getElementsByTagName
        // let tab_length = 0;
        this.w = 100 / (this.tabs_robot_name.length + this.prebuilt_tabs_N);
        let width = this.w + "%";
        console.log("New Width: " + width);
        for (let i = 0; i < this.tabs_robot_name.length; i++) {
            let robotTab = this.tabs.querySelector("[robot_name=" + this.tabs_robot_name[i] + "]");
            // if (robotTab.getAttribute("visible") == "true") {
                robotTab.style.width = width;
            // }
        }
        var custom = this.tabs.querySelector("[id='defaultOpen']");
        custom.style.width = width;
        var file = this.tabs.querySelector("[id='FileTab']");
        file.style.width = width;
        var file = this.tabs.querySelector("[id='Artifact_InfoTab']");
        file.style.width = width;
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
        var topicsClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/topics',
            serviceType: 'rosapi/Topics'
        });

        var request = new ROSLIB.ServiceRequest();

        topicsClient.callService(request, function (result) {
            // console.log("Getting topics...");
            topicsList = result.topics;
            topicsTypeList = result.types;
            window.autocomplete(document.getElementById("myInput"), topicsList);
        });
        global_tabManager.search_robots();
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

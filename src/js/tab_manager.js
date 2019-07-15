class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_OdomSub = [];
        this.Tab_OdomChart = [];
        this.Tab_BatterySub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_VehicleStatusSub = [];
        this.Tab_PointCloudSub = [];
        this.Tab_CmdVelSub = [];
        this.Tab_OdomMsg = [];
        // Tab_BatteryMsg;
        // Tab_CmdVelMsg;

        this.global_vehicleType = [];
        this.global_vehicleArtifactsList = [];

        this.robot_name = [];
        this.tabs_robot_name = [];
        this.x = 0;
        this.artifact_tracker = document.getElementById("Artifact_Page");

        this.fullColors = [];
        this.colors = ['rgba(128,0,0,', 'rgba(0,128,0,', 'rgba(0,0,128,', 'rgba(128,128,0,', 'rgba(128,0,128,', 'rgba(0,128,128,', 'rgba(255,0,0,', 'rgba(0,255,0,', 'rgba(0,0,255,', 'rgba(0,255,255,', 'rgba(255,0,255,', 'rgba(2555,255,0,', 'rgba(0,0,0,']
        this.colorsLength = this.colors.length;
        for (let k = 0; k < this.colorsLength; k++) {
            this.fullColors[k] = this.colors[k] + "1.0)";
        }
        let topicsLength = topicsList.length;
        console.log("Starting Tab Creation...");
        for (let i = 0; i < topicsLength; i++) {
            if (topicsList[i].includes("odometry")) {
                let name = topicsList[i].split('/')[1];
                if (this.robot_name.indexOf(name) == -1) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
            } else if (topicsList[i].includes("vehicle_status")) {
                let name = topicsList[i].split('/')[1];
                if (this.robot_name.indexOf(name) == -1) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
            }
        }
        this.prebuilt_tabs_N = 3; //Number of tabs that gui launches with before adding vehicles
        this.i = 0;
        for (this.i; this.i < this.x; this.i++) {
            this.add_tab(this.i);
        }

        window.setInterval(this.get_TopicsFromROS, 2000);
    }

    // Search topics list for robot namespaces and add those robots to the current robot name
    // list if they are not there already
    update_robot_tab_options() {
        let topicsLength = topicsList.length;
        let prev_robot_length = this.robot_name.length; // Length of entire robots seen over all time before function
        let temp_robot_names = [];
        for (let i = 0; i < topicsLength; i++) {
            if (topicsList[i].includes("odometry")) {
                let name = topicsList[i].split('/')[1];
                if (temp_robot_names.indexOf(name) == -1) {
                    temp_robot_names.push(name);
                }
                if (this.robot_name.indexOf(name) == -1) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
                else if (this.tabs_robot_name.indexOf(name) == -1) {
                    $('#connection_status_' + name).html('<font color="green">Connected</font>')
                }
                else {

                }
            } else if (topicsList[i].includes("vehicle_status")) {
                let name = topicsList[i].split('/')[1];
                temp_robot_names.push(name);
                if (this.robot_name.indexOf(name) == -1 && !this.robot_name.includes(name)) {
                    this.robot_name.push(name);
                    this.tabs_robot_name.push(name);
                    this.x++;
                }
            }
        }

        // "remove" disconnected robots
        // the only change is the tab label is changed to say "Disconnected". Its pages is kept so info
        // regarding their previous history is not lost and maintains subscribers to Artifact, Point Cloud 2, and Pose Graph topics
        for (let i = 0; i < this.robot_name.length; i++) {
            if (temp_robot_names.indexOf(this.robot_name[i]) == -1 && this.tabs_robot_name.indexOf(this.robot_name[i]) != -1) {
                $('#connection_status_' + this.robot_name[i]).html('<font color="red">Disconnected</font>')
            }
        }

        // add newly connected robots
        if (this.robot_name.length > prev_robot_length) {
            for (this.i; this.i < this.robot_name.length; this.i++) {
                this.add_tab(this.i);
            }
        }
    }

    // Function for adding additional vehicle tabs to gui, it will add whenever a vehicle with ROS topic ending in odometry is found
    add_tab(n) {
        let robot_name = this.robot_name[n];
        console.log("Tab: " + robot_name);

        let titles_data = [];
        if (robot_name == "X1" || robot_name == "X2" || robot_name.includes("G")) {
            this.global_vehicleType[n] = "Ground Vehicle";
            titles_data = ['linear_x', 'angular_z', 'cmd_linear_x', 'cmd_angular_z'];
        } else if (robot_name == "X3" || robot_name == "X4" || robot_name == "DJI_SIM" || robot_name.includes("A")) {
            this.global_vehicleType[n] = "Air Vehicle";
            // titles_data contains the name of each dataset that is represented on the robots chart
            titles_data = ['linear_x', 'linear_y', 'linear_z', 'angular_x', 'angular_y', 'angular_z', 'cmd_linear_x', 'cmd_linear_y', 'cmd_linear_z', 'cmd_angular_x', 'cmd_angular_y', 'cmd_angular_z'];
        } else {
            console.log(robot_name + " is not recognized by this application...")
            return;
        }

        let OdomTopic = {
            topic: "/" + robot_name + "/odometry",
            messageType: "nav_msgs/Odometry"
        };
        let CmdVelTopic = "/" + robot_name + "/cmd_vel";
        let CmdPosTopic = {
            topic: "/" + robot_name + "/current_goal",
            messageType: "geometry_msgs/PoseStamped"
        };
        let BatteryTopic = {
            topic: "/" + robot_name + "/battery_status",
            messageType: "std_msgs/Float32"
        };
        let ArtifactTopic = {
            topic: "/artifact_record",
            // topic: "/" + robot_name + "/artifact_record",
            messageType: "marble_artifact_detection_msgs/ArtifactArray"
        };
        let VehicleStatusTopic = {
            topic: "/" + robot_name + "/status", //TODO: change to vehicle_status
            messageType: "marble_common_msgs/VehicleStatus"
        }
        let PointCloudTopic = {
            topic: "/" + robot_name + "/octomap_point_cloud_occupied",
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
        this.Tab_ArtifactSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ArtifactTopic.topic,
            messageType: ArtifactTopic.messageType
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

        // TODO nav: <li class="nav-item" id="` + robot_name + `_tab">
        $('#Robot_Tabs').prepend(`
            <li class="nav-item" robot_name="` + robot_name + `">
                <a  class="nav-link" onclick="window.openPage('` + robot_name + `', ` + n + `)" >` + robot_name + `<br><span id="connection_status_` + robot_name + `"><font color="green">Connected</font></span></a>
            </li>`);

        // Creating information stored within the tab
        var tab_content = $(`
        <div id="` + robot_name + `" class="tabcontent">
            <div class="row">
                send desired positions to robots: publishes when submitted    
                <form onsubmit="window.pubTopicMsg(this);return false;">
                    position_x: <input id='position_x' type='text' placeholder='0'>
                    position_y: <input id='position_y' type='text' placeholder='0'>
                    position_z: <input id='position_z' type='text' placeholder='0'>
                    
                    <br>
                    
                    <input type='submit' value='Publish Position'>
                    <input id='topic' type='hidden' value='` + CmdPosTopic.topic + `'>
                    <input id='type' type='hidden' value='` + CmdPosTopic.messageType + `'>
                </form>

                <div class="col-sm-10" style="position:relative; height:50vh; width:100%; margin: auto">
                    <canvas id="odometry" width=400 height=400></canvas>
                </div>
            </div>

            <div class="row">
                <button id="panel_btns_` + robot_name + `" type="button" class="btn btn-danger emergency_stop">Stop Vehicle</button>
                <span class="badge badge-secondary battery_voltage" style="font-size: 30px;">Voltage1: </span>
            </div>
            
            <div id="` + robot_name + `_viewer"></div>
        </div>`);

        $('#Robot_Pages').prepend(tab_content);



        // Create chart frame
        var ctx = $('#odometry')[0].getContext("2d");
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


        $(`#panel_btns_` + robot_name).click(function () {
            var estop = new ESTOP(global_tabManager.robot_name[n]);
            estop.send_estop();
        });

        create_viewer(robot_name);

        var robot_artifact_container = $(`
        <div class="row">
            <div class="col-sm-6" robot_name="` + robot_name + `">
                <div class="row" artifact_id="header">
                    <span class="badge badge-secondary col-sm-12">
                        <b>` + robot_name + `</b>
                    </span>
                </div>
                <div class="row" artifact_id="title">
                    <span id="artifact_row_id" class="badge badge-secondary col-sm-1" style="text-align: center">
                        <b>ID</b>
                    </span>
                    <span id="type" class="badge badge-secondary col-sm-3" style="text-align: center">
                        <b>Type</b>
                    </span>
                    <span id="confidence" class="badge badge-secondary col-sm-2" style="text-align: center">
                        <b>Confidence</b>
                    </span>
                    <span id="position" class="badge badge-secondary col-sm-3" style="text-align: center">
                        <b>Position</b>
                    </span>
                    <span class="badge badge-secondary col-sm-2" style="text-align: center">
                        <b>DARPA</b>
                    </span>
                    <span class="badge badge-secondary col-sm-1" style="text-align: center">
                        <b>Img</b>
                    </span>
                </div>
            </div>
        </div>`);

        for (let i = 0; i < 20; i++) {
            let robot_artifact_tracker = $(`
            <div class="row" artifact_id=` + parseFloat(i) + `>
                <span id="artifact_row_id" class="badge badge-secondary col-sm-1" style="text-align: center">` + i + `</span>
                <span contenteditable="true" id="type" class="badge badge-secondary col-sm-3" style="text-align: center; min-height: 1px;" value="undefined"> undefined </span>
                <span contenteditable="true" id="confidence" class="badge badge-secondary col-sm-2" style="text-align: center" value="0.00">0.00</span>
                <span contenteditable='true' id='position' class='badge badge-secondary col-sm-3' style='text-align: center' value='` + JSON.stringify({ x: 0.00, y: 0.00, z: 0.00 }) + `'>{x: 0.00 y: 0.00 z: 0.00}</span>
            
                <button id="submit_tracker_` + robot_name + `" class="col-sm-2">Submit</button>

                <div class="badge badge-secondary col-sm-1 popup" id="image">
                    Img
                    <img id="myPopup" class="popuptext">
                </div>
            </div>`);


            $('#submit_tracker_' + robot_name).click(function () {
                global_tabManager.global_vehicleArtifactsList[n].submit_artifact(global_tabManager.global_vehicleArtifactsList, i);
            });

            $('#image').click(function () {
                global_tabManager.global_vehicleArtifactsList[n].display_image(global_tabManager.global_vehicleArtifactsList, i);
            });


            robot_artifact_container.append(robot_artifact_tracker);
        }

        $("#Artifact_Page").append(robot_artifact_container);


        // Sets up all objects for vehicle artifact manager
        this.global_vehicleArtifactsList[n] = new Artifact(robot_name);

        this.Tab_ArtifactSub[n].subscribe(function (msg) {
            global_tabManager.global_vehicleArtifactsList[n].set_artifacts(msg.artifacts);
        });

        // Subscriber that handles distributing all vehicle status information to their relevant topics
        this.Tab_VehicleStatusSub[n].subscribe(function (msg) {
            global_tabManager.Tab_ArtifactSub[n].publish(msg.artifact_array);
            global_tabManager.Tab_BatterySub[n].publish(msg.battery_voltage);
        });
    }
    get_vehicleArtifactsList(n) {
        return this.global_vehicleArtifactsList[n];
    }
    get_Tab_OdomSub() {
        return this.Tab_OdomSub;
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

            // search suggestions for Custom Tab  
            window.autocomplete(document.getElementById("myInput"), topicsList);
        });
        global_tabManager.update_robot_tab_options();
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

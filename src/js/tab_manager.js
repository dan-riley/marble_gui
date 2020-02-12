var ANALYZE_TOPICS_LIST_INTERVAL = 2000;
var teleop_robot = "Base"
var goal_pose = new ROSLIB.Message();
ros = new ROSLIB.Ros({
    url: "ws://localhost:9090"
});

function send_ma_task(robot_name, signal, value) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        // name: `/Anchor/neighbors/${robot_name}/guiTaskName`,
        name: `/Base/neighbors/${robot_name}/guiTaskName`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: signal
    });
    Topic.publish(msg);

    var Topic = new ROSLIB.Topic({
        ros: ros,
        // name: `/Anchor/neighbors/${robot_name}/guiTaskValue`,
        name: `/Base/neighbors/${robot_name}/guiTaskValue`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: value
    });
    Topic.publish(msg);
}

function send_signal_to(robot_name, signal, value) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `/${robot_name}/${signal}`,
        messageType: "std_msgs/Bool"
    });
    var msg = new ROSLIB.Message({
        data: value
    });
    Topic.publish(msg);

    // Also publish to multi-agent so it can relay it
    send_ma_task(robot_name, signal, (value ? 'True': 'False'));
}

function send_string_to(robot_name, signal, text) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `/${robot_name}/${signal}`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: text
    });
    Topic.publish(msg);

    // Also publish to multi-agent so it can relay it
    send_ma_task(robot_name, signal, text);
}


// This changes what robot we want to teleop to
function teleop_to(robot_name){
    var tele_btn = document.getElementById(`${robot_name}_teleop`);
    var robot_ctrl_card = document.getElementById(`${robot_name}_control_card`)
    if(tele_btn.value == "Teleop"){
        teleop_robot = robot_name;
        tele_btn.value = "Disable Teleop";
        robot_ctrl_card.style.backgroundColor = "#FF4C26";
    }else{
        teleop_robot = "Base";
        tele_btn.value = "Teleop";
        robot_ctrl_card.style.backgroundColor = "darkgrey";
    }
}


// This needs to run all the time
function teleop_route(){
    // listen to /base/twist
    // send to /teleop_robot/twist
    var teleop_listener = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });
    var Topic = new ROSLIB.Topic({
        ros: ros,
        // HEY YOU CHANGED THIS BEFORE THE TEST ON THE 15th
        name: `/${teleop_robot}/joy_cmd_vel`,
        messageType: "geometry_msgs/Twist"
    })
    // create a publisher
    var last_robot = "Base"
    teleop_listener.subscribe(function (message){
        if(teleop_robot != last_robot){
            Topic.name = `/${teleop_robot}/cmd_vel_base`;
            last_robot = teleop_robot;
            console.log("changed target robot")
        }
        var msg = new ROSLIB.Message(message);
        if(teleop_robot != 'Base'){
            Topic.publish(msg);
        }
    });
}


class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_TaskSub = [];
        this.Tab_CommSub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_ArtifactImgSub = [];
        this.Tab_CmdVelSub = [];

        this.global_vehicleType = [];
        this.tasks = [];
        this.global_vehicleArtifactsList = [];
        this.fusedArtifacts = new Artifact('Base', 0);

        this.poses = [];
        this.rows = 0;
        this.robot_name = [];
        this.incomm = [];
        this.tabs_robot_name = [];
        this.x = 0;
        this.tabs = document.getElementById("Robot_Tabs");
        this.pages = document.getElementById("Robot_Pages");

        this.publishersClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/publishers',
            serviceType: 'rosapi/Publishers'
        });

        this.fullColors = [];
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

    // brief Function for searching topics list for robot namespaces and adding those robots to the current robot name
    // list if they are not there already
    search_robots() {
        var _this = global_tabManager;

        if (robots_disp.length == 1) {
            // This is where robots and beacons are filtered
            var patt = /^((?!B).)\d{1,2}(?!_)/;

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
        } else {
          for (let i = 0; i < robots_disp.length - 1; i++) {
              name = robots_disp[i];
              if (_this.robot_name.indexOf(name) == -1) {
                _this.robot_name.push(name);
                _this.tabs_robot_name.push(name);
                _this.x++;
              }
          }
        }

        let curr_robot_length = _this.robot_name.length; // Length of entire robots seen over all time after function

        // report robot as "disconnect" if it was previously discovered but we are no longer
        // receiving messages from it.
        let now = new Date();
        for (let i = 0; i < curr_robot_length; i++) {
            var status_dom = $('#connection_status_' + _this.robot_name[i]);
            if (_this.incomm[i]) {
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
            } else if (task == "Deploy") {
                task_dom.html('<font color="yellow">Deploying Beacon</font>');
            } else if (task == "Stop") {
                task_dom.html('<font color="red">Stopped</font>');
            } else if (task == "Explore") {
                task_dom.html('<font color="green">Exploring</font>');
            } else if (task == "guiCommand") {
                task_dom.html('<font color="green">GUI Goal</font>');
            } else {
                if (task == undefined) task = '';
                task_dom.html('<font color="red">' + task + '</font>');
            }

        }

        for (_this.i; _this.i < curr_robot_length; _this.i++) {
            _this.add_tab();
        }
    }

    // Function for adding additional vehicle tabs to gui and beacons to the beacon page
    add_tab() {
        let n = this.i;
        var robot = this.robot_name[n];

        console.log("Tab: " + robot);

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

        // This function (found below) gets up all the listeners for this robot
        this.listen_to_robot_topics(n, robot)

        var last_cloud_report_success = "never";

        global_tabManager.Tab_TaskSub[n].subscribe(function (msg) {
            global_tabManager.tasks[n] = msg.data
        });

        global_tabManager.Tab_CommSub[n].subscribe(function (msg) {
            // Save our current time to update connection status
            // The service call isn't reliable!
            global_tabManager.incomm[n] = msg.data;
        });

        // Creating tab at top of screen for selecting robot view
        $('#Robot_Tabs').prepend(`
            <li class="nav-item" id="${this.robot_name[n]}_nav_link" robot_name="${this.robot_name[n]}">
                <a  class="nav-link" onclick="window.openPage('${this.robot_name[n]}', ${n})" >
                    ${this.robot_name[n]}
                    <br><span id="connection_status_${this.robot_name[n]}"></span>
                    <br><span id="task_status_${this.robot_name[n]}"></span>
                </a>
            </li>`);

        // This is for creatiung the control card for each robot on the sidebar
        $('#controls_bar_inner').prepend(`
        <li id="${this.robot_name[n]}_control_card" class="quick_control">
            <h4>${this.robot_name[n]}</h4>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_startup"
                onclick="send_signal_to('${this.robot_name[n]}', 'estop', false)">
                Start
            </button>
            <button type='button' class="btn btn-danger btn-sm" id="${this.robot_name[n]}_stop"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Stop')">
                Stop
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_explore"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Explore')">
                Explore
            </button>
            <button type='button' class="btn btn-danger btn-sm" id="${this.robot_name[n]}_home"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Home')">
                Go Home
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_deploy"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Deploy')">
                Deploy Beacon
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_estop_off"
                onclick="send_signal_to('${this.robot_name[n]}', 'estop_cmd', false)">
                E-Stop Disabled
            </button>
            <button type='button' class="btn btn-danger btn-sm" id="${this.robot_name[n]}_estop"
                onclick="send_signal_to('${this.robot_name[n]}', 'estop_cmd', true)">
                E-Stop
            </button>
            <br>
            <button type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_radio"
                onclick="send_signal_to('${this.robot_name[n]}', 'radio_reset_cmd', true)">
                Radio Reset
            </button>
            <input type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_teleop"
                onclick="teleop_to('${this.robot_name[n]}')" value="Teleop"></input><br>
            <input type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_goal"
                onclick="publish_goal('${this.robot_name[n]}')" value="Goal"></input><br>
        </li>
        `)

        // Creating information stored within the tab
        var tab_content = document.createElement("DIV");
        tab_content.setAttribute("id", this.robot_name[n]);
        tab_content.setAttribute("class", "tabcontent");

        // Generate topics for each robot and subscribe
        var sub = document.createElement("DIV");
        sub.setAttribute("class", "info");

        var top_card = document.createElement("DIV");
        top_card.setAttribute("class", "card");

        var top_card_header = document.createElement("DIV");
        top_card_header.setAttribute("class", "card-header");
        top_card_header.innerText = global_tabManager.robot_name[n];

        top_card.appendChild(top_card_header);
        tab_content.appendChild(top_card);

        $('#Robot_Pages').prepend(tab_content);

        var robot_artifact_container = document.createElement("DIV");
        robot_artifact_container.setAttribute("class", "col-sm-12 artifact_table");
        robot_artifact_container.setAttribute("robot_name", this.robot_name[n]);

        var robot_artifact_titles = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "title");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "header");
        robot_artifact_titles.innerHTML = `
                <span class="col-sm-1"> </span>
                <span id="type" class="badge badge-secondary col-sm-2" style="text-align: center"><b>Type</b></span>
                <span id="confidence" class="badge badge-secondary col-sm-1" style="text-align: center"><b>Confidence</b></span>
                <span id="position" class="badge badge-secondary col-sm-3" style="text-align: center"><b>Position</b></span>
                <span class="badge badge-secondary col-sm-2" style="text-align: center"><b>DARPA</b></span>
                <span class="badge badge-secondary col-sm-2" style="text-align: center"><b>Image</b></span>`;

        var robot_artifact_header = document.createElement("SPAN");
        robot_artifact_header.setAttribute("class", "badge badge-secondary col-sm-12");
        robot_artifact_header.setAttribute("style", "font-size: 20px")

        var robot_artifact_header_inner = document.createElement("DIV");
        robot_artifact_header_inner.setAttribute("class", "panel panel-default");
        robot_artifact_header_inner.innerHTML = `
                    <div class="panel-heading" role="tab" id="${this.robot_name[n]}_heading">
                        <b class="panel-title">
                            <a class="" role="button" title="" data-toggle="collapse" href="#${this.robot_name[n]}_collapse" aria-expanded="true" aria-controls="collapse1">
                            ${this.robot_name[n]}
                            </a>
                        </b>
                    </div>`;

        var robot_artifact_header_inner2 = document.createElement("DIV");
        robot_artifact_header_inner2.setAttribute("id", this.robot_name[n] + "_collapse");
        robot_artifact_header_inner2.setAttribute("class", "panel-collapse collapse show");
        robot_artifact_header_inner2.setAttribute("role", "tabpanel");
        robot_artifact_header_inner2.setAttribute("aria-labelledby", this.robot_name[n] + "_heading");

        var robot_buttons_container = document.createElement("DIV");
        robot_buttons_container.setAttribute("class", "panel-body mb-4");
        robot_buttons_container.setAttribute("id", this.robot_name[n] + '_buttons_container');

        robot_artifact_header_inner2.appendChild(robot_buttons_container);
        robot_artifact_header_inner.appendChild(robot_artifact_header_inner2);
        robot_artifact_header.appendChild(robot_artifact_header_inner);

        robot_artifact_container.appendChild(robot_artifact_header);
        robot_artifact_container.appendChild(robot_artifact_titles);

        // Artifact rows get created by the artifact handler now
        let artifact_tracker = document.getElementById("robot_artifact_tables");
        // Creates a DIV element that is placed either on the left or right side of the screen depending on how many robots there currently are
        if (n % 2 == 0) {
            this.rows++;
            let row_artifact_containers = document.createElement("DIV");
            row_artifact_containers.setAttribute("class", "row");
            row_artifact_containers.setAttribute("row_id", this.rows);
            row_artifact_containers.appendChild(robot_artifact_container);
            artifact_tracker.appendChild(row_artifact_containers);
        } else {
            let row_artifact_containers = artifact_tracker.querySelector("[row_id = '" + this.rows + "']");
            row_artifact_containers.appendChild(robot_artifact_container);
        }

        // Buttons have to be added here or jquery doesn't see it in the DOM
        // $('#' + this.robot_name[n] + '_buttons').clone(true, true).appendTo('#' + this.robot_name[n] + '_buttons_container');

        // Sets up all objects for vehicle artifact manager
        this.global_vehicleArtifactsList[n] = new Artifact(this.robot_name[n], n);

        // Subscribes to artifact messages
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

    }

    // This is used by "add_tab" above
    listen_to_robot_topics(n, robot){
        let TaskTopic = {
            // topic: "/" + robot + "/task_update",
            topic: "/Base/neighbors/" + robot + "/status",
            // topic: "/Anchor/neighbors/" + robot + "/status",
            messageType: "std_msgs/String"
        };
        let CommTopic = {
            topic: "/Base/neighbors/" + robot + "/incomm",
            // topic: "/Anchor/neighbors/" + robot + "/incomm",
            messageType: "std_msgs/Bool"
        };
        let ArtifactTopic = {
            // topic: "/artifact_record",  // For use when artifact detection is on ground station
            // topic: "/" + this.robot_name[n] + "/artifact_record",
            // topic: "/" + robot + "/artifact_array/relay",
            // topic: "/Anchor/neighbors/" + robot + "/artifacts",
            topic: "/Base/neighbors/" + robot + "/artifacts",
            messageType: "marble_artifact_detection_msgs/ArtifactArray"
        };
        let ArtifactImgTopic = {
            // topic: "/artifact_record",  // For use to save images on ground station
            // topic: "/" + this.robot_name[n] + "/located_artifact_img",
            topic: "/" + robot + "/artifact_image_to_base",
            // topic: "/disabled3",
            messageType: "marble_artifact_detection_msgs/ArtifactImg"
        };
        this.Tab_TaskSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: TaskTopic.topic,
            messageType: TaskTopic.messageType
        });
        this.Tab_CommSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: CommTopic.topic,
            messageType: CommTopic.messageType
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
    }

    // This is used by "add_tab" above
    darpa_msg_from_ros_msg(msg, type) {
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

    add_beacon(beacon_name){
        // Listen for activation, may be atena up msg
        // Creates a card for each beacon
        var beaconcard = 
        `<div class="card" id="${beacon_name}_card" beacon="${beacon_name}">
                ${this.robot_name[n]}
                <br><span id="connection_status_${beacon_name}"></span>
                <br><span id="task_status_${beacon_name}"></span>
            </div>`;

        // Add card to beacons page
        g = document.createElement('div');
        g.id = beacon_name + "_container";
        document.body.appendChild(g);
        document.getElementById(g.id).innerHTML = beaconcard;
    }


    get_vehicleArtifactsList(n) {
        return this.global_vehicleArtifactsList[n];
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

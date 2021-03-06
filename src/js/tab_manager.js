var ANALYZE_TOPICS_LIST_INTERVAL = 2000;
var teleop_robot = "Base"
var goal_pose = new ROSLIB.Message();
ros = new ROSLIB.Ros({
    url: "ws://localhost:9090"
});

var robots_disp, ma_prefix, comms_prefix;
function load_params() {
    var robots_param = new ROSLIB.Param({
        ros: ros,
        name: "robots"
    });
    console.log('calling robots');
    robots_param.get(function(param){
        console.log('got robots');
        robots_disp = param.split(',');
        console.log(param);
        robots_init = true;
    });
    var ma_param = new ROSLIB.Param({
        ros: ros,
        name: "ma_prefix"
    });
    ma_param.get(function(param){
        ma_prefix = param;
        console.log(param);
    });

    var comms_param = new ROSLIB.Param({
        ros: ros,
        name: "comms_prefix"
    });
    comms_param.get(function(param){
        comms_prefix = param;
        console.log(param);
    });
}

function send_ma_task(robot_name, signal, value) {
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `${ma_prefix}${robot_name}/guiTaskName`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: signal
    });
    Topic.publish(msg);

    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `${ma_prefix}${robot_name}/guiTaskValue`,
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
        name: `${comms_prefix}${robot_name}/${signal}`,
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
        name: `${comms_prefix}${robot_name}/${signal}`,
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
// This is legacy code kept around in case I broke something and we need to stitch back
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
        name: '/joy',
        messageType: 'sensor_msgs/Joy'
    });
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `${comms_prefix}${teleop_robot}/joy_base`,
        messageType: "sensor_msgs/Joy"
    })
    // create a publisher
    var last_robot = "Base"
    teleop_listener.subscribe(function (message){
        if(teleop_robot != last_robot){
            Topic.name = `${comms_prefix}/${teleop_robot}/joy_base`;
            last_robot = teleop_robot;
            console.log("changed target robot")
        }
        var msg = new ROSLIB.Message(message);
        if(teleop_robot != 'Base'){
            Topic.publish(msg);
        }
    });
}

function pubTask(task_dom, tasks, i) {
    if (i < tasks.length) {
        setTimeout(function() {
            task_dom.html('<font color="red">' + tasks[i] + '</font>');
            pubTask(task_dom, tasks, i+1);
        }, 1000);
    }
}

// This stores the transform to get it from the subscriber to the publisher to the correct robot
var robot_transform = new ROSLIB.Message({
    transform : {
        translation : {
            x : 0,
            y : 0,
            z : 0
        },
        rotation : {
            x : 0,
            y : 0,
            z : 0,
            w : 0
        }
    }
});

// This sends kyle's transform to the correct robot
function send_tf_to(){
    var robot = document.getElementById("select_robot_transform").value;
    // get data from the modal
    robot_transform.transform.translation.x = parseFloat(document.getElementById("x_translation").value);
    robot_transform.transform.translation.y = parseFloat(document.getElementById("y_translation").value);
    robot_transform.transform.translation.z = parseFloat(document.getElementById("z_translation").value);

    robot_transform.transform.rotation.x = parseFloat(document.getElementById("x_rotation").value);
    robot_transform.transform.rotation.y = parseFloat(document.getElementById("y_rotation").value);
    robot_transform.transform.rotation.z = parseFloat(document.getElementById("z_rotation").value);
    robot_transform.transform.rotation.w = parseFloat(document.getElementById("w_rotation").value);

    console.log("sending tf");
    var tf_publisher = new ROSLIB.Topic({
        ros: ros,
        name: `${comms_prefix}${robot}/origin_from_base`,
        messageType: "geometry_msgs/TransformStamped"
    });

    // This is to deactivate the transform preview in rviz when sending thetransform to the robot
    // var preview_button = document.getElementById("transform_preview_button");
    // if(preview_button.innerText != "Preview TF"){
    //     previewTransform();
    // }

    $('#TFModal').modal('hide');

    for(let i = 0; i < 3; i++){
        tf_publisher.publish(robot_transform);
        sleep(50);
    }

}

// This listens for kyle's tf message to pass to a robot
function listen_for_tf(){
    // This is verrified with two messages at 1hz
    //roslibjs seems to lose the first message but recieves everyone after that
    console.log("listening for the tf");
    // Listen to the transform that kyle sends over
    var tf_listener = new ROSLIB.Topic({
        ros: ros,
        name: "/leica/robot_to_origin_transform",
        messageType: "geometry_msgs/TransformStamped"
    });
    // update the tf variable to be sent to a robot
    // console.log("maybe its subscribed");
    tf_listener.subscribe(function (message){
        console.log("got transform");
        robot_transform = message;

        // update the modal with message data
        $('#select_robot_transform').val(robot_transform.child_frame_id);
        $('#x_translation').val(robot_transform.transform.translation.x);
        $('#y_translation').val(robot_transform.transform.translation.y);
        $('#z_translation').val(robot_transform.transform.translation.z);

        $('#x_rotation').val(robot_transform.transform.rotation.x);
        $('#y_rotation').val(robot_transform.transform.rotation.y);
        $('#z_rotation').val(robot_transform.transform.rotation.z);
        $('#w_rotation').val(robot_transform.transform.rotation.w);
    });
}


// This updates options lists with new robots
async function updateRobotOptions(){
    // This is for the custom artifact modal
    populateBots("existing_location");

}


// Initialize the whole gui
function initialize() {
    load_params();
    teleop_route();
    get_darpa_artifacts();
    what_logs("js", "_reported.json");
    listen_to_markers();
    listen_to_pose();
    listen_for_tf();
    init_reset();

}

class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_TaskSub = [];
        this.Tab_TaskNameSub = [];
        this.Tab_TaskValueSub = [];
        this.Tab_CommSub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_ArtifactImgSub = [];

        this.global_vehicleType = [];
        this.tasks = [];
        this.task_names = [];
        this.task_values = [];
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
        if (robots_disp[0] == "") {
            // This is where robots and beacons are filtered
            var patt = /^((?!B).)\d{1,2}(?!_)/;
            var handled_names = [];

            for (let i = 0; i < topicsList.length; i++) {
                let name = topicsList[i].split('/')[1];

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
          for (let i = 0; i < robots_disp.length; i++) {
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

            var task = '';
            var task_dom = $('#task_status_' + _this.robot_name[i]);
            var full_task = global_tabManager.tasks[i];
            if (full_task) {
              var tasks = full_task.split('+++');
              task = tasks[0];
              pubTask(task_dom, tasks, 1);
            }
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

        this.global_vehicleType[n] = "Ground Vehicle";
        titles_data = ['linear_x', 'angular_z', 'cmd_linear_x', 'cmd_angular_z'];

        // This function (found below) gets up all the listeners for this robot
        this.listen_to_robot_topics(n, robot)

        var last_cloud_report_success = "never";

        global_tabManager.Tab_TaskSub[n].subscribe(function (msg) {
            global_tabManager.tasks[n] = msg.data;
        });

        global_tabManager.Tab_TaskNameSub[n].subscribe(function (msg) {
            global_tabManager.task_names[n] = msg.data;
        });

        // Add highlighting to buttons when we get updated info from the multi-agent base
        global_tabManager.Tab_TaskValueSub[n].subscribe(function (msg) {
            let robot = global_tabManager.robot_name[n];
            let task = msg.data.toLowerCase();
            if ((task == 'true') || (task == 'false')) {
                switch (global_tabManager.task_names[n]) {
                    case 'estop_cmd':
                        task = 'estop_toggle';
                        break;
                    case 'radio_reset_cmd':
                        task = 'radio';
                        break;
                }
            }
            global_tabManager.task_values[n] = task;

            // Set highlighting for the currently pressed button
            let btns = document.querySelectorAll([`button[id^="${robot}_btn_"]`]);
            btns.forEach((btn) => {
                if (btn.id == `${robot}_btn_${task}`) {
                    if (!btn.classList.contains('highlight')) {
                        btn.classList.add('highlight');
                        btn.blur();
                    }
                } else if (btn.classList.contains('highlight')) {
                    btn.classList.remove('highlight');
                }
            });
        });

        global_tabManager.Tab_CommSub[n].subscribe(function (msg) {
            // Save our current time to update connection status
            // The service call isn't reliable!
            global_tabManager.incomm[n] = msg.data;
        });

        // Creating tab at top of screen for selecting robot view
        $('#Robot_Tabs').append(`
            <li class="nav-item" id="${this.robot_name[n]}_nav_link" robot_name="${this.robot_name[n]}">
                <a  class="nav-link" onclick="window.openPage('${this.robot_name[n]}', ${n})" >
                    ${this.robot_name[n]}
                    <br><span id="connection_status_${this.robot_name[n]}"></span>
                    <br><span id="task_status_${this.robot_name[n]}"></span>
                </a>
            </li>`);

        // Create sidebar buttons
        var disarmBtn = '';
        if (this.robot_name[n].includes('A'))
            disarmBtn = `
            <button type='button' class="btn btn-danger btn-sm" id="${this.robot_name[n]}_btn_disarm"
                onclick="send_signal_to('${this.robot_name[n]}', 'disarm', true)">
                Disarm
            </button><br>`;

        $('#controls_bar_inner').append(`
        <li id="${this.robot_name[n]}_control_card" class="quick_control">
            <h4>${this.robot_name[n]}</h4>
            ${disarmBtn}
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_btn_start"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Start')" title="Start">
                <img src="./images/start.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-danger btn-sm" id="${this.robot_name[n]}_btn_stop"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Stop')" title="Stop">
                <img src="./images/Stop_sign.png" class="control-icons">
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_btn_explore"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Explore')" title="Explore">
                <img src="./images/compas.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-primary btn-sm" id="${this.robot_name[n]}_btn_home"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Home')" title="Go Home">
                <img src="./images/go_home.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-primary btn-sm" id="${this.robot_name[n]}_btn_deploy"
                onclick="send_ma_task('${this.robot_name[n]}', 'task', 'Deploy')" title="Deploy Beacon">
                <img src="./images/deploy_beacon.png" class="control-icons">
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${this.robot_name[n]}_btn_estop_toggle"
                onclick="estop_toggle('${this.robot_name[n]}')" title="Estop">
                E-Stop
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_btn_radio"
                onclick="send_signal_to('${this.robot_name[n]}', 'radio_reset_cmd', true)" title="Radio Reset">
                <img src="./images/radio_reset.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_teleop"
                onclick="teleop_to('${this.robot_name[n]}')" value="Teleop" title="Teleop">
                <img src="./images/teleop.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_btn_goal"
                onclick="publish_goal('${this.robot_name[n]}')" value="Go to Goal" title="Go To Goal">
                <img src="./images/go_to_goal.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${this.robot_name[n]}_goal"
                onclick="goal_to_robotII('${this.robot_name[n]}')" value="Goal to Robot" title="Goal To Robot">
                <img src="./images/goal_to_robot.png" class="control-icons">
            </button></br>
        </li>`)

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

        // Build the artifacts section for this robot
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
        updateRobotOptions();

        // Subscribes to artifact messages
        this.Tab_ArtifactSub[n].subscribe(function (msg) {
            // console.log("get some artifacts");
            // if (JSON.stringify(msg.artifacts) != JSON.stringify(global_tabManager.global_vehicleArtifactsList[n].get_artifactsList())) {
            global_tabManager.global_vehicleArtifactsList[n].set_artifacts(msg.artifacts);
            // }

        });
        this.Tab_ArtifactImgSub[n].subscribe(function (msg) {
            // if (JSON.stringify(msg.artifacts) != JSON.stringify(global_tabManager.global_vehicleArtifactsList[n].get_artifactsList())) {
            global_tabManager.global_vehicleArtifactsList[n].save_image(msg);
            // }

        });

        // Add to the Transform Transport dropdown
        var modal_options = document.getElementById("select_robot_transform");
        var option = document.createElement("option");
        option.text = robot;
        option.value = robot;
        modal_options.add(option);

        // Build the reset section for this robot
        let robot_reset = document.createElement("DIV");
        robot_reset.setAttribute("id", this.robot_name[n]);
        robot_reset.setAttribute("class", "row");
        robot_reset.innerHTML = `
                <div class="col-auto"><H3>${this.robot_name[n]}</H3></div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="reset_agent" title="Resets multi-agent and mapping like a fresh start (affects all robots including this one)">
                  <label for="reset_agent"><b>Reset Agent</b><label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="hard_reset" title="Resets the current map for this robot like a fresh start, including on the robot itself">
                  <label for="hard_reset">Hard Reset Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="clear_map" name="clear" title="Clears the current map for this robot but continues from current position">
                  <label for="clear_map">Clear Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="reset_map" title="Resets the current map for this robot like a fresh start">
                  <label for="reset_map">Reset Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="ignore_map" title="Ignores map from this agent until reset (does not clear the map by itself!)">
                  <label for="ignore_map">Ignore Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="ma_reset" title="Resets multi-agent for this robot like a fresh start, except for maps">
                  <label for="ma_reset">Reset Multi-Agent<label>
                </div>
                 <div class="col-auto">
                  <input type="text" class="form-control" name="diff_reset" title="Removes map diffs from everyone else's merged map.  Use comma-separated list (1,3,6,8) OR range (0-8), but not both!">
                  <label for="diff_reset">Reset Map Diffs<label>
                </div>`;
        let reset_tracker = document.getElementById("robot_reset_tables");
        reset_tracker.appendChild(robot_reset);
    }

    // This is used by "add_tab" above
    listen_to_robot_topics(n, robot){
        this.Tab_TaskSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/status",
            messageType: "std_msgs/String"
        });
        this.Tab_TaskNameSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/guiTaskNameReceived",
            messageType: "std_msgs/String"
        });
        this.Tab_TaskValueSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/guiTaskValueReceived",
            messageType: "std_msgs/String"
        });
        this.Tab_CommSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/incomm",
            messageType: "std_msgs/Bool"
        });
        this.Tab_ArtifactSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/artifacts",
            messageType: "marble_artifact_detection_msgs/ArtifactArray"
        });
        this.Tab_ArtifactImgSub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/image",
            messageType: "marble_artifact_detection_msgs/ArtifactImg"
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

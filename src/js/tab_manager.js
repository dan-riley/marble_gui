var ANALYZE_TOPICS_LIST_INTERVAL = 2000;
var teleop_robot = "Base"
var goal_pose = new ROSLIB.Message();
ros = new ROSLIB.Ros({
    url: "ws://localhost:9090"
});

var robots_disp, ma_prefix, comms_prefix;
var handled_topics = [];


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
    listen_goal_pose();
    listen_for_tf();
    init_reset();

}

class TabManager {
    constructor() {
        // Permanent subscribers for all vehicle tabs
        this.Tab_BatterySub = [];
        this.Tab_TaskSub = [];
        this.Tab_TaskNameSub = [];
        this.Tab_TaskValueSub = [];
        this.Tab_CommSub = [];
        this.Tab_ArtifactSub = [];
        this.Tab_ArtifactImgSub = [];
        this.Tab_RobotLocation = [];
        this.joy = [];
        this.tf_publisher = [];

        this.global_vehicleType = [];
        this.battery = [];
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
        this.transforms = [];
        this.x = 0;
        this.tabs = document.getElementById("Robot_Tabs");
        this.pages = document.getElementById("Robot_Pages");

        this.publishersClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/publishers',
            serviceType: 'rosapi/Publishers'
        });

        this.i = 0;

        window.setInterval(this.get_TopicsFromROS, ANALYZE_TOPICS_LIST_INTERVAL);

        document.getElementById("select_robot_transform").addEventListener("change", function() {
          robot_transform = global_tabManager.transforms[$(this).val()]
          if (robot_transform) {
            $('#select_robot_transform').val(robot_transform.child_frame_id);
            $('#x_translation').val(robot_transform.transform.translation.x);
            $('#y_translation').val(robot_transform.transform.translation.y);
            $('#z_translation').val(robot_transform.transform.translation.z);

            $('#x_rotation').val(robot_transform.transform.rotation.x);
            $('#y_rotation').val(robot_transform.transform.rotation.y);
            $('#z_rotation').val(robot_transform.transform.rotation.z);
            $('#w_rotation').val(robot_transform.transform.rotation.w);
          }
        });

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
        // if we need to search the network for robots
        if (robots_disp[0] == "") {
            // This is where robots and beacons are filtered
            // var patt = /^((?!B).)\d{1,2}(?!_)/;
            // var handled_names = [];

            // for (let i = 0; i < topicsList.length; i++) {
            //     console.log("Looking for robots on the network");
            //     let name = topicsList[i].split('/')[1];

            //     if (handled_names.indexOf(name) == -1) {
            //         if (patt.test(name) && (name != 'S01')) {
            //             console.log('adding ', name, ' from the network');
            //             if (_this.robot_name.indexOf(name) == -1) {
            //                 _this.robot_name.push(name);
            //                 _this.tabs_robot_name.push(name);
            //                 _this.x++;
                            
            //             }
            //         }
            //         handled_names.push(name);
            //     }
            // }

            // Make decision of what to do with this improved system
            let topics = topicsList.filter(x => !handled_topics.includes(x));

            for (let i = 0; i < topics.length; i++) {
                // console.log("Looking for robots on the network");
                if(topics[i].includes(ma_prefix) && topics[i].includes('odometry')){
                    
                    // reg ex patern for good robot names
                    var patt = /\b[A, C-R, T-Z]\d{1,2}(?!_)\b/i;
                    let results = topics[i].match(patt);
                    if(results){
                        name = results[0];
                        console.log('adding ', name, ' from the network');
                        if (global_tabManager.robot_name.indexOf(name) == -1) {
                            global_tabManager.robot_name.push(name);
                            global_tabManager.tabs_robot_name.push(name);
                            global_tabManager.x++;
                            
                        }
                    }
                }
                handled_topics.push(topics[i]);
            }

        // If we can get robots from launch file
        } else {
          for (let i = 0; i < robots_disp.length; i++) {
              name = robots_disp[i];
              if (global_tabManager.robot_name.indexOf(name) == -1) {
                global_tabManager.robot_name.push(name);
                global_tabManager.tabs_robot_name.push(name);
                global_tabManager.x++;
              }
          }
        }

        let curr_robot_length = global_tabManager.robot_name.length; // Length of entire robots seen over all time after function

        // report robot as "disconnect" if it was previously discovered but we are no longer
        // receiving messages from it.
        let now = new Date();
        for (let i = 0; i < curr_robot_length; i++) {
            var battery_disp = $('#battery_' + global_tabManager.robot_name[i]);
            var battery_dom = $('#battery_status_' + global_tabManager.robot_name[i]);
            var color = 'grey';
            if (global_tabManager.battery[i] < 23.1) {
                color = 'red';
            } else if (global_tabManager.battery[i] < 24.5) {
                color = 'orange';
            }
            battery_disp.html('<font color="' + color + '">' + global_tabManager.battery[i] + '</font>');
            battery_dom.html('<font color="' + color + '">' + global_tabManager.robot_name[i] + '</font>');

            var status_dom = $('#connection_status_' + global_tabManager.robot_name[i]);
            if (global_tabManager.incomm[i]) {
                status_dom.html('<font color="green">Connected</font>');
            }
            else {
                status_dom.html('<font color="red">Disconnected</font>');
            }

            var task = '';
            var task_dom = $('#task_status_' + global_tabManager.robot_name[i]);
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

        for (global_tabManager.i; global_tabManager.i < curr_robot_length; global_tabManager.i++) {
            global_tabManager.add_tab();
        }
    }

    // Function for adding additional vehicle tabs to gui and beacons to the beacon page
    add_tab() {
        let n = this.i;
        var robot = this.robot_name[n];

        console.log("Tab: " + robot);

        // Create an empty transform for the robot
        global_tabManager.transforms[robot] = new ROSLIB.Message({
            child_frame_id : robot,
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

        // This function (found below) gets up all the listeners for this robot
        this.listen_to_robot_topics(n, robot)

        global_tabManager.Tab_BatterySub[n].subscribe(function (msg) {
            global_tabManager.battery[n] = msg.data;
        });

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

        global_tabManager.joy[robot] = new ROSLIB.Topic({
            ros: ros,
            name: `${comms_prefix}${robot}/joy_base`,
            messageType: "sensor_msgs/Joy"
        })

        global_tabManager.tf_publisher[robot] = new ROSLIB.Topic({
            ros: ros,
            name: `${comms_prefix}${robot}/origin_from_base`,
            messageType: "geometry_msgs/TransformStamped"
        });

        // Creating tab at top of screen for selecting robot view
        $('#Robot_Tabs').append(robotTab(robot, n));


        $('#controls_bar_inner').append(controlCard(robot))

        // Creating information stored within the tab
        tabContent(robot);

        // Build the artifacts section for this robot
        robotArtifactSection(robot, n);

        // Buttons have to be added here or jquery doesn't see it in the DOM

        // Sets up all objects for vehicle artifact manager
        this.global_vehicleArtifactsList[n] = new Artifact(this.robot_name[n], n);
        updateRobotOptions();

        // Subscribes to artifact messages
        this.Tab_ArtifactSub[n].subscribe(function (msg) {
            global_tabManager.global_vehicleArtifactsList[n].set_artifacts(msg.artifacts);
        });
        this.Tab_ArtifactImgSub[n].subscribe(function (msg) {
            global_tabManager.global_vehicleArtifactsList[n].save_image(msg);
        });
        this.Tab_RobotLocation[n].subscribe(function (msg) {
            global_tabManager.global_vehicleArtifactsList[n].update_location(msg);
        });

        // Add to the Transform Transport dropdown
        var modal_options = document.getElementById("select_robot_transform");
        var option = document.createElement("option");
        option.text = robot;
        option.value = robot;
        modal_options.add(option);

        // Build the reset section for this robot
        robotReset(robot);

        document.getElementsByName("end_minutes_" + robot)[0].addEventListener("change", function() {
          var end_seconds = $(this).val() * 60;
          // Current time in seconds -- Note that when using sim time the times won't work!
          var now = new Date();
          var now_time = Math.floor(now.getTime() / 1000);
          // New time in seconds
          var new_time = now_time + end_seconds;
          // Get a readable time
          var date = new Date(new_time * 1000);
          var hours = date.getHours();
          var minutes = "0" + date.getMinutes();

          var end_time = document.getElementById("end_time_" + robot);
          end_time.dataset.time = new_time.toString();
          end_time.innerHTML = hours + ":" + minutes.substr(-2);
        });
    }

    // This is used by "add_tab" above
    listen_to_robot_topics(n, robot){
        this.Tab_BatterySub[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/battery",
            messageType: "std_msgs/Float32"
        });
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
        this.Tab_RobotLocation[n] = new ROSLIB.Topic({
            ros: ros,
            name: ma_prefix + robot + "/odometry",
            messageType: "nav_msgs/Odometry"
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


    get_TopicsFromROS() {
        update_topics_list(global_tabManager.search_robots);
    }

}

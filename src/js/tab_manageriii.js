var ANALYZE_TOPICS_LIST_INTERVAL = 2000;

// This is for sending messages to the robots to start, stop, or go home
function send_msg_to(robot_name, topic, value) {
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

// This is for inserting variables into strings
//      useful for adding data to html
// THIS IS A BACKUP INCASE THE TEMPLATE LITERALS DONT WORK
// String.prototype.format = function () {
//     var i = 0, args = arguments;
//     return this.replace(/{}/g, function () {
//         return typeof args[i] != 'undefined' ? args[i++] : '';
//     });
// };

// This deals with updating or creating the link status in the top bar
function link_stat_handler(robot_name, status) {
    // Look for the element on the page for that robot
    var robot_stat = document.getElementById(`connection_status_${robot_name}`);
    // If the robot is not already on the page we need to add it
    if (robot_stat == null) {
        create_robot_stat(robot_name, status);
    // Robot is on page, just update the status
    } else {
        update_robot_link(robot_name, status);
    }
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

function create_pose_array(robot_name, poses) {
    var now = new Date();
    let now_time = now.getTime() / 1000;

    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: "/" + robot_name + "/posearray",
        messageType: "geometry_msgs/PoseArray"
    })
    var msg = new ROSLIB.Message({
        header: {
            stamp: 1.0,
            frame_id: "darpa",
        },
        poses: poses
    })
    Topic.publish(msg);
}

var robots = [];

function update_robot_link(robot_name, stat) {
    if (stat == true) {
        // stat = 'Connected';
        color = 'green';
    } else {
        // stat = 'Disconnected';
        color = 'red';
    }
    var robot_element = document.getElementById(`connection_status_${robot_name}`);
    var control_element = document.getElementById(`${robot_name}_control`);
    robot_element.innerHTML = stat;
    robot_element.style.color = color;
    control_element.style.backgroundColor = color;
}

function create_robot_stat(robot_name, status) {
    var link_stat = `<li class="nav-item">
                    <a class="nav-link" onclick="window.openPage('${robot_name}') " id="${robot_name}_con_stat">${robot_name}<br>
                        <span id="connection_status_${robot_name}" syle="color:green"> ${status} </span>
                    </a>
                </li>`;
    document.getElementById('connections_bar_inner').innerHTML = link_stat;

    var control = `<li class="quick_control" id="${robot_name}_control" style="background-color:green">
                            <h1>${robot_name}</h1>
                            <a class="button btn btn-primary" id="${robot_name}_start" onclick="send_signal_to('${robot_name}', 'control', 'start'"> Start </a><br>
                            <a class="button" id="${robot_name}_stop" onclick="send_signal_to('${robot_name}', 'control', 'stop'"> Stop </a><br>
                            <a class="button" id="${robot_name}_home" onclick="send_signal_to('${robot_name}', 'control', 'go_home'"> go home</a><br>
                        </li>`;
    document.getElementById('controls_bar_inner').innerHTML = control;
}

function message_ingest(){
    // THIS LISTENS FOR MESSAGES COMING INTO THE BASE
    if
}

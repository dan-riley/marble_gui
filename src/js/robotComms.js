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
    // create a publisher
    var last_robot = "Base"
    teleop_listener.subscribe(function (message){
        if(teleop_robot != 'Base'){
            if(teleop_robot != last_robot){
                last_robot = teleop_robot;
                console.log("changed target robot")
            }
            var msg = new ROSLIB.Message(message);
            global_tabManager.joy[teleop_robot].publish(msg);
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

// This sends kyle's transform to the correct robot
function send_tf_to(){
    var robot = document.getElementById("select_robot_transform").value;

    // Transform Message essentials.  Would be better to just grab a template.
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

    // get data from the modal
    robot_transform.transform.translation.x = parseFloat(document.getElementById("x_translation").value);
    robot_transform.transform.translation.y = parseFloat(document.getElementById("y_translation").value);
    robot_transform.transform.translation.z = parseFloat(document.getElementById("z_translation").value);

    robot_transform.transform.rotation.x = parseFloat(document.getElementById("x_rotation").value);
    robot_transform.transform.rotation.y = parseFloat(document.getElementById("y_rotation").value);
    robot_transform.transform.rotation.z = parseFloat(document.getElementById("z_rotation").value);
    robot_transform.transform.rotation.w = parseFloat(document.getElementById("w_rotation").value);

    console.log("sending tf");
    // This is to deactivate the transform preview in rviz when sending the transform to the robot
    // var preview_button = document.getElementById("transform_preview_button");
    // if(preview_button.innerText != "Preview TF"){
    //     previewTransform();
    // }

    $('#TFModal').modal('hide');

    for(let i = 0; i < 10; i++){
        global_tabManager.tf_publisher[robot].publish(robot_transform);
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
        global_tabManager.transforms[robot_transform.child_frame_id] = robot_transform;

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

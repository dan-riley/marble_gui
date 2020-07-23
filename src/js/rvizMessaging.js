// This sends the goal pose from RVIZ to the correct robot
function listen_to_pose(){
    var pose_listener = new ROSLIB.Topic({
        ros: ros,
        name: '/robot_to_goal',
        messageType: 'geometry_msgs/Pose'
    });
   
    pose_listener.subscribe(function (message){
        goal_pose = message
    });
}

// This sends the goal pose to the robot
function publish_goal(robot){
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `Base/neighbors/${robot}/guiGoalPoint`,
        messageType: "geometry_msgs/Pose"
    });
    Topic.name = `Base/neighbors/${robot}/guiGoalPoint`;
    if(robot != 'base'){
        Topic.publish(goal_pose);
    }
    console.log()
}


// This sends the goal location to  the specified robot
// function publish_goalII(){
//     var opt = document.getElementById("teleop_robot_select");
//     var robot = opt.options[opt.selectedIndex].value;

//     var Topic = new ROSLIB.Topic({
//         ros: ros,
//         name: `Base/neighbors/${robot}/guiGoalPoint`,
//         messageType: "geometry_msgs/Pose"
//     });
    
//     Topic.name = `Base/neighbors/${robot}/guiGoalPoint`;
//     if(robot != 'Base'){
//         Topic.publish(goal_pose);
//     }
// }


// This send the goal near the pose of the specified robot
// function goal_to_robot(){
//     var opt = document.getElementById("teleop_robot_select");
//     var robot = opt.options[opt.selectedIndex].value;

//     console.log("goal to robot: " + robot);

//     var Topic = new ROSLIB.Topic({
//         ros: ros,
//         name: `/gui/goal_to_robot`,
//         messageType: "std_msgs/String"
//     });
//     var msg = new ROSLIB.Message({
//         data: robot
//     });
//     Topic.publish(msg);
// }

// This send the goal near the pose of the specified robot
function goal_to_robotII(robot){
    console.log("goal to robot: " + robot);

    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `/gui/goal_to_robot`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: robot
    });
    Topic.publish(msg);
}

function clear_rviz(){
    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `/gui/clear_markers`,
        messageType: "std_msgs/String"
    });
    var msg = new ROSLIB.Message({
        data: "clear"
    });
    Topic.publish(msg);
    
}


// This sends a fused artifact to the marker server
function send_fused_update(artifact, id, old_id) {
    // Important to catch these null artifacts
    if (artifact != undefined) {
        if (old_id)
            console.log("Updating fused artifact " + old_id + " with " + id)
        else
            console.log("Sending new fused artifact to server: " + id)

        var fused_pub = new ROSLIB.Topic({
            ros: ros,
            // You should probably make this actually work, it super doesn't now and current nick is too tired to deal with it
            name: `/gui/fused_artifact`,
            // Probably change this to a custom message
            messageType: "marble_gui/ArtifactTransport"
        });
        // console.log(artifact)
        // Use the pose to make life easy. just neglect the orientation stuff
        var pose = new ROSLIB.Message({
            object_class: artifact.obj_class,
            id: id,
            old_id: old_id,
            position: artifact.position,
            origin: "gui"
        });
        //   console.log(pose)
        fused_pub.publish(pose)
    }
}

// This will listen to and process the updates from the marker server to update the gui
function listen_to_markers(){
    var listener = new ROSLIB.Topic({
        ros : ros,
        name : '/mkr_srv_talkback',
        messageType : 'marble_gui/ArtifactTransport'
    });
    
    listener.subscribe(function(message) {
        // Kick this over to update fused artifacts
        update_fused_artifact(message);
        // listener.unsubscribe();
    });
}

// This tells the marker server to set a constant marker
function submitted_marker(artifact, success) {
    // Important to catch these null artifacts
    if (artifact != undefined) {
        console.log("Saving submitted artifact")
        var fused_pub = new ROSLIB.Topic({
            ros: ros,
            // You should probably make this actually work, it super doesn't now and current nick is too tired to deal with it
            name: `/gui/submitted`,
            // Probably change this to a custom message
            messageType: "marble_gui/ArtifactTransport"
        });
        // console.log(artifact)
        // Use the pose to make life easy. just neglect the orientation stuff
        var pose = new ROSLIB.Message({
            object_class: artifact.type,
            position: {
                x: artifact.x,
                y: artifact.y,
                z: artifact.z
            },
            origin: "gui",
            success: success
        });
        //   console.log(pose)
        fused_pub.publish(pose);
    }
}


// Send an odom message do the urdf can show the tf
function previewTransform(onoff){
    let robot_name = document.getElementById("select_robot_transform").value;

    var Topic = new ROSLIB.Topic({
        ros: ros,
        name: `${ma_prefix}${robot_name}_base/base_link`,
        messageType: "odometry_msgs/Pose"
    });

    if(onoff){
        var msg = new ROSLIB.Message({
            pose : {
                pose : {
                    position : {
                        x : parseFloat(document.getElementById("x_translation").value),
                        y : parseFloat(document.getElementById("y_translation").value),
                        z : parseFloat(document.getElementById("z_translation").value)
                    },
                    orientation : {
                        x : parseFloat(document.getElementById("x_rotation").value),
                        y : parseFloat(document.getElementById("y_rotation").value),
                        z : parseFloat(document.getElementById("z_rotation").value),
                        w : parseFloat(document.getElementById("w_rotation").value)
                    }
                }
                
    
            }
        });
    }else{
        var msg = new ROSLIB.Message({
            pose : {
                pose : {
                    position : {
                        x : 0,
                        y : 0,
                        z : 0
                    },
                    orientation : {
                        x : 0,
                        y : 0,
                        z : 0,
                        w : 0
                    }
                }
                
    
            }
        });
    }
    
    Topic.publish(msg);
}
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


// This moves the goal marker to the robot 
// This is a convienience so dan doesn't have to drag a marker through the whole map
function goal_to_robot(robot){
    let cur_robot_pose;
    
    // listen to Base/neighbors/${robot}/guiGoalPoint to get the current pose of the robot
    var odom_listener = new ROSLIB.Topic({
        ros : ros,
        name : `/Base/neighbors/${robot}/odometry`,
        messageType : 'nav_msgs/Odometry'
    });
    
    odom_listener.subscribe(function(message) {
        // get the pose info from the robot then un subscribe
        cur_robot_pose = message.pose.pose;
        odom_listener.unsubscribe();
    });
    
    
    var fused_pub = new ROSLIB.Topic({
        ros: ros,
        // You should probably make this actually work, it super doesn't now and current nick is too tired to deal with it
        name: `/gui/goal_to_robot`,
        // Probably change this to a custom message
        messageType: "geometry_msgs/Pose"
    });
    // console.log(artifact)
    // Use the pose to make life easy. just neglect the orientation stuff
    var pose = new ROSLIB.Message({
        position: cur_robot_pose,
        orientation: {
            x: 0,
            y: 0,
            z: 0,
            w: 1
        }
    });
    //   console.log(pose)
    fused_pub.publish(pose)
}


// This tells the marker server to set a constant marker
function submitted_marker(artifact_info, success) {
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
            object_class: artifact_info.type,
            position: {
                x: artifact_info.x,
                y: artifact_info.y,
                z: artifact_info.z
            },
            origin: "gui", 
            success: success
        });
        //   console.log(pose)
        fused_pub.publish(pose);
    }
}
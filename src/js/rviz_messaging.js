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

// This sends a fused artifact to the marker server
function send_fused_update(artifact, id){
    // Important to catch these null artifacts
    if(artifact != undefined){
        console.log("sending fused artifact to server: " + artifact)
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
            position: artifact.position,
            origin: "gui"
        });
        //   console.log(pose)
        fused_pub.publish(pose)
    }
}

function publish_goal(robot){
    var Topic = new ROSLIB.Topic({
        ros: ros,
        // You should probably make this actually work, it super doesn't now and current nick is too tired to deal with it
        name: `Base/neighbors/${robot}/guiGoalPoint`,
        messageType: "geometry_msgs/Pose"
    });
    Topic.name = `Base/neighbors/${robot}/guiGoalPoint`;
    if(robot != 'base'){
        Topic.publish(goal_pose);
    }
}

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


// This moves the goal to the robot
function goal_to_robot(robot){
    // how get pose of robot?

    var fused_pub = new ROSLIB.Topic({
        ros: ros,
        // You should probably make this actually work, it super doesn't now and current nick is too tired to deal with it
        name: `/gui/goal_to_robot`,
        // Probably change this to a custom message
        messageType: "geometry_msgs/Pose"
    });
}
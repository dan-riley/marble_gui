#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"

#include "markers.hpp"

#include <string>
#include <math.h>
#include <vector>

using namespace visualization_msgs;
using namespace std;

// Important kind of setup stuff
boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server;
interactive_markers::MenuHandler menu_handler;
ros::Publisher pub, goal_pub;


// This is the vector of artifact names in play right now
vector<string> artifact_names;


// This publishes the marker position when its moved in rviz
void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback){
	// std::ostringstream s;
	// s << "Feedback from marker '" << feedback->marker_name << "' "
	//   << " / control '" << feedback->control_name << "'";

	if(feedback->event_type == InteractiveMarkerFeedback::POSE_UPDATE){
        if(feedback->marker_name == "GOAL"){
            goal_pub.publish(feedback->pose);
        }else{
            marble_artifact_detection_msgs::Artifact updated_artifact;
            updated_artifact.position.x = feedback->pose.position.x;
            updated_artifact.position.y = feedback->pose.position.y;
            updated_artifact.position.z = feedback->pose.position.z;
            updated_artifact.obj_class = feedback->marker_name;
            updated_artifact.vehicle_reporter = "mkr_srvr";
            pub.publish(updated_artifact);
        }
		
	}

	// server->applyChanges();
}


// This makes a general 6dof marker
void makeMarker(int dof, geometry_msgs::Pose &pos, string &artifact_name){

    // Instatiate marker
    InteractiveMarker int_marker;  
    if(dof == 3){
        int_marker = make3dofMarker(pos, artifact_name);
    }
    if(dof == 6){
        cout << "CHOOSE 6 DOF" << endl;
        int_marker = make6dofMarker(pos, artifact_name);
    }
    // Error case 
    if(dof != 3 && dof != 6){
        ROS_ERROR("ERROR DEFINING MARKER DOF");
        return;
    }
	
	server->insert(int_marker);
	server->setCallback(int_marker.name, &processFeedback);
	
}


// This deals with marker messages
// It creates new markers and updates existing ones when necessary
// void markerCallback(marble_artifact_detection_msgs::Artifact &art){
//     // Not fully implemented
//     return; 
//     // Check Who sent the message
//   	if(art.vehicle_reporter ==  "gui"){
// 		geometry_msgs::Pose pos; 
// 		  // CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
// 		pos.position.x = art.position.x;
//         pos.position.y = art.position.y;
//         pos.position.z = art.position.z;
//         // "server->setPose" will return a truth value if that marker exists in the server
//         // If the artifact already exists
// 		if(server->setPose(art.obj_class, pos)){
// 			cout << "successfully updated marker " + art.obj_class << endl;
// 		// If the artifact needs to be made
//         }else{
// 			makeMarker(3, pos, art.obj_class);
// 		}
		
// 		server->applyChanges();
//   	}
// }


// This just inits the goal marker and keeps publishing the goal position
void initGoal(){
    geometry_msgs::Pose pos; 
    // CHECK TO MAKE SURE THESE ARE IN THE RIGHT PLACES
    pos.position.x = 0;
    pos.position.y = 0;
    pos.position.z = 0;
    string name = "GOAL";
    makeMarker(6, pos, name);
    server->applyChanges();
}


int main(int argc, char **argv){
	ros::init(argc, argv, "basic_controls");
	ros::init(argc, argv, "listener");
	ros::NodeHandle n;

	// create a timer to update the published transforms
	// ros::Timer frame_timer = n.createTimer(ros::Duration(0.01), frameCallback);

	server.reset(new interactive_markers::InteractiveMarkerServer("basic_controls", "", false));

	ros::Duration(0.1).sleep();

	// subscribe to fused artifacts
	// ros::Subscriber sub = n.subscribe("fused_artifacts", 10, markerCallback);
	pub = n.advertise<marble_artifact_detection_msgs::Artifact>("mkr_srv_talkback", 5);
    goal_pub = n.advertise<geometry_msgs::Pose>("robot_to_goal", 10);
    
    
	server->applyChanges();

    initGoal();

	ros::spin();

	server.reset();
}
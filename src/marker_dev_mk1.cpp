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
#include <algorithm>

using namespace visualization_msgs;
using namespace std;

// Important kind of setup stuff
boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server;
// boost::shared_ptr<ros::NodeHandle> n;
interactive_markers::MenuHandler menu_handler;
ros::Publisher pub;
ros::Publisher goal_pub;
string world_frame;
geometry_msgs::Pose robot_goal;


// This is the vector of artifact names in play right now
vector<string> logged_artifacts;


// This publishes the marker position when its moved in rviz
void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback){
	// std::ostringstream s;
	// s << "Feedback from marker '" << feedback->marker_name << "' "
	//   << " / control '" << feedback->control_name << "'";

	if(feedback->event_type == InteractiveMarkerFeedback::POSE_UPDATE){
        if(feedback->marker_name == "GOAL"){
            // geometry_msgs::Pose pos;
            robot_goal.position = feedback->pose.position;
            robot_goal.orientation = feedback->pose.orientation;
            // goal_pub.publish(pos);
            // cout << "updating goal: " << pos << endl;
            // ros::spinOnce();
        }else{
            cout << feedback->marker_name << endl;
            // [artifact name] [artifact id]
            string* identifiers = getIdFromName(feedback->marker_name);
            cout << identifiers << endl;
            marble_gui::ArtifactTransport updated_artifact;
            updated_artifact.position.x = feedback->pose.position.x;
            updated_artifact.position.y = feedback->pose.position.y;
            updated_artifact.position.z = feedback->pose.position.z;
            updated_artifact.object_class = identifiers[0];
            updated_artifact.id = identifiers[1];
            updated_artifact.origin = "mkr_srvr";
            pub.publish(updated_artifact);
            delete[] identifiers;
            // cout << "you moved " << identifiers[0] << endl;
        }
		
	}

	// server->applyChanges();
}


string* getIdFromName(string glob){
    int globby_boi = glob.length(); 
  
    // declaring character array to make strtok happy
    char char_array[globby_boi + 1]; 
  
    // copying the contents of the 
    // string to char array 
    strcpy(char_array, glob.c_str()); 
    // [artifact name] [artifact id]
    string* components = new string[2];
    
    char *token = strtok(char_array, "||"); 
    
    // Keep printing tokens while one of the 
    // delimiters present in str[]. 
    for(int i = 0; i < 2; i++) {
        components[i] = token; 
        token = strtok(NULL, "||"); 
    } 

    return components; 
}


// This makes a general 6dof marker
void makeMarker(int dof, geometry_msgs::Pose &pos, const string &artifact_name, const string &id){

    // Instatiate marker
    InteractiveMarker int_marker;  
    if(dof == 3){
        cout << "making 3dof marker" << endl;
        int_marker = make3dofMarker(pos, artifact_name, id, world_frame);
    }
    if(dof == 6){
        cout << "CHOOSE 6 DOF" << endl;
        int_marker = make6dofMarker(pos, artifact_name, world_frame);
    }
    // Error case 
    if(dof != 3 && dof != 6){
        ROS_ERROR("ERROR DEFINING MARKER DOF");
        return;
    }
	
	server->insert(int_marker);
	server->setCallback(int_marker.name, &processFeedback);
	
}

bool check_for_artifact(string &name){
    if (std::find(logged_artifacts.begin(), logged_artifacts.end(), name) != logged_artifacts.end()){
        return true;
    }
    // Because this will be a new marker we added it to the logged vector in here to make life easier
    logged_artifacts.push_back(name);
    return false;

}


// This deals with marker messages
// It creates new markers and updates existing ones when necessary
void markerCallback(const marble_gui::ArtifactTransport &art){
    // Not fully implemented
    // return;
    // cout << "hit the marker callback" << endl;
    if(art.origin ==  "gui"){
        geometry_msgs::Pose pos; 
		// CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
		pos.position.x = art.position.x;
        pos.position.y = art.position.y;
        pos.position.z = art.position.z;
        string full_name = art.object_class + "||" + art.id;
        // Check to see if we already have this artifact
        if(check_for_artifact(full_name)){
            server->setPose(full_name, pos);
            cout << "successfully updated marker " + full_name << endl;
        }else{
            cout << "making a new marker for " + art.object_class << endl;
            makeMarker(3, pos, art.object_class, art.id);
        }
        server->applyChanges();
    }
}


// This just inits the goal marker and keeps publishing the goal position
void initGoal(){
    geometry_msgs::Pose pos; 
    // CHECK TO MAKE SURE THESE ARE IN THE RIGHT PLACES
    pos.position.x = 0;
    pos.position.y = 0;
    pos.position.z = 0;
    string name = "GOAL";
    // Note: using "name" twice was to get around the ID thing
    makeMarker(6, pos, name, name);
    server->applyChanges();
    // cout << "applied changes to server" << endl;
    publishGoal();
}

void publishGoal(){
    ros::Rate r(10); // 10 hz
    while(ros::ok){
        goal_pub.publish(robot_goal);
        ros::spinOnce();
        r.sleep();
    }
}

// void goalToRobot(msg) soon!


int main(int argc, char **argv){
	ros::init(argc, argv, "int_mkr_srv");
	// ros::init(argc, argv, "listener");
    ros::NodeHandle n;

	if(!n.getParam("frame", world_frame)){
        cout << "something wrong with your frame parameter" << endl;
        return 1;
    }
    cout << "started marker server" << endl;

	// create a timer to update the published transforms
	// ros::Timer frame_timer = n.createTimer(ros::Duration(0.01), frameCallback);

	server.reset(new interactive_markers::InteractiveMarkerServer("gui_god", "", false));

	ros::Duration(0.1).sleep();

	// subscribe to fused artifacts
	ros::Subscriber sub = n.subscribe("/gui/fused_artifact", 10, markerCallback);
	pub = n.advertise<marble_gui::ArtifactTransport>("mkr_srv_talkback", 5);
    goal_pub = n.advertise<geometry_msgs::Pose>("robot_to_goal", 10);
    
    
	server->applyChanges();

    initGoal();


	ros::spin();

	server.reset();
}
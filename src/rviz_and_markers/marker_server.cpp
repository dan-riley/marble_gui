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
// This publishes the submitted artifact marker to rviz
ros::Publisher sub_mkr_pub;
// This publishes the updated location of any interactive marker
ros::Publisher pub;
// This publishes the goal pose for the gui
ros::Publisher goal_pub;
// This is so that everything can work on the same world frame
string world_frame;
// store the offsets for the text of the submitted marker -> get from launch file 
// [x, y, z]
float sub_text_offsets[3];
// This keeps track of the the goal pose so it can be published constantly 
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
            robot_goal.position = feedback->pose.position;
            robot_goal.orientation = feedback->pose.orientation;
            
        }else{
            string* identifiers = getIdFromName(feedback->marker_name);
            // cout << identifiers << endl;
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
}


// This deals with marker messages
// It creates new markers and updates existing ones when necessary
void markerCallback(const marble_gui::ArtifactTransport &art){
    if(art.origin ==  "gui"){
        geometry_msgs::Pose pos; 
		// CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
		pos.position.x = art.position.x;
        pos.position.y = art.position.y;
        pos.position.z = art.position.z;
        string full_name = art.object_class + "||" + art.id;
        string old_name = art.object_class + "||" + art.old_id;

        // Check to see if we already have this artifact
        if(check_for_artifact(full_name)){
            server->setPose(full_name, pos);
            cout << "successfully updated marker " + full_name << endl;
        } else if (!art.old_id.empty() && check_for_artifact(old_name)) {
            server->erase(old_name);
            makeMarker(3, pos, art.object_class, art.id);
            cout << "moved marker " + old_name + " to " + full_name << endl;
        }else{
            cout << "making a new marker for " + art.object_class << endl;
            makeMarker(3, pos, art.object_class, art.id);
        }
        server->applyChanges();
    }
}



// This sends the goal to the same area as a robot
void goalToRobotCallback(geometry_msgs::Pose msg){
    geometry_msgs::Pose pos;
    pos = msg;
    pos.position.x += 1;
    pos.position.y += 1;
    server->setPose("GOAL", msg);
}



// This seperates the ID from the NAME of the marker
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



// This makes a marker
void makeMarker(int dof, geometry_msgs::Pose &pos, const string &artifact_name, const string &id){

    // Instatiate marker
    InteractiveMarker int_marker;  
    if(dof == 3){
        cout << "making 3dof marker" << endl;
        int_marker = make3dofMarker(artifact_name, id, world_frame);
    }
    if(dof == 6){
        cout << "CHOOSE 6 DOF" << endl;
        int_marker = make6dofMarker(artifact_name, world_frame);
    }
    // Error case 
    if(dof != 3 && dof != 6){
        ROS_ERROR("ERROR DEFINING MARKER DOF");
        return;
    }
	
	server->insert(int_marker);
	server->setCallback(int_marker.name, &processFeedback);
    server->setPose(int_marker.name, pos);
}


// This checks for the existance ofan artifact in the logged artifact vector  9135-
bool check_for_artifact(string &name){
    if (std::find(logged_artifacts.begin(), logged_artifacts.end(), name) != logged_artifacts.end()){
        return true;
    }
    // Because this will be a new marker we added it to the logged vector in here to make life easier
    logged_artifacts.push_back(name);
    return false;

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


// This continuiousely publishes the goal marker position
void publishGoal(){
    ros::Rate r(1); // 1 hz
    while(ros::ok){
        goal_pub.publish(robot_goal);
        ros::spinOnce();
        r.sleep();
    }
}


// This deletes a marker from the server and from the logged artifacts vector
void deleteMarker(string marker_name){
    // find the index of the marker in the vector
    vector<string>::iterator itr = std::find(logged_artifacts.begin(), logged_artifacts.end(), marker_name);
    // If the marker exists then remove it
    if(iter != logged_artifacts.cend()){
        // remove it from the logged artifact vector
        logged_artifacts.remove(iter);
        // remove it from the server
        server->erase(marker_name);
        server->applyChanges();
    } 
}


// This makes then publishes the non-interactive markers for the submitted artifacts
void sumbitted_marker_callback(const marble_gui::ArtifactTransport &art){
    Marker sub_markers[2] = makeSubmittedMarker(art, world_frame, sub_text_offsets);
    // Publish the sphere marker and the marker name in the correct colors at the correct locations
    // This is the sphere marker
    sub_mkr_pub.publish(sub_markers[0]);
    // This is the text marker
    sub_mkr_pub.publish(sub_markers[1]);
    delete sub_markers;
}


// This gets the x, y, z offsets for the text of the submitted artifacts
void setOffsets(ros::NodeHandle* nh){
    if(!n.getParam("sub_offset_text_x", sub_text_offsets[0])){
        cout << "something wrong with your offset x parameter" << endl;
        exit(EXIT_FAILURE);
    }
    if(!n.getParam("sub_offset_text_y", sub_text_offsets[1])){
        cout << "something wrong with your offset y parameter" << endl;
        exit(EXIT_FAILURE);
    }
    if(!n.getParam("sub_offset_text_z", sub_text_offsets[2])){
        cout << "something wrong with your offset z parameter" << endl;
        exit(EXIT_FAILURE);
    }
}

 

int main(int argc, char **argv){
	ros::init(argc, argv, "int_mkr_srv");
    ros::NodeHandle n;

    // Get the world frame parameterfrom the launch file
	if(!n.getParam("frame", world_frame)){
        cout << "something wrong with your frame parameter" << endl;
        exit(EXIT_FAILURE);
    }
    // Get the submitted text marker offsets from the launch file
    setOffsets(&n)

    cout << "started marker server" << endl;
	server->reset(new interactive_markers::InteractiveMarkerServer("gui_god", "", false));
	ros::Duration(0.1).sleep();

	// subscribe to fused artifacts
	ros::Subscriber sub = n.subscribe("/gui/fused_artifact", 10, markerCallback);
    // scribe to the the gui setting the goal to be closer to a robot
    ros::Subscriber goal_sub = n.subscribe("/gui/goal_to_robot", 10, goalToRobotCallback);
    // subscribe to the submitted artifact topic from the gui
    ros::Subscriber submitted_sub = n.subscribe("/gui/submitted", 10, sumbitted_marker_callback)


    // updates to gui about fused artifacts
	pub = n.advertise<marble_gui::ArtifactTransport>("mkr_srv_talkback", 1);
    // sends the goal for the robot to the gui
    goal_pub = n.advertise<geometry_msgs::Pose>("robot_to_goal", 10);
    // send non interactive markers to rviz
    sub_mkr_pub = n.advertise<visualization_msgs::Marker>("submitted_marker", 1);
    
    
	server->applyChanges();

    // This initializes the goal interactive marker
    initGoal();

	ros::spin();

	server->reset();
}

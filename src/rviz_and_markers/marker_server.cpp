#include <ros/ros.h>
#include <ros/console.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include <iostream>
#include <fstream>
#include <string>
#include <math.h>
#include <vector>
#include <algorithm>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"
#include "marble_gui/TransformPreview.h"

#include "markers.hpp"
#include "Robot.hpp"
#include "marker_server.hpp"
#include "utilities.hpp"

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
// Save transform preview from kyle
geometry_msgs::TransformStamped kylePreviewTF;

// This is so that everything can work on the same world frame
string world_frame;
// store the offsets for the text of the submitted marker -> get from launch file
// [x, y, z]
float sub_text_offsets[3];

// This scales the size of the robots in rviz
float robot_scale = 1.0;

// This keeps track of the the goal pose so it can be published constantly
geometry_msgs::Pose robot_goal;
// This is the vector of artifact names in play right now
vector<string> logged_artifacts;
// Submitted markers array so we can just append to it
visualization_msgs::MarkerArray submitted_markers;
int num_submitted = 0;

// This vector has all of the robots being tracked right now
vector<Robot*> robots;

// This publishes the marker position when its moved in rviz
void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback){

    try{
        if (feedback->event_type == InteractiveMarkerFeedback::POSE_UPDATE) {
            if (feedback->marker_name == "GOAL") {
                robot_goal.position = feedback->pose.position;
                robot_goal.orientation = feedback->pose.orientation;
            } else {
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
    catch(const std::exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    
   
}

// This deals with marker messages
// It creates new markers and updates existing ones when necessary
void markerCallback(const marble_gui::ArtifactTransport &art){
    if (art.origin ==  "gui") {
        geometry_msgs::Pose pos;
        // CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
        pos.position.x = art.position.x;
        pos.position.y = art.position.y;
        pos.position.z = art.position.z;
        string full_name = art.object_class + "||" + art.id;
        string old_name = art.object_class + "||" + art.old_id;

        // Check to see if we already have this artifact
        if (check_for_artifact(full_name, logged_artifacts)) {
            server->setPose(full_name, pos);
            cout << "successfully updated marker " + full_name << endl;
        } else if (!art.old_id.empty() && check_for_artifact(old_name, logged_artifacts)) {
            server->erase(old_name);
            makeMarker(3, pos, art.object_class, art.id);
            cout << "moved marker " + old_name + " to " + full_name << endl;
        } else {
            cout << "making a new marker for " + art.object_class << endl;
            makeMarker(3, pos, art.object_class, art.id);
        }
        server->applyChanges();
    }
}

// This makes a marker
void makeMarker(int dof, geometry_msgs::Pose &pos, const string &artifact_name, const string &id) {
    // Instatiate marker
    InteractiveMarker int_marker;
    if (dof == 3) {
        cout << "making 3dof marker" << endl;
        int_marker = make3dofMarker(artifact_name, id, world_frame);
    }
    if (dof == 6) {
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
    while (ros::ok) {
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
    if (itr != logged_artifacts.cend()) {
        // remove it from the logged artifact vector
        logged_artifacts.erase(itr);
        // remove it from the server
        server->erase(marker_name);
        server->applyChanges();
        cout << "deleted " << marker_name << endl;
    }
    cout << "finished delete marker" << endl;
}

// This makes then publishes the non-interactive markers for the submitted artifacts
void submittedMarkerCallback(const marble_gui::ArtifactTransport &art){
    // Build the marker for this artifact
    Marker marker = makeSubmittedMarker(art, world_frame);
    // Adjust the id or only the most recent will display
    marker.id = num_submitted;
    num_submitted++;
    // Add to the array and publish
    submitted_markers.markers.push_back(marker);
    sub_mkr_pub.publish(submitted_markers);
}

// This gets the x, y, z offsets for the text of the submitted artifacts
void setOffsets(ros::NodeHandle* nh){
    if (!nh->getParam("sub_offset_text_x", sub_text_offsets[0])) {
        cout << "something wrong with your offset x parameter" << endl;
        exit(EXIT_FAILURE);
    }
    if (!nh->getParam("sub_offset_text_y", sub_text_offsets[1])) {
        cout << "something wrong with your offset y parameter" << endl;
        exit(EXIT_FAILURE);
    }
    if (!nh->getParam("sub_offset_text_z", sub_text_offsets[2])) {
        cout << "something wrong with your offset z parameter" << endl;
        exit(EXIT_FAILURE);
    }
}

// gets the robot pose for a specified robot
geometry_msgs::Pose get_robot_pose(const std_msgs::String& robot_name){
    // look for the correct robot
    // this should be changed to a better search algorithm in the future
    for (int i = 0; i < robots.size(); i++) {
        cout << robots[i]->name << endl;
        if (robots[i]->name == robot_name.data) {
            cout << "found robot and pose" << endl;
            return robots[i]->getPose();
        }
    }
    cout << "never found robot" << endl;
    // Error case, dont do anything
    return robot_goal;
}

// This should move the goal to the robot
void goal_to_robot(const std_msgs::String& robot_name) {
    geometry_msgs::Pose near_robot_pose = get_robot_pose(robot_name);

    // Change the pose marker to be close but not on top of the robot
    near_robot_pose.position.z += 1;

    cout << near_robot_pose << endl;

    server->setPose("GOAL", near_robot_pose);
    server->applyChanges();

    cout << "Got goal_to_robot" << endl;
}


// This applies a preview of the transform kyle sends
void preview_tf(const marble_gui::TransformPreview &msg){
    cout << "preview hit" << endl;
    // look for robot with name
    for(auto robot : robots){
        if(robot->name == msg.robot_name.c_str()){
            if(robot->PreviewState()){
                robot->TurnOffTFPreview();
            }else{
                robot->PreviewTF(msg.transform);
            }
        }
    }
    cout << "previewing" << endl;
}

// This removes all artifact markers from rviz
void clearMarkers(const std_msgs::String::ConstPtr& msg){
    cout << "clearing markers" << msg->data << endl;
    for(string marker : logged_artifacts){
        cout << "deleting " << marker << " from marker server" << endl;
        // remove it from the server
        server->erase(marker);
        server->applyChanges();
    }
    logged_artifacts.clear();
    for(int i = 0; i < num_submitted; i++){
        submitted_markers.markers[i].action = visualization_msgs::Marker::DELETE;
    }
    sub_mkr_pub.publish(submitted_markers);
}


//=======================================================
// MAIN
//=======================================================
int main(int argc, char **argv) {

    ros::init(argc, argv, "int_mkr_srv");

    ros::NodeHandle nh;

    // reset the interactive marker server so it works
    server.reset(new interactive_markers::InteractiveMarkerServer("gui_god", "", false));

    // Get the world frame parameterfrom the launch file
    if (!nh.getParam("frame", world_frame)) {
        cout << "something wrong with your frame parameter" << endl;
        exit(EXIT_FAILURE);
    }else{
        cout << "world frame set to: " + world_frame << endl;
    }

    // Get the submitted text marker offsets from the launch file
    setOffsets(&nh);

    // initialize robots vector for goal to robot functionality
    // Make a new robot and add it to the robots vector
    vector<string> robot_names = get_config_robots(&nh);
    for (auto i = 0; i < robot_names.size(); i++) {
        Robot *new_robot = new Robot(&nh, robot_names[i], robot_scale, server);
        robots.push_back(new_robot);
    }

    // Read in the robot names from the config
    vector<string> config_robots = get_config_robots(&nh);

    
    ros::Duration(0.1).sleep();

    // subscribe to fused artifacts
    ros::Subscriber sub = nh.subscribe("/gui/fused_artifact", 10, markerCallback);
    // scribe to the the gui setting the goal to be closer to a robot
    ros::Subscriber goal_sub = nh.subscribe("/gui/goal_to_robot", 10, goal_to_robot);
    // subscribe to the submitted artifact topic from the gui
    ros::Subscriber submitted_sub = nh.subscribe("/gui/submitted", 10, submittedMarkerCallback);

    // subscribe to the gui for clearing rviz markers
    ros::Subscriber clear_sub = nh.subscribe("/gui/clear_markers", 10, clearMarkers);

    // Use this to activate the transform preview
    ros::Subscriber transform_preview = nh.subscribe("/gui/transform_preview", 10, preview_tf);

    // updates to gui about fused artifacts
    pub = nh.advertise<marble_gui::ArtifactTransport>("mkr_srv_talkback", 1);
    // sends the goal for the robot to the gui
    goal_pub = nh.advertise<geometry_msgs::Pose>("robot_to_goal", 10);
    // send non interactive markers to rviz
    sub_mkr_pub = nh.advertise<visualization_msgs::MarkerArray>("submitted_markers", 1);

    server->applyChanges();

    // This initializes the goal interactive marker
    initGoal();

    cout << "inited goal" << endl;


    // The "main" loop
    ros::Rate loop_rate(10);
    while(true){
        if(ros::ok()){
            ros::spinOnce();
            cout << "heart beat" << endl;
            loop_rate.sleep();
        }else{
            cout << "server reset" << endl;
            // server.reset();

            for(int i = 0; i < robots.size(); i++)
                delete robots[i];

            // delete the server
            server.reset();
            
            return 0;
            // exit(0);
            
        }
        
    }

    return 0;
    
}

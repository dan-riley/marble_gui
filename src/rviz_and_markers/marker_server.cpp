#include <ros/ros.h>

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

#include "markers.hpp"
#include "Robot.hpp"
#include "marker_server.hpp"



using namespace visualization_msgs;
using namespace std;
// using namespace robot;

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

// This scales the size of the robots in rviz
float robot_scale = 1.0;

// This keeps track of the the goal pose so it can be published constantly
geometry_msgs::Pose robot_goal;
// This is the vector of artifact names in play right now
vector<string> logged_artifacts;
// Submitted markers array so we can just append to it
visualization_msgs::MarkerArray submitted_markers;
int num_submitted = 0;


// This verctor has all of the robots being tracked right now
// CRH: moved from global to main, but there is a dependency in get_robot_pose which would require handing off this vector.
vector<Robot> robots;

// ros::NodeHandle n;

// This publishes the marker position when its moved in rviz
void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback){
    // std::ostringstream s;
    // s << "Feedback from marker '" << feedback->marker_name << "' "
    //   << " / control '" << feedback->control_name << "'";

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
        if (check_for_artifact(full_name)) {
            server->setPose(full_name, pos);
            cout << "successfully updated marker " + full_name << endl;
        } else if (!art.old_id.empty() && check_for_artifact(old_name)) {
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
    for (int i = 0; i < 2; i++) {
        components[i] = token;
        token = strtok(NULL, "||");
    }

    return components;
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

// This checks for the existance ofan artifact in the logged artifact vector  9135-
bool check_for_artifact(string &name){
    if (std::find(logged_artifacts.begin(), logged_artifacts.end(), name) != logged_artifacts.end()) {
        return true;
    }
    // Because this will be a new marker we added it to the logged vector in here to make life easier
    logged_artifacts.push_back(name);
    return false;
}

// This just inits the goal marker and keeps publishing the goal position
void initGoal(Robot* testrobot){
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
    publishGoal(testrobot);
}

// This continuiousely publishes the goal marker position
void publishGoal(Robot* testrobot){
    ros::Rate r(1); // 1 hz
    while (ros::ok) {
        cout << testrobot->pose_ << endl;
        // for (int i = 0; i < robots.size(); i++) {
        //   cout << robots[i].test << endl;
        //   cout << robots[i].pose_ << endl;
        // }
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
    }
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
  // cout << testrobot->name << endl;
    // return testrobot->pose_;
    // look for the correct robot
    // this should be changed to a better search algorithm in the future
    // for(auto i = 0; i < robots.size(); i++){
    //     cout << robots[i].name << endl;
    //     if(robots[i].name == robot_name.data){
    //         cout << "found robot and pose" << endl;
    //         cout << robots[i].name;
    //         cout << " ";
    //         cout << robot_name.data;
    //         cout << robots[i].pose_ << endl;
    //         return robots[i].pose_;
    //     }
    // }
    // cout << "never found robot" << endl;
    // // Error case, dont do anything
    // return robot_goal; 
}

// This should move the goal to the robot
void goal_to_robot(const std_msgs::String& robot_name){
    geometry_msgs::Pose near_robot_pose = get_robot_pose(robot_name);

    // Change the pose marker to be close but not on top of the robot
    // near_robot_pose.position.x += 1;
    // near_robot_pose.position.y += 1;
    // near_robot_pose.position.z += 0.5;

    // cout << near_robot_pose << endl;

    server->setPose("GOAL", near_robot_pose);   
    server->applyChanges();

    cout << "Got goal_to_robot" << endl;
}


// This reads the config used for the js to get the robot names in play
vector<string> get_config_robots( ros::NodeHandle* nh ){
    vector<string> robot_names;
    string new_robot;
    string config_name;

    nh->getParam("robot_names_config", config_name);

    ifstream config_file(config_name);
    if (config_file.is_open()){
        while(getline(config_file, new_robot)){
            robot_names.push_back(new_robot);
        }
        config_file.close();
    }else{
        cout << "Unable to open robots config file" << endl;
    }
    return robot_names;
}


//=======================================================
// MAIN
//=======================================================
int main(int argc, char **argv) {
    ros::init(argc, argv, "int_mkr_srv");

    // ros::NodeHandle* nh = nullptr;
    ros::NodeHandle nh;
    // CRH: removed the below line when I moved the above away from global.
   // nh.reset(new ros::NodeHandle);

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
    // for(auto i = 0; i < robot_names.size(); i++){
    //     Robot *new_robot = new Robot(&nh, robot_names[i], robot_scale);
    //     robots.push_back(*new_robot);
    // }

    // Read in the robot names from the config
    vector<string> config_robots = get_config_robots(&nh);

    server.reset(new interactive_markers::InteractiveMarkerServer("gui_god", "", false));
    ros::Duration(0.1).sleep();

    // subscribe to fused artifacts
    ros::Subscriber sub = nh.subscribe("/gui/fused_artifact", 10, markerCallback);
    // scribe to the the gui setting the goal to be closer to a robot
    ros::Subscriber goal_sub = nh.subscribe("/gui/goal_to_robot", 10, goal_to_robot);
    // subscribe to the submitted artifact topic from the gui
    ros::Subscriber submitted_sub = nh.subscribe("/gui/submitted", 10, submittedMarkerCallback);

    // cout << robots[0].pose_ << endl;
    // REMOVE THIS AND ADD IT BASED ON THE robots.txt FILE
    // http://www.cplusplus.com/doc/tutorial/files/
    // This adds a robot to the vector of robots
    // ros::Subscriber add_robot = nh->subscribe("/gui/add_robot", 10, add_robot_callback);

    // updates to gui about fused artifacts
    pub = nh.advertise<marble_gui::ArtifactTransport>("mkr_srv_talkback", 1);
    // sends the goal for the robot to the gui
    goal_pub = nh.advertise<geometry_msgs::Pose>("robot_to_goal", 10);
    // send non interactive markers to rviz
    sub_mkr_pub = nh.advertise<visualization_msgs::MarkerArray>("submitted_markers", 1);

    Robot *testrobot = new Robot(&nh, "X1", robot_scale);
  cout << testrobot->name << endl;
    server->applyChanges();

    // This initializes the goal interactive marker
    initGoal(testrobot);
    ros::spin();
    server.reset();
}

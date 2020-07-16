#include <ros/ros.h>
#include <nav_msgs/Odometry.h>
#include <geometry_msgs/Pose.h>
#include <geometry_msgs/TransformStamped.h>
#include <cmath>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include "Robot.hpp"

using namespace visualization_msgs;
using namespace std;


Robot::Robot(ros::NodeHandle* nh, std::string robot_name, float scale, boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server){
    try{
        nh_ = *nh;
        nh_.getParam("frame", world_frame_);
        name = robot_name;
        scale_ = scale;

        // this makes the interactive marker server usable here inside the robot object
        server_ = server;

        string prefix;
        nh_.getParam("ma_prefix", prefix);
        odom_sub = nh_.subscribe(prefix + robot_name + "/odometry", 10, &Robot::update_robot_callback, this);    

        // Decide wether to use robot mesh. use of meshes has a performance penalty
        bool to_show;
        // This actually gets the option from the launch file
        nh_.getParam("show_robot_mesh", to_show);
        if(to_show){
            cout << "showing robot mesh" << endl;
            makeRobotMarker();
        }
        
        // menu_handler_.insert("Goal to robot", &Robot::processFeedback);
        // menu_handler_.insert("Go to goal", &Robot::processFeedback);
        //menu_handler_.insert("preview tf", &Robot::processFeedback);
    }
    catch(const std::exception& e){
        cout << "there was an error making the new robot" << endl;
    }

}

// This is the upodate callback for getting the robot's current pose showing that in rviz
void Robot::update_robot_callback(const nav_msgs::Odometry odom){
    
    // get the robot pose from the odom
    pose_.position = odom.pose.pose.position;
    pose_.orientation = odom.pose.pose.orientation;

    // cout << name << "pose update in rviz" << pose_ << endl;

    // this integrates with the tf preview system and can stop this piece of code from showing new odom messages
    if(listen_to_odom_ == true){
        // This is where the inteactive marker server updates the robot pose
        server_->setPose(name, pose_);
        server_->applyChanges();
    }

    return;
}

// Returns the pose of the robot
geometry_msgs::Pose Robot::getPose() {
  return pose_;
}

// This makes the model of the robot for rviz
Marker Robot::makeModel(){
    Marker marker;
    
    marker.type = Marker::MESH_RESOURCE;

    // match robot to its virtual mesh
    if(name.find('H') != std::string::npos){
        marker.mesh_resource = "package://marble_gui/src/meshes/H01.STL";
        cout << "H01 mesh" << endl;
    }else if(name.find('T') != std::string::npos){
        marker.mesh_resource = "package://marble_gui/src/meshes/T01.STL";
        cout << "T01 mesh" << endl;
    }else if(name.find('A') != std::string::npos){
        marker.mesh_resource = "package://marble_gui/src/meshes/A01.STL";
        cout << "A01 mesh" << endl;
    }else if(name.find('L') != std::string::npos){
        marker.mesh_resource = "package://marble_gui/src/meshes/L01.STL";
        cout << "L01 mesh" << endl;
    }else{
        // Backup resopurce for unknown robots
        marker.mesh_resource = "package://marble_gui/src/meshes/wheatley.STL";
        cout << "wheatley mesh" << endl;
    }
    
    marker.scale.x = scale_ * 0.45;
    marker.scale.y = scale_ * 0.45;
    marker.scale.z = scale_ * 0.45;
    marker.color.r = 0.5;
    marker.color.g = 0.5;
    marker.color.b = 0.5;
    marker.color.a = 1.0;

    return marker;
}

// This makes the marker object for the robot
void Robot::makeRobotMarker(){

    InteractiveMarker int_marker;
    // Change this probably
    int_marker.header.frame_id = world_frame_;
    int_marker.scale = 1;

    int_marker.name = name;
    int_marker.description = name;

    InteractiveMarkerControl control;

    control.interaction_mode = InteractiveMarkerControl::MENU;
    control.name = name + "_control";

    Marker marker = makeModel();
    control.markers.push_back(marker);
    control.always_visible = true;
    int_marker.controls.push_back(control);

    server_->insert(int_marker);
    server_->setCallback(int_marker.name, boost::bind(&Robot::processFeedback, this, _1));
    menu_handler_.apply(*server_, int_marker.name);
    return;
}


// Deal with interacting with robot 
void Robot::processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback){
    
    // For future update to move goal to robot and send robot to goal
    if(feedback->event_type == visualization_msgs::InteractiveMarkerFeedback::MENU_SELECT){
        cout << "menu entry id" << endl;
        cout << feedback->menu_entry_id << endl;
        cout << "mouse point" << endl;
        cout << feedback->mouse_point.x << feedback->mouse_point.y << feedback->mouse_point.z << endl; 
        // std::ostringstream s;
        // s << "Feedback from marker '" << feedback->marker_name << "' "
        // << " / control '" << feedback->control_name << "'";
        // ROS_INFO_STREAM( s.str() << ": menu item " << feedback->menu_entry_id << " clicked" << mouse_point_ss.str() << "." );

    }
    return;
}


// this temporarily changes the robot pose (just its marker) to preview incoming transform
void Robot::PreviewTF(const geometry_msgs::Transform tf){

    listen_to_odom_ = false;

    // get the robot pose from the odom
    geometry_msgs::Pose preview;
    // This is stupid because point is the same as vector3 but we'll roll with it
    preview.position.x = tf.translation.x;
    preview.position.y = tf.translation.y;
    preview.position.z = tf.translation.z;
    preview.orientation.x = tf.rotation.x;
    preview.orientation.y = tf.rotation.y;
    preview.orientation.z = tf.rotation.z;
    preview.orientation.w = tf.rotation.w;

    // This is where the inteactive marker server updates the robot pose
    server_->setPose(name, preview);
    server_->applyChanges();

    cout << "previewing transform" << endl;

    return;
}

// This just resets the the robot pose to use 
void Robot::TurnOffTFPreview(){

    listen_to_odom_ = true;

    server_->setPose(name, pose_);
    server_->applyChanges();

    return;
}


bool Robot::PreviewState(){
    return !listen_to_odom_;
}
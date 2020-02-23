#include <ros/ros.h>
#include <nav_msgs/Odometry.h>
#include <geometry_msgs/Pose.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include "Robot.hpp"


boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server;
interactive_markers::MenuHandler menu_handler;

using namespace visualization_msgs;
using namespace std;


Robot::Robot(ros::NodeHandle nh, std::string robot_name, float* scales){
    try{
        nh_ = nh;
        nh.getParam("frame", world_frame_);
        name = robot_name;
        scale_ = scales;
        odom_sub = nh_.subscribe("/Base/neighbors/" + robot_name + "/odometry", 10, &Robot::update_robot_callback, this);    

        // cout << name << endl;
        // cout << scales << endl;

    }
    catch(const std::exception& e){
        cout << "there was an error making the new robot" << endl;
    }

    // makeRobotMarker();

}

// This is the upodate callback for getting the robot's current pose and storing that
void Robot::update_robot_callback(const nav_msgs::Odometry &odom){

    geometry_msgs::Pose odom_pose = odom.pose.pose;

    // Get the current pose of the robot from odom messages
    // this is the best way i've found to do it because the odom comes in as a const and that makes things weird
    pose_.position.x = odom_pose.position.x;
    pose_.position.y = odom_pose.position.y;
    pose_.position.z = odom_pose.position.z;
    pose_.orientation.x = odom_pose.orientation.x;
    pose_.orientation.y = odom_pose.orientation.y;
    pose_.orientation.z = odom_pose.orientation.z;
    pose_.orientation.w = odom_pose.orientation.w;

    // cout << "hit robot odom callback" << endl;
}


// // This makes the model of the robot for rviz
// Marker makeModel(std::string robot_name){
//     Marker marker;

//     if(robot_name.find("H") != std::string::npos){
//         marker.type = Marker.MESH_RESOURCE;
//         marker.mesh_resource = 'package://meshes/huskey.STL'
//     }else if(robot_name.find("T") != std::string::npos){
//         marker.type = Marker.MESH_RESOURCE;
//         marker.mesh_resource = 'package://meshes/tank.STL'
//     }else if(robot_name.find("A") != std::string::npos){
//         marker.type = Marker.MESH_RESOURCE;
//         marker.mesh_resource = 'package://meshes/quad.STL'
//     }
    
//     marker.scale.x = scale_[0] * 0.45;
//     marker.scale.y = scale_[1] * 0.45;
//     marker.scale.z = scale_[2] * 0.45;
//     marker.color.r = 0.5;
//     marker.color.g = 0.5;
//     marker.color.b = 0.5;
//     marker.color.a = 1.0;

//     return marker;
// }


// // This makes the marker object for the robot
// void Robot::makeRobotMarker(){

//     InteractiveMarker int_marker;
//     // Change this probably
//     int_marker.header.frame_id = world_frame_;
//     int_marker.scale = 1;

//     int_marker.name = name;
//     int_marker.description = name;

//     InteractiveMarkerControl control;

//     control.interaction_mode = InteractiveMarkerControl::MENU;
//     control.name = name + "_control";

//     Marker marker = makeBox( int_marker );
//     control.markers.push_back( marker );
//     control.always_visible = true;
//     int_marker.controls.push_back(control);

//     server->insert(int_marker);
//     server->setCallback(int_marker.name, &processFeedback);
//     menu_handler.apply( *server, int_marker.name );
// }
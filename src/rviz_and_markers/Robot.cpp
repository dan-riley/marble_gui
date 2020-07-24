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


Robot::Robot(ros::NodeHandle* nh, std::string robot_name){
    try{
        nh_ = *nh;
        name = robot_name;

        string prefix;
        nh_.getParam("ma_prefix", prefix);

        // this spoofs a robot's odometry so the urdf will preview the transform from kyle
        // tf_pub_ = nh_.advertise<odometry_msgs::Pose>(prefix + robot_name + "_base/base_link", 1);
        odom_sub = nh_.subscribe(prefix + robot_name + "/odometry", 10, &Robot::update_robot_callback, this);

        
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

    return;
}

// Returns the pose of the robot
geometry_msgs::Pose Robot::getPose() {
  return pose_;
}


// this temporarily changes the robot pose (just its marker) to preview incoming transform
void Robot::PreviewTF(const geometry_msgs::Transform tf){

    listen_to_odom_ = false;

    // publish the tf to the correct topic for the urdf to show up
    tf_pub_.publish(tf);


    cout << "previewing transform" << endl;

    return;
}

// This just resets the the robot pose to use 
void Robot::TurnOffTFPreview(){

    listen_to_odom_ = true;

    return;
}


bool Robot::PreviewState(){
    return !listen_to_odom_;
}
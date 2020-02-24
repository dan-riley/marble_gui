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


Robot::Robot(ros::NodeHandle* nodehandle, std::string robot_name, float scale):nh_(*nodehandle) {
    try{
        // nh_ = nh;
        nh_.getParam("frame", world_frame_);
        name = robot_name;
        scale_ = scale;
        odom_sub = nh_.subscribe("/Base/neighbors/" + robot_name + "/odometry", 10, &Robot::update_robot_callback, this);

        cout << name << endl;
        cout << "finished" << endl;
    }
    catch(const std::exception& e){
        cout << "there was an error making the new robot" << endl;
    }

    // makeRobotMarker();

}

// This is the upodate callback for getting the robot's current pose and storing that
void Robot::update_robot_callback(const nav_msgs::Odometry odom){
    pose_.position = odom.pose.pose.position;
    pose_.orientation = odom.pose.pose.orientation;
}

geometry_msgs::Pose Robot::getPose() {
  return pose_;
}

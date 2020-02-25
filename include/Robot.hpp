#ifndef ROBOT
#define ROBOT

#include <string>

#include <ros/ros.h>
#include <std_msgs/String.h>
#include <geometry_msgs/Pose.h>
#include <nav_msgs/Odometry.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include "markers.hpp"


// using namespace std;


// robot class for doing things related to robots in rviz
//namespace robot{

// position struct
struct pos{
    double x = 0;
    double y = 0;
    double z = 0;
};

// orientation struct
struct oer{
    double x = 0;
    double y = 0;
    double z = 0;
    double w = 1;
};


class Robot{
    public:
        std::string name;
        int test;

        Robot(ros::NodeHandle* nodehandle, std::string robot_name, float scale);
        void update_robot_callback(const nav_msgs::Odometry odom);
        geometry_msgs::Pose getPose();

    private:
        // For future additions of interactive robots
        boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server_;
        interactive_markers::MenuHandler menu_handler_;


        geometry_msgs::Pose pose_;

        ros::NodeHandle nh_;
        // Fix the topic string
        ros::Subscriber odom_sub;
        ros::Publisher pub;

        std::string world_frame_;
        // for scaling the marker [x, y, z]
        float scale_;

};
//}
#endif



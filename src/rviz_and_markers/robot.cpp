#include <string>
#include <ros/ros.h>
#include <std_msgs/String.h>

using namespace std;

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

// robot class for doing things related to robots in rviz
// class Robot{
//     public:
//         string name;
//         pos position;
//         oer orientation;

//     private: 
//         // ros::init(argc, argv, "int_mkr_srv");
//         ros::NodeHandle nh;
//         // Fix the topic string
//         ros::Subscriber odom_sub;
    
//     Robot(){
//         ros::init(name);
//         //odom_sub = Robot::nh.subscribe("/neighbors/", 10, &Robot::update_robot_callback, &update_robot_callback);

//     }
//     void update_robot_callback()

// };
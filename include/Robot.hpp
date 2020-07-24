#ifndef ROBOT
#define ROBOT

#include <string>
#include <vector>

#include <ros/ros.h>
#include <std_msgs/String.h>
#include <geometry_msgs/Pose.h>
#include <nav_msgs/Odometry.h>
#include <geometry_msgs/TransformStamped.h>


#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

using namespace visualization_msgs;


class Robot{
    public:
        std::string name;
       

        Robot(ros::NodeHandle* nodehandle, std::string robot_name);
        void update_robot_callback(const nav_msgs::Odometry odom);
        geometry_msgs::Pose getPose();
        void PreviewTF(const geometry_msgs::Transform tf);
        void TurnOffTFPreview();
        bool PreviewState();

        // Robot class destructor
        ~Robot();

    private:
        geometry_msgs::Pose pose_;

        ros::Publisher tf_pub_;

        bool listen_to_odom_ = true;

        ros::NodeHandle nh_;

        // Fix the topic string
        ros::Subscriber odom_sub;
        ros::Publisher pub;

};


// Destructor
Robot::~Robot(){
    std::cout << "destroy" << std::endl;
    delete &nh_;
    delete &pub;
    delete &odom_sub;
    delete &name;
    delete &pose_;
}
#endif


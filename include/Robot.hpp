#ifndef ROBOT
#define ROBOT

#include <string>
#include <vector>

#include <ros/ros.h>
#include <std_msgs/String.h>
#include <geometry_msgs/Pose.h>
#include <nav_msgs/Odometry.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

using namespace visualization_msgs;


class Robot{
    public:
        std::string name;
        geometry_msgs::Pose pose_;

        Robot(ros::NodeHandle* nodehandle, std::string robot_name, float scale, boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server);
        void update_robot_callback(const nav_msgs::Odometry odom);
        geometry_msgs::Pose getPose();

    private:
        boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server_;
        interactive_markers::MenuHandler menu_handler_;

        Marker makeModel();

        void makeRobotMarker();

        void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback);

        bool listen_to_odom_;

        ros::NodeHandle nh_;
        // Fix the topic string
        ros::Subscriber odom_sub;
        ros::Publisher pub;

        std::string world_frame_;
        // for scaling the marker 
        float scale_;

       

};
#endif
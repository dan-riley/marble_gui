#include <fstream>
#include <ros/ros.h>
#include <ros/console.h>
#include "marble_artifact_detection_msgs/ArtifactImg.h"
#include "image_saver.hpp"
#include "utilities.hpp"
#include <boost/filesystem.hpp>

#include <vector>
#include <string>

using namespace std;

int main(int argc, char **argv){
    cout << "listening for images" << endl;
    ros::init(argc, argv, "int_mkr_srv");

    ros::NodeHandle nh;
    string prefix;
    nh.getParam("ma_prefix", prefix);

    // get mission robots
    vector<string> mission_robots = get_config_robots(&nh);

    vector<ImageSaver*> image_savings;

    // ros::Duration(0.1).sleep();

    // subscribe to images artifacts
    for(string robot : mission_robots){
        ImageSaver *new_listener = new ImageSaver(&nh, robot, prefix);
        image_savings.push_back(new_listener);
        // cout << "made image listener" << endl;
    }

    ros::spin();

    return 0;
}

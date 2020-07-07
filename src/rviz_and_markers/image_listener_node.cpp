#include <fstream>
#include <ros/ros.h>
#include <ros/console.h>
#include "marble_artifact_detection_msgs/ArtifactImg.h"
#include "image_saver.hpp"

#include <vector>
#include <string>

using namespace std;

vector<string> getMissionRobots(){
    vector<string> mission_robots;
    string robots_file = "../js/robots.txt";
    string line;
    ifstream file(robots_file);
    if (file.is_open()){
        while(getline(file, line)){
            mission_robots.push_back(line);
        }
        file.close();
    }
    else cout << "Unable to open file"; 

    return mission_robots;
}

int main(int argc, char **argv){
    ros::init(argc, argv, "int_mkr_srv");

    ros::NodeHandle nh;
    string prefix;
    nh.getParam("comms_prefix", prefix);

    // get mission robots
    vector<string> mission_robots = getMissionRobots();

    vector<ImageSaver*> image_savings;

    ros::Duration(0.1).sleep();

    // subscribe to images artifacts
    for(string robot : mission_robots){
        ImageSaver *new_listener = new ImageSaver(&nh, robot, prefix);
        image_savings.push_back(new_listener);
        cout << "made image listener" << endl;
    }

    ros::spin();

    return 0;
}




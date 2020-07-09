#include <fstream>
#include <ros/ros.h>
#include <ros/console.h>
#include "marble_artifact_detection_msgs/ArtifactImg.h"
#include "image_saver.hpp"
#include <boost/filesystem.hpp>

#include <vector>
#include <string>

using namespace std;

vector<string> getMissionRobots(string robots_file){
    vector<string> mission_robots;
    std::string path(robots_file);
    cout << path << endl;
    if (!boost::filesystem::exists(path))
    {
        std::cout << "Can't find robots.txt!" << std::endl;
    }
    string line;
    ifstream file(robots_file);
    if(file.is_open()){
        cout << "opened robots.txt" << endl;
        while(getline(file, line)){
            cout << line << endl;
            mission_robots.push_back(line);
        }
        file.close();
    }
    else cout << "Unable to open file"; 

    return mission_robots;
}

int main(int argc, char **argv){
    cout << "listening for images" << endl;
    ros::init(argc, argv, "int_mkr_srv");

    ros::NodeHandle nh;
    string prefix;
    nh.getParam("ma_prefix", prefix);
    string robots;
    nh.getParam("robot_names_config", robots);

    // get mission robots
    vector<string> mission_robots = getMissionRobots(robots);

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




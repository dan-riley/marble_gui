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

bool exists(vector<ImageSaver*>& image_handlers, string robot_name){
    for(auto i : image_handlers){
        if(i->name_ == robot_name){
            return true;
        }
    }
    return false;
}

int main(int argc, char **argv){
    cout << "listening for images" << endl;
    ros::init(argc, argv, "int_mkr_srv");

    ros::NodeHandle nh;
    string prefix;
    nh.getParam("ma_prefix", prefix);

    // get mission robots
    vector<string> mission_robots;

    vector<ImageSaver*> image_savings;

    ros::Rate loop_rate(1);
    while (ros::ok()){

        try{
            mission_robots = get_config_robots(&nh);
        }catch (const std::exception& e) { // reference to the base of a polymorphic object
            std::cout << e.what() << endl; // information from length_error printed
            cout << "error getting robots" << endl;
        }

        try{
            // subscribe to images artifacts
            for(string robot : mission_robots){
                if(!exists(image_savings, robot)){
                    cout << "adding " << robot << " image listener" << endl;
                    ImageSaver *new_listener = new ImageSaver(&nh, robot, prefix);
                    image_savings.push_back(new_listener);
                }
                
            }
        }catch (const std::exception& e) { // reference to the base of a polymorphic object
            std::cout << e.what() << endl; // information from length_error printed
            cout << "error adding listener" << endl;
        }
        
        ros::spinOnce();
        loop_rate.sleep();
    }

    cout << "exiting image listener node" << endl;

    return 0;
}

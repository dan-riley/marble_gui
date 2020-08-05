#ifndef IMAGESAVER
#define IMAGESAVER
#include <fstream>
#include <iostream>
#include <stdio.h>
#include <boost/filesystem.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <cv_bridge/cv_bridge.h>
#include <ros/ros.h>
#include <ros/console.h>
#include "marble_artifact_detection_msgs/ArtifactImg.h"
#include <image_transport/image_transport.h>

#include <vector>
#include <string>

using namespace std;

// This is to organize image data
struct image{
    string robot_name;
    float id;

    // image(string name_, float id_){
    //     robot_name = name_;
    //     id = id_;
    // }
};

class ImageSaver{
    private:
        vector<float> images;
        string prefix_;
        string img_dir_;
        ros::NodeHandle nh_;
        ros::Subscriber img_sub;

    public:
        ImageSaver(ros::NodeHandle* nh, string robot_name, string comms_prefix);
        ~ImageSaver();
        bool imageExists(float id);
        string name_;
        void imageWriter(marble_artifact_detection_msgs::ArtifactImg image);
};

#endif

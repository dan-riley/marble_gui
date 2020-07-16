// Make a better name for this
// this should show a marker for a robot relative to the world frame
// make a robot marker (use interactive robot marker)
// use tf to move that marker as a preview
// 

#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <math.h>
#include <vector>
#include <algorithm>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"

#include "utilities.hpp"

using namespace visualization_msgs;
using namespace std;
// void robot_relative_to_world_tf_marker()

// This seperates the ID from the NAME of the marker
string* getIdFromName(string glob){
    int globby_boi = glob.length();

    // declaring character array to make strtok happy
    char char_array[globby_boi + 1];

    // copying the contents of the
    // string to char array
    strcpy(char_array, glob.c_str());
    // [artifact name] [artifact id]
    string* components = new string[2];

    char *token = strtok(char_array, "||");

    // Keep printing tokens while one of the
    // delimiters present in str[].
    for (int i = 0; i < 2; i++) {
        components[i] = token;
        token = strtok(NULL, "||");
    }

    return components;
}


// This checks for the existance ofan artifact in the logged artifact vector  9135-
bool check_for_artifact(string &name, vector<string> &logged_artifacts){
    if (std::find(logged_artifacts.begin(), logged_artifacts.end(), name) != logged_artifacts.end()) {
        return true;
    }
    // Because this will be a new marker we added it to the logged vector in here to make life easier
    logged_artifacts.push_back(name);
    return false;
}

// This reads the config used for the js to get the robot names in play
vector<string> get_config_robots(ros::NodeHandle* nh) {
    string robots;
    vector<string> robot_names;

    nh->getParam("robots", robots);
    stringstream s_stream(robots);
    while (s_stream.good()) {
        string substr;
        getline(s_stream, substr, ',');
        robot_names.push_back(substr);
    }

    return robot_names;
}

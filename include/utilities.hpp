#ifndef UTILITIES_H
#define UTILITIES_H

#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include <iostream>
#include <fstream>
#include <string>
#include <math.h>
#include <vector>
#include <algorithm>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"

using namespace visualization_msgs;
using namespace std;

string* getIdFromName(string glob);

// This checks for the existance ofan artifact in the logged artifact vector  9135-
bool check_for_artifact(string &name, vector<string> &logged_artifacts);

// This reads the config used for the js to get the robot names in play
vector<string> get_config_robots( ros::NodeHandle* nh );

#endif

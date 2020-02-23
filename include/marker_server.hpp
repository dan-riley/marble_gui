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

#include "markers.hpp"
#include "Robot.hpp"

using namespace visualization_msgs;
using namespace std;

vector<string> get_config_robots();

void goal_to_robot(const std_msgs::String &robot_name);

geometry_msgs::Pose get_robot_pose(const std_msgs::String &robot_name);

void add_robots();

void setOffsets();

void submittedMarkerCallback(const marble_gui::ArtifactTransport &art);

void deleteMarker(string marker_name);

void publishGoal();

void initGoal();

bool check_for_artifact(string &name);

void makeMarker(int dof, geometry_msgs::Pose &pos, const string &artifact_name, const string &id);

string* getIdFromName(string glob);

void markerCallback(const marble_gui::ArtifactTransport &art);

void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback);
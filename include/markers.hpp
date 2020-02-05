
#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"

#include <string>
#include <math.h>
#include <vector>

using namespace visualization_msgs;
using namespace std;

/*
    This is a 3 dof marker used mostly for artifacts
*/
InteractiveMarker make3dofMarker(geometry_msgs::Pose &pos, const string &artifact_name, const string &id, string world_frame);


/*
    This is a 6 dof marker used for goal positions
*/
InteractiveMarker make6dofMarker(geometry_msgs::Pose &pos, const string &artifact_name, string world_frame);


string* getIdFromName(string glob);


InteractiveMarkerControl& makeArtifactControl(InteractiveMarker &msg, int dof);


Marker makeArtifact(InteractiveMarker &msg);


Marker makeGoal(InteractiveMarker &msg);


void makeControls(InteractiveMarker &marker, bool rotate);
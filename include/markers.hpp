
#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>
#include <visualization_msgs/MarkerArray.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"

#include <string>
#include <math.h>
#include <vector>

using namespace visualization_msgs;
using namespace std;

/*
    This is a 3 dof marker used mostly for artifacts
*/
InteractiveMarker make3dofMarker(const string &artifact_name, const string &id, string world_frame);


/*
    This is a 6 dof marker used for goal positions
*/
InteractiveMarker make6dofMarker(const string &artifact_name, string world_frame);


string* getIdFromName(string glob);


// This makes all of the controls for for an interactive marker
InteractiveMarkerControl& makeArtifactControl(InteractiveMarker &msg, int dof);


// This makes the visible shape of the artifact in rviz
Marker makeArtifact(InteractiveMarker &msg);


// This makes a goal marker for robots to drive to
Marker makeGoal(InteractiveMarker &msg);


// Make the controls for an interactive marker
void makeControls(InteractiveMarker &marker, bool rotate);

void publishGoal();

bool check_for_artifact(string &name);


void makeMarker(int dof, geometry_msgs::Pose &pos, const string &artifact_name, const string &id);

// This is a more basic non-interactive marker used for submitted 
Marker submittedMarker(float scalar, string world_frame, bool success);

// This makes the markers for the artifacts submitted to DARPA
Marker makeSubmittedMarker(const marble_gui::ArtifactTransport &art, string world_frame);

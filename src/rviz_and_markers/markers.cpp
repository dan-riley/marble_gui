#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include "std_msgs/String.h"
#include "marble_artifact_detection_msgs/Artifact.h"
#include "marble_gui/ArtifactTransport.h"


#include "markers.hpp"

#include <string>
#include <math.h>
#include <vector>

using namespace visualization_msgs;
using namespace std;


/*
    This is a 3 dof marker used mostly for artifacts
    THIS IS USED IN THE MAIN MARKER SERVER CODE
*/
InteractiveMarker make3dofMarker(const string &artifact_name, const string &id, string world_frame) {
    // Instatiate marker
    InteractiveMarker int_marker;
    // May have to change this for octomap
    int_marker.header.frame_id = world_frame;

    int_marker.scale = 1;

    int_marker.name = artifact_name + "||" + id;
    cout << "making 3 dof marker: " << int_marker.name << endl;
    int_marker.description = artifact_name + "||" + id;

    // insert a box
    makeArtifactControl(int_marker, 3);
    int_marker.controls[0].interaction_mode = visualization_msgs::InteractiveMarkerControl::MOVE_3D;

    // This makes all of the controls and adds them to the marker
    makeControls(int_marker, false);

    return int_marker;
}

InteractiveMarker make6dofMarker(const string &artifact_name, string world_frame) {
    InteractiveMarker int_marker;
    // You'll want to change this
    int_marker.header.frame_id = world_frame;
    int_marker.scale = 1;

    int_marker.name = artifact_name;
    int_marker.description = artifact_name;

    // makeGoal(int_marker);
    makeArtifactControl(int_marker, 6);
    int_marker.controls[0].interaction_mode = InteractiveMarkerControl::MOVE_ROTATE_3D;
    makeControls(int_marker, true);

    return int_marker;
}


// This makes the markers for the artifacts submitted to DARPA
Marker makeSubmittedMarker(const marble_gui::ArtifactTransport &art, string world_frame) {
    float scale = 2.0;
    Marker sub_marker_viz = submittedMarker(scale, world_frame, art.success);
    sub_marker_viz.pose.position.x = art.position.x;
    sub_marker_viz.pose.position.y = art.position.y;
    sub_marker_viz.pose.position.z = art.position.z;

    return sub_marker_viz;
}

// This instantiates the control of the marker
InteractiveMarkerControl& makeArtifactControl(InteractiveMarker &msg, int dof){
        InteractiveMarkerControl control;
        control.always_visible = true;
    if (dof == 3) control.markers.push_back(makeArtifact(msg));
    if (dof == 6) control.markers.push_back(makeGoal(msg));
    msg.controls.push_back(control);

    return msg.controls.back();
}


// This makes the visible shape of the artifact in rviz
Marker makeArtifact(InteractiveMarker &msg) {
    Marker marker;

    // This is the shape of the marker, can be mesh object too
    marker.type = Marker::CUBE;
    marker.scale.x = msg.scale * 0.45;
    marker.scale.y = msg.scale * 0.45;
    marker.scale.z = msg.scale * 0.45;
    marker.color.r = 0.5;
    marker.color.g = 0.5;
    marker.color.b = 0.5;
    marker.color.a = 1.0;

    return marker;
}

// This is a more basic non-interactive marker used for submitted
Marker submittedMarker(float scalar, string world_frame, bool success) {
    Marker marker;

    marker.header.frame_id = world_frame;

    marker.type = visualization_msgs::Marker::SPHERE;
    marker.pose.orientation.x = 0.0;
    marker.pose.orientation.y = 0.0;
    marker.pose.orientation.z = 0.0;
    marker.pose.orientation.w = 1.0;
    marker.scale.x = scalar * 0.45;
    marker.scale.y = scalar * 0.45;
    marker.scale.z = scalar * 0.45;
    marker.color.a = 1.0; // Don't forget to set the alpha!
    marker.color.b = 0.0;
    if (success) {
        marker.color.r = 0.0;
        marker.color.g = 1.0;
    } else {
        marker.color.r = 1.0;
        marker.color.g = 0.0;
    }
    marker.action = visualization_msgs::Marker::ADD;

    return marker;
}


// This makes a goal marker for robots to drive to
Marker makeGoal(InteractiveMarker &msg) {
    Marker marker;

    // This is the shape of the marker, can be mesh object too
    marker.type = Marker::ARROW;
    marker.scale.x = msg.scale * 0.5;
    marker.scale.y = msg.scale * 0.3;
    marker.scale.z = msg.scale * 0.3;
    marker.color.r = 0.5;
    marker.color.g = 1.0;
    marker.color.b = 0.0;
    marker.color.a = 1.0;

    return marker;
}


// Make the controls for an interactive marker
void makeControls(InteractiveMarker &marker, bool rotate) {
    InteractiveMarkerControl control;

    control.orientation.w = 1;
    control.orientation.x = 1;
    control.orientation.y = 0;
    control.orientation.z = 0;
    if (rotate) {
        control.name = "rotate_x";
        control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
        marker.controls.push_back(control);
    }
    control.name = "move_x";
    control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
    marker.controls.push_back(control);

    control.orientation.w = 1;
    control.orientation.x = 0;
    control.orientation.y = 1;
    control.orientation.z = 0;
    if (rotate) {
        control.name = "rotate_z";
        control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
        marker.controls.push_back(control);
    }
    control.name = "move_z";
    control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
    marker.controls.push_back(control);

    control.orientation.w = 1;
    control.orientation.x = 0;
    control.orientation.y = 0;
    control.orientation.z = 1;
    if (rotate) {
        control.name = "rotate_y";
        control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
        marker.controls.push_back(control);
    }
    control.name = "move_y";
    control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
    marker.controls.push_back(control);
}

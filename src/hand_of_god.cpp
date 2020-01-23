#include <ros/ros.h>

#include <interactive_markers/interactive_marker_server.h>
#include <interactive_markers/menu_handler.h>

#include <tf/transform_broadcaster.h>
#include <tf/tf.h>

#include "std_msgs/String.h"

#include <string>
#include <math.h>
#include <vector>

using namespace visualization_msgs;
using namespace std;

// Important kind of setup stuff
boost::shared_ptr<interactive_markers::InteractiveMarkerServer> server;
interactive_markers::MenuHandler menu_handler;

struct artifact{
	string name;
	float x_pos;
	float y_pos;
	float z_pos;
};

// This is the vector of artifacts in play right now
vector<artifact> artifact_list;
vector<string> rendered_artifact_names;

// This makes the visible shape of the artifact in rviz
Marker makeArtifact(InteractiveMarker &msg){
	Marker marker;

	// This is the shape of the marker, can be mesh object too
	marker.type = Marker::SPHERE;
	marker.scale.x = msg.scale * 0.45;
	marker.scale.y = msg.scale * 0.45;
	marker.scale.z = msg.scale * 0.45;
	marker.color.r = 0.5;
	marker.color.g = 0.5;
	marker.color.b = 0.5;
	marker.color.a = 1.0;

	return marker;
}

// This instantiates the control of the marker
InteractiveMarkerControl &makeArtifactControl(InteractiveMarker &msg){
	InteractiveMarkerControl control;
	control.always_visible = true;
	control.markers.push_back(makeArtifact(msg));
	msg.controls.push_back(control);

	return msg.controls.back();
}

void processFeedback(const visualization_msgs::InteractiveMarkerFeedbackConstPtr &feedback)
{
	std::ostringstream s;
	s << "Feedback from marker '" << feedback->marker_name << "' "
	  << " / control '" << feedback->control_name << "'";

	std::ostringstream mouse_point_ss;
	if (feedback->mouse_point_valid)
	{
		mouse_point_ss << " at " << feedback->mouse_point.x
					   << ", " << feedback->mouse_point.y
					   << ", " << feedback->mouse_point.z
					   << " in frame " << feedback->header.frame_id;
	}

	switch (feedback->event_type)
	{
	case visualization_msgs::InteractiveMarkerFeedback::BUTTON_CLICK:
		ROS_INFO_STREAM(s.str() << ": button click" << mouse_point_ss.str() << ".");
		break;

	case visualization_msgs::InteractiveMarkerFeedback::MENU_SELECT:
		ROS_INFO_STREAM(s.str() << ": menu item " << feedback->menu_entry_id << " clicked" << mouse_point_ss.str() << ".");
		break;
// IMPORTANT!! BROADCAST THIS FOR THE GUI
	case visualization_msgs::InteractiveMarkerFeedback::POSE_UPDATE:
		ROS_INFO_STREAM(s.str() << ": pose changed"
								<< "\nposition = "
								<< feedback->pose.position.x
								<< ", " << feedback->pose.position.y
								<< ", " << feedback->pose.position.z
								<< "\norientation = "
								<< feedback->pose.orientation.w
								<< ", " << feedback->pose.orientation.x
								<< ", " << feedback->pose.orientation.y
								<< ", " << feedback->pose.orientation.z
								<< "\nframe: " << feedback->header.frame_id
								<< " time: " << feedback->header.stamp.sec << "sec, "
								<< feedback->header.stamp.nsec << " nsec");
		break;

	case visualization_msgs::InteractiveMarkerFeedback::MOUSE_DOWN:
		ROS_INFO_STREAM(s.str() << ": mouse down" << mouse_point_ss.str() << ".");
		break;

	case visualization_msgs::InteractiveMarkerFeedback::MOUSE_UP:
		ROS_INFO_STREAM(s.str() << ": mouse up" << mouse_point_ss.str() << ".");
		break;
	}

	server->applyChanges();
}

// This makes a general 6dof marker
void make6DofMarker(bool fixed, unsigned int interaction_mode, const tf::Vector3 &position, bool show_6dof, const string &artifact_name){

	InteractiveMarker int_marker;
	// May have to change this for octomap
	int_marker.header.frame_id = "base_link";


	tf::pointTFToMsg(position, int_marker.pose.position);
	int_marker.scale = 1;

	int_marker.name = artifact_name;
	int_marker.description = artifact_name;

	// insert a box
	makeArtifactControl(int_marker);
	int_marker.controls[0].interaction_mode = interaction_mode;

	InteractiveMarkerControl control;

	if (fixed)
	{
		int_marker.name += "_fixed";
		int_marker.description += "\n(fixed orientation)";
		control.orientation_mode = InteractiveMarkerControl::FIXED;
	}

	if (show_6dof)
	{
		control.orientation.w = 1;
		control.orientation.x = 1;
		control.orientation.y = 0;
		control.orientation.z = 0;
		// control.name = "rotate_x";
		// control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
		// int_marker.controls.push_back(control);
		control.name = "move_x";
		control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
		int_marker.controls.push_back(control);

		control.orientation.w = 1;
		control.orientation.x = 0;
		control.orientation.y = 1;
		control.orientation.z = 0;
		// control.name = "rotate_z";
		// control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
		// int_marker.controls.push_back(control);
		control.name = "move_z";
		control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
		int_marker.controls.push_back(control);

		control.orientation.w = 1;
		control.orientation.x = 0;
		control.orientation.y = 0;
		control.orientation.z = 1;
		// control.name = "rotate_y";
		// control.interaction_mode = InteractiveMarkerControl::ROTATE_AXIS;
		// int_marker.controls.push_back(control);
		control.name = "move_y";
		control.interaction_mode = InteractiveMarkerControl::MOVE_AXIS;
		int_marker.controls.push_back(control);
	}

	server->insert(int_marker);
	server->setCallback(int_marker.name, &processFeedback);
	if (interaction_mode != visualization_msgs::InteractiveMarkerControl::NONE)
		menu_handler.apply(*server, int_marker.name);
	
}


// This deals with marker messages
// It creates new markers and updates existing ones when necessary
void markerCallback(const marble_gui::artifact& art){

	// If a new artifact comes in from the gui
  	if(!rendered_artifact_names.contains(art.artifact_name) && art.sender ==  1){
		// Make marker
		tf::Vector3 position;
		// CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
		position = tf::Vector3(art.x, art.y, art.z);
		make6DofMarker(false, visualization_msgs::InteractiveMarkerControl::MOVE_3D, position, true, art.artifact_name);
		server->applyChanges();
		new_artifact artifact;
		new_artifact.name = art.artifact_name;
		new_artifact.x = art.x;
		new_artifact.y = art.y;
		new_artifact.z = art.z;
		artifact_list.push_back(new_artifact);
		rendered_artifact_names.push_back(art.artifact_name);
  	}

	// Update an existing artifact
	if(rendered_artifact_names.contains(art.artifact_name) && art.sender ==  1){
		tf::Vector3 position;
		// CHECK TO MAKE SURE TEHESE ARE IN THE RIGHT PLACES
		position = tf::Vector3(art.x, art.y, art.z);
		// might need this so its here tf::pointTFToMsg(position, int_marker.pose.position);
		server.setPose(art.artifact_name) = position;
		server.applyChanges();
	}


}

int main(int argc, char **argv)
{
	ros::init(argc, argv, "basic_controls");
	ros::init(argc, argv, "listener");
	ros::NodeHandle n;

	// create a timer to update the published transforms
	ros::Timer frame_timer = n.createTimer(ros::Duration(0.01), frameCallback);

	server.reset(new interactive_markers::InteractiveMarkerServer("basic_controls", "", false));

	ros::Duration(0.1).sleep();

	// subscribe to fused artifacts
	ros::Subscriber sub = n.subscribe("fused_artifacts", 1000, markerCallback);

	server->applyChanges();

	ros::spin();

	server.reset();
}

// see the "Displays" section of this page to see how to add messages of different types
// https://github.com/jstnhuang/ros-rviz/wiki/User-guide

// the github wiki wasn't helpful for getting the code running. this was more helpful
// https://roscon.ros.org/2017/presentations/ROSCon%202017%20Web%20Components.pdf


function create_viewer(robot_name) {
	// var rviz = document.getElementById(robot_name + '_rviz');


	var grid = {
		isShown: true,
		name: "Grid",
		options: {
			cellSize: "1",
			color: "#cccccc",
			numCells: "10"
		},
		type: "grid"
	};
	// rviz.push('config.displays', grid);


	var pt_cloud = {
		isShown: true,
		name: "Point cloud",
		options: {
			topic: "/" + robot_name + "/octomap_point_cloud_occupied",
			size: 0.1
		},
		type: "pointCloud2"
	}
	// rviz.push('config.displays', pt_cloud);


	var map = {
		isShown: true,
		name: "Map",
		options: {
			continuous: true,
			opacity: 1,
			topic: "/" + robot_name + "/map"
		},
		type: "occupancyGrid"
	}
	// rviz.push('config.displays', map);

	// rviz.set('config.sidebarOpened', false);
}
// // var config = {
// //     globalOptions: {
// //         url: //the websocket url to connect to

// //     },
// //     SidebarOpened: true,
// //     displays: [
// //         {isShown: true},
// //         {type: "occupancyGrid"}
// //     ]
// // };


// // go here: https://wiki.ros.org/ros3djs/Tutorials/VisualizingInteractiveMarkers
//  /**
//    * Setup all visualization elements when the page is loaded.
//    */
//   function viewer_init() {
//     // Connect to ROS.
//     var ros = new ROSLIB.Ros({
//       url : 'ws://localhost:9090'
//     });

//     // Create the main viewer.
//     var viewer = new ROS3D.Viewer({
//       divID : 'markers',
//       width : 1200,
//       height : 800,
//       antialias : true
//     });

//     // Setup a client to listen to TFs.
//     // var tfClient = new ROSLIB.TFClient({
//     //   ros : ros,
//     //   angularThres : 0.01,
//     //   transThres : 0.01,
//     //   rate : 10.0,
//     //   fixedFrame : '/world'
//     // });

//     // Setup the marker client.
//     // var imClient = new ROS3D.InteractiveMarkerClient({
//     //   ros : ros,
//     //   tfClient : tfClient,
//     //   topic : '/basic_controls',
//     //   camera : viewer.camera,
//     //   rootObject : viewer.selectableObjects
//     // });

//     var octo_map_viewer = new ROS3D.OccupancyGridClient({
//       ros : ros,
//       // topic : '/merged_map',
//       // continuious : true,
//       rootObject: viewer.scene
//     });

//     // var robot_names = [];
//     // for(int i = 0; i < robot_names.length; i++ ){
//     //   var tfClient = new ROSLIB.TFClient({
//     //     ros : ros,
//     //     angularThres : 0.01,
//     //     transThres : 0.01,
//     //     rate : 10.0,
//     //     fixedFrame : `${robot_names[i]}/rotating_frame`
//     //   });
//     // };
//   }

// Maybe this will help you
// https://github.com/jstnhuang/ros-rviz/wiki/User-guide

function viewer_init() {
  var updated_config = {
	  	globalOptions: {
			  colladaLoader: 'collada2'
			},
  		sidebarOpened: true,
  		displays: [{
			isShown: true,
			name: 'Octomap',
			options: {
				opacity: 1,
				continuious: true,
				topic: '/merged_map'
			},
			type: 'occupancyGrid'
		}]};

  var rviz = document.getElementById('rviz');
  rviz.config = updated_config;

//   rviz.set('config.displays.0.name', 'Hello world');
//   rviz.set('config.sidebarOpened', false);


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
			topic: "/merged_map",
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
			topic: "/merged_map"
		},
		type: "occupancyGrid"
	}
	// rviz.push('config.displays', map);

	// rviz.set('config.sidebarOpened', false);
}
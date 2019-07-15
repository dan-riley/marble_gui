// http://wiki.ros.org/ros3djs/Tutorials/Point%20Cloud%20Streaming%20from%20a%20Kinect
// http://wiki.ros.org/ros3djs/Tutorials/VisualizingInteractiveMarkers
// https://answers.ros.org/question/172895/displaying-point-cloud-in-browser/

function create_viewer(robot_name) {
    var viewer = new ROS3D.Viewer({
        divID: robot_name + '_viewer',
        width: 800,
        height: 600,
        antialias: true,
        background: '#111111'
    });

    // Setup a client to listen to TFs.
    var tfClient = new ROSLIB.TFClient({
        ros: ros,
        angularThres: 0.01,
        transThres: 0.01,
        rate: 30.0,
        fixedFrame: "darpa"
    });

    // Setup Kinect DepthCloud stream
    // depthCloud = new ROS3D.DepthCloud({
    //     url: 'http://' + window.location.hostname + ':9999/streams/depthcloud_encoded.webm',
    //     f: 525.0
    // });
    // depthCloud.startStream();

    // Create Kinect scene node
    // var kinectNode = new ROS3D.SceneNode({
    //     frameID: 'X4/rgbd_camera_link',
    //     tfClient: tfClient,
    //     object: depthCloud
    // });

    //! Displays Point Cloud data for vehicle
    var cloudClient = new ROS3D.PointCloud2({
        ros: ros,
        tfClient: tfClient,
        rootObject: viewer.scene,
        // topic: "/octomap_point_cloud_occupied",
        topic: "/" + robot_name + "/octomap_point_cloud_occupied",
        // topic: "/octomap_point_cloud_occupied",
        material: { size: 0.1, color: 0xeeeeee },
        max_pts: 5000
    });

    //! Displays pose graph data for vehicle
    var pathClient = new ROS3D.Path({
        ros: ros,
        topic: "/" + robot_name + "/pose_graph",
        tfClient: tfClient,
        rootObject: viewer.scene,
        color: 0xcc00ff
    });

    //! Displays odometry of vehicle within graph
    //TODO: Add back in, find way to only subscribe to this topic when the vehicle tab is selected. This is similar to how tabs.js unsubscribes
    // var pointClient = new ROS3D.Odometry({
    //     ros: ros,
    //     topic: "/" + robot_name + "/odometry",
    //     tfClient: tfClient,
    //     rootObject: viewer.scene
    // });
    // function displayCloud(msg){
    //     tmpSub.processMessage(msg);
    // }
    // viewer.scene.add(kinectNode);


    // // Create the main viewer.
    // var viewer = new ROS3D.Viewer({
    //     divID: 'viewer_' + name,
    //     width: 800,
    //     height: 600,
    //     antialias: true
    // });

    // // Setup a client to listen to TFs.
    // var tfClient = new ROSLIB.TFClient({
    //     ros: ros,
    //     angularThres: 0.01,
    //     transThres: 0.01,
    //     rate: 10.0,
    //     fixedFrame: '/rotating_frame'
    // });

    // // Setup the marker client.
    // var imClient = new ROS3D.InteractiveMarkerClient({
    //     ros: ros,
    //     tfClient: tfClient,
    //     topic: '/basic_controls',
    //     camera: viewer.camera,
    //     rootObject: viewer.selectableObjects
    // });
}
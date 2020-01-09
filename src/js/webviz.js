/**
   * Setup all visualization elements when the page is loaded.
   */
  function viewer_init() {
    // Connect to ROS.
    try{
      var ros = new ROSLIB.Ros({
      url : 'ws://localhost:9090'
      });
    }
    catch(error) {
      console.error(error);
    }
    

    // Create the main viewer.
    try{
      var viewer = new ROS3D.Viewer({
        divID : 'markers',
        width : 800,
        height : 600,
        antialias : true
      });
    }
    catch(error) {
      console.error(error);
    }

    try{
      // Setup a client to listen to TFs.
      var tfClient = new ROSLIB.TFClient({
        ros : ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : '/world'
      });
    }
    catch(error) {
      console.error(error);
    }

    try{
      // Setup the marker client.
      var imClient = new ROS3D.InteractiveMarkerClient({
        ros : ros,
        tfClient : tfClient,
        topic : '/basic_controls',
        camera : viewer.camera,
        rootObject : viewer.selectableObjects
      });
    }
    catch(error) {
      console.error(error);
    }

    // code from: https://github.com/RobotWebTools/ros3djs/blob/develop/examples/depthcloud.html
    try{
      depthCloud = new ROS3D.DepthCloud({
        url : 'http://'+window.location.hostname+':9999/stream?topic=/depthcloud_encoded&type=vp8&bitrate=250000&quality=best',
        f : 525.0
      });
    }
    catch(error) {
      console.error(error);
    }
    // Issue here
    try{
      depthCloud.startStream();
    }
    catch(error) {
      console.error(error);
    }
    try{
      var kinectNode = new ROS3D.SceneNode({
        frameID : '/merged_map',
        tfClient : tfClient,
        object : depthCloud
      });
    }
    catch(error) {
      console.error(error);
    }

    try{
      viewer.scene.add(kinectNode);
    }
    catch(error) {
      console.error(error);
    }
  }
// see the "Displays" section of this page to see how to add messages of different types
// https://github.com/jstnhuang/ros-rviz/wiki/User-guide

function create_viewer(robot_name) {
    var rviz = document.getElementById(robot_name + '_rviz');
    var display = {
      isShown: true,
      name: "Grid",
      options: {
        cellSize: "1",
        color: "#cccccc",
        numCells: "10"
      },
      type: "grid"
    };
    rviz.push('config.displays', display);
  
    var pt_cloud = {
      isShown: true,
      name: "Point cloud",
      options: {
        topic: "/" + robot_name + "/octomap_point_cloud_occupied",
        size: 0.1
      },
      type: "pointCloud2"
    }
    rviz.push('config.displays', pt_cloud);
    rviz.set('config.sidebarOpened', false);
}
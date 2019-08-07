# marble_gui

marble_gui was created to meet the following demands listed in the DARPA Subterranean Challenge Competition Rules PDF:, Tunnel Circuit, Revision 2 (June 28, 2019)

* Provide rapid situational awareness to a small team of operators preparing to enter unknown and dynamic subterranean environments
* Provide real-time 3D volumetric map updates to the DARPA Command Post at a minimum frequency
* Provide a base station which sends both artifact reports and map updates to the DARPA scoring interface


## Instalation
### On Every Machine
Make sure you have the following installed

```
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt -y install ros-$ROS_DISTRO-rosbridge-server ros-$ROS_DISTRO-tf2-web-republisher ros-$ROS_DISTRO-rosapi nodejs
```

You'll probably also be wanting DARPA's test scoring server. See their installation instructions at https://bitbucket.org/subtchallenge/test_scoring_server/src/master/

### For Every Clone:
```
cd ~/marble_ws/src/marble/marble_gui/src/
sudo npm install -save electron --unsafe-perm=true --allow-root

# the npm problem given by the following command can be disregarded 
sudo npm install fs csv-writer csv-parser jquery path node-ssh polymer-cli
sudo npm install -g bower

# when asked which version of ros-websocket to install, choose 3.0.2
sudo bower install --save jstnhuang/ros-websocket jstnhuang/ros-rviz --allow-root
```


## Test setup
### Launch the GUI
```
roslaunch marble_gui marble_gui.launch
```
This should make a GUI module pop up. It will have three tabs that are always shown, even when no robots are connected. The DARPA and Artifact tabs require more setup and will be explained later. The Listener tab however can be tested. Enter the name of a topic and compare the GUI's output to "rostopic echo name_of_topic". The output should be same.

### Launch DARPA's test server 
Follow DARPA's instructions for running their test scoring server as specified in the test_scoring_server's project README. Once the DARPA server is running, the DARPA tab in the GUI should report it as "Connected"

### Launch a robot
Running the following rosbag will simulate a robot which is running and publishing topics properly named for compatibility with the GUI.
```
rosbag play /path/to/marble/marble_gui/test/test.bag -l
```
The following notable GUI features should now be observable:
* A new Tab appears called "G01" (the name of the robot).
* The robot's connection status is reported in the tab link. Stop playing the rosbag to see the satus change.
* On the robot's page, a linear velocity graph visualizes odometry messages received from the robot
* Also on the robot's page, a 3D visualization displays OccupancyGrid and PointCloud2 map data received under the robot's namespace.
* On the Artifact page, a table for the robot can now be found. 4 artifacts are included and the first artifact includes an image
* Assuming the DARPA test server is running, on the DARPA page, all three different methods of DARPA reporting should be active. The GUI automatically forwards OccupancyGrid, PointCloud2, and PoseArray messages received from robots to DARPA


## Trouble Shooting:
    
#### tornado affects rosbridge and makes it so the gui cannot establish a connection
```
pip uninstall tornado
```

#### npm ownership issue (permission denied)
```
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

#### The gui was working, but then it stopped...
If reloading the GUI (ctrl + r) doesn't fix the problem, stop any rosbags that are playing and relaunch the gui.

#### Other packages in the marble project fail to build
Exclude them from the build, for example
```
catkin_make -DCATKIN_BLACKLIST_PACKAGES=DCATKIN_BLACKLIST_PACKAGES="marble_localization;marble_artifact_detection;marble_origin_detection"
```

#### Can't get tests the gui to run
If all hell is breaking loose when you're trying to install the GUI, you may want to consider installing the GUI on a clean install of linux. The script marble/marble_gui/scripts/linux_clean_install.sh is provided which includes every command needed to make a clean install of linux ready to run the GUI.


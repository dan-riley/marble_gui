# marble_gui

marble_gui is a package devoted to optimizing the management of multiple robots and managing the data they relay to the operatot


## Instalation
### On Every Machine
Make sure you have the following installed

```
# We assume you already have a catkin workspace setup and ros installed with the gui downloaded
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

# cd ...marble_gui/scripts
sudo ./gui_setup.sh
```
This script will need some human intervestion but should get everything setup. 

You'll probably also be wanting DARPA's test scoring server. See their installation instructions at https://bitbucket.org/subtchallenge/test_scoring_server/src/master/

### For Every Clone:
As a breakout and debugging help this section may help you fix any issues the setup script had.
```
cd ~/marble_ws/src/marble/marble_gui/src/
sudo npm install -save electron --unsafe-perm=true --allow-root

# the npm problem given by the following command can be disregarded 
sudo npm install fs csv-writer csv-parser jquery path node-ssh polymer-cli
sudo npm install -g bower

# when asked which version of ros-websocket to install, choose 3.0.2
sudo bower install --save jstnhuang/ros-websocket --allow-root
```


## Test setup
To launch a test
```
# roscd marble_gui
./scripts/launch_local_test.sh
```
This may need modification to meet the demands of ignition and other systems. It was originally made for a simplier setup without multimaster and other packages.


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


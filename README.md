# marble_gui

marble_gui is a package devoted to optimizing the management of multiple robots and managing the data they relay to the operator


## Instalation
### On Every Machine
Make sure that you have ros melodic installed and a catkin_ws.
To setup the gui and its components use the below script

```
# cd ...marble_gui/scripts
sudo ./gui_setup.sh
```
This script will need some human intervestion but should get everything setup. 

You'll probably also be wanting DARPA's test scoring server. See their installation instructions at https://bitbucket.org/subtchallenge/test_scoring_server/src/master/

### Launch the GUI
```
roslaunch marble_gui marble_gui.launch
```
This launch script launches the gui itself however you will need to launch the DARPA scoring server with:
```
cd ~/test_scoring_server && docker-compose up --build
```
Once the DARPA server is running, the DARPA tab in the GUI should report it as "Connected"

### Trouble shooting:
As a breakout and debugging help this section may help you fix any issues the setup script had.
```
cd ~/marble_ws/src/marble/marble_gui/src/
sudo npm install -save electron --unsafe-perm=true --allow-root

# the npm problem given by the following command can be disregarded 
sudo npm install fs jquery path polymer-cli ejs-electron
sudo npm install -g bower

# when asked which version of ros-websocket to install, choose 3.0.2
sudo bower install --save jstnhuang/ros-websocket --allow-root
```

### Tests:
There are testing scripts to test basic functionality such as dealing with artifacts and testing the functionality of sending a leica transform to a robot. 
These tests are rudimentary and are meant to test basic functionality.


## Trouble Shooting:

#### npm ownership issue (permission denied)
```
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

#### The gui was working, but then it stopped...
If reloading the GUI (ctrl + r) doesn't fix the problem, stop any rosbags that are playing and relaunch the gui.


### Bson issues
"pymongo" is very important for bson and the newer versions of rosweb libray, this should've been installed long ago in the install script but its just of note.
WHATEVER YOU DO, DO NOT INSTALL "bson" AS ITS NOT THE ROSJS LIBRARIES USE, THEY USE "pymongo" AND THAT IMPLEMENTATION OF BSON.


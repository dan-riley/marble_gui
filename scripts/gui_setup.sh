#!/bin/bash

# I ASSUME THERE IS ALREADY A catkin_ws IN PLACE
# ALSO ASSUMING THE INSTALL IS MELODIC

source ~/catkin_ws/devel/setup.bash

sudo apt -y install ros-melodic-rosbridge-server

git clone https://github.com/RobotWebTools/tf2_web_republisher ~/catkin_ws/src/

cd ~/catkin_ws

catkin_make

# INSTALL ELECTRON AND nodejs IN GENERAL
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

sudo apt -y install nodejs

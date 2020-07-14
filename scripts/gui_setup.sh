#!/bin/bash

# I ASSUME THERE IS ALREADY A catkin_ws IN PLACE
# ALSO ASSUMING THE INSTALL IS MELODIC

source ~/catkin_ws/devel/setup.bash

cd ~/catkin_ws/src/

# Boost libraries 
sudo apt-get -y install libboost-all-dev

# Catkin Build
sudo apt-get install python-catkin-tools

# git clone https://github.com/RobotWebTools/tf2_web_republisher 

git clone https://github.com/RobotWebTools/rosbridge_suite.git -b release_0.11.5

git cone https://github.com/GT-RAIL/rosauth.git -b master

cd ~/catkin_ws

catkin build marble_gui

catkin build tf2_web_republisher

# INSTALL ELECTRON AND nodejs IN GENERAL
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

# sudo apt -y install nodejs

sudo apt install ros-melodic-teleop-twist-joy ros-melodic-joy

npm install electron -g

cd ~/catkin_ws/src/marble_gui/src

npm install

sudo npm install fs jquery path polymer-cli ejs-electron
sudo npm install -g bower

cd ~/catkin_ws/src/marble_gui/src
sudo bower install --save jstnhuang/ros-websocket --allow-root
echo 3.0.2

# pymongo is very important for bson
pip install pymongo twisted tornado

cd ~/catkin_ws/src/marble_gui/
catkin build marble_gui


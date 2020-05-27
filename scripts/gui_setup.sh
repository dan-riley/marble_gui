#!/bin/bash

# I ASSUME THERE IS ALREADY A catkin_ws IN PLACE
# ALSO ASSUMING THE INSTALL IS MELODIC

source ~/catkin_ws/devel/setup.bash

cd ~/catkin_ws/src/

git clone https://github.com/RobotWebTools/tf2_web_republisher 

git clone https://github.com/RobotWebTools/rosbridge_suite.git -b release_0.11.5

git cone https://github.com/GT-RAIL/rosauth.git -b master

cd ~/catkin_ws

catkin_make

# INSTALL ELECTRON AND nodejs IN GENERAL
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

sudo apt -y install nodejs

npm install electron -g

cd ~/catkin_ws/src/marble_gui/src

npm install

sudo npm install fs jquery path polymer-cli
sudo npm install -g bower

cd ~/catkin_ws/src/marble_gui/src
sudo bower install --save jstnhuang/ros-websocket jstnhuang/ros-rviz --allow-root
echo 3.0.2

pip install pymongo twisted tornado

# echo -e "\e[31mPLEASE OPEN THE 'rosbridge_packages' FOLDER AND INSTALL THEM THROUGH EDDY\
# THESE ARE THE ROSBRIDGE PACKAGES THAT WORK AND EDDY IS ANNOYING BUT WORKS FOR INSTALLING THEM"

# nautilus ~/catkin_ws/src/marble_gui/rosbridge_packages
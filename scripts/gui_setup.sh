#!/bin/bash

# I ASSUME THERE IS ALREADY A catkin_ws IN PLACE
# ALSO ASSUMING THE INSTALL IS MELODIC

if [ "$1" == "" ]; then
    echo "please specify your workspace (ex: gui_setup.sh catkin_ws)"
    exit 1 # terminate and indicate error
else
    echo "$1 is the workspace specified"
fi

source ~/$1/devel/setup.bash

cd ~/$1/src/

# Boost libraries 
printf "++++++++++++++++++++++++++++ \n INSTALLING BOOST LIBRARIES \n++++++++++++++++++++++++++++\n"
sudo apt-get -y install libboost-all-dev

# Catkin Build
printf "++++++++++++++++++++++++++++ \n INSTALLING CATKIN TOOLS, NODEjs, AND JOYSTICK THINGS \n++++++++++++++++++++++++++++\n"
sudo apt -y install python3-catkin-tools ros-noetic-joy nodejs npm

printf "++++++++++++++++++++++++++++ \n DOWNLOADING ROSBRIDGE_SUITE \n++++++++++++++++++++++++++++\n"
git clone https://github.com/RobotWebTools/rosbridge_suite.git

printf "++++++++++++++++++++++++++++ \n DOWNLOADING ROSAUTH \n++++++++++++++++++++++++++++\n"
git clone https://github.com/GT-RAIL/rosauth.git -b master

printf "++++++++++++++++++++++++++++ \n DOWNLOADING ROSAUTH \n++++++++++++++++++++++++++++\n"
git clone https://github.com/RobotWebTools/tf2_web_republisher.git -b master

cd ~/catkin_ws

# echo "++++++++++++++++++++++++++++ \n BUILDING GUI \n++++++++++++++++++++++++++++"
# catkin build marble_gui

# catkin build tf2_web_republisher

# INSTALL ELECTRON AND nodejs IN GENERAL
# curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

# sudo apt -y install nodejs

printf "++++++++++++++++++++++++++++ \n INSTALLING ELECTRON \n++++++++++++++++++++++++++++\n"
sudo npm install electron -g

printf "++++++++++++++++++++++++++++ \n NPM INSTALL THE GUI \n++++++++++++++++++++++++++++\n"
cd ~/$1/src/marble_base_station/marble_gui/src
npm install

printf "++++++++++++++++++++++++++++ \n NPM INSTALL EJS, JQUERY, FS, PATH, AND ROS-WEBSOCKET  \n++++++++++++++++++++++++++++\n"
sudo npm install fs jquery path ejs-electron @justinhuang/ros-websocket
# sudo npm install -g bower

# cd ~/$1/src/marble_base_station/marble_gui/src
# sudo bower install --save jstnhuang/ros-websocket --allow-root
# echo 3.0.2

# pymongo is very important for bson
printf "++++++++++++++++++++++++++++ \n INSTALLING PYMONGO \n++++++++++++++++++++++++++++\n"
pip3 install pymongo twisted tornado

printf "++++++++++++++++++++++++++++ \n FINAL BUILD \n++++++++++++++++++++++++++++\n"
cd ~/$1/src/marble_base_station/marble_gui/
catkin build
printf "++++++++++++++++++++++++++++ \n PLEASE RE-SOURCE \n++++++++++++++++++++++++++++\n"


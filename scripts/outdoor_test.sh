#!/bin/bash

# personal note about connecting to T01
# export ROS_MASTER_URI=http://172.31.4.1:11311/

source ~/catkin_ws/devel/setup.bash

# Can thsi be changed to S0B
export ROS_HOSTNAME="pop-os"



# This is if you want to use the darpa test server running
if [ "$1" == "dts" ]; then
    gnome-terminal -e 'sh -c "cd ~/test_scoring_server && docker-compose up --build; exec bash"' &
fi

# launch multi agent
gnome-terminal -e 'sh -c "roslaunch marble_multi_agent multi_agent_base.launch; exec bash"' &

# launch multi master
gnome-terminal -e 'sh -c "roslaunch marble_common launch_multimaster.launch; exec bash"' &

# launch gui
gnome-terminal -e 'sh -c "roslaunch marble_gui marble_gui.launch; exec bash"' &

# launch merge map
# change to be base mode
gnome-terminal -e 'sh -c "roslaunch octomap_merger octomap_merger.launch; exec bash"' &

# MAKE SURE DARPA TEST SERVER IS TURNED OFF FOR REAL LAUNCH
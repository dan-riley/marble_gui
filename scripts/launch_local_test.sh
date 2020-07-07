#!/bin/bash

source ~/.bashrc

# This is for statring the darpa test server
gnome-terminal -e 'sh -c "cd ~/test_scoring_server && docker-compose up --build; exec bash"' &

# sleep 5

# # start the marble gui
# gnome-terminal -e 'sh -c "roslaunch marble_gui marble_gui.launch; exec bash"' &

# sleep 5

# play the rosbag of deployment 3
# gnome-terminal -e 'sh -c "rosbag play ~/catkin_ws/bagfiles/2019-08-20-14-01-16.bag -r 10; exec bash"' &

# Teleop broadcast node
# gnome-terminal -e 'sh -c "roslaunch `rospack find teleop_twist_joy`/launch/teleop.launch"' &


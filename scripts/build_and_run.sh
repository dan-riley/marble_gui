#!/bin/bash

echo "=================Building================="
catkin build marble_gui

echo "=================Sourcing================="
source ~/.bashrc

echo "=================Running================="
roslaunch marble_gui marble_gui.launch
#!/bin/bash

# This is to clean up the reported files for each robot

cd ~/catkin_ws/src/marble_gui/src/js
if [ "$1" == "save" ]; then
    cp *_reported.txt  ~/catkin_ws/src/marble_gui/src/js/saved_missions
fi
rm *_reported.txt
cd ~/catkin_ws/src/marble_gui/scripts
#!/bin/bash

#! Directory used for base station testing at SSCI
# cd $HOME/subt_ws/src/subT_ssci/ros_gui/src/

#! Directory used for base station on Nook
# cd $HOME/catkin_ws/src/ros_gui/src/
# source ~/catkin_ws/devel/setup.bash
{
    source ~/gui_ws/devel/setup.bash

} || {

    echo -e "\e[31;43mThere is not a setup file in this ws. Change the ws directory inside gui_launch.sh to make this script work.\e[0m"
    exit 3
}
roscd marble_gui/src

npm start

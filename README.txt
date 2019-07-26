marble_gui
    The main unique value is to manage artifact reporting by robots and
    report artifacts to the DARPA server. It also creates a "we have 
    ourselves all put together" impression for the judges at the
    competition because pretty buttons are more impressive than terminal
    commands.

Installing
    Machine prereqs

        has this stuff installed
           curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
           sudo apt -y install ros-$ROS_DISTRO-rosbridge-server ros-$ROS_DISTRO-tf2-web-republisher ros-$ROS_DISTRO-rosapi nodejs
      
        Install the DARPA test server following its instructions at
	    https://bitbucket.org/subtchallenge/test_scoring_server/src/master/

    TODO for every clone:
        cd ~/marble_ws/src/marble/marble_gui/src/
        sudo npm install -save electron --unsafe-perm=true --allow-root
        sudo npm install fs csv-writer csv-parser jquery path node-ssh


    Test setup
        # This tests everything all at once by launching the GUI, test DARPA server, and robot rosbags.
        roslaunch marble_gui test_marble_gui.launch
        # this should make a GUI pop up appear
        roslaunch marble_gui marble_gui.launch
        # should make a new robot tab appear
        rosbag play /path/to/marble_gui/test/test.bag
        # setup and run this server
        # this should make the Time and Score in the header report change
        git clone https://github.com/gillamkid/darpa_subt_test_scoring_server.git
        # after the server is running, clone this into a workspaces' src folder
        git clone https://github.com/arpg/marble.git
        # and run this to make some artifacts appear on the artifacts page
        rosrun marble_artifact_detection A02_fake_artifact_array_pub.py

    Trouble Shooting:
        
        tornado affects rosbridge and makes it so the gui cannot establish a connection
            uninstall tornado from python using "pip uninstall tornado"
        
        npm ownership issue (permission denied)
            sudo chown -R $USER:$GROUP ~/.npm
            sudo chown -R $USER:$GROUP ~/.config

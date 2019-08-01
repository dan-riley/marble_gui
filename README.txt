marble_gui
    The following purposes for the gui were derived from the following needs as explained in the
    DARPA Subterranean Challenge Competition Rules, Tunnel Circuit, Revision 2 (June 28, 2019)

    "The primary scenario of interest for the competition is providing rapid situational awareness to a small team of operators preparing to enter unknown and dynamic subterranean environments."

    "Systems Teams mustprovide real-time 3D volumetric map updates to the DARPA Command Post at a minimum frequency of one update per 10 seconds."
    Teams are expected to provided a base station "which is expected to provide both artifact reports and map updates to the DARPA scoring interface." 
    "the quality of a team’s mapping capability may be used, in part, to inform continued funding decisions."

    The gui does this. The gui acts as a middle man between the agents and the scoring server. THe 3d map can be viewed in realtime
    and artifact info can be reviewed before submitting it to the server. The gui also allows an interface for sending commands to the agents.


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
        
        # the npm problem given by the following command can be disregarded 
        sudo npm install fs csv-writer csv-parser jquery path node-ssh bower polymer-cli

        sudo bower init --allow-root

        # when asked which version of ros-websocket to install, choose 3.0.2
        sudo bower install --save jstnhuang/ros-websocket jstnhuang/ros-rviz --allow-root




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

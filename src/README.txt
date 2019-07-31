Pre-requisites
- rosbridge
- rosapi, tf2_webrepublisher
- npm, nodejs, build-essential, electron

Hard-Coded directories that need to be changed:
- marble_gui/scripts/gui_launch.sh
    - change "source ~/subt_ws/devel/setup.bash" to your workspace directories setup file

Terminal 1
- roslaunch marble_gui marble_gui.launch
or
- roslaunch marble_gui ground_station.launch

Installing (look at issues below if there are any errors):

sudo apt-get install ros-melodic-rosbridge-server ros-melodic-tf2-web-republisher ros-melodic-rosapi
sudo apt-get install nodejs
curl -L https://www.npmjs.com/install.sh | sudo sh
cd ~/subT_ssci/src/marble_gui/src/
sudo npm install -save electron --unsafe-perm=true --allow-root

npm install fs
npm install csv-writer
npm install csv-parser
npm install jquery
npm install path
npm install node-ssh

Issues:

- uninstall tornado from python using "pip uninstall tornado"
    - tornado affects rosbridge and makes it so the gui cannot establish a connection

- npm ownership issue (permission denied)
    - sudo chown -R $USER:$GROUP ~/.npm
      sudo chown -R $USER:$GROUP ~/.config

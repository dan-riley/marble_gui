# THIS IS VERY EXPERIMENTAL 
# probably dont use it

# install ROS
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
sudo apt-key adv --keyserver 'hkp://keyserver.ubuntu.com:80' --recv-key C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
sudo apt update

sudo apt -y install ros-melodic-desktop-full python-rosinstall python-rosinstall-generator python-wstool build-essential python-catkin-tools ros-melodic-rosbridge-server ros-melodic-tf2-web-republisher ros-melodic-rosapi
sudo apt-get -y install libboost-all-dev


sudo rosdep init
rosdep update

echo "source ~/catkin_ws/devel/setup.bash" >> ~/.bashrc
source ~/.bashrc

# get all of the things for js
sudo apt install nodejs
curl -L https://www.npmjs.com/install.sh | sudo sh
sudo npm install -save electron --unsafe-perm=true --allow-root

npm install fs
npm install csv-writer
npm install csv-parser
npm install jquery
npm install path
npm install node-ssh

npm install -g bower

# clone repos
mkdir -p ~/catkin_ws/src
git clone https://bitbucket.org/subtchallenge/test_scoring_server.git ~/catkin_ws
git clone https://github.com/arpg/marble.git ~/catkin_ws
cd ~/ctakin_ws
catkin build -DCATKIN_BLACKLIST_PACKAGES="marble_localization"

# marble_gui setup
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt -y install ros-$ROS_DISTRO-rosbridge-server ros-$ROS_DISTRO-tf2-web-republisher ros-$ROS_DISTRO-rosapi nodejs

# install stuff needed for DARPA test_scoring_server
# see https://bitbucket.org/subtchallenge/test_scoring_server/src/master/
sudo apt -y install docker.io
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo groupadd docker
sudo usermod -aG docker $USER
sudo reboot


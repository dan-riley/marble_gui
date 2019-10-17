# install ROS
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
sudo apt-key adv --keyserver 'hkp://keyserver.ubuntu.com:80' --recv-key C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
sudo apt update

# sudo apt -y install ros-melodic-desktop-full python-rosinstall python-rosinstall-generator python-wstool build-essential 
sudo apt -y install ros-melodic-desktop-full

sudo rosdep init
rosdep update

echo "source /opt/ros/melodic/setup.bash" >> ~/.bashrc
source ~/.bashrc

# install other stuff
sudo apt -y install vim
# sudo snap install --classic code

# clone repos
# mkdir -p ~/marble_ws/src
# cd ~/marble_ws/src
# git clone https://bitbucket.org/subtchallenge/test_scoring_server.git
# git clone https://github.com/arpg/marble.git
# cd ~/marble_ws
# catkin_make -DCATKIN_BLACKLIST_PACKAGES="marble_localization"

# marble_gui setup
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt -y install ros-melodic-rosbridge-server nodejs


# install stuff needed for DARPA test_scoring_server
# see https://bitbucket.org/subtchallenge/test_scoring_server/src/master/
sudo apt -y install docker.io
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo groupadd docker
sudo usermod -aG docker $USER
sudo reboot


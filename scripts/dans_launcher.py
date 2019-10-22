import sys
import getopt
import os
import subprocess

source = "~/catkin_ws/devel/setup.bash && "

'''
rosbag play ~/catkin_ws/bags/2019-08-20-14-01-16.bag
'''

'''
cd ~/test_scoring_server
docker-compose up --build
'''

def main(argv):
    if len(sys.argv) == 1:
        # Field deployment mode
        subprocess.call(['gnome-terminal', '-x', "echo im working"])
    else:
        try:
            opts, args = getopt.getopt(argv, "hb:m:", ["bag=", "mods="])
        except getopt.GetoptError:
            print('dans_launcher.py -b <path to bag file> -m <modules to run>')
            sys.exit(2)
        for opt, arg in opts:
            if opt == '-h':
                print('dans_launcher.py -b <path to bag file> -m <modules to run>')
                sys.exit()
            elif opt in ("-b", "--bag"):
                os.system(source + "rosbag play " + arg)
            elif opt in ("-m", "--mods"):
                # Option 1
                os.system(source + "roslaunch marble_common launch_multimaster.launch")
                # Option 2
                os.system(source + "roslaunch base_mapping.launch")
                # Option 3
                os.system(source + "roslaunch marble_gui marble_gui.launch")
                # Option 4
                os.system(source + "roslaunch marble_multi_agent multi_agent.launch")


if __name__ == "__main__":
    main(sys.argv[1:])

import roslib
import rospy
import time
from nav_msgs.msg import Odometry
import tf

test_bots = ['H', 'h', '', '\n', 'B', 'b', 's', 'S']
test_nums = ['1', '01', '', '345']
test_chars = ['!', '\n', '_', '']

def fakeOdometry():
    odom = Odometry()
    odom.pose.pose.orientation.x = 1
    odom.pose.pose.orientation.y = 0 
    odom.pose.pose.orientation.z = 0
    odom.pose.pose.orientation.w = 0
    odom.pose.pose.position.x = 0
    odom.pose.pose.position.y = 0
    odom.pose.pose.position.z = 0
    # print odom
    return odom


def fake(name):
    opub = rospy.Publisher('/Base/neighbors/' + name + '/odometry', Odometry, queue_size=10)

    odom_msg = fakeOdometry()
    
    opub.publish(odom_msg)
        



if __name__ == "__main__":
    rospy.init_node('odom_tester', anonymous=True) #make node 
    
    for b in test_bots:
        for c in test_chars:
            for n in test_nums:
                fake(b+c+n)


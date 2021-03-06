import roslib
import rospy
import time

import tf


def fakeOdometry():
    trans = Odometry()
    odom.pose.pose.orientation.x = 1
    odom.pose.pose.orientation.y = 0 
    odom.pose.pose.orientation.z = 0
    odom.pose.pose.orientation.w = 0
    odom.pose.pose.position.x = 0
    odom.pose.pose.position.y = 0
    odom.pose.pose.position.z = 0
    # print odom
    return odom


def odometryCb(odometry):
    print odometry


if __name__ == "__main__":
    rospy.init_node('odom_tester', anonymous=True) #make node 
    opub = rospy.Publisher('/Base/neighbors/H01/odometry', Odometry, queue_size=10)

    odom_msg = fakeOdometry()

    for x in range(10):
        opub.publish(odom_msg)
        time.sleep(0.5)

    rospy.Subscriber('/Base/neighbors/H01/odometry', Odometry, odometryCb)


    rospy.spin()

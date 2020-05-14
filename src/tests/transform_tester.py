#!/usr/bin/env python

# This sends a random transform to the gui, 
# and recieves the transform from the gui to be printed and checked
import rospy
import random
from geometry_msgs.msg import TransformStamped

check_tf = TransformStamped()

def talker():
    pub = rospy.Publisher('/tf/topic', TransformStamped, queue_size=10)
    tf = TransformStamped()
    tf.transform.translation.x = random.uniform(-3.0, 3.0)
    tf.transform.translation.y = random.uniform(-3.0, 3.0)
    tf.transform.translation.z = random.uniform(-3.0, 3.0)

    tf.transform.rotation.x = random.uniform(-3.0, 3.0)
    tf.transform.rotation.y = random.uniform(-3.0, 3.0)
    tf.transform.rotation.z = random.uniform(-3.0, 3.0)
    tf.transform.rotation.w = random.uniform(-3.0, 3.0)
    rospy.loginfo("original tf")
    rospy.loginfo(tf.transform)
    rate = rospy.Rate(1)
    for i in range(2):
        pub.publish(tf)
        rate.sleep()
    return


def listener(message):
    rospy.loginfo("returned tf")
    rospy.loginfo(message.transform)
    


if __name__ == '__main__':
    try:
        rospy.init_node('optimus_prime', anonymous=True)
        talker()
        rospy.Subscriber("/A01/kyles/tf/topic", TransformStamped, listener)
        rospy.spin()
    except rospy.ROSInterruptException:
        pass

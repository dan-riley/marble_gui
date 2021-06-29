

"""
Used for testing the gui.

Publishes an array of Artifacts and publishes an image for one of those
artifacts in the following two formats
  1. rqt format: For rqt to detect and view compressed images, it requires:
    * the topic is of type sensor_msgs::CompressedImage. Only topics whose type is
      sensor_msgs::CompressedImage will be detected and not attributes of messages
      whose type is sensor_msgs::CompressedImage
    * the topic name ends with the suffix "/compressed"
  2. gui format: it requires
    * the compressed image to be an atribute of ArtifactImg so other information
      can be bundled with it, such as artifact_id and robot name


This node shares some of the same functionality as the
marble/marble_artifact_detection/src/publish_artifacts.cpp node.
Both files are kept for reference in case we decide to do things in C++ or python.

"""

import rospy
from marble_artifact_detection_msgs.msg import Artifact, ArtifactArray, ArtifactImg
from sensor_msgs.msg import CompressedImage
import cv2
from cv_bridge import CvBridge
import numpy as np

ROBOT_NAMES = ['H01', 'H02', 'H03', 'T01', 'T02', 'T03', 'A01', 'A02', 'A03']
ARTIFACT_IMG_ID = 0
ARTIFACT_IMG_PATH = 'test_img.jpg'
ARTIFACTS = ['survivor', 'drill', 'dan', 'backpack']

def make_message(id, i):
    msg = Artifact()
    msg.header.seq = i
    msg.header.stamp = rospy.Time.now()
    msg.header.frame_id = ''
    msg.position.x = np.random.uniform(-20, 20.1, 1)[0]
    msg.position.y = np.random.uniform(-20, 20.1, 1)[0]
    msg.position.z = np.random.uniform(-20, 20.1, 1)[0]
    msg.obj_class = np.random.choice(ARTIFACTS, 1)[0]
    msg.obj_prob = 0.99
    msg.artifact_id = str(id)
    
    return msg


def get_messages_filled_with_data(robot_name):
    array_msg = ArtifactArray()
    compressed_img_msg = CompressedImage()
    artifact_img_msg = ArtifactImg()

    array_msg.header.seq = 1
    array_msg.header.stamp = rospy.Time.now()
    array_msg.header.frame_id = ''
    array_msg.owner = robot_name

    id = 0

    for i in range(1, 20):
      id +=1
      array_msg.artifacts.append(make_message(id, i))

    cv_img = cv2.imread(ARTIFACT_IMG_PATH, cv2.IMREAD_COLOR)
    compressed_img_msg = CvBridge().cv2_to_compressed_imgmsg(cv_img)

    artifact_img_msg.header.stamp = rospy.Time.now()
    artifact_img_msg.artifact_img = compressed_img_msg
    artifact_img_msg.artifact_id = str(id)

    return array_msg, compressed_img_msg, artifact_img_msg


def main(robot_name):
	print(robot_name, "publishing")
	array_pub = rospy.Publisher(
	    '/Base/neighbors/' + robot_name + '/artifacts', ArtifactArray, queue_size=10)
	img_pub = rospy.Publisher(
	    '/Base/neighbors/' + robot_name + '/image', ArtifactImg, queue_size=10)
	rqt_img_pub = rospy.Publisher('/Base/neighbors/' + robot_name + '/' + str(
	    ARTIFACT_IMG_ID) + '/artifact_img/compressed', CompressedImage, queue_size=10)

	array_msg, compressed_img_msg, artifact_img_msg = get_messages_filled_with_data(robot_name)

	for i in range(10):
		rate = rospy.Rate(10)
		array_pub.publish(array_msg)
		img_pub.publish(artifact_img_msg)
		rqt_img_pub.publish(compressed_img_msg)
		rate.sleep()


rospy.init_node('fake_artifact_array_pub', anonymous=True)
for name in ROBOT_NAMES:
    main(name)
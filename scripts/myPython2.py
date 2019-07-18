#!/usr/bin/python

import sys
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import pynotify
from marble_artifact_detection_msgs.msg import ArtifactImg
import os


argLen = len(sys.argv)
print 'Number of arguments:', argLen, 'arguments.'
argList = str(sys.argv)
print 'Argument List:', argList



#img=sys.argv[1] 
#img.imread('/home/overlord/Desktop/ros_gui/src/images/img_250.png')
#imgplot = plt.imshow(img)
#plt.show()


# Only Text Notification
pynotify.init('Basic')
pynotify.Notification("Title", argList).show()


# Lets try with an image
pynotify.init('Image')
## Use absolute Path of the photo
pynotify.Notification("Title", "My Photo here!!", "").show()

#pynotify.Notification("Title", "My Photo here!!", "/home/overlord/gui_ws/src/marble/marble_gui/src/images/img_250.jpg").show()

# Try Markup 
pynotify.init("markup") ## all smallerCase "markup"
# but in parameter, first letter capital  
pynotify.Notification("Markup", 
  '''
  <b>bold</b>, <i>italic</i>, <u>underline</u>
  and even <a href="http://google.com">links</a> are supported!
  '''
).show()

print('Hello, My world!')

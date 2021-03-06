cmake_minimum_required(VERSION 2.8.3)
project(marble_gui)

## Compile as C++11, supported in ROS Kinetic and newer
add_compile_options(-std=c++11)
set(CMAKE_CXX_FLAGS "-O3 -Wall -Wextra")

find_package(catkin REQUIRED
  COMPONENTS
    roscpp
    std_msgs
    geometry_msgs
    tf
    cv_bridge
    rospy
    sensor_msgs
    marble_artifact_detection_msgs
    visualization_msgs
    interactive_markers
    message_generation
)

find_package(OpenCV REQUIRED)
## System dependencies are found with CMake's conventions
# find_package(Boost REQUIRED COMPONENTS system)

add_message_files(
  FILES
  Point.msg
  ArtifactTransport.msg
)

generate_messages(
  DEPENDENCIES
    roscpp
    std_msgs
    geometry_msgs
    sensor_msgs
    marble_artifact_detection_msgs
)

###################################
## catkin specific configuration ##
###################################
## The catkin_package macro generates cmake config files for your package
## Declare things to be passed to dependent projects
## INCLUDE_DIRS: uncomment this if your package contains header files
## LIBRARIES: libraries you create in this project that dependent projects also need
## CATKIN_DEPENDS: catkin_packages dependent projects also need
## DEPENDS: system dependencies of this project that dependent projects also need

catkin_package(
  INCLUDE_DIRS include
  LIBRARIES ${PROJECT_NAME}
  CATKIN_DEPENDS ${PACKAGE_DEPENDENCIES}
)

###########
## Build ##
###########

## Specify additional locations of header files
## Your package locations should be listed before other locations
include_directories(
  include
  ${catkin_INCLUDE_DIRS}
)



##############################################
#### build the interactive markers ###########
##############################################

add_library(markers src/rviz_and_markers/markers.cpp)
target_link_libraries(markers ${catkin_LIBRARIES})
add_dependencies(markers ${PROJECT_NAME}_generate_messages_cpp)

add_library(Robot src/rviz_and_markers/Robot.cpp)
target_link_libraries(Robot ${catkin_LIBRARIES})

add_library(utilities src/rviz_and_markers/utilities.cpp)
target_link_libraries(utilities ${catkin_LIBRARIES})
add_dependencies(utilities ${PROJECT_NAME}_generate_messages_cpp)

add_executable(marker_server src/rviz_and_markers/marker_server.cpp)
target_link_libraries(marker_server
                      markers
                      Robot
                      utilities
                      ${catkin_LIBRARIES})

add_executable(image_listener_node src/rviz_and_markers/image_listener_node.cpp)
target_link_libraries(image_listener_node
                      image_saver
                      utilities
                      ${catkin_LIBRARIES})

add_library(image_saver src/rviz_and_markers/image_saver.cpp)
target_link_libraries(image_saver ${catkin_LIBRARIES})


#############
## Install ##
#############



##############################################
#### install the interactive markers #########
##############################################

# install(TARGETS
#   marker_dev_mk1
#   markers
#   ARCHIVE DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
#   LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
#   RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
# )

install(DIRECTORY include/${PROJECT_NAME}/
  DESTINATION ${CATKIN_PACKAGE_INCLUDE_DESTINATION}
  PATTERN ".svn" EXCLUDE
)

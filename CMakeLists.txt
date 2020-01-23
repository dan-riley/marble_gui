cmake_minimum_required(VERSION 2.8.3)
project(marble_gui)

## Compile as C++11, supported in ROS Kinetic and newer
add_compile_options(-std=c++11)

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
  artifact.msg
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
  CATKIN_DEPENDS 
  interactive_markers 
  roscpp 
  visualization_msgs 
  tf
  message_runtime
)

###########
## Build ##
###########

## Specify additional locations of header files
## Your package locations should be listed before other locations
include_directories(
# include
  ${catkin_INCLUDE_DIRS}
)



##############################################
#### build the interactive markers ###########
##############################################

add_executable(marker_server src/marker_server.cpp)
target_link_libraries(marker_server
   ${catkin_LIBRARIES}
)

add_executable(demo_mkr_srv src/demo_mkr_srv.cpp)
target_link_libraries(demo_mkr_srv
   ${catkin_LIBRARIES}
)

add_executable(make_mkr src/marker_maker.cpp)
target_link_libraries(make_mkr
   ${catkin_LIBRARIES}
)




#############
## Install ##
#############


##############################################
#### install the interactive markers #########
##############################################

install(TARGETS
  marker_server
  demo_mkr_srv
  make_mkr
  ARCHIVE DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)


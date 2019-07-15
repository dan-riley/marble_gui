#!/bin/bash

# this argument should be the path to your_ws/marble/marble_gui/test/test_scoring_server_stix1
cd $1

docker-compose up --build

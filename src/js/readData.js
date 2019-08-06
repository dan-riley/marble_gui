var ros_connection = false;
var topicsList = [];
var topicsTypeList = [];
var global_tabManager;


_custom_prev_time = 0;

ROS_clock = 0; //Holds clock information for sim environment


$(document).ready(function () {
  console.log("ready!");
  var selected_topic_num = 0;

  window.autocomplete = function(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) {
        return false;
      }
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input id='topic' type='hidden' value='" + arr[i] + "'>";
          b.innerHTML += "<input id='num' type='hidden' value='" + i + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function (e) {
            /*insert the value for the autocomplete text field:*/
            selected_topic_num = parseFloat(this.getElementsByTagName("input")[1].value);
            inp.value = this.getElementsByTagName("input")[0].value;
            /*close the list of autocompleted values,
            (or any other open lists of autocompleted values:*/
            closeAllLists();

            setTopicMsg(); //parseFloat(this.getElementsByTagName("input")[1].value));
          });
          a.appendChild(b);
        }
      }
      a.style.overflow = "scroll";
      a.style.maxHeight = "30vh";
      a.style.color = "#000000";
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
    });

    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }

    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
      closeAllLists(e.target);
    });

  }



  // Connecting to ROS
  // -----------------

  ros = new ROSLIB.Ros({
    url: "ws://localhost:9090"
  });

  ros.on("connection", function () {
    ros_connection = true;

    console.log("Connected to websocket server.");
    getTopics();
    // create_viewer(ros);

  });

  ros.on("error", function (error) {
    console.log("Error connecting to websocket server: ", error);
  });

  ros.on("close", function () {
    console.log("Connection to websocket server closed.");
  });

  /* Get List of ROS Topics */
  function getTopics() {
    var topicsClient = new ROSLIB.Service({
      ros: ros,
      name: '/rosapi/topics',
      serviceType: 'rosapi/Topics'
    });

    var request = new ROSLIB.ServiceRequest();

    topicsClient.callService(request, function (result) {
      console.log("Getting topics...");
      topicsList = result.topics;
      topicsTypeList = result.types;

      createTab();
      window.setInterval(function () {
        startGET_Status();
      }, 2000);
      setTopicMsg();
      window.autocomplete(document.getElementById("myInput"), topicsList);

    });


  }


  count = 0
  // TODO: Replace count with values from response
  function startGET_Status() {
    // var http = new HTTP("/api/status/", {});
    $.get(SERVER_ROOT + "/api/status/", function( json ) {
      $('#header_time').text(json.run_clock);
      $('#header_score').text(json.score);
      $('#header_remaining_reports').text(json.remaining_reports);

      $('#connection_status_DARPA').html('<font color="green">Connected</font>')
    }).fail(function () {
      $('#connection_status_DARPA').html('<font color="red">Disconnected</font>');
    });
    
  }



  /*--- Subscribe to a chosen User Topic from the Custom Tab ---*/
  function setTopicMsg() {
    var fullColors = [];
    // var colors = ['rgba(255,0,0,1.0)', 'rgba(0,255,0,1.0)', 'rgba(0,0,255, 1.0)', 'rgba(128,128,0, 1.0)', 'rgba(128,0,128, 1.0)', 'rgba(0,128,128, 1.0)']
    var colors = ['rgba(128,0,0,', 'rgba(0,128,0,', 'rgba(0,0,128,', 'rgba(128,128,0,', 'rgba(128,0,128,', 'rgba(0,128,128,', 'rgba(255,0,0,', 'rgba(0,255,0,', 'rgba(0,0,255,', 'rgba(0,255,255,', 'rgba(255,0,255,', 'rgba(2555,255,0,', 'rgba(0,0,0,']
    var colorsLength = colors.length;
    for (let k = 0; k < colorsLength; k++) {
      fullColors[k] = colors[k] + "1.0)";
    }
    var topic_msg = new ROSLIB.Message();
    var topic = new ROSLIB.Topic({
      ros: ros,
      name: topicsList[selected_topic_num],
      messageType: topicsTypeList[selected_topic_num]
    });
    var e = document.getElementById("Custom");
    var custom = document.createElement("DIV");
    custom.setAttribute("id", "_custom");
    e.appendChild(custom);



    /* Unsubscribes from the topic fi */
    topic.subscribe(function (msg) {
      var robot_name = topic.name.split('/');
      topic_msg = msg;
      let text;
      switch (topic.messageType) {
        case "geometry_msgs/Twist":
          text = document.getElementById("_custom");
          break;
        case "geometry_msgs/PoseStamped":
          var _custom = document.getElementById("_custom");

          var here = true;

          var time = msg.header.stamp.secs + msg.header.stamp.nsecs * 0.000000001;
          ROS_clock = time;
          var poseJSON = [];
          poseJSON[0] = {
            x: msg.pose.position.x,
            y: msg.pose.position.y
          }
          poseJSON[1] = {
            x: time,
            y: msg.pose.position.y
          }
          poseJSON[2] = {
            x: time,
            y: msg.pose.position.z
          }
          poseJSON[3] = {
            x: time,
            y: msg.pose.orientation.x

          }
          poseJSON[4] = {
            x: time,
            y: msg.pose.orientation.y
          }
          poseJSON[5] = {
            x: time,
            y: msg.pose.orientation.z
          }

          // Creates a graph if there is not already an existing graph on the custom page
          if (!_custom.querySelector("[id=graph]")) {
            applyCSS(_custom, {
              position: "relative",
              height: "50vh",
              width: "100%",
              margin: "auto"
            });
            let graph = document.createElement("canvas");
            graph.setAttribute("id", "graph");
            let ctx = graph.getContext("2d");
            let titles_data = ["position_x"]; //, "linear_y", "linear_z", "angular_x", "angular_y", "angular_z"];
            CustomChart = new Chart(ctx, {
              responsive: true,
              type: 'scatter',
              title: {
                display: true,
                text: 'Vehicle Odometry'
              },
              data: {
                datasets: []
              },
              options: {
                maintainAspectRatio: false,
                // events: [],
                scales: {
                  yAxes: [{
                    id: 'linear',
                    position: 'left',
                    ticks: {
                      // beginAtZero: true,
                      max: 5,
                      min: -5,
                      display: true
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Linear Velocity (m/s)'
                    },
                    display: true
                  }, {
                    id: 'angular',
                    position: 'right',
                    ticks: {
                      // beginAtZero: true,
                      max: 3.14,
                      min: -3.14,
                      display: true
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Angular Rate (Rad/s)'
                    },
                    display: true
                  }],
                  xAxes: [{
                    ticks: {
                      // autoskip: false,
                      beginAtZero: true,
                      min: 0,
                      maxRotation: 0,
                      minRotation: 0
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Time (seconds)'
                    }
                    // display: true
                  }]
                },
                chartArea: {
                  backgroundColor: 'rgba(255, 255, 255, 1.0)'
                }
              }
            });
            var titles_dataLength = titles_data.length
            for (let k = 0; k < titles_dataLength; k++) {
              let Color = colors[(k + 1) % colorsLength];
              let _hidden = false;
              let yaxis_id = "linear";
              // if (Color + "1.0)" == fullColors[i]) Color = colors[(k + 2) % colorsLength];
              if (~titles_data[k].indexOf("angular")) {
                _hidden = true;
                yaxis_id = "angular";
              }
              console.log(titles_data[k]);
              let newData = {
                label: titles_data[k],
                backgroundColor: Color + '1.0)',
                data: [],
                yAxisID: yaxis_id,

                pointBackgroundColor: Color + '0.5)',
                pointBorderColor: Color + '0.5)',
                pointRadius: 1,
                pointHoverRadius: 1,
                borderColor: Color + '0.5)',

                borderWidth: 4,
                fill: false,
                tension: 0,
                showLine: true,

                hidden: _hidden
              };
              CustomChart.data.datasets.push(newData);
            }
            CustomChart.update();


            _custom.appendChild(graph);
          }

          var date = new Date();
          var now_time = date.getTime() / 1000;

          var min_time;
          var diff_time = 5;


          if (now_time - _custom_prev_time >= 0.05 || _custom_prev_time == null) {
            time >= diff_time ? min_time = time - diff_time : min_time = 0;

            if (CustomChart.data.datasets[0].data.length >= 1000) {
              let length = CustomChart.data.datasets.length;
              for (let j = 0; j < length; j++) {
                CustomChart.data.datasets[j].data.shift();
              }
            }
            let dataset_length = CustomChart.data.datasets.length;

            console.log(poseJSON[2].y);
            for (let j = 0; j < dataset_length; j++) {
              CustomChart.data.datasets[j].data.push(poseJSON[j]);
            }

            CustomChart.options.scales.xAxes[0].ticks.max = time;
            CustomChart.options.scales.xAxes[0].ticks.min = min_time;


            // Y-axis linear values
            // CustomChart.options.scales.yAxes[0].ticks.max = -5;
            // CustomChart.options.scales.yAxes[0].ticks.min = 5;
            // CustomChart.options.scales.yAxes[0].ticks.display = true; // TODO: Get rid of and fix issue where ticks dissapear after chart update


            // Y-axis angular values
            CustomChart.options.scales.yAxes[1].ticks.max = 3.14;
            CustomChart.options.scales.yAxes[1].ticks.min = -3.14;

            CustomChart.update();

            _custom_prev_time = now_time;
          }
          break;
        case "nav_msgs/Odometry":
          var _custom = document.getElementById("_custom");

          var here = true;

          var time = msg.header.stamp.secs + msg.header.stamp.nsecs * 0.000000001;
          ROS_clock = time;
          var odomJSON = [];
          odomJSON[0] = {
            x: time,
            y: msg.twist.twist.linear.x
          }
          odomJSON[1] = {
            x: time,
            y: msg.twist.twist.linear.y
          }
          odomJSON[2] = {
            x: time,
            y: msg.twist.twist.linear.z
          }
          odomJSON[3] = {
            x: time,
            y: msg.twist.twist.angular.x

          }
          odomJSON[4] = {
            x: time,
            y: msg.twist.twist.angular.y
          }
          odomJSON[5] = {
            x: time,
            y: msg.twist.twist.angular.z
          }

          // Creates a graph if there is not already an existing graph on the custom page
          if (!_custom.querySelector("[id=graph]")) {
            applyCSS(_custom, {
              position: "relative",
              height: "50vh",
              width: "100%",
              margin: "auto"
            });
            let graph = document.createElement("canvas");
            graph.setAttribute("id", "graph");
            let ctx = graph.getContext("2d");
            let titles_data = ["linear_x", "linear_y", "linear_z", "angular_x", "angular_y", "angular_z"];
            CustomChart = new Chart(ctx, {
              responsive: true,
              type: 'scatter',
              title: {
                display: true,
                text: 'Vehicle Odometry'
              },
              data: {
                datasets: []
              },
              options: {
                maintainAspectRatio: false,
                // events: [],
                scales: {
                  yAxes: [{
                    id: 'linear',
                    position: 'left',
                    ticks: {
                      // beginAtZero: true,
                      max: 5,
                      min: -5,
                      display: true
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Linear Velocity (m/s)'
                    },
                    display: true
                  }, {
                    id: 'angular',
                    position: 'right',
                    ticks: {
                      // beginAtZero: true,
                      max: 3.14,
                      min: -3.14,
                      display: true
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Angular Rate (Rad/s)'
                    },
                    display: true
                  }],
                  xAxes: [{
                    ticks: {
                      // autoskip: false,
                      beginAtZero: true,
                      min: 0,
                      maxRotation: 0,
                      minRotation: 0
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Time (seconds)'
                    }
                    // display: true
                  }]
                },
                chartArea: {
                  backgroundColor: 'rgba(255, 255, 255, 1.0)'
                }
              }
            });
            var titles_dataLength = titles_data.length
            for (let k = 0; k < titles_dataLength; k++) {
              let Color = colors[(k + 1) % colorsLength];
              let _hidden = false;
              let yaxis_id = "linear";
              // if (Color + "1.0)" == fullColors[i]) Color = colors[(k + 2) % colorsLength];
              if (~titles_data[k].indexOf("angular")) {
                _hidden = true;
                yaxis_id = "angular";
              }
              console.log(titles_data[k]);
              let newData = {
                label: titles_data[k],
                backgroundColor: Color + '1.0)',
                data: [],
                yAxisID: yaxis_id,

                pointBackgroundColor: Color + '0.5)',
                pointBorderColor: Color + '0.5)',
                pointRadius: 1,
                pointHoverRadius: 1,
                borderColor: Color + '0.5)',

                borderWidth: 4,
                fill: false,
                tension: 0,
                showLine: true,

                hidden: _hidden
              };
              CustomChart.data.datasets.push(newData);
            }
            CustomChart.update();


            _custom.appendChild(graph);
          }

          var date = new Date();
          var now_time = date.getTime() / 1000;

          var min_time;
          var diff_time = 5;


          if (now_time - _custom_prev_time >= 0.05 || _custom_prev_time == null) {
            time >= diff_time ? min_time = time - diff_time : min_time = 0;

            if (CustomChart.data.datasets[0].data.length >= 1000) {
              let length = CustomChart.data.datasets.length;
              for (let j = 0; j < length; j++) {
                CustomChart.data.datasets[j].data.shift();
              }
            }
            let dataset_length = CustomChart.data.datasets.length;

            console.log(odomJSON[2].y);
            for (let j = 0; j < dataset_length; j++) {
              CustomChart.data.datasets[j].data.push(odomJSON[j]);
            }

            CustomChart.options.scales.xAxes[0].ticks.max = time;
            CustomChart.options.scales.xAxes[0].ticks.min = min_time;


            // Y-axis linear values
            // CustomChart.options.scales.yAxes[0].ticks.max = -5;
            // CustomChart.options.scales.yAxes[0].ticks.min = 5;
            // CustomChart.options.scales.yAxes[0].ticks.display = true; // TODO: Get rid of and fix issue where ticks dissapear after chart update


            // Y-axis angular values
            CustomChart.options.scales.yAxes[1].ticks.max = 3.14;
            CustomChart.options.scales.yAxes[1].ticks.min = -3.14;

            CustomChart.update();

            _custom_prev_time = now_time;
          }

          // text.innerHTML = "<p>" + robot_name[1] + " Velocity { x: " + topic_msg.twist.twist.linear.x + " y: " + topic_msg.twist.twist.linear.y + " z: " + topic_msg.twist.twist.linear.z + " }\n" +
          // robot_name[1] + " Angular Rate { x: " + topic_msg.twist.twist.angular.x + " y: " + topic_msg.twist.twist.angular.y + " z: " + topic_msg.twist.twist.angular.z + " }</p>";
          // document.getElementById("Topic_Display").innerText = robot_name[1] + " Velocity { x: " + topic_msg.twist.twist.linear.x + " y: " + topic_msg.twist.twist.linear.y + " z: " + topic_msg.twist.twist.linear.z + " }\n" +
          //   robot_name[1] + " Angular Rate { x: " + topic_msg.twist.twist.angular.x + " y: " + topic_msg.twist.twist.angular.y + " z: " + topic_msg.twist.twist.angular.z + " }";
          // // console.log("Subscribed to " + topicsList[selected_topic_num]);
          break;
        default:
          document.getElementById("_custom").innerText = "No topic selected or topic is not implemented";
      }
      if (topic.name != topicsList[selected_topic_num]) {

        let myNode = document.getElementById("_custom");
        // while (myNode.firstChild) {
        //   myNode.removeChild(myNode.firstChild);
        // }
        myNode.parentNode.removeChild(myNode);
        myNode = null;
        topic.unsubscribe();

        // cus.parentNode.removeChild(cus);
      }
    });

  }

  /* Function to create tabs for all recognized robots when the ros server connects */
  function createTab() {
    global_tabManager = new TabManager();
    return;
  }




  function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
      dataset.data.pop();
    });
    chart.update();
  }

  /*--- Function for grabbing info from form and publishing it to ROS        ---*/
  /*--- geometry_msgs/Twist requires id format of 'linear_x' and 'angular_x' ---*/
  /*--- All messages and ids follow format corresponding to their JSON       ---*/
  window.pubTopicMsg = function (e) {

    let topic = e.querySelector("[id=topic]").value;
    let type = e.querySelector("[id=type]").value;
    var Topic = new ROSLIB.Topic({
      ros: ros,
      name: topic,
      messageType: type
    });
    var topic_msg;
    switch (type) {
      case "geometry_msgs/Twist":
        topic_msg = new ROSLIB.Message({
          linear: {
            x: 0.0,
            y: 0.0,
            z: 0.0
          },
          angular: {
            x: -0.0,
            y: -0.0,
            z: -0.0
          }
        });
        console.log("Publishing to " + topic + "...");

        try {
          if (e.querySelector("[id='linear_x']").value) topic_msg.linear.x = parseFloat(e.querySelector("[id=linear_x]").value);
        } catch (err) {
          topic_msg.linear.x = 0
        }
        try {
          if (e.querySelector("[id='linear_y']").value) topic_msg.linear.y = parseFloat(e.querySelector("[id=linear_y]").value);
        } catch (err) {
          topic_msg.linear.y = 0
        }
        try {
          if (e.querySelector("[id='linear_z']").value) topic_msg.linear.z = parseFloat(e.querySelector("[id=linear_z]").value);
        } catch (err) {
          topic_msg.linear.z = 0
        }
        try {
          if (e.querySelector("[id='angular_x']").value) topic_msg.angular.x = parseFloat(e.querySelector("[id=angular_x]").value);
        } catch (err) {
          topic_msg.angular.x = 0
        }
        try {
          if (e.querySelector("[id='angular_y']").value) topic_msg.angular.y = parseFloat(e.querySelector("[id=angular_y]").value);
        } catch (err) {
          topic_msg.angular.y = 0
        }
        try {
          if (e.querySelector("[id='angular_z']").value) topic_msg.angular.z = parseFloat(e.querySelector("[id=angular_z]").value);
        } catch (err) {
          topic_msg.angular.z = 0
        }
        break;
      case "nav_msgs/Odometry":

        break;
      case "sensor_msgs/CompressedImage":

        break;
      case "geometry_msgs/Pose":
        topic_msg = new ROSLIB.Message({
          position: {
            x: 0.0,
            y: 0.0,
            z: 0.0
          },
          orientation: {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0
          }
        });
        vehicle_Artifacts[i].reportedArtifacts[other_location] = true;
        try {
          if (e.querySelector("[id='position_x']").value) topic_msg.position.x = parseFloat(e.querySelector("[id=position_x]").value);
        } catch (err) {
          topic_msg.position.x = 0
        }
        try {
          if (e.querySelector("[id='position_y']").value) topic_msg.position.y = parseFloat(e.querySelector("[id=position_y]").value);
        } catch (err) {
          topic_msg.position.y = 0
        }
        try {
          if (e.querySelector("[id='position_z']").value) topic_msg.position.z = parseFloat(e.querySelector("[id=position_z]").value);
        } catch (err) {
          topic_msg.position.z = 0
        }
        try {
          if (e.querySelector("[id='orientation_x']").value) topic_msg.orientation.x = parseFloat(e.querySelector("[id=orientation_x]").value);
        } catch (err) {
          topic_msg.orientation.x = 0
        }
        try {
          if (e.querySelector("[id='orientation_y']").value) topic_msg.orientation.y = parseFloat(e.querySelector("[id=orientation_y]").value);
        } catch (err) {
          topic_msg.orientation.y = 0
        }
        try {
          if (e.querySelector("[id='orientation_z']").value) topic_msg.orientation.z = parseFloat(e.querySelector("[id=orientation_z]").value);
        } catch (err) {
          topic_msg.orientation.z = 0
        }
        try {
          if (e.querySelector("[id='orientation_w']").value) topic_msg.orientation.z = parseFloat(e.querySelector("[id=orientation_w]").value);
        } catch (err) {
          topic_msg.orientation.w = 1.0
        }
        break;
      case "sensor_msgs/BatteryState":
        topic_msg = new ROSLIB.Message({
          percentage: 0.0
        });
        try {
          if (e.querySelector("[id='percentage']").value) topic_msg.position.x = parseFloat(e.querySelector("[id=percentage]").value);
        } catch (err) {
          topic_msg.percentage = 0
        }
        break;
      case "geometry_msgs/PoseStamped": // TODO: Add in correct GPS msg format for x, y, z desired locations
        topic_msg = new ROSLIB.Message({
          header: {
            seq: 0,
            stamp: 0,
            frame_id: ""
          },
          pose: {
            position: {
              x: 0.0,
              y: 0.0,
              z: 0.0
            },
            orientation: {
              x: 0.0,
              y: 0.0,
              z: 0.0,
              w: 0.0
            }
          }

        });
        try {
          if (e.querySelector("[id='position_x']").value) topic_msg.pose.position.x = parseFloat(e.querySelector("[id=position_x]").value);
        } catch (err) {
          topic_msg.pose.position.x = 0
        }
        try {
          if (e.querySelector("[id='position_y']").value) topic_msg.pose.position.y = parseFloat(e.querySelector("[id=position_y]").value);
        } catch (err) {
          topic_msg.pose.position.y = 0
        }
        try {
          if (e.querySelector("[id='position_z']").value) topic_msg.pose.position.z = parseFloat(e.querySelector("[id=position_z]").value);
        } catch (err) {
          topic_msg.pose.position.z = 0
        }
        break;
      default:
        return;
    }
    for (var i = 0; i < 100; i++) {
      Topic.publish(topic_msg);
    }

  }


  document.getElementById("Custom_nav_link").click(); //Opens Custom Tab on html load
});



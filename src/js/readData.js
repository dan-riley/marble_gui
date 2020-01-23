var ros_connection = false;
var connected_to_scoring_server = false;
var topicsList = [];
var topicsTypeList = [];
var global_tabManager;
var run_echo = false;
var scoringTimer = new Date();


_custom_prev_time = 0;

// ROS_clock = 0; //Holds clock information for sim environment

// This is incredibly important for the gui to pick up on new topics
function update_topics_list(callback) {
	var topicsClient = new ROSLIB.Service({
		ros: ros,
		name: '/rosapi/topics',
		serviceType: 'rosapi/Topics'
	});

	var request = new ROSLIB.ServiceRequest();

	topicsClient.callService(request, function (result) {
		topicsList = result.topics;
		topicsTypeList = result.types;
		callback();
	});
}


/* Function to create tabs for all recognized robots when the ros server connects */
function createTab() {
	global_tabManager = new TabManager();
	return;
}


$(document).ready(function () {
	
	console.log("ready!");


	// Connecting to ROS
	// -----------------
	
	// The ros connection object
	// VERY IMPORTANT
	ros = new ROSLIB.Ros({
		url: "ws://localhost:9090"
	});

	

	ros.on("connection", function () {
		ros_connection = true;

		console.log("Connected to websocket server.");
		// This allows us 
		getTopics();
	});

	ros.on("error", function (error) {
		console.log("Error connecting to websocket server: ", error);
	});

	ros.on("close", function () {
		console.log("Connection to websocket server closed.");
	});

	/* Get List of ROS Topics */
	function getTopics() {
		update_topics_list(function () {
			createTab();
			window.setInterval(function () {
				let t = new Date();
				t.setSeconds(t.getSeconds() - 2);
				if (t > scoringTimer) {
					startGET_Status();
					scoringTimer = new Date();
				}
			}, 5000);
		});

	}


	count = 0
	// TODO: Replace count with values from response
	function startGET_Status() {
		// var http = new HTTP("/api/status/", {});
		$.get(SCORING_SERVER_ROOT + "/api/status/", function (json) {
			$('#header_time').text(json.run_clock);
			$('#header_score').text(json.score);
			$('#header_remaining_reports').text(json.remaining_reports);

			$('#connection_status_DARPA').html('<font color="green">Connected</font>');
			connected_to_scoring_server = true;
		}).fail(function () {
			$('#connection_status_DARPA').html('<font color="red">Disconnected</font>');
			connected_to_scoring_server = false;
		});

	}

	

	function removeData(chart) {
		chart.data.labels.pop();
		chart.data.datasets.forEach((dataset) => {
			dataset.data.pop();
		});
		chart.update();
	}

	// so that the Listener Tab loads initially
	document.getElementById("Artifact_Page_nav_link").click();
});


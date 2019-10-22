var ros_connection = false;
var connected_to_scoring_server = false;
var topicsList = [];
var topicsTypeList = [];
var global_tabManager;
var run_echo = false;
var scoringTimer = new Date();


_custom_prev_time = 0;

ROS_clock = 0; //Holds clock information for sim environment

function update_topics_list(callback) {
	var topicsClient = new ROSLIB.Service({
		ros: ros,
		name: '/rosapi/topics',
		serviceType: 'rosapi/Topics'
	});

	var request = new ROSLIB.ServiceRequest();

	topicsClient.callService(request, function (result) {
		// console.log("Getting topics...");
		topicsList = result.topics;
		topicsTypeList = result.types;
		callback();
		window.autocomplete(document.getElementById("myInput"), topicsList);
	});
}


$(document).ready(function () {
	console.log("ready!");

	$('#clear_console').click(function () {
		$('#echo_console').empty();
	});

	$('#begin_echo').click(function () {
		run_echo = true;

		var topic = new ROSLIB.Topic({
			ros: ros,
			name: topicsList[selected_topic_num],
			messageType: topicsTypeList[selected_topic_num]
		});

		topic.subscribe(function (msg) {
			topic_msg = msg;
			if (run_echo) {
				document.getElementById("echo_console").appendChild(renderjson.set_show_to_level(1).set_icons('⇣', '⇡')(msg));
			}
			else {
				topic.unsubscribe();
			}
		});

		$('#begin_echo').hide();
		$('#stop_echo').show();
	});

	$('#stop_echo').click(function () {
		run_echo = false;
		$('#stop_echo').hide();
		$('#begin_echo').show();
	});

	var selected_topic_num = 0;

	// establish topic list in the Listener Tab)
	window.autocomplete = function (inp, arr) {
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

	// so that the Listener Tab loads initially
	document.getElementById("Artifact_Page_nav_link").click();
});



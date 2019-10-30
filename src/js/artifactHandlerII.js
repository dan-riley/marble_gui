// THIS GETS ALL OF OUR ARTIFACTS TO USE
var fs = require("fs");
// you might wnat to change where the artifact file is
// It works by putting each artifact on a new line
var artifact_file = fs.readFileSync("js/artifacts.txt", "utf-8");
var artifacts = artifact_file.split("\n")


// Populate modal options
// var modal_options = document.getElementById("NewReportForm");
// for(var i = 0; i < artifacts.length; i++){
//     var artifact = artifacts[i];
//     radioInput = document.createElement('INPUT');
//     radioInput.setAttribute('type', 'radio');
//     radioInput.setAttribute('name', artifact);
//     modal_options.appendChild(radioInput);
// }
function populateOpts(){
    var modal_options = document.getElementById("artifactSelect");
    for(var i = 0; i < artifacts.length; i++){
        var artifact = artifacts[i];
        var option = document.createElement("option");
        option.text = artifact;
        option.value = artifact;
        modal_options.add(option);
    }
}


class Artifact {
    constructor(name, n) {
        this.robot_name = name;
        this.n = n;
        this.artifact_All = [];
        this.artifactsList = [];
        this.artifactImages = [];
        this.reportedArtifacts = [];

        if (!this.read_file()) {
            for (let i = 0; i < ARTIFACT_ARR_LEN; i++) {
                this.reportedArtifacts[i] = [i, false];
            }
        };

        this.dist_threshhold = 1.0;
        console.log("artifact handler: " + name);

        this.location_all = 0; // Int to keep track of location in all artifact arrays stored by callback function
        this.location_array = 0; // Int to keep track of location in artifact array message

        this.artifact_tracker = [];
        this.artifact_position = [];
	    this.artifact_type = [];
        // this.artifact_num_seen = [];
        this.artifact_seen_by = [];
        this.artifact_confidence = [];
        this.artifact_image = [];
        this.artifact_image_id = [];
    }

    set_artifact_tracker(robot_artifacts, id) {
        this.artifact_tracker[id] = robot_artifacts.querySelector("[artifact_id = '" + id + "']");
        this.artifact_position[id] = this.artifact_tracker[id].querySelector("[id = 'position']");
        this.artifact_type[id] = this.artifact_tracker[id].querySelector("[id = 'type']");
        // this.artifact_num_seen[id] = this.artifact_tracker[id].querySelector("[id = 'num_seen'");
        this.artifact_seen_by[id] = this.artifact_tracker[id].querySelector("[id = 'seen_by']");
        this.artifact_confidence[id] = this.artifact_tracker[id].querySelector("[id = 'confidence']");
        this.artifact_image[id] = this.artifact_tracker[id].querySelector("[id = image]");
    }

    async submit_artifact(id, _this) {
        console.log("here I am");

        var robo_name = _this.get_robot_name();
        var xPos = document.getElementById('xVal').value;
        var yPos = document.getElementById('yVal').value;
        var zPos = document.getElementById('zVal').value;
        var editType = document.getElementById('artifactSelect').value;
        var editNotes = document.getElementById('notestTextArea').value;

        var data = {
            "x": xPos,
            "y": yPos,
            "z": zPos,
            "type": editType
        };

        // Old code for finding the highest confidence.  We're doing this using
        // base_artifact_fusion.  If this comes back, need to check code for new layout
        var findBest = false;

        if (findBest == true) {
            var vehicle_Artifacts_length = this.artifactsList.length;
            var other_location = new Array(vehicle_Artifacts_length);
            var best_prob = parseFloat(this.artifact_confidence[row_id].getAttribute("value"));
            for (let i = 0; i < vehicle_Artifacts_length; i++) {
                if (vehicle_Artifacts[i].get_robot_name() == robo_name) {
                    continue;
                }
                let other_artifactsList = vehicle_Artifacts[i].get_artifactsList();
                let other_artifactsList_length = other_artifactsList.length;
                for (let k = 0; k < other_artifactsList_length; k++) {
                    if (other_artifactsList[k] == null) {
                        break;
                    }
                    if (other_artifactsList[k].obj_class != this.artifactsList[row_id].obj_class) {
                        continue;
                    }
                    let dist_x = other_artifactsList[k].position.x - data.x;
                    let dist_y = other_artifactsList[k].position.y - data.y;

                    if (other_artifactsList[k].obj_prob > best_prob && Math.hypot(dist_x, dist_y) < this.dist_threshhold) {
                        console.log("Choosing higher chance object");
                        data.x = other_artifactsList[k].position.x;
                        data.y = other_artifactsList[k].position.y;
                        data.z = other_artifactsList[k].position.z;
                        other_location[i] = k;
                    } else if (Math.hypot(dist_x, dist_y) < this.dist_threshhold) {
                        other_location[i] = k;
                    }
                }
            }
        }
        var position_string =  xPos + ', ' + yPos + ', ' + zPos;

        $('#submission_tbody').append(`
        <tr>
            <td>` + editType + `</td>
            <td>` + position_string + `</td>
            <td>` + editNotes + `</td>
            <td id="` + position_string + `">No result yet</td>
        </tr>`);

        var org_artifacts = _this.artifactsList[id].originals;
        console.log("submitting artifact to DARPA server. Waiting for response...");
        let t = new Date();
        t.setSeconds(t.getSeconds() - 1);
        if (t <= scoringTimer) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            scoringTimer = new Date();
        }

        // ==================================================
        // DARPA SCORING STUFF
        // ==================================================
        $.post(SCORING_SERVER_ROOT + '/api/artifact_reports/', JSON.stringify(data))
            .done(function (json) {
                // This is for testing a bad artifact and darpa responding with "0"
                // if(data.type == "score 0"){
                //     json.score_change = 0;
                // }
                // This is where we get the darpa score back - specifically json.score_change
                console.log("WOWAH!");
                var submission_result = "+" + json.score_change + " points";
                // Here down is mostly formatting
                $("[id='" + position_string + "']").text(submission_result);

                var color_class = 'table-danger';
                if(json.score_change > 0){
                    color_class = 'table-success';
                }
                $("[id='" + position_string + "']").parent().addClass(color_class);

                document.getElementById("submit_" + robo_name + "_" + id).innerText = "submission result: " + submission_result;

                if (json.score_change > 0) {
                    document.getElementById("submit_" + robo_name + "_" + id).disabled = true;
                }

                if (robo_name == "Base") {
                    for (let id2 in org_artifacts) {
                        let artifact = org_artifacts[id2];
                        global_tabManager.global_vehicleArtifactsList[artifact.n].artifactsList[id2].submitted = true;
                        global_tabManager.global_vehicleArtifactsList[artifact.n].artifactsList[id2].result = json.score_change;
                        let robot_name = global_tabManager.global_vehicleArtifactsList[artifact.n].robot_name;
                        if (json.score_change > 0) {
                            document.getElementById("submit_" + robot_name + "_" + id2).disabled = true;
                        }

                        global_tabManager.global_vehicleArtifactsList[artifact.n].updateDisplay();
                    }
                } else {
                    for (let id2 in global_tabManager.fusedArtifacts.artifactsList) {
                        let fartifact = global_tabManager.fusedArtifacts.artifactsList[id2];
                        for (let id3 in fartifact.originals) {
                            if (id3 == id) {
                                fartifact.submitted = true;
                                fartifact.result = json.score_change;
                                if (json.score_change > 0) {
                                    document.getElementById("submit_Base_" + id2).disabled = true;
                                }
                            }
                        }
                    }
                    global_tabManager.fusedArtifacts.updateDisplay();
                }
                if(json.score_change > 0){
                    $('#' + position_string).html('Success');
                }
            });

        $('#myModal').modal('hide');
    }
}
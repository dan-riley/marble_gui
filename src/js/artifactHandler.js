function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function update_fused_artifact(msg){
    let id = msg.id;
    let fusedArtifacts = global_tabManager.fusedArtifacts.artifactsList;
    fusedArtifacts[id].position = msg.position;
    global_tabManager.fusedArtifacts.updateDisplay();

    let fa = global_tabManager.fusedArtifacts;
    fa.artifact_type[id].style.backgroundColor = "#dca200";
    fa.artifact_seen_by[id].style.backgroundColor = "#dca200";
    fa.artifact_confidence[id].style.backgroundColor = "#dca200";
    fa.artifact_position[id].style.backgroundColor = "#dca200";
    fa.artifact_image[id].style.backgroundColor = "#dca200";
    fa.artifact_image[id].firstChild.style.backgroundColor = "#dca200";
    fa.artifact_tracker[id].querySelector("[id = 'Base_" + id + "']").style.backgroundColor = "#dca200";

    await sleep(5000);
    fa.artifact_type[id].style.backgroundColor = "#6c757d";
    fa.artifact_seen_by[id].style.backgroundColor = "#6c757d";
    fa.artifact_confidence[id].style.backgroundColor = "#6c757d";
    fa.artifact_position[id].style.backgroundColor = "#6c757d";
    fa.artifact_image[id].style.backgroundColor = "#6c757d";
    fa.artifact_image[id].firstChild.style.backgroundColor = "#6c757d";
    fa.artifact_tracker[id].querySelector("[id = 'Base_" + id + "']").style.backgroundColor = "#6c757d";
}


/**
 * Artifact class for handling, sending, and checking known artifacts
 */


class Artifact {
    constructor(name, n) {
        this.robot_name = name;
        this.n = n;
        this.artifact_All = [];
        this.artifactsList = recover_artifacts(name);
        // This only has image ids, image data is saved with the image_listener node to files
        this.artifactImages = [];
        this.reportedArtifacts = [];
        this.savedArtifacts = recover_artifacts(name);

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

        this.updateDisplay();
    }

    set_artifact_tracker(robot_artifacts, id) {
        this.artifact_tracker[id] = robot_artifacts.querySelector("[artifact_id = '" + id + "']");
        this.artifact_position[id] = this.artifact_tracker[id].querySelector("[id = 'position']");
        this.artifact_type[id] = this.artifact_tracker[id].querySelector("[id = 'type']");
        // this.artifact_num_seen[id] = this.artifact_tracker[id].querySelector("[id = 'num_seen'");
        this.artifact_seen_by[id] = this.artifact_tracker[id].querySelector("[id = 'seen_by']");
        this.artifact_confidence[id] = this.artifact_tracker[id].querySelector("[id = 'confidence']");
        this.artifact_image[id] = this.artifact_tracker[id].querySelector(`[id = "img_cont_${this.robot_name}_${id}"]`);
    }

    // Add artifact to page
    add_artifact(id) {
        // Add artifact to page
        console.log("adding artifact")
        let robot_artifact_tracker = document.createElement("DIV");
        robot_artifact_tracker.setAttribute("class", "row");
        robot_artifact_tracker.setAttribute("artifact_id", id);
        let align = '';
        // This is used in place of actual alignment to center the robot artifacts
        if (this.robot_name != 'Base') {
            align = '<span class="col-sm-1">  </span>';
        }
        robot_artifact_tracker.innerHTML = align + '<span contenteditable="false" id="type" class="badge badge-secondary col-sm-2" style="text-align: center; min-height: 1px;" value="undefined"> undefined </span>';
        if (this.robot_name == 'Base') {
            robot_artifact_tracker.innerHTML += '<span contenteditable="false" id="seen_by" class="badge badge-secondary col-sm-2" style="text-align: center; min-height: 1px;" value="undefined">unknown</span>';
        }

        robot_artifact_tracker.innerHTML += '<span contenteditable="false" id="confidence" class="badge badge-secondary col-sm-1" style="text-align: center" value="0.00">0.00</span>' +
            "<span contenteditable='false' id='position' class='badge badge-secondary col-sm-3' style='text-align: center' value='" + JSON.stringify({ x: 0.00, y: 0.00, z: 0.00 }) + "'>{x: 0.00 y: 0.00 z: 0.00}</span>";

        let robot_artifact_tracker_yes_container = document.createElement("DIV");
        robot_artifact_tracker_yes_container.setAttribute("class", "badge badge-secondary col-sm-2");
        robot_artifact_tracker_yes_container.setAttribute("id", this.robot_name + "_" + id);
        let robot_artifact_tracker_yes = document.createElement("BUTTON");
        robot_artifact_tracker_yes.setAttribute("id", "submit_" + this.robot_name + "_" + id);
        robot_artifact_tracker_yes.innerText = "Submit";
        var n = this.n;
        var robot_name = this.robot_name;
        robot_artifact_tracker_yes.onclick = function () {
            if(connected_to_scoring_server){
                robot_artifact_tracker_yes.innerText = "submitting...";
                if (robot_name == 'Base') {
                    global_tabManager.fusedArtifacts.open_edit_submit_modal(id);
                } else {
                    global_tabManager.global_vehicleArtifactsList[n].open_edit_submit_modal(id);
                }
            }
            else {
                alert('Cannot submit. You are not connected to the DARPA server.');
            }
        };
        robot_artifact_tracker_yes_container.appendChild(robot_artifact_tracker_yes);

        let robot_artifact_tracker_delete = document.createElement("BUTTON");
        robot_artifact_tracker_delete.setAttribute("id", "delete_" + this.robot_name + "_" + id);
        robot_artifact_tracker_delete.innerText = "X";
        robot_artifact_tracker_delete.onclick = function () {
            if (robot_name == 'Base') {
                global_tabManager.fusedArtifacts.deleteArtifact(id);
            } else {
                global_tabManager.global_vehicleArtifactsList[n].deleteArtifact(id);
            }
        };
        robot_artifact_tracker_yes_container.appendChild(robot_artifact_tracker_delete);


        let robot_artifact_tracker_reset = document.createElement("DIV");
        robot_artifact_tracker_reset.onclick = function () {
            if (robot_name == 'Base') {
                let artifacts = global_tabManager.fusedArtifacts.artifactsList;
                artifacts['dupe_' + id] = Object.assign({}, artifacts[id]);
                artifacts['dupe_' + id].position = Object.assign({}, artifacts[id].position);
                global_tabManager.fusedArtifacts.updateDisplay();
            } else {
                let artifacts = global_tabManager.global_vehicleArtifactsList[n].artifactsList;
                artifacts['dupe_' + id] = Object.assign({}, artifacts[id]);
                artifacts['dupe_' + id].position = Object.assign({}, artifacts[id].position);
                global_tabManager.global_vehicleArtifactsList[n].updateDisplay();
            }
        }
        robot_artifact_tracker_yes_container.appendChild(robot_artifact_tracker_reset);

        // CHNAGE TO BE A BUTTON THAT ACTIVATES A FUNCTION THAT PASSES ROBOT AND IMAGE ID SO IT CAN BE DISPLAYED IN THE IMAGE MODAL
        let robot_artifact_image_container = document.createElement("DIV");
        robot_artifact_image_container.setAttribute("class", "badge badge-secondary col-sm-2");
        robot_artifact_image_container.id = `img_cont_${this.robot_name}_${id}`;

        let robot_artifact_image_button = document.createElement("BUTTON");
        robot_artifact_image_button.setAttribute("class", "btn btn-secondary btn-sm");
        robot_artifact_image_button.style.border = 0;
        robot_artifact_image_button.style.fontSize = '0.79rem';
        robot_artifact_image_button.style.fontWeight = 'bold';
        robot_artifact_image_button.id = `arti_img_${this.robot_name}_${id}`;
        robot_artifact_image_button.innerHTML = "No Image";

        robot_artifact_tracker.appendChild(robot_artifact_tracker_yes_container);
        robot_artifact_tracker.appendChild(robot_artifact_image_container);
        robot_artifact_image_container.appendChild(robot_artifact_image_button);
        // robot_artifact_tracker.appendChild(robot_artifact_tracker_no);

        return robot_artifact_tracker;
    }

    updateDisplay() {
        console.log("updating the display")
        var artifact_page = document.getElementById("Artifact_Page");
        // Make this work - its looking for the wong thing
        var robot_artifacts = artifact_page.querySelector("[robot_name = '" + this.robot_name + "']");
        for (let id in this.artifactsList) {
            let artifact = this.artifactsList[id];
            let type = artifact.obj_class;
            let confidence = artifact.obj_prob;
            let position = artifact.position;

            if (this.artifact_tracker[id] == null) {
                let new_row = this.add_artifact(id);
                robot_artifacts.appendChild(new_row);
                this.set_artifact_tracker(robot_artifacts, id);
            }

            // When artifact class value has not been set, allow for code to set the class
            type == "" ? type = "undefined" : false;
            if (this.artifact_type[id].getAttribute("value") == "undefined") {
                this.artifact_type[id].innerText = type;
            }
            this.artifact_type[id].setAttribute("value", type);

            if (this.robot_name == 'Base') {
                // let num_seen = seen_by.split(',').length;
                // this.artifact_num_seen[id].innerText = num_seen;
                let seen_by = '';
                for (let robot in artifact.robots) {

                    seen_by += robot + ',';
                }
                if(seen_by != ""){
                    this.artifact_seen_by[id].innerText = seen_by.slice(0, -1);
                }
            } else if (artifact.fused) {
                this.artifact_type[id].style.backgroundColor = "#aaaaaa";
                this.artifact_confidence[id].style.backgroundColor = "#aaaaaa";
                this.artifact_position[id].style.backgroundColor = "#aaaaaa";
                this.artifact_image[id].style.backgroundColor = "#aaaaaa";
                // Button styling.  Can't change hover unless we swap classes.
                this.artifact_image[id].firstChild.style.backgroundColor = "#aaaaaa";
                this.artifact_image[id].firstChild.style.color = "#000000";
                this.artifact_tracker[id].querySelector("[id = '" + this.robot_name + "_" + id + "']").style.backgroundColor = "#aaaaaa";

            }

            if (artifact.submitted) {
                this.artifact_tracker[id].querySelector("[id = '" + this.robot_name + "_" + id + "']").firstChild.style.color = "#aaaaaa";
                this.artifact_tracker[id].querySelector("[id = 'submit_" + this.robot_name + "_" + id + "']").innerText = 'submission result: ' + this.artifactsList[id].result;
                let delButton = this.artifact_tracker[id].querySelector("[id = 'delete_" + this.robot_name + "_" + id + "']");
                if (delButton) delButton.remove();
            }

            this.artifact_confidence[id].setAttribute("value", toString(confidence));
            this.artifact_position[id].setAttribute("value", JSON.stringify(position));

            if (confidence != undefined) {
                this.artifact_confidence[id].innerText = confidence.toFixed(2);
            }
            if (position != undefined) {
                this.artifact_position[id].innerText = "{x: " + position.x.toFixed(2) + " y: " + position.y.toFixed(2) + " z: " + position.z.toFixed(2) + "}";
            }
            if (this.artifactImages.includes(id)){
                var img_btn = this.artifact_image[id].firstChild;
                console.log(this.robot_name + " has an image");
                let name = this.robot_name;
                img_btn.onclick = function(){show_image(name, id);};
                img_btn.innerHTML = "View Image";
                img_btn.setAttribute("data-toggle", "modal");
                img_btn.setAttribute("data-target", "#artifact_image_modal");
            }

            let color = this.color_artifacts(type);
            this.artifact_type[id].style.color = color;

            if(this.savedArtifacts.includes(type) == false){
                var position_string = `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`;

                log_robot_artifacts(this.robot_name, this.artifactsList);
                this.savedArtifacts.push(type)
                console.log(`saved artifact ${type}`)
            }
        }
    }

    add_array(array) {
        this.artifact_All.push(array);
    }

    // this svaes the image id for display purpouses
    save_image(msg) {
        this.artifactImages.push(this.robot_name + '_' + msg.artifact_id);
        console.log("got an image");
        this.updateDisplay();
    }

    getDist(artifact, artifact2) {
        var x1 = artifact.position.x;
        var y1 = artifact.position.y;
        var z1 = artifact.position.z;
        var x2 = artifact2.position.x;
        var y2 = artifact2.position.y;
        var z2 = artifact2.position.z;

        // return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }


    // THIS FUSES ARTIFACTS AND SEND THE FUSED ARTIFACT TO THE MARKER SERVER
    fuse_artifacts(id, useFusedArtifact) {
        let artifact;
        let fusedArtifacts = global_tabManager.fusedArtifacts.artifactsList;
        if (useFusedArtifact) {
            artifact = fusedArtifacts[id];
        } else {
            artifact = this.artifactsList[id];
        }
        let fuse = false;
        let new_ids = [];
        let remove_ids = [];


        // Compare to all of the other artifacts in the fuse array
        for (let id2 in fusedArtifacts) {
            // If the id's are the same then it's the same artifact
            // Note that if by some miracle multiple vehicles get the exact same position
            // then some of this may break!
            if (id2 != id) {
                let artifact2 = fusedArtifacts[id2];
                let dist = this.getDist(artifact, artifact2);

                if ((dist < 3) && (artifact.obj_class == artifact2.obj_class)) {
                    console.log("fusing", id, id2);
                    fuse = true;

                    if (useFusedArtifact) {
                        for (let id3 in artifact.originals) {
                            if (artifact2.originals[id3] == undefined) {
                                artifact2.originals[id3] = Object.assign({}, artifact.originals[id3]);
                                artifact2.originals[id3].position = Object.assign({}, artifact.originals[id3].position);
                            }
                        }
                    } else {
                        if (artifact2.originals[id] == undefined) {
                            artifact2.originals[id] = Object.assign({}, this.artifactsList[id]);
                            artifact2.originals[id].position = Object.assign({}, this.artifactsList[id].position);
                        }
                    }

                    let newArtifact = artifact2;
                    let x = 0;
                    let y = 0;
                    let z = 0;
                    let obj_prob = 0;
                    let robots = [];
                    let result = 0;
                    let submitted = false;

                    for (let id3 in artifact2.originals) {
                        let artifact3 = artifact2.originals[id3];
                        x += artifact3.position.x;
                        y += artifact3.position.y;
                        z += artifact3.position.z;
                        obj_prob += artifact3.obj_prob;
                        robots[artifact3.vehicle_reporter] = artifact3.vehicle_reporter;

                        global_tabManager.global_vehicleArtifactsList[artifact3.n].artifactsList[id3].fused = true;
                        if (global_tabManager.global_vehicleArtifactsList[artifact3.n].artifactsList[id3].submitted) {
                            submitted = true;
                            result += global_tabManager.global_vehicleArtifactsList[artifact3.n].artifactsList[id3].result;
                        }
                    }

                    length = Object.keys(artifact2.originals).length;
                    newArtifact.position.x = x / length;
                    newArtifact.position.y = y / length;
                    newArtifact.position.z = z / length;
                    newArtifact.obj_prob = obj_prob / length;
                    let newid = artifact2.id + '_' + id

                    fusedArtifacts[newid] = newArtifact;
                    fusedArtifacts[newid].id = newid;
                    fusedArtifacts[newid].robots = robots;
                    if (submitted) {
                        fusedArtifacts[newid].submitted = true;
                        fusedArtifacts[newid].result = result;
                    }
                    new_ids.push(newid);
                    remove_ids.push(id2);

                    // Move the marker
                    send_fused_update(fusedArtifacts[newid], newid, id2);
                }
            }
        }

        for (let i in remove_ids) {
            delete fusedArtifacts[remove_ids[i]];
            let elem = document.getElementById("Artifact_Page").querySelector("[robot_name = 'Base']").querySelector("[artifact_id = '" + remove_ids[i] + "']");
            if (elem != null)
                elem.parentNode.removeChild(elem);
        }

        if (new_ids.length > 1) {
            for (let i in new_ids) {
                if (fusedArtifacts[new_ids[i]] != undefined) {
                    if (this.fuse_artifacts(new_ids[i], true)) {
                        delete fusedArtifacts[new_ids[i]];
                        let elem = document.getElementById("Artifact_Page").querySelector("[robot_name = 'Base']").querySelector("[artifact_id = '" + new_ids[i] + "']");
                        if (elem != null)
                            elem.parentNode.removeChild(elem);

                    }
                }
            }
        }

        if (!useFusedArtifact && !fuse) {
            fusedArtifacts[id] = Object.assign({}, this.artifactsList[id]);
            fusedArtifacts[id].position = Object.assign({}, this.artifactsList[id].position);
            fusedArtifacts[id].vehicle_reporter = this.robot_name;

            fusedArtifacts[id].originals = [];
            fusedArtifacts[id].originals[id] = Object.assign({}, this.artifactsList[id]);
            fusedArtifacts[id].originals[id].position = Object.assign({}, this.artifactsList[id].position);

            fusedArtifacts[id].robots = [];
            fusedArtifacts[id].robots[this.robot_name] = this.robot_name;

            // Publish the new fused artifact to markers
            send_fused_update(fusedArtifacts[id], id, '');
        }

        global_tabManager.fusedArtifacts.updateDisplay();
        for (let n in global_tabManager.global_vehicleArtifactsList) {
            global_tabManager.global_vehicleArtifactsList[n].updateDisplay();
        }

        return fuse;
    }

    // THIS IS SUPER IMPORTANT AND ACTUALLY WHERE THE ARTIFACTS COME IN
    set_artifacts(msg) {
        // console.log("begining of setting artifact")
        let update = false;
        for (let i = 0; i < msg.length; i++) {
            // Remap the artifacts to the DARPA required names
            // SHOULD BE CHANGED BY MIKE ON A ROBOT LEVEL SO TRANSLATION DOESN'T NEED TO HAPPEN
            let obj_class = msg[i].obj_class;
            switch(msg[i].obj_class) {
                case "person":
                case "survivor":
                    obj_class = "Survivor";
                    break;
                case "cellphone":
                    obj_class = "Cell Phone";
                    break;
                case "backpack":
                    obj_class = "Backpack";
                    break;
                case "drill":
                    obj_class = "Drill";
                    break;
                case "extinguisher":
                    obj_class = "Fire Extinguisher";
                    break;
                case "gas":
                    obj_class = "Gas";
                    break;
                case "vent":
                    obj_class = "Vent";
                    break;
            }

            // console.log(typeof msg[i])

            // Set a unique id by adding the robot name
            // Only update the list if it's a new artifact
            let id = this.robot_name + '_' + msg[i].artifact_id;

            if (this.artifactsList[id] == undefined) {
                update = true;
                this.artifactsList[id] = {}
                this.artifactsList[id].id = id;
                this.artifactsList[id].n = this.n;
                this.artifactsList[id].fused = false;
                this.artifactsList[id].submitted = false;

                // When there is not an artifact class declared, set all properties of the artifact
                if (this.artifactsList[id].obj_class == undefined || this.artifactsList[i].obj_class == "") {
                    this.artifactsList[id].obj_class = obj_class;
                    this.artifactsList[id].obj_prob = msg[i].obj_prob;
                    this.artifactsList[id].header = msg[i].header;
                    this.artifactsList[id].position = msg[i].position;
                    this.artifactsList[id].vehicle_reporter = this.robot_name;
                }
                // When there is an artifact class declared, only set certain properties of the artifact
                // this logic allows for the user to change the name of artifact class from the gui
                else {
                    this.artifactsList[id].obj_prob = msg[i].obj_prob;
                    this.artifactsList[id].header = msg[i].header;
                    this.artifactsList[id].position = msg[i].position;
                }

                // Check if we need to fuse this with another artifact
                this.fuse_artifacts(id, false);
            }
        }
        // console.log("set artifacts")
        if (update) {
            //this.save_file();
            this.updateDisplay();
        }
    }

    deleteArtifact(id) {
        this.artifact_tracker[id].remove();
        delete this.artifactsList[id];
        delete this.artifact_tracker[id];
        delete this.artifact_position[id];
        delete this.artifact_type[id];
        delete this.artifact_seen_by[id];
        delete this.artifact_confidence[id];
        // delete this.artifact_image[id];
    }

    open_edit_submit_modal(id){
        console.log("inside the submit modal");
        $('#edit_x_pos').val(JSON.parse(this.artifact_position[id].getAttribute("value")).x.toFixed(2));
        $('#edit_y_pos').val(JSON.parse(this.artifact_position[id].getAttribute("value")).y.toFixed(2));
        $('#edit_z_pos').val(JSON.parse(this.artifact_position[id].getAttribute("value")).z.toFixed(2));
        $("#edit_type").val(this.artifact_type[id].innerText).change();

        // This is here for a reason as part of a scope change
        var different_scope_this = this;
        // This is called by the submit button on the modal
        $('#edit_submit').off('click').on('click', function () {
            console.log("submit button");
            submit_artifact(id, different_scope_this);
        });

        $('#NewReportModal').modal({backdrop: 'static', keyboard: false});
        $('#NewReportModal').modal('show');
    }


// ================================================================================================
// THIS IS SUBMITTING AN ARTIFACT
// ================================================================================================

    get_robot_name() {
        return this.robot_name;
    }

    get_artifactsList() {
        return this.artifactsList;
    }

    read_file() {
        // var robot_reported = `js/${this.robot_name}_reported.txt`;
        // if(fs.existsSync(robot_reported)){
        //     var reported_artifact_file = fs.readFileSync(robot_reported, "utf-8");
        //     this.reportedArtifacts = artifact_file.split("\n");
        //     console.log("recovered artifacts");
        // }else{
        //     fs.openSync(robot_reported, "w");
        //     console.log("made a recovery file for " + this.robot_name);
        // }
    }

    // Function for determining color id of artifacts in Artifact list
    color_artifacts(type) {
        switch (type) {
            case "Fire Extinguisher":
                return "red";
            case "Backpack":
                return "black";
                break;
            case "Survivor":
                return "blue";
            case "Drill":
                return "orange";
            default:
                break;

        }
    }

}

async function submit_artifact(id, _this) {
    var robo_name;

    // Catches for custom artifacts
    if(_this != undefined){
        robo_name = _this.get_robot_name();
    }else{
        robo_name = "base";
    }

    var data = {
        "x": parseFloat($('#edit_x_pos').val()),
        "y": parseFloat($('#edit_y_pos').val()),
        "z": parseFloat($('#edit_z_pos').val()),
        "type": $('#edit_type').val()
    };

    // Catching for custom artifacts
    if(id == 'base'){
        id = `${data.x}-${data.y}-${data.z}`; 
    }

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
    // Variables used for logging a little later and for submission now
    var position_string =  `${$('#edit_x_pos').val()}, ${$('#edit_y_pos').val()}, ${$('#edit_z_pos').val()}`;
    var notes = $('#edit_notes ').val();
    var type = $('#edit_type').val();

    $('#submission_tbody').append(`
    <tr>
        <td>${type}</td>
        <td>${position_string}</td>
        <td>${notes}</td>
        <td id="${type}_${position_string}">No result yet</td>
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
            log_submitted_artifacts(type, position_string, notes, json.score_change);
            update_submitted_table(robo_name, id, org_artifacts, json, type + '_' + position_string, data);
        });

    $('#NewReportModal').modal('hide');
}

// Update the submitted table
function update_submitted_table(robo_name, id, org_artifacts, json, htmlid, data){
    // This is for testing a bad artifact and darpa responding with "0"
    if(data.type == "return 0"){
      json.score_change = 0;
    }

    // This is where we get the darpa score back - specifically json.score_change

    // Write overall reported
    var submission_result = "+" + json.score_change + " points";
    // Here down is mostly formatting
    $("[id='" + htmlid + "']").text(submission_result);

    var color_class = 'table-danger';
    if(json.score_change > 0){
        color_class = 'table-success';
    }
    $("[id='" + htmlid + "']").parent().addClass(color_class);

    // Put the fused artifact in the fused artifact tab
    var fused_div = document.getElementById("fused_artifacts");

    document.getElementById("submit_" + robo_name + "_" + id).innerText = "submission result: " + submission_result;

    if (json.score_change > 0) {
        document.getElementById("submit_" + robo_name + "_" + id).disabled = true;
    }

    // Remove the delete button if we've ever tried to submit
    var delButton = document.getElementById("delete_" + robo_name + "_" + id);
    if (delButton) delButton.remove()

    if (robo_name == "Base") {
        for (let id2 in org_artifacts) {
            let artifact = org_artifacts[id2];
            global_tabManager.global_vehicleArtifactsList[artifact.n].artifactsList[id2].submitted = true;
            global_tabManager.global_vehicleArtifactsList[artifact.n].artifactsList[id2].result = json.score_change;
            let robot_name = global_tabManager.global_vehicleArtifactsList[artifact.n].robot_name;
            if (json.score_change > 0) {
                document.getElementById("submit_" + robot_name + "_" + id2).disabled = true;
            }
            delButton = document.getElementById("delete_" + robo_name + "_" + id2);
            if (delButton) delButton.remove()

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

                    delButton = document.getElementById("delete_Base_" + id2);
                    if (delButton) delButton.remove()
                }
            }
        }
        global_tabManager.fusedArtifacts.updateDisplay();
    }

    let success = false;

    if(json.score_change > 0){
        success = true;
    }

    submitted_marker(data, success)
}

// This is a work around for the custom submit modal so
// it actually submits when there are no fused artifacts
function custom_submission(){
    console.log("inside the submit modal");
    $('#edit_submit').off('click').on('click', function () {
        console.log("submit button");
        submit_artifact("base", undefined);
        $('#NewReportModal').modal("hide");
    });

    $('#NewReportModal').modal({backdrop: 'static', keyboard: false});
    $('#NewReportModal').modal("show");
}


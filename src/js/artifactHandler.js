/**
 * Artifact class for handling, sending, and checking known artifacts
 */


// establishes and evaluates a robots artifact list
class Artifact {

    /*
    Initializes arrays that store artifact information and an array for storing artifacts that 
    have been successfully reported to the base station. Also creates references to ids related
    to information display in the artifact table.

    If a csv file exists with previous reported artifacts those values are read and used for
    future reports
        - intended for use in the situation where the gui crashes during scored run
        - allows for no information to be lost in regards to what has been sent
    */
    constructor(name) {
        // Fixed array size determined by University of Colorado Denver, 
        // meant to reduce overall maintenance across network
        this.fixedArray_size = 20;
        this.robot_name = name;
        this.artifact_All = [];
        this.artifactsList = [];
        this.reportedArtifacts = new Array(this.fixedArray_size);

        if (!this.read_file()) {
            for (let i = 0; i < this.fixedArray_size; i++) {
                this.reportedArtifacts[i] = false;
            }
        };

        this.dist_threshhold = 1.0;
        console.log("artifact handler: " + name);

        this.location_all = 0; // Int to keep track of location in all artifact arrays stored by callback function
        this.location_array = 0; // Int to keep track of location in artifact array message
        var artifact_page = document.getElementById("Artifact_Page");

        this.artifact_tracker = new Array(this.fixedArray_size);
        this.artifact_position = new Array(this.fixedArray_size);
        this.artifact_type = new Array(this.fixedArray_size);
        this.artifact_confidence = new Array(this.fixedArray_size);
        this.artifact_image = new Array(this.fixedArray_size);

        // Establishes links to specific rows of artifact list for vehicle
        for (let i = 0; i < this.fixedArray_size; i++) {
            this.artifact_tracker[i] = artifact_page.querySelector("[robot_name = '" + name + "']").querySelector("[artifact_id = '" + parseFloat(i) + "']");
            this.artifact_position[i] = this.artifact_tracker[i].querySelector("[id = 'position'");
            this.artifact_type[i] = this.artifact_tracker[i].querySelector("[id = 'type'");
            this.artifact_confidence[i] = this.artifact_tracker[i].querySelector("[id = 'confidence'");
            this.artifact_image[i] = this.artifact_tracker[i].querySelector("[id = image]");
        }


    }

    skip_array() {
        this.artifact_All[0].shift();
        this.updateDisplay();
    }


    // Changes values stored on page so it represents the newest value
    updateDisplay() {
        // let end = this.artifactsList.length - 1;
        // let artifact = artifact_All[location_all][location_array];
        for (let i = 0; i < this.fixedArray_size; i++) {
            let artifact = this.artifactsList[i];
            let type = artifact.obj_class;
            let confidence = artifact.obj_prob;
            let position = artifact.position;

            // When artifact class value has not been set, allow for code to set the class
            type == "" ? type = "undefined" : false;
            if (this.artifact_type[i].getAttribute("value") == "undefined") {
                this.artifact_type[i].innerText = type;
            }
            this.artifact_type[i].setAttribute("value", type);
            this.artifact_confidence[i].setAttribute("value", toString(confidence));
            this.artifact_position[i].setAttribute("value", JSON.stringify(position));

            this.artifact_confidence[i].innerText = confidence.toFixed(2);
            this.artifact_position[i].innerText = "{x: " + position.x.toFixed(2) + " y: " + position.y.toFixed(2) + " z: " + position.z.toFixed(2) + "}";

            let color = this.color_artifacts(type);
            this.artifact_type[i].style.color = color;
        }
    }

    // adds a new artifact list for a new robot when it joins the system
    add_array(array) {
        this.artifact_All.push(array);
    }

    // sets artifact list value using msg from ROS and updates display accordingly
    set_artifacts(msg) {
        try {
            for (let i = 0; i < this.fixedArray_size; i++) {

                // When there is not an artifact class declared, set all properties of the artifact
                if (this.artifactsList[i].obj_class == "") {
                    this.artifactsList[i].obj_class = msg[i].obj_class;
                    this.artifactsList[i].obj_prob = msg[i].obj_prob;
                    this.artifactsList[i].has_been_reported = msg[i].has_been_reported;
                    this.artifactsList[i].header = msg[i].header;
                    this.artifactsList[i].position = msg[i].position;
                }
                // When there is an artifact class declared, only set certain properties of the artifact
                // this logic allows for the user to change the name of artifact class from the gui
                else {
                    // this.artifactsList = msg;
                    // this.artifactsList[i].obj_class = "";
                    this.artifactsList[i].obj_prob = msg[i].obj_prob;
                    this.artifactsList[i].has_been_reported = msg[i].has_been_reported;
                    this.artifactsList[i].header = msg[i].header;
                    this.artifactsList[i].position = msg[i].position;
                }
            }
        }
        catch{
            this.artifactsList = msg;
        }


        this.updateDisplay();
    }

    /*
    Analyzes requested artifact submission and determines if it has been reported before
    or if it resembles another artifact from another robot. If it has been reported it
    will not send to DARPA. If it looks the same as another artifact, the artifact with
    the highest confidence will be chosen and the user will be given an option to send
    once artifact is submitted it will check to see if the score increases and if it does
    the artifact will be marked as reported
    */
    submit_artifact(vehicle_Artifacts, row_id) {
        console.log(vehicle_Artifacts);
        console.log(JSON.parse(this.artifact_position[row_id].getAttribute("value")));
        var data = {
            "x": JSON.parse(this.artifact_position[row_id].getAttribute("value")).x,
            "y": JSON.parse(this.artifact_position[row_id].getAttribute("value")).y,
            "z": JSON.parse(this.artifact_position[row_id].getAttribute("value")).z,
            "type": this.artifact_type[row_id].innerText
        };
        var vehicle_Artifacts_length = vehicle_Artifacts.length;
        var other_location = new Array(vehicle_Artifacts_length);
        var best_prob = parseFloat(this.artifact_confidence[row_id].getAttribute("value"));
        for (let i = 0; i < vehicle_Artifacts_length; i++) {
            if (vehicle_Artifacts[i].get_robot_name() == this.get_robot_name()) {
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
                // console.log(Math.hypot(dist_x, dist_y));
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
        var score = Number($('#header_score').text());
        $.post(SERVER_ROOT + '/api/artifact_reports/', JSON.stringify(data))
            .done(function (data) {
                console.log(data);
            });

        if (Number($('#header_score').text()) > score) {
            this.reportedArtifacts[row_id] = true;
            this.save_file();

            // Sorts through all other vehicles and saves a csv file corresponding to that vehicles order of artifacts
            for (let i = 0; i < vehicle_Artifacts_length; i++) {
                if (other_location[i] != null && vehicle_Artifacts[i].get_robot_name() != this.robot_name) {
                    vehicle_Artifacts[i].reportedArtifacts[other_location[i]] = true;
                    vehicle_Artifacts[i].save_file();
                }
            }
        } else {
            console.log("No score increase for report");
        }
    }

    // returns robot associated with artifact list
    get_robot_name() {
        return this.robot_name;
    }

    get_artifactsList() {
        return this.artifactsList;
    }

    // Saves csv file containing robots reported artifact list, used for data
    // storage and collection in case of ros gui failure/crash
    save_file() {
        console.log(this.reportedArtifacts);
        console.log("Started saving artifact CSV file.");
        const createCsvWriter = require('csv-writer').createArrayCsvWriter;
        const csvWriter = createCsvWriter({
            path: this.robot_name + '_reported.csv',
            header: ['id', 'Reported']
        });

        csvWriter
            .writeRecords(this.reportedArtifacts)
            .then(() => console.log('Finished saving artifact CSV file.'));

    }

    // reads in csv file if it exists and stores the reported artifacts as an array
    read_file() {
        const csv = require('csv-parser');
        const fs = require('fs');
        var count = 0;
        console.log('Started reading artifact CSV file.');
        fs.createReadStream(this.robot_name + '_reported.csv')
            .pipe(csv())
            .on('data', (row) => {
                // console.log(row);
                this.reportedArtifacts[count] = (row.Reported == "true");

                count++;
            })
            .on('end', () => {
                console.log('Finished reading artifact CSV file.');
                console.log(this.reportedArtifacts);
            });
    }

    // Function for determining color id of artifacts in Artifact list
    color_artifacts(type) {
        switch (type) {
            case "fire extinguisher":
                return "red";
            case "backpack":
                return "black";
                break;
            case "person":
                return "blue";
            case "drill":
                return "orange";
            default:
                break;

        }
    }

    // Shows hidden image when img column is clicked in artifacts list
    display_image(vehicle_Artifacts, i) {
        var popup = this.artifact_image.querySelector("[id='myPopup']");
        popup.classList.toggle("show");
    }
}
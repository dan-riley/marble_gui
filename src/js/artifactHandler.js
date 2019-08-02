/**
 * Artifact class for handling, sending, and checking known artifacts
 */

 // Fixed array size determined by University of Colorado Denver, meant to reduce overall maintenance across network
var ARTIFACT_ARR_LEN = 20;

class Artifact {  
    constructor(name) {  
        this.robot_name = name;
        this.artifact_All = [];
        this.artifactsList = [];
        this.reportedArtifacts = new Array(ARTIFACT_ARR_LEN);

        if (!this.read_file()) {
            for (let i = 0; i < ARTIFACT_ARR_LEN; i++) {
                this.reportedArtifacts[i] = [i, false];
            }
        };

        this.dist_threshhold = 1.0;
        console.log("artifact handler: " + name);

        this.location_all = 0; // Int to keep track of location in all artifact arrays stored by callback function
        this.location_array = 0; // Int to keep track of location in artifact array message
        var artifact_page = document.getElementById("Artifact_Page");

        this.artifact_tracker = new Array(ARTIFACT_ARR_LEN);
        this.artifact_position = new Array(ARTIFACT_ARR_LEN);
        this.artifact_type = new Array(ARTIFACT_ARR_LEN);
        this.artifact_confidence = new Array(ARTIFACT_ARR_LEN);
        this.artifact_image = new Array(ARTIFACT_ARR_LEN);
        this.artifact_image_id = new Array(ARTIFACT_ARR_LEN);


        // Establishes links to specific rows of artifact list for vehicle
        for (let i = 0; i < ARTIFACT_ARR_LEN; i++) {
            this.artifact_tracker[i] = artifact_page.querySelector("[robot_name = '" + name + "']").querySelector("[artifact_id = '" + parseFloat(i) + "']");
            this.artifact_position[i] = this.artifact_tracker[i].querySelector("[id = 'position'");
            this.artifact_type[i] = this.artifact_tracker[i].querySelector("[id = 'type'");
            this.artifact_confidence[i] = this.artifact_tracker[i].querySelector("[id = 'confidence'");
            this.artifact_image[i] = this.artifact_tracker[i].querySelector("[id = image]");
        }


    }

    change_artifact() {

    }
    skip_array() {
        this.artifact_All[0].shift();
        this.updateDisplay();
    }

    //! Deprecated for use with small artifact interface
    skip_artifact(flag) {
        // this.artifact_array.shift();
        // if (this.location_array){

        // }
        var count = 0;
        while (this.reportedArtifacts[this.location_array][1] == true || this.artifactsList[this.location_array].obj_class == "" || flag) {
            flag = false;
            this.location_array++;
            console.log(this.location_array);
            if (this.location_array >= this.artifactsList.length) {
                this.location_array = 0;
            }
            count++;
            if (count == this.artifactsList.length) {
                break;
            }
        }
        // console.log(this.location_array);
        this.updateDisplay();
    }
    updateDisplay() {
        // let end = this.artifactsList.length - 1;
        // let artifact = artifact_All[location_all][location_array];
        for (let i = 0; i < ARTIFACT_ARR_LEN; i++) {
            let artifact = this.artifactsList[i];
            let type = artifact.obj_class;
            let confidence = artifact.obj_prob;
            let position = artifact.position;

            // let type = "survivor";
            // let confidence = 70.3;
            // let position = {x: 1.0, y: 2.0, z: 3.0};

            // When artifact class value has not been set, allow for code to set the class
            type == "" ? type = "undefined" : false;
            if (this.artifact_type[i].getAttribute("value") == "undefined"){
                this.artifact_type[i].innerText = type;
            }
            this.artifact_type[i].setAttribute("value", type);
            this.artifact_confidence[i].setAttribute("value", toString(confidence));
            this.artifact_position[i].setAttribute("value", JSON.stringify(position));

            this.artifact_confidence[i].innerText = confidence.toFixed(2);
            this.artifact_position[i].innerText = "{x: " + position.x.toFixed(2) + " y: " + position.y.toFixed(2) + " z: " + position.z.toFixed(2) + "}";
            
            if(artifact.image_data == null){
                this.artifact_image[i].innerText = "No Image";
            }
            else{
                if( this.artifact_image[i].children.length == 0){
                    this.artifact_image[i].innerText = "View Image";
                    let robot_artifact_image = document.createElement("IMG");
                    robot_artifact_image.setAttribute("id", "myPopup");
                    robot_artifact_image.setAttribute("class", "popuptext");
                    this.artifact_image[i].appendChild(robot_artifact_image);
                }
                this.artifact_image[i].children[0].setAttribute("src", "data:image/jpg;base64," + this.artifactsList[i].image_data);

                this.artifact_image[i].onclick = function(){
                    $(this.children[0]).toggleClass("show");
                }
            }

            let color = this.color_artifacts(type);
            this.artifact_type[i].style.color = color;
            // this.artifact_confidence[i].style.color = color;
            // this.artifact_position[i].style.color = color;
        }

        //! The code below is meant for use with a smaller artifact list user interface, this interface only showed 1 artifact at a time from each vehicle
        // let artifact = this.artifactsList[this.location_array];
        // let type = artifact.obj_class;
        // let confidence = artifact.obj_prob;
        // let position = artifact.position;

        // // let type = "survivor";
        // // let confidence = 70.3;
        // // let position = {x: 1.0, y: 2.0, z: 3.0};

        // this.artifact_type.innerText = "Type: " + type;
        // this.artifact_confidence.innerText = "Confidence: " + confidence.toFixed(2);
        // this.artifact_position.innerText = "Position: {x: " + position.x.toFixed(2) + " y: " + position.y.toFixed(2) + " z: " + position.z.toFixed(2) + "}";
    }
    add_array(array) {
        this.artifact_All.push(array);
    }
    // Use this to save the image received from ROS
    save_image(msg){
        this.artifactsList[msg.image_id.data].image_data = msg.artifact_img.data;
        this.save_file();
        this.updateDisplay();
    }
    set_artifacts(msg) {
        try{
            if(msg.length != ARTIFACT_ARR_LEN){
                console.log("number of artifacts in message received is not the same as the amount expected!!!");
            }
            for (let i = 0; i < ARTIFACT_ARR_LEN; i++){

                // When there is not an artifact class declared, set all properties of the artifact
                if (this.artifactsList[i].obj_class == ""){
                    this.artifactsList[i].obj_class = msg[i].obj_class;
                    this.artifactsList[i].obj_prob = msg[i].obj_prob;
                    this.artifactsList[i].has_been_reported = msg[i].has_been_reported;
                    this.artifactsList[i].header = msg[i].header;
                    this.artifactsList[i].position = msg[i].position;
                    this.artifactsList[i].image_id = msg[i].image_id;
                    this.artifactsList[i].vehicle_reporter = msg[i].vehicle_reporter;
                }
                // When there is an artifact class declared, only set certain properties of the artifact
                // this logic allows for the user to change the name of artifact class from the gui
                else{
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
        
        this.save_file();
        this.updateDisplay();
    }

    submit_artifact(vehicle_Artifacts, row_id) {
        console.log(vehicle_Artifacts);
        var robo_name = this.get_robot_name();

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
        var universal_page = document.getElementById("Universal_Page");
        var universal_score_section = universal_page.getElementsByTagName("span")[1];
        var score = parseFloat(universal_score_section.getAttribute("score"));
        console.log("submitting artifact to DARPA server. Waiting for response...");
        $.post(SERVER_ROOT + '/api/artifact_reports/', JSON.stringify(data))
        .done(function( json ) {
            document.getElementById(robo_name + "_" + row_id).innerText = "submission result: +" + json.score_change + " points";
            if (json.score_change) {
                this.reportedArtifacts[row_id][1] = true;
                this.save_file();
    
                // Sorts through all other vehicles and saves a csv file corresponding to that vehicles order of artifacts
                for (let i = 0; i < vehicle_Artifacts_length; i++) {
                    if (other_location[i] != null && vehicle_Artifacts[i].get_robot_name() != this.robot_name) {
                        vehicle_Artifacts[i].reportedArtifacts[other_location[i]][1] = true;
                        vehicle_Artifacts[i].save_file();
                        // vehicle_Artifacts[i].check_location(other_location[i]);
                    }
                }
                // this.skip_artifact(false);
            } 
        });
    }

    get_robot_name() {
        return this.robot_name;
    }

    get_artifactsList() {
        return this.artifactsList;
    }
    // set reportedArtifacts(value){
    //     console.log(value);
    //     if (value != null){
    //         this.save_file();
    //     }   
    // }

    //! Deprecated for use with small artifact interface
    check_location(location) {
        if (this.location_array == location) {
            this.skip_artifact(false);
        }
    }
    save_file() {
        const createCsvWriter = require('csv-writer').createArrayCsvWriter;
        const csvWriter = createCsvWriter({
            path: this.robot_name + '_reported.csv',
            header: ['id', 'Reported']
        });
        csvWriter
            .writeRecords(this.reportedArtifacts);//.then(() => console.log('The CSV file was written successfully'));

    }
    read_file() {
        const csv = require('csv-parser');
        const fs = require('fs');
        var count = 0;
        fs.createReadStream(this.robot_name + '_reported.csv')
            .pipe(csv())
            .on('data', (row) => {
                // console.log(row);
                this.reportedArtifacts[count][0] = parseInt(row.id);
                this.reportedArtifacts[count][1] = (row.Reported == "true");

                count++;
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
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

}
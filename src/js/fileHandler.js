var fs = require("fs");

// Robots that are allowed to be displayed in the GUI
// Leave the file blank to display any that match
function get_mission_robots() {
    var robots_file = fs.readFileSync("js/robots.txt", "utf-8");
    var robots_disp = robots_file.split("\n");
    return robots_disp;
}


// you might wnat to change where the artifact file is
// It works by putting each artifact on a new line
var artifact_file = fs.readFileSync("js/artifacts.txt", "utf-8");
var artifacts = artifact_file.split("\n");
var ARTIFACT_ARR_LEN = artifacts.length;
function populateOpts() {
    var modal_options = document.getElementById("edit_type");
    for (var i = 0; i < artifacts.length; i++) {
        var artifact = artifacts[i];
        var option = document.createElement("option");
        option.text = artifact;
        option.value = artifact;
        modal_options.add(option);
    }
    console.log("made artifacts array");
}


// For crash recovery this checks for logs of artifacts that have been reported by robots
function what_logs() {
    console.log("Checking for logs");
    var existing_logs = []
    var files = fs.readdirSync('js');
    for (f = 0; f < files.length; f++) {
        if (files[f].includes("_reported.json")) {
            existing_logs.push(files[f].split("_")[0]);
        }
    }
    console.log(existing_logs);
    return existing_logs;
}


// This logs artifacts that have been submitted to darpa
function log_submitted_artifacts(artifact, position, notes, score) {
    console.log("saving a submitted artifact");
    var submitted_data = `\n${artifact} |${position}| ${notes} | ${score}`;
    console.log(submitted_data)
    fs.appendFile('js/DARPA_reported.txt', submitted_data, function (err) {
        if (err) throw err;
        console.log(err);
    });
}


// This saves an artifact from a robot to a file
// Each robot has its own file
function log_robot_artifacts(robot_name, artifacts) {
    var artifact_list = [];
    // console.log(artifacts);
    // this catches if teh artifacts array is undefined sometimes
    if(artifacts == "undefined"){
        return;
    }
    // This turns every artifact and its data into a json string
    for (let id in artifacts) {
        artifact_list.push(JSON.stringify(artifacts[id]));
    }
    // console.log(robot_name, artifact_list);
    // This puts the list of json strings into a json container for writing to the file
    var artifact_data = `{"data": [${artifact_list}]}`;

    // write all of the data to the file
    fs.writeFile(`js/${robot_name}_reported.json`, artifact_data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}


// This is for recovering aftifacts from the _reported files for each robot so duplicates arent made in the reported files
function recover_artifacts(name) {
    console.log(`Recovering artifacts for ${name}`);
    // see what report files exist
    let existing_logs = what_logs();
    var robot_file_name = `js/${name}_reported.json`;
    // if the log exists, recover the reports
    if(existing_logs.indexOf(name) >= 0) {
        console.log(`recovring artifacts from ${name}`);
        try{
            var content = fs.readFileSync(robot_file_name, "utf8");
            var ret = JSON.parse(content);
            // console.log(ret.data);
            return ret.data;
        }catch{
            console.log("whoops, cant read that file");
        }
        console.log("wtf are you doing?");
    }
    // if there was an error, just return an empty array
    console.log("returning empty array");
    return [];
}


// This gets all of the submitted artifacts
function get_darpa_artifacts() {
    console.log("Getting artifacts submitted to darpa");
    var darpa_file_name = "js/DARPA_reported.txt"
    // open or make DARPA_reported

    // Get the list of existing logs
    let existing_logs = what_logs();

    var found = existing_logs.find(function (darpa) {
        return darpa == "DARPA";
    });
    if (found) {
        fs.open(darpa_file_name, 'r+', function (err, file) {
            if (err) throw err;
            console.log(`Found ${darpa_file_name}`);
        });
    }
    try {
        var DARPA_reported_file = fs.readFileSync(darpa_file_name, "utf-8");
    }
    catch (error) {
        fs.open(darpa_file_name, 'w', function (err, file) {
            if (err) throw err;
            console.log('error in creating the darpa reported file');
        });
    }
    // Get artifacts reported to darpa
    var reported = DARPA_reported_file.split("\n");
    for (var i = 0; i < reported.length; i++) {
        var reported_components = reported[i].split("|");
        // Catch weird errors where empty or undefined artifacts are added to the file
        if (reported_components[0] != '' || reported_components[0] == 'undefined') {
            var color_class = 'table-danger';
            if (parseInt(reported_components[3]) > 0) {
                color_class = 'table-success';
            }
            $('#submission_tbody').append(`
            <tr class="${color_class}">
                <td>${reported_components[0]}</td>
                <td>${reported_components[1]}</td>
                <td>${reported_components[2]}</td>
                <td id="${reported_components[1]}">${reported_components[3]}</td>
            </tr>`);
        }
    }
}


//Move files from this mission to another folder with date and stuff
// end mission
function end_mission() {
    console.log("ending mission")
    let existing_logs = what_logs();
    // MAKE BETTER DIR NAME
    var currentdate = new Date();
    var folder = currentdate.getFullYear() + "."
        + (currentdate.getMonth() + 1) + "."
        + currentdate.getDate() + "_"
        + currentdate.getHours() + "."
        + currentdate.getMinutes() + "."
        + currentdate.getSeconds();
    fs.mkdirSync(`js/saved_missions/${folder}`)
    // console.log(folder);
    for (f = 0; f < existing_logs.length; f++) {
        let oldPath = `js/${existing_logs[f]}_reported.json`;
        let newPath = `js/saved_missions/${folder}/${existing_logs[f]}_reported.json`;
        copy(oldPath, newPath);
    }
    $('#EndMissionModal').modal('hide');
}


// Take  a guess what this does
function copy(oldPath, newPath) {
    fs.rename(oldPath, newPath, (err) => {
        if (err) throw err;
        console.log('Rename complete!');
    });


}


// This overwrites the save files 
// for use while at competition and preliminary checks are over
function clear_mission() {
    console.log("Clearing mission");
    let existing_logs = what_logs();
    for (f = 0; f < existing_logs.length; f++) {
        let file_path = `js/${existing_logs[f]}_reported.json`;
        fs.writeFile(file_path, '', function (err) {
            if (err) throw err;
            console.log(err);
        });
    }
    $('#EndMissionModal').modal('hide');
}
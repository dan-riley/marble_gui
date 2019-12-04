var fs = require("fs");
// you might wnat to change where the artifact file is
// It works by putting each artifact on a new line
var artifact_file = fs.readFileSync("js/artifacts.txt", "utf-8");
var artifacts = artifact_file.split("\n");
var ARTIFACT_ARR_LEN = artifacts.length;
function populateOpts(){
    var modal_options = document.getElementById("edit_type");
    for(var i = 0; i < artifacts.length; i++){
        var artifact = artifacts[i];
        var option = document.createElement("option");
        option.text = artifact;
        option.value = artifact;
        modal_options.add(option);
    }
    console.log("made artifacts array")
}

// For crash recovery
var existing_logs = []
function what_logs(){
    var files = fs.readdirSync('js');
    for(f = 0; f < files.length; f++){
        if(files[f].includes("_reported.txt")){
            existing_logs.push(files[f].split("_")[0]);
        }
    }  
}

// This logs artifacts that have been submitte dto darpa
function log_submitted_artifacts(artifact, position, notes, score){
    var submitted_data  = `\n${artifact} |${position}| ${notes} | ${score}`;
    console.log(submitted_data)
    fs.appendFile('js/DARPA_reported.txt', submitted_data, function (err) {
        if (err) throw err;
        console.log(err);
      });
}

function log_robot_artifacts(robot_name, artifact, position){
    var submitted_data  = `\n${artifact} | ${position}`;
    // console.log(submitted_data)
    fs.appendFile(`js/${robot_name}_reported.txt`, submitted_data, function (err) {
        if (err) throw err;
        // console.log(err);
    });
    return true
}


// This gets all of the submitted artifacts
function get_darpa_artifacts(){
    var darpa_file_name = "js/DARPA_reported.txt"
    // open or make DARPA_reported
    if(existing_logs.indexOf('DARPA') < 0){
        fs.open(darpa_file_name, 'w', function (err, file) {
            if (err) throw err;
            console.log('Saved!');
          });
    }
    try{
        var DARPA_reported_file = fs.readFileSync(darpa_file_name, "utf-8");
    }
    catch(error){
        fs.open(darpa_file_name, 'w', function (err, file) {
            if (err) throw err;
            console.log('error in creating the darpa reported file');
          });
    }
    // Get artifacts reported to darpa
    var reported = DARPA_reported_file.split("\n");
    for(var i = 0; i < reported.length; i++){
        var reported_components = reported[i].split("|");
        // Catch weird errors where empty or undefined artifacts are added to the file
        if(reported_components[0] != '' || reported_components[0] == 'undefined'){
            var color_class = 'table-danger';
            if(parseInt(reported_components[3]) > 0){
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
function end_mission(){
    // MAKE BETTER DIR NAME
    var currentdate = new Date(); 
    var folder = currentdate.getFullYear() + "."
                + (currentdate.getMonth()+1)  + "." 
                + currentdate.getDate() + "_"  
                + currentdate.getHours() + "."  
                + currentdate.getMinutes() + "." 
                + currentdate.getSeconds();
    fs.mkdirSync(`past_missions/${folder}`)
    for(f = 0; f < existing_logs.length; f++){
        fs.renameSync(`js/${existing_logs[f]}`, `${folder}/${existing_logs[f]}`);
    }
    $('#EndMissionModal').modal('hide');
}


// This is for recovering aftifacts from the _reported files for each robot so duplicates arent made in the reported files
function recover_artifacts(name){
    var reported_types = []
    var robot_file_name = `js/${name}_reported.txt`
    if(existing_logs.indexOf(name) >= 0){
        // console.log(`recovring artifacts from ${name}`)
        var robot_reported_file = fs.readFileSync(robot_file_name, "utf-8");
        var reported = robot_reported_file.split("\n");
        for(var i = 0; i < reported.length; i++){
            var reported_components = reported[i].split(" |");
            // Catch weird errors where empty or undefined artifacts are added to the file
            if(reported_components[0] != '' || reported_components[0] == 'undefined'){
                reported_types.push(reported_components[0])
            }
        }
    }
    console.log(reported_types);
    return reported_types
    }
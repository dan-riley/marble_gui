var fs = require("fs");
const path = require('path')

// you might wnat to change where the artifact file is
// It works by putting each artifact on a new line
var artifact_file = fs.readFileSync("js/artifacts.txt", "utf-8");
var artifacts = artifact_file.split("\n");
var ARTIFACT_ARR_LEN = artifacts.length;
function populateOpts(id) {
    var modal_options = document.getElementById(id);
    for (var i = 0; i < artifacts.length; i++) {
        var artifact = artifacts[i];
        if(artifact != ""){
            var option = document.createElement("option");
            option.text = artifact;
            option.value = artifact;
            modal_options.add(option);
        }
    }
    // console.log("made artifacts array");
}


function what_logs(startPath, filter, keepPath, keepSuffix){
    if(keepPath == undefined) keepPath = false;
    if(keepSuffix == undefined) keepSuffix = false;
    // console.log("Checking for logs", startPath, filter);

    var returnable = []

    if(!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    for(var i = 0; i < files.length; i++){
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if(stat.isDirectory()){
            // Recurse
            returnable.concat(what_logs(filename, filter, keepPath, keepSuffix));
        }else if(filename.indexOf(filter) >= 0) {
            if(keepPath == false){
                filename.replace(startPath, '');
            }
            if(keepSuffix == false){
                filename.replace(filter, '');
            }
            returnable.push(filename)
        };
    };
    // console.log(returnable);
    return returnable
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
    fs.writeFile(`js/mission_logs/${robot_name}_reported.json`, artifact_data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}


// This is for recovering aftifacts from the _reported files for each robot so duplicates arent made in the reported files
function recover_artifacts(name) {
    console.log(`Recovering artifacts for ${name}`);
    // // see what report files exist
    // let existing_logs = what_logs();
    // var robot_file_name = `js/${name}_reported.json`;
    // // if the log exists, recover the reports
    // if(existing_logs.indexOf(name) >= 0) {
    //     console.log(`recovring artifacts from ${name}`);
    //     try{
    //         var content = fs.readFileSync(robot_file_name, "utf8");
    //         var ret = JSON.parse(content);
    //         // console.log(ret.data);
    //         return ret.data;
    //     }catch{
    //         console.log("whoops, cant read that file");
    //     }
    //     console.log("wtf are you doing?");
    // }
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
    let existing_logs = what_logs("js/mission_logs", "_reported.json");

    var found = existing_logs.find(item => item =="DARPA");
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
    let existing_logs = what_logs("js/mission_logs", "_reported.json", true, true);
    // MAKE BETTER DIR NAME
    var currentdate = new Date();
    var folder = currentdate.getFullYear() + "."
        + (currentdate.getMonth() + 1) + "."
        + currentdate.getDate() + "_"
        + currentdate.getHours() + "."
        + currentdate.getMinutes() + "."
        + currentdate.getSeconds();
    let save_folder = `js/saved_missions/${folder}`;
    fs.mkdirSync(save_folder);
    // Move all of the logs of the objects
    for (f = 0; f < existing_logs.length; f++) {
        let oldPath = existing_logs[f];
        let newPath = `js/saved_missions/${folder}/${existing_logs[f].replace("js/")}`;
        copy(oldPath, newPath);
    }
    // Move all of the images
    let images = what_logs("js/mission_imgs", ".jpg", true, true);
    for(i = 0; i < images.length; i++){
        let oldPath = images[i];
        let newPath = `js/saved_missions/${folder}/${images[i].replace("js/mission_imgs/", "")}`;
        // Make directory for robot if necessary
        let dirPath = newPath.substr(0, newPath.lastIndexOf("/"));
        if(!fs.existsSync(dirPath)){
            fs.mkdirSync(`js/saved_missions/${folder}/${dirPath.replace(save_folder + "/", "")}`)
        }
        copy(oldPath, newPath);
    }
    copy("js/DARPA_reported.txt", save_folder + "DARPA_reported.txt")
    $('#EndMissionModal').modal('hide');
}


// Take a guess what this does
function copy(oldPath, newPath) {
    console.log(oldPath, newPath);
    fs.rename(oldPath, newPath, (err) => {
        if (err) throw err;
        console.log('Rename complete!');
    });


}


// This overwrites the save files 
// for use while at competition and preliminary checks are over
function clear_mission() {
    console.log("Clearing mission");
    let existing_logs = what_logs("js/mission_logs", "_reported.json", true, true);
    console.log(existing_logs)
    for (f = 0; f < existing_logs.length; f++) {
        fs.unlink(existing_logs[f], function (err) {
            if (err) throw err;
            console.log(err);
        });
    }
    let existing_imgs = what_logs("js/mission_imgs", ".jpg", true, true);
    console.log(existing_imgs)
    for (f = 0; f < existing_imgs.length; f++) {
        fs.unlink(existing_imgs[f], function (err) {
            if (err) throw err;
            console.log(err);
        });
        console.log("deleted image");
    }
    // Get rid of the submitted data
    fs.unlink("js/DARPA_reported.txt", function (err) {
        if (err) throw err;
        console.log(err);
    });

    $('#EndMissionModal').modal('hide');
    location.reload();
}


function image_saver(robot_name, msg){
    let path = `js/mission_imgs/`;
    // create the directory if needed
    var robot_folders = [];
    var files = fs.readdirSync(path);
    for (f = 0; f < files.length; f++) {
        let dirPath = path + files[f];
        if(fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
            robot_folders.push(files[f]);
        }
    }
    console.log(robot_folders);
    if(robot_folders.indexOf(robot_name) == -1){
        fs.mkdirSync(path + robot_name);
    }
    // write the image to file
    fs.writeFileSync(`${path}${robot_name}/${msg.image_id}.png`, msg.artifact_img.data, 'binary', function(err){
        if (err) throw err
        console.log('File saved.')
    })
}

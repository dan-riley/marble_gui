// switch estop button to be "estop disabled" when pressed
function estop_toggle(robot_name){
    var tele_btn = document.getElementById(`${robot_name}_btn_estop_toggle`);

    if(tele_btn.innerText == "E-Stop"){
        send_signal_to(robot_name, 'estop_cmd', true)
        tele_btn.innerText = "Disable E-Stop";
        tele_btn.className = "btn btn-danger btn-sm";
    }else{
        send_signal_to(robot_name, 'estop_cmd', false)
        tele_btn.innerText = "E-Stop";
        tele_btn.className = "btn btn-success btn-sm";
    }
}

// This changes the teleop robot to whatever is selcted by the controls card
function teleop_toII(){
    var opt = document.getElementById("teleop_robot_select");
    var robot_name = opt.options[opt.selectedIndex].value;

    var tele_btn = document.getElementById(`teleop_toggle`);
    var robot_ctrl_card = document.getElementById(`${robot_name}_control_card`)

    if(tele_btn.value == "Joystick Teleop"){
        teleop_robot = robot_name;
        tele_btn.value = "Disable Teleop";
        robot_ctrl_card.style.backgroundColor = "#FF4C26";
    }else{
        teleop_robot = "Base";
        tele_btn.value = "Joystick Teleop";
        robot_ctrl_card.style.backgroundColor = "darkgrey";
    }
}

var prevListener = false;
var nextListener = false;
// This shows an artifact image(s)
function show_images(robots, ids){
    let modalImg = document.getElementById("artifact_image");
    let prevBtn = document.getElementById("previousImage");
    let nextBtn = document.getElementById("nextImage");
    iidx = 0;

    // Hide buttons by default
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    if (robots.length > 1) {
        nextBtn.style.display = 'block';

        if (!prevListener) {
            prevListener = true;
            prevBtn.addEventListener('click', function() {
                iidx--;
                modalImg.src = `js/mission_imgs/${robots[iidx]}/${ids[iidx]}.jpg`;
                nextBtn.style.display = 'block';
                if (iidx == 0)
                    prevBtn.style.display = 'none';
            });
        }

        if (!nextListener) {
            nextListener = true;
            nextBtn.addEventListener('click', function() {
                iidx++;
                modalImg.src = `js/mission_imgs/${robots[iidx]}/${ids[iidx]}.jpg`;
                prevBtn.style.display = 'block';
                if (iidx > robots.length - 2)
                    nextBtn.style.display = 'none';
            });
        }
    }

    // Display default image
    try{
        modalImg.src = `js/mission_imgs/${robots[0]}/${ids[0]}.jpg`;
    }catch{
        console.log("error with image");
    }
}

// This is used for determining if we need to publish the odom a few times
var tf_published_before = false;

// this sends the 
function transform_preview(){
    // var preview_button = document.getElementById("transform_preview_button");
    previewTransform(true);
    // It takes a few publish attempts to get the urdf to show the tf
    for(var i = 0; i < 3; i++){
        setTimeout(function(){ 
            previewTransform(true);
        }, i*500);
    }

}

function send_beacons(robot) {
    var beacons = document.getElementsByName("beacons_" + robot)[0].value;
    send_ma_task(robot, 'setBeacons', beacons);
}

function send_end_time(robot) {
    // Let BOBCAT actually calculate the time since Javascript stamp may not match
    var end_minutes = document.getElementsByName("end_minutes_" + robot)[0].value;
    send_ma_task(robot, 'setGUITime', 'setTime_' + end_minutes.toString());
}

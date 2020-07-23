// switch estop button to be "estop disabled" when pressed
function estop_toggle(robot_name){
    var tele_btn = document.getElementById(`${robot_name}_estop_toggle`);

    if(tele_btn.innerText == "E-Stop"){
        send_signal_to(robot_name, 'estop_cmd', true)
        tele_btn.innerText = "Disable E-Stop";
        tele_btn.className = "btn btn-danger   btn-sm";
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

// This shows an artifact image
function show_image(robot_name, id){
    // console.log(`uhh showing ${robot_name}`);
    // $(this.children[0]).toggleClass("show");
    let img_modal = document.getElementById("artifact_image_modal");
    let modalImg = document.getElementById("artifact_image");
    // console.log(id);
    try{
        modalImg.src = `js/mission_imgs/${robot_name}/${id}.jpg`;
        // img_modal.modal('show');
        // console.log("image show not working now");
    }catch{
        console.log("error with image");
    } 
}


// this sends the 
function transform_preview(){
    var preview_button = document.getElementById("transform_preview_button");



    // switch button color when activated
    if(preview_button.innerText == "Preview TF"){
        // Call over to the rvizMessaging file to send the preview
        previewTransform(true);
        preview_button.innerText = "Turn Off Preview";
        preview_button.className = "btn btn-danger";
    }else{
        // Call over to the rvizMessaging file to send the preview
        previewTransform(false);
        preview_button.innerText = "Preview TF";
        preview_button.className = "btn btn-success";
    }

}
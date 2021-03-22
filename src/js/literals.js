// This file is entirely for building bits of the pages for the robots to abstract away the grunt work of writing html


function controlCard(robot){
    var disarmBtn = '';
    if (robot.includes('A')){
        disarmBtn = `
        <button type='button' class="btn btn-danger btn-sm" id="${robot}_btn_disarm"
            onclick="send_signal_to('${robot}', 'disarm', true)">
            Disarm
        </button><br>`;
    }

    let card = `<li id="${robot}_control_card" class="quick_control">
            <h4>${robot}</h4>
            <p id="distance_to_${robot}">0m</p>
            ${disarmBtn}
            <button type='button' class="btn btn-success btn-sm" id="${robot}_btn_start"
                onclick="send_ma_task('${robot}', 'task', 'Start')" title="Start">
                <img src="./images/start.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-danger btn-sm" id="${robot}_btn_stop"
                onclick="send_ma_task('${robot}', 'task', 'Stop')" title="Stop">
                <img src="./images/Stop_sign.png" class="control-icons">
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${robot}_btn_explore"
                onclick="send_ma_task('${robot}', 'task', 'Explore')" title="Explore">
                <img src="./images/compas.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-primary btn-sm" id="${robot}_btn_home"
                onclick="send_ma_task('${robot}', 'task', 'Home')" title="Go Home">
                <img src="./images/go_home.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-primary btn-sm" id="${robot}_btn_deploy"
                onclick="send_ma_task('${robot}', 'task', 'Deploy')" title="Deploy Beacon">
                <img src="./images/deploy_beacon.png" class="control-icons">
            </button>
            <br>
            <button type='button' class="btn btn-success btn-sm" id="${robot}_btn_estop_toggle"
                onclick="estop_toggle('${robot}')" title="Estop">
                E-Stop
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${robot}_btn_radio"
                onclick="send_signal_to('${robot}', 'radio_reset_cmd', true)" title="Radio Reset">
                <img src="./images/radio_reset.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${robot}_teleop"
                onclick="teleop_to('${robot}')" value="Teleop" title="Teleop">
                <img src="./images/teleop.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${robot}_btn_goal"
                onclick="publish_goal('${robot}')" value="Go to Goal" title="Go To Goal">
                <img src="./images/go_to_goal.png" class="control-icons">
            </button>
            <button type='button' class="btn btn-warning btn-sm" id="${robot}_goal"
                onclick="goal_to_robotII('${robot}')" value="Goal to Robot" title="Goal To Robot">
                <img src="./images/goal_to_robot.png" class="control-icons">
            </button></br>

        </li>`;

        return card;
}


function robotTab(robot, n){
    let tab = `
    <li class="nav-item" id="${robot}_nav_link" robot_name="${robot}">
        <a  class="nav-link" onclick="window.openPage('${robot}', ${n})" >
            ${robot}
            <br><span id="connection_status_${robot}"></span>
            <br><span id="task_status_${robot}"></span>
        </a>
    </li>`;

    return tab;
}

function robotReset(robot){
    let robot_reset = document.createElement("DIV");
        robot_reset.setAttribute("id", robot);
        robot_reset.setAttribute("class", "row");
        robot_reset.innerHTML = `
                <div class="col-auto"><H3>${robot}</H3></div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="reset_agent" title="Resets multi-agent and mapping like a fresh start (affects all robots including this one)">
                  <label for="reset_agent"><b>Reset Agent</b><label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="hard_reset" title="Resets the current map for this robot like a fresh start, including on the robot itself">
                  <label for="hard_reset">Hard Reset Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="clear_map" name="clear" title="Clears the current map for this robot but continues from current position">
                  <label for="clear_map">Clear Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="reset_map" title="Resets the current map for this robot like a fresh start">
                  <label for="reset_map">Reset Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="ignore_map" title="Ignores map from this agent until reset (does not clear the map by itself!)">
                  <label for="ignore_map">Ignore Map<label>
                </div>
                <div class="col-auto">
                  <input type="checkbox" class="form-control reset-check" name="ma_reset" title="Resets multi-agent for this robot like a fresh start, except for maps">
                  <label for="ma_reset">Reset Multi-Agent<label>
                </div>
                 <div class="col-auto">
                  <input type="text" class="form-control" name="diff_reset" title="Removes map diffs from everyone else's merged map.  Use comma-separated list (1,3,6,8) OR range (0-8), but not both!">
                  <label for="diff_reset">Reset Map Diffs<label>
                </div>`;
        let reset_tracker = document.getElementById("robot_reset_tables");
        reset_tracker.appendChild(robot_reset);
}


function tabContent(robot){
    var tab_content = document.createElement("DIV");
        tab_content.setAttribute("id", robot);
        tab_content.setAttribute("class", "tabcontent");

        // Generate topics for each robot and subscribe
        var sub = document.createElement("DIV");
        sub.setAttribute("class", "info");

        var top_card = document.createElement("DIV");
        top_card.setAttribute("class", "card");

        var top_card_header = document.createElement("DIV");
        top_card_header.setAttribute("class", "card-header");
        top_card_header.innerText = robot;

        top_card.appendChild(top_card_header);
        tab_content.appendChild(top_card);

        $('#Robot_Pages').prepend(tab_content);
}


function robotArtifactSection(robot, n){
    var robot_artifact_container = document.createElement("DIV");
        robot_artifact_container.setAttribute("class", "col-sm-12 artifact_table");
        robot_artifact_container.setAttribute("robot_name", robot);

        var robot_artifact_titles = document.createElement("DIV");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "title");
        robot_artifact_titles.setAttribute("class", "row");
        robot_artifact_titles.setAttribute("artifact_id", "header");
        robot_artifact_titles.innerHTML = `
                <span class="col-sm-1"> </span>
                <span id="type" class="badge badge-secondary col-sm-2" style="text-align: center"><b>Type</b></span>
                <span id="confidence" class="badge badge-secondary col-sm-1" style="text-align: center"><b>Confidence</b></span>
                <span id="position" class="badge badge-secondary col-sm-3" style="text-align: center"><b>Position</b></span>
                <span class="badge badge-secondary col-sm-2" style="text-align: center"><b>DARPA</b></span>
                <span class="badge badge-secondary col-sm-2" style="text-align: center"><b>Image</b></span>`;

        var robot_artifact_header = document.createElement("SPAN");
        robot_artifact_header.setAttribute("class", "badge badge-secondary col-sm-12");
        robot_artifact_header.setAttribute("style", "font-size: 20px")

        var robot_artifact_header_inner = document.createElement("DIV");
        robot_artifact_header_inner.setAttribute("class", "panel panel-default");
        robot_artifact_header_inner.innerHTML = `
                    <div class="panel-heading" role="tab" id="${robot}_heading">
                        <b class="panel-title">
                            <a class="" role="button" title="" data-toggle="collapse" href="#${robot}_collapse" aria-expanded="true" aria-controls="collapse1">
                            ${robot}
                            </a>
                        </b>
                    </div>`;

        var robot_artifact_header_inner2 = document.createElement("DIV");
        robot_artifact_header_inner2.setAttribute("id", robot + "_collapse");
        robot_artifact_header_inner2.setAttribute("class", "panel-collapse collapse show");
        robot_artifact_header_inner2.setAttribute("role", "tabpanel");
        robot_artifact_header_inner2.setAttribute("aria-labelledby", robot + "_heading");

        var robot_buttons_container = document.createElement("DIV");
        robot_buttons_container.setAttribute("class", "panel-body mb-4");
        robot_buttons_container.setAttribute("id", robot + '_buttons_container');

        robot_artifact_header_inner2.appendChild(robot_buttons_container);
        robot_artifact_header_inner.appendChild(robot_artifact_header_inner2);
        robot_artifact_header.appendChild(robot_artifact_header_inner);

        robot_artifact_container.appendChild(robot_artifact_header);
        robot_artifact_container.appendChild(robot_artifact_titles);

        // Artifact rows get created by the artifact handler now
        let artifact_tracker = document.getElementById("robot_artifact_tables");
        // Creates a DIV element that is placed either on the left or right side of the screen depending on how many robots there currently are
        if (n % 2 == 0) {
            this.rows++;
            let row_artifact_containers = document.createElement("DIV");
            row_artifact_containers.setAttribute("class", "row");
            row_artifact_containers.setAttribute("row_id", this.rows);
            row_artifact_containers.appendChild(robot_artifact_container);
            artifact_tracker.appendChild(row_artifact_containers);
        } else {
            let row_artifact_containers = artifact_tracker.querySelector("[row_id = '" + this.rows + "']");
            row_artifact_containers.appendChild(robot_artifact_container);
        }

}
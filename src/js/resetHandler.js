function init_reset_msg(robot_name) {
    var robot = [];
    robot['Topic'] = new ROSLIB.Topic({
        ros: ros,
        name: `${ma_prefix}${robot_name}/guiReset`,
        messageType: "bobcat/AgentReset"
    });

    var now = new Date().getTime() / 1000;
    var secs = Math.floor(now);
    var nsecs = Math.round(1000000000 * (now - secs));
    robot['msg'] = new ROSLIB.Message({
        stamp: {
            secs: secs,
            nsecs: nsecs },
        agent: robot_name,
        seqs: [],
        clear: false,
        reset: false,
        ignore: false,
        hardReset: false,
        ma_reset: false,
        base: document.getElementById('apply_base').checked,
        robots: document.getElementById('apply_robots').checked
    });

    return robot;
}

function init_reset() {
    document.getElementById('reset_all').addEventListener('click', function() {
        var reset_all = this.checked;
        var inputs = document.querySelectorAll("input[type=checkbox]:checked, input[type=text][name=diff_reset]");
        // Reset all checkboxes and clear text input
        [].forEach.call(inputs, function(input) {
            input.checked = false;
            input.value = '';
        });

        this.checked = reset_all;
        if (reset_all) {
            // If Reset All Checked, check the Reset Agent for each robot so submit catches it
            inputs = document.querySelectorAll("input[type=checkbox][name=reset_agent]");
            [].forEach.call(inputs, function(input) {
                input.checked = true;
            });
        }
        document.getElementById('apply_base').checked = true;
        document.getElementById('apply_robots').checked = true;
    });

    var seq = 0;
    document.getElementById('reset_submit').addEventListener('click', function() {
        // Get all of the inputs at once
        var inputs = document.querySelectorAll("input[type=checkbox]:checked, input[type=text][name=diff_reset]");
        var robots = [];
        // Check every input individually, using parent row to assign by robot
        [].forEach.call(inputs, function(input) {
            var robot = input.parentElement.parentElement.id;
            var diff_blank = ((input.name == 'diff_reset') && (input.value == ''));

            // Don't processs if there's no parent (reset all), or it's the diff box and it's blank
            if (robot && !diff_blank) {
                // Initialize the topic/message if we haven't already
                if (!robots[robot]) {
                    robots[robot] = init_reset_msg(robot);
                }

                var msg = robots[robot].msg;
                if (input.name == 'diff_reset') {
                    // Build the diff sequences depending on input
                    var seqs;
                    seqs = input.value.split('-').map(Number);
                    if (seqs.length > 1) {
                        // Range based input
                        var seqsrange = [];
                        for (var i = seqs[0]; i <= seqs[1]; i++)
                            seqsrange.push(i);
                        seqs = seqsrange;
                    } else {
                        // Comma-separated list is easy
                        seqs = input.value.split(',').map(Number);
                    }
                    msg.seqs = seqs;
                } else if (input.name == 'reset_agent') {
                    // If Reset Agent is checked, other inputs don't matter
                    msg.hardReset = true;
                    msg.ma_reset = true;
                } else {
                    // Otherwise just use the checkboxes
                    if (input.name == 'clear_map') msg.clear = true;
                    if (input.name == 'reset_map') msg.reset = true;
                    if (input.name == 'ignore_map') msg.ignore = true;
                    if (input.name == 'hard_reset') msg.hardReset = true;
                    if (input.name == 'ma_reset') msg.ma_reset = true;
                }
            }
        });

        // Publish each robots' message
        for (var robot in robots) {
            robots[robot]['Topic'].publish(robots[robot]['msg']);
        }
    });
}

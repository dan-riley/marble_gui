// Class for sending emergeny stop message to vehicle
class ESTOP{
    constructor(robot_name){
        this.robot_name = robot_name;
    }
    send_estop() {
        var Topic = new ROSLIB.Topic({
            ros: ros,
            // name: "/" + this.robot_name + "/estop",
            name: "/estop",
            messageType: "marble_common/Estop"
        });
        var topic_msg = new ROSLIB.Message({
            header: {
                seq: 0,
                stamp: 0,
                frame_id: ""
            },
            cmd: 2
        });
        console.log(topic_msg);
        Topic.publish(topic_msg);
        console.log("STOP " + this.robot_name);
    }
}
    
//     $('body').on('click', '.emergency_stop', function () {
//         var $that = $(this);
//         var robot_name = $that.attr('robot_name');
//         send_estop(robot_name);
//         console.log("estop sent");

//     });
// });
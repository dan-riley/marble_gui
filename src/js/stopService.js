// Class for sending emergeny stop message to vehicle
class ESTOP{
    constructor(robot_name){
        this.robot_name = robot_name;
    }
    send_estop(stop_value) {
        var Topic = new ROSLIB.Topic({
            ros: ros,
            name: "/" + this.robot_name + "/estop",
            //name: "/estop",
            messageType: "marble_common_msgs/Estop" // HEA 
        });
        var topic_msg = new ROSLIB.Message({
            header: {
                seq: 0,
                stamp: 0,
                frame_id: ""
            },
            cmd: stop_value
        });
        console.log(topic_msg);
        Topic.publish(topic_msg);
        console.log("STOP " + this.robot_name);
    }
}
// Startup class
class STARTUP{
    constructor(robot_name){
        this.robot_name = robot_name;
    }
    send_startup() {
        var Topic = new ROSLIB.Topic({
            ros: ros,
            name: "/" + this.robot_name + "/startup",
            //name: "/estop",
            messageType: "marble_common_msgs/Startup" // HEA 
        });
        var topic_msg = new ROSLIB.Message({
            header: {
                seq: 0,
                stamp: 0,
                frame_id: ""
            },
            cmd: 1
        });
        console.log(topic_msg);
        Topic.publish(topic_msg);
        console.log("START " + this.robot_name);
    }
}
    
//     $('body').on('click', '.emergency_stop', function () {
//         var $that = $(this);
//         var robot_name = $that.attr('robot_name');
//         send_estop(robot_name);
//         console.log("estop sent");

//     });
// });
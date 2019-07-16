// https://stackoverflow.com/questions/6158933/how-is-an-http-post-request-made-in-node-js
// https://www.subtchallenge.com/resources/STIX_Interface_Control_Document.pdf
// https://stackoverflow.com/questions/5725430/http-test-server-accepting-get-post-requests

// Class for establishing http requests and sending them to DARPA or other server
class HTTP{
    constructor(url, data){
        // Invokes setters for all variable
        // this.type = type; this.protocol = protocol; this.hostname = hostname;

        // TODO: Change authorization code and ip address/port for competition
        // Authorization key and ip address used with test DARPA server
        // this.authorization = 'Bearer subttesttoken123';
        // this.ip_address_port = 'http://localhost:8000';

        // this.authorization = 'Bearer DarpaTestToken00';
        // this.ip_address_port = 'http://192.168.100.102:8000';
        this.authorization = 'Bearer QAJJHkFmkErzqYxx';
        this.ip_address_port = 'http://10.100.2.200:8000';
        if (url == "/map/update/"){
            this.ip_address_port = "http://10.100.2.201:8000";
        }

        // console.log(data);
        this.APIrequest = {
            type: "GET",
            url: this.ip_address_port + url,
            data: JSON.stringify(data),
            dataType: "json",
            headers: "",
            contentType: "application/json",
            success: function (json){
                // console.log(json);
                return json;
                // this.response = json;
            },
            error: function(jqXHR, textStatus, errorThrown ) {

                // alert(textStatus);
            },
            complete: function (jqXHR, textStatus) {
                if (jqXHR.status == 200 || jqXHR.status == 201){
                    console.log(jqXHR.status + ": " + textStatus);
                }
                else{
                    console.log(jqXHR.status + ": " + jqXHR.responseText);
                }
                // switch (jqXHR.status){
                //     case 200:
                //         console.log(textStatus);
                //     case 201:
                // }
            }
        }
        this.url = url;
        // console.log(this.APIrequest);
        // this.request = net.request(this.APIrequest)
    }

    set url(value){
        var url = value;
        if (url == "/api/status/")
        {
            this.APIrequest.type = "GET";
            this.APIrequest.headers = {
                'Authorization' : this.authorization
            }
        }
        else if (url == "/api/artifact_reports/")
        {
            var buf = Buffer.from(this.APIrequest.data);
            this.APIrequest.type = "POST";
            this.APIrequest.headers = {
                'Authorization' : this.authorization,
                // 'Content-Length' : toString(buf.length),
                'Content-Type' : 'application/json'
            }
            // this.APIrequest.data = JSON.stringify({
            //     "x": 14.2,
            //     "y": 65.5,
            //     "z": 197.1,
            //     "type": "survivor",
            // });
        }
        else if (url = "/map/update/") // POST /map/update
        {
            this.APIrequest.type = "POST";
            this.APIrequest.headers = {
                'Authorization' : this.authorization,
                // 'Content-Length' : toString(buf.length),
                'Content-Type' : 'application/json'
            }
        }
        else if (url = "/state/update/") // POST /state/update
        {

            this.APIrequest.type = "POST";
            this.APIrequest.headers = {
                'Authorization' : this.authorization,
                // 'Content-Length' : toString(buf.length),
                'Content-Type' : 'application/json'
            }
        }
        else{
            return;
        }

        //! This code is for testing http calls against a website
        // this.APIrequest.url = this.ip_address + url;
        // if (this.APIrequest.type == "GET"){
        //     this.APIrequest.url = "http://httpbin.org/headers";
        // }
        // else if (this.APIrequest.type = "POST"){
        //     this.APIrequest.url = "http://httpbin.org/post";
        // }

        // return value;
    }

    requestHTTP(){
        return $.ajax(this.APIrequest);
    }

    // requestHTTP(){
    //     this.resolveHTTP().done(function(value){
    //         this.response = value;
    //     });
    //     // console.log(this.response);
    // }
    // getResponse(){
    //     // this.response = data;
    //     console.log(this.response);
    //     // return this.response;
    // }

}

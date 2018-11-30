const electron = require('electron');
const prompt = require('electron-prompt');

const net = require('net');

let promptWindow = null;
var HOST = '127.0.0.1';
var PORT = 6969;

var client = new net.Socket();

client.connect(PORT, HOST, () => {
  //Log connection once extablished
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    //Prompt user for username (does not check if unique)
        prompt({
          title: 'Set username',
          label: 'Username:',
          inputAttrs: {
            type: 'text'
          },
          type: 'input'
        })
        .then((r) => {
          if(r === null) {
            console.log('user cancelled');
          } else {
            console.log('result', r);
            //Send username to server
            client.write("uname/" + r)
          }
        })
        .catch(console.error);
        var button = document.getElementById("sendButton");
        button.addEventListener("click",function(e){
          //Sends message from text field to default room (0)
          var msg = "msg/All/" + document.getElementById("messageField").value;
          client.write(msg);
          //Reset value of input field
          document.getElementById("messageField").value = '';
        },false);
});
//Event handler for data received
client.on('data', (data) => {
      //Log data from server to console
      console.log('DATA: ' + data);
      //Parse response
      var recv = data.toString('utf8').split('/');
      switch(recv[0]) {
        //If server sends uname, a new user has joined
        //format: opcode/username
        case 'uname':
          console.log(newUser + " just joined the room");
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + " just joined!";
          break;
        //If server sends msg, a message has been relayed
        //The server should handle sending messages to the correct room this
        //client is in
        //format: opcode/user/(room(s))/message content
        case 'msg':
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + "(" + recv[2] + "): " + recv[3];
          break;
        case 'left':
          var leaveMsg = recv[1].split('/', 2);
          console.log(leaveMsg[0] + " just left " + leaveMsg[1]);
          break;
        }

  });

client.on('close',() => {
  console.log('Connection closed');
});

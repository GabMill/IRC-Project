const electron = require('electron');
const prompt = require('electron-prompt');

const net = require('net');

let promptWindow = null;
var HOST = '127.0.0.1';
var PORT = 6969;

var client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
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
            client.write("uname/" + r)
          }
        })
        .catch(console.error);
        var button = document.getElementById("sendButton");
        button.addEventListener("click",function(e){
          var msg = "msg/0:0/" + document.getElementById("messageField").value;
          client.write(msg);
          document.getElementById("messageField").value = '';
        },false);
});

client.on('data', (data) => {
      console.log('DATA: ' + data);
      var recv = data.toString('utf8').split('/', 4);
      switch(recv[0]) {
        case 'uname':
          var newUser = recv[1];
          console.log(newUser + " just joined the room");
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = newUser + " just joined!";
          break;
        case 'msg':
          var message = recv[3];
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + ": " + message;
          if(recv[1] === userName)
            {
              console.log("You to " + message[1] + ": " + message[3]);
            }
          else
            {
              console.log(message[0] + " to " + message[1] + ":" + message[3]);
            }
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

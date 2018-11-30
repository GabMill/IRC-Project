const electron = require('electron');

const net = require('net');

let promptWindow = null;
var HOST = '127.0.0.1';
var PORT = 6969;

var client = new net.Socket();


client.connect(PORT, HOST, () => {
  //Log connection once extablished
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);

        var button = document.getElementById("sendButton");
        button.addEventListener("click",function(e){
          var input = document.getElementById("messageField").value
          msg = input.split('/');
          var toSend;
          switch(msg[0]) {
            case 'list':
            //list available rooms
              if(msg[1] === 'rooms')
              {
                toSend = "list/rooms"
                break;
              }
              //list users in room
              else if(msg[1] === 'users')
              {
                toSend = "list/users/" + msg[2];
                break;
              }
              else {
                console.log("Bad list input");
                break;
              }
            case 'uname':
              toSend = "uname/" + msg[1];
              break;
            case 'new':
              toSend = input;
              break;
            case 'join':
              toSend = input;
              break;
          }
          console.log(toSend);
          client.write(toSend);
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
          console.log(recv[1] + " just joined the room");
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
          console.log(recv[1] + " just left");
          break;
        case 'list':
          var rooms = recv[2].split(':');
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = "Available rooms:";
          for(i = 0; i < rooms.length; i++)
          {
            var temp = document.getElementById("thread").insertRow(-1);
            temp.innerHTML = rooms[i];
          }
          break;
        }

  });

client.on('close',() => {
  console.log('Connection closed');
});

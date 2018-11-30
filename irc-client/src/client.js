const electron = require('electron');

const net = require('net');

let promptWindow = null;
var HOST = '127.0.0.1';
var PORT = 8080;

var client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);

        var button = document.getElementById("sendButton");
        button.addEventListener("click",function(e){
          var input = document.getElementById("messageField").value
          msg = input.split('/');
          var toSend;
          switch(msg[0]) {
            case 'list':
              if(msg[1] === 'rooms')
              {
                toSend = "list/rooms"
                break;
              }
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
              toSend = input;
              break;
            case 'new':
              toSend = input;
              break;
            case 'join':
              toSend = input;
              break;
            case 'leave':
              toSend = input;
              break;
            case 'room':
              toSend = input;
              break;
            case 'dm':
              toSend = input;
              break;
            default:
              toSend = "msg/" + input
              break;
          }
          client.write(toSend);
          document.getElementById("messageField").value = '';
          e.preventDefault();
        },false);
});
client.on('data', (data) => {
      console.log('DATA: ' + data);
      var recv = data.toString('utf8').split('/');
      switch(recv[0]) {
        case 'uname':
          console.log(recv[1] + " just joined the room");
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + " just joined!";
          break;
        case 'msg':
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + "(" + recv[2] + "): " + recv[3];
          break;
        case 'left':
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + " just left";
          console.log(recv[1] + " just left");
          break;
        case 'list':
          var list = recv[2].split(':');
          if(recv[1] === 'rooms'){
            var temp = document.getElementById("thread").insertRow(-1);
            temp.innerHTML = "Available rooms:";
          }else{
            var temp = document.getElementById("thread").insertRow(-1);
            temp.innerHTML = "Users in " + recv[3] + ":";
          }
          for(i = 0; i < list.length; i++)
          {
            var temp = document.getElementById("thread").insertRow(-1);
            temp.innerHTML = list[i];
          }
        }

  });

client.on('close',() => {
  console.log('Connection closed');
});

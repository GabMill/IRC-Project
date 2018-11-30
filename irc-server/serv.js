var net = require('net');

var HOST = '127.0.0.1';
var PORT = 8080;
var clientArray = [];
var roomArray = [];
var dorelay = true;

function roomRelay(msg, room) {
  if(clientArray.length === 0) {
    console.log("No connected clients")
  }
  else {
    for(i = 0; i < roomArray.length; i++){
      if(roomArray[i].name === room){
        for(j = 0; j < roomArray[i].users.length; j++){
          roomArray[i].users[j].write(msg)
        }
      }
    }
  }
}

function userRelay(msg, user) {
  if(clientArray.length === 0) {
    console.log("No connected clients")
  }
  else {
    for(i = 0; i < clientArray.length; i++){
      if(clientArray[i].name === user){
        clientArray[i].write(msg);
      }
    }
  }
}

function relay(msg) {
  if(clientArray.length === 0)
  {
    console.log("No connected clients")
  }
  else {
    for(i = 0; i < clientArray.length; i++)
    {
      clientArray[i].write(msg);
    }
  }
}

net.createServer( function(socket) {
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

    function Room(name, user) {
      this.name = '';
      this.name = name;
      this.users = [];
      this.users.push(user);
    }

    socket.on('data', function(data) {
        var recv = data.toString('utf8').split('/')
        console.log(recv);
        var toSend;
        if (!roomArray[0]) {
          var newRoom = new Room('All', socket)
          roomArray.push(newRoom);
          console.log(newRoom.name)
        }
        switch(recv[0]) {
          case 'uname':
            clientArray.push(socket)
            socket.name = recv[1];
            toSend = "uname/" + socket.name;
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            else {
              roomArray[0].users.push(socket);
            }
            break;
          case 'msg':
            if(!socket.name)
            {
              socket.name = "unameNotSet";
            }
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            toSend = "msg/" + socket.name + "/" + "All/" + recv[1];
            console.log(socket.name + ": " + recv[1]);
            break;
          case 'list':
            dorelay = false;
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            if(recv[1] === 'rooms'){
              toSend = "list/rooms/"
              console.log(roomArray.length);
              console.log(roomArray[0].name)
              for(i = 0; i < roomArray.length; i++){
                toSend = toSend + roomArray[i].name + ':';
              }
            }else{
              toSend = "list/users/";
              for(i = 0; i < roomArray.length; i++){
                  if(roomArray[i].name === recv[2]){
                  for(j = 0; j < roomArray[i].users.length; j++){
                    toSend = toSend + roomArray[i].users[j].name + ":";
                  }
                }
              }
            }
            socket.write(toSend + "/" + recv[2])
            break;
          case 'new':
            var newRoom = new Room(recv[1], socket)
            roomArray.push(newRoom);
            toSend = "msg/" + socket.name + "/" + "All/Created new room: " + recv[1];
            break;
          case 'join':
            dorelay = false;
            for(i = 0; i < roomArray.length; i++){
                if(roomArray[i].name === recv[1]){
                  roomArray[i].users.push(socket);
              }
            }
            break;
          case 'leave':
            dorelay = false;
            for(i = 0; i < roomArray.length; i++){
              if(roomArray[i].name === recv[1]){
                roomArray[i].users.splice(i, 1);
              }
            }
            break;
          case 'room':
            dorelay = false;
            toSend = "msg/" + socket.name + "/" + recv[1] + "/" + recv[2];
            roomRelay(toSend, recv[1])
            break;
          case 'dm':
            dorelay = false;
            toSend = "msg/" + socket.name + "/dm/" + recv[2];
            userRelay(toSend, recv[1])
            break;
        }
      if(dorelay){
        relay(toSend);
      }
      else{
        dorelay = true;
      }
    });

    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
        for( var i = 0; i < clientArray.length; i++){
          if ( clientArray[i] === socket) {
            clientArray.splice(i, 1);
          }
        }
        relay("left/" + socket.name)
    });
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

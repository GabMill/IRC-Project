var net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;
var clientArray = [];
var roomArray = [];
var dorelay = true;

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

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
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
          //If message begins with /uname, a new client is joining.
          //Push client to array, send a welcome message, then broadcast
          //new user connection to all clients
          case 'uname':
            if(!socket.name){
              clientArray.push(socket)
            }
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
            //If message begins with msg, it is from a client. Relay to others.
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
            toSend = "msg/" + socket.name + "/" + "All/" + recv[2];
            console.log(socket.name + ": " + recv[2]);
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
                    toSend = toSend + ":" + roomArray[i].users[j].name;
                  }
                }
              }
            }
            socket.write(toSend)
            break;
          case 'new':
            var newRoom = new Room(recv[1], socket)
            roomArray.push(newRoom);
            toSend = "msg/" + socket.name + "/" + "All/Created new room: " + recv[1];
            break;
          case 'join':
            for(i = 0; i < roomArray.length; i++){
                if(roomArray[i].name === recv[1]){
                  roomArray[i].users.push(socket);
              }
            }
        }
      if(dorelay){
        relay(toSend);
      }
      else{
        dorelay = true;
      }
    });

    // Handles client closing connection
    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
        //Don't want to relay messages to closed connections
        for( var i = 0; i < clientArray.length; i++){
          console.log(socket.name);
          if ( clientArray[i] === socket) {
            clientArray = clientArray.splice(i, 1);
          }
        }
        relay("left/" + socket.name)
    });
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

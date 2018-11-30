var net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;

var clientArray = [];
var room = {
  name: '',
  members: [],
}

function relay(msg) {
  for(i = 0; i < clientArray.length; i++)
  {
    clientArray[i].write(msg);
  }
}

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer( function(socket) {
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

    socket.on('data', function(data) {
        var recv = data.toString('utf8').split('/')
        switch(recv[0]) {
          //If message begins with /uname, a new client is joining.
          //Push client to array, send a welcome message, then broadcast
          //new user connection to all clients
          case 'uname':
            socket.name = recv[1];
            clientArray.push(socket);
            socket.write("Hello, " + socket.name);
            var toSend = "uname/" + socket.name;
            relay(toSend);
            break;
            //If message begins with msg, it is from a client. Relay to others.
          case 'msg':
            var message = recv[2]
            console.log(message);
            var toSend = "msg/" + socket.name + "/" + "All/" + message;
            console.log(socket.name + ": " + message);
            relay(toSend);
            break;
          }
    });

    // Handles client closing connection
    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
        //Don't want to relay messages to closed connections
        for( var i = 0; i < clientArray.length-1; i++){
          if ( clientArray[i].name === socket.name) {
            clientArray.splice(i, 1);
          }
        }
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

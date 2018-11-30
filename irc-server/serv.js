var net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;

var clientArray = [];

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

    //Print
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);
    // Add a 'data' event handler to this instance of socket

    socket.on('data', function(data) {
        var recv = data.toString('utf8').split('/', 3)
        console.log(recv);
        switch(recv[0]) {
          case 'uname':
            socket.name = recv[1];
            clientArray.push(socket);
            socket.write("Hello, " + socket.name);
            var toSend = "uname/" + socket.name;
            relay(toSend);
            break;
          case 'msg':
            var message = recv[2] //message[0] will be room number
            console.log(message);
            var toSend = "msg/" + socket.name + "/" + "0:0/" + message;
            console.log(socket.name + ": " + message);
            relay(toSend);
            break;
          }
    });

    // Handles client closing connection
    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

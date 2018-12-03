var net = require('net');
//Set host address (local) and port number to connect to
var HOST = '127.0.0.1';
var PORT = 8080;

//Arrays for keeping trac of connected clients and rooms
var clientArray = [];
var roomArray = [];

//Boolean for overriding relay at the end of switch statement
//so that roomRelay and userRelay can be used and messages
//aren't relayed to users that shouldn't be getting them
var dorelay = true;

//This function looks through the list of rooms for the room the
//server needs to relay a message to so that users don't receive messages
//for rooms they have not joined
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

//This function is for relaying direct messages to the user they are intended for
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

//This function relays a message to all users. It is used for sending to the
//"All" channel and for sending other commands that all users should receive
//(such as join/leave notification messages)
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

//The net.createServer method sets up a server that listens on a specified
//host and port number and provides a "socket" object that can be written to
//and read from to relay messages
net.createServer( function(socket) {
    //Log connection when established
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

    //Room object for storing users in a room and the rooms name
    function Room(name, user) {
      this.name = '';
      this.name = name;
      this.users = [];
      this.users.push(user);
    }
    //Handler for data received from a client
    socket.on('data', function(data) {
        //Split data using '/' delimiter
        var recv = data.toString('utf8').split('/')
        //Logs data (really just for debugging)
        console.log(recv);
        //Create variable to hold string to relay to client(s)
        var toSend;
        //Check if the "All" room has been set up. If it hasn't, this is the
        //first client to connect so the room needs to be created.
        if (!roomArray[0]) {
          var newRoom = new Room('All', socket)
          roomArray.push(newRoom);
          console.log(newRoom.name)
        }
        //Start switch statement to process data received
        switch(recv[0]) {
          //uname command means a user is setting their username
          case 'uname':
            //Add this socket to the list of connected clients
            clientArray.push(socket)
            //Set the sockets "name" to the name set by the client
            socket.name = recv[1];
            //Create string to relay to clients to inform them that a new user
            //has connected
            toSend = "uname/" + socket.name;
            //If for some reason the "All" room doesn't exist or the room array
            //is empty, create it and add this socket to its list of members.
            //Otherwise, add this socket to the "All" channel (which should always
            //be index[0])
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            else {
              roomArray[0].users.push(socket);
            }
            break;
          //msg command indicates user is sending message to a channel
          case 'msg':
            //If user has not set username and is trying to send a message,
            //set a default username
            if(!socket.name)
            {
              socket.name = "unameNotSet";
            }
            //If for some reason the "All" room doesn't exist or the room array
            //is empty, create it and add this socket to its list of members.
            //Otherwise, add this socket to the "All" channel (which should always
            //be index[0])
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            //Create response string to send to clients
            toSend = "msg/" + socket.name + "/" + "All/" + recv[1];
            console.log(socket.name + ": " + recv[1]);
            break;
          //list command indicates client is requesting list of rooms or users
          //in a specific room
          case 'list':
            //Set doRelay to false so standard relay function is not called
            //after switch ends
            dorelay = false;
            //If for some reason the "All" room doesn't exist or the room array
            //is empty, create it and add this socket to its list of members.
            //Otherwise, add this socket to the "All" channel (which should always
            //be index[0])
            if (!roomArray[0]) {
              var newRoom = new Room('All', socket)
              roomArray.push(newRoom);
              console.log(newRoom.name)
            }
            //room command indicates client wishes to list rooms
            if(recv[1] === 'rooms'){
              //set command section of string to relay to client
              toSend = "list/rooms/"
              console.log(roomArray.length);//for debugging
              console.log(roomArray[0].name)
              //Loop through room array and get room names. Delimited by ':'
              for(i = 0; i < roomArray.length; i++){
                toSend = toSend + roomArray[i].name + ':';
              }
            //users command indicates client wishes to list users in specific
            //room
            }else{
              //set command section of string to relay to client
              toSend = "list/users/";
              //Loop through room array until the requested room is found.
              //If found, users of that room are added to response string and
              //delimited by ':'
              for(i = 0; i < roomArray.length; i++){
                  if(roomArray[i].name === recv[2]){
                  for(j = 0; j < roomArray[i].users.length; j++){
                    toSend = toSend + roomArray[i].users[j].name + ":";
                  }
                }
              }
            }
            //Send data to client that requested listing
            socket.write(toSend + "/" + recv[2])
            break;
          //new command indicates user is creating a new room
          case 'new':
            //Add new room to room array using name provided by client and add
            //that client to that room
            var newRoom = new Room(recv[1], socket)
            roomArray.push(newRoom);
            //Create string to send to clients to notify them of new room
            toSend = "msg/" + socket.name + "/" + "All/Created new room: " + recv[1];
            break;
          //join command indicates client is trying to join a new room
          case 'join':
            //Don't want to relay anything, just add client to room
            dorelay = false;
            for(i = 0; i < roomArray.length; i++){
                if(roomArray[i].name === recv[1]){
                  roomArray[i].users.push(socket);
              }
            }
            break;
          //leave command indicates client wishes to leave a specific room
          case 'leave':
            //Don't want to relay anything, just remove from room
            dorelay = false;
            for(i = 0; i < roomArray.length; i++){
              if(roomArray[i].name === recv[1]){
                roomArray[i].users.splice(i, 1);
              }
            }
            break;
          //room command indicates client wishes to send a message to a
          //specific room
          case 'room':
            //Don't want to use standard relay function as it will send to
            //clients not in the desired room
            dorelay = false;
            //Create string to relay to clients
            toSend = "msg/" + socket.name + "/" + recv[1] + "/" + recv[2];
            //Relay message to clients in room specified by user (in recv[1])
            roomRelay(toSend, recv[1])
            break;
          //dm command indicates client wishes to send a message to a specific
          //client
          case 'dm':
            //Don't want to use standard relay function as it will send to
            //all clients and not the specified client
            dorelay = false;
            //Create string to relay to client
            toSend = "msg/" + socket.name + "/dm/" + recv[2];
            //Relay message to specified client
            userRelay(toSend, recv[1])
            break;
        }
      //Check if standard relay function needs to be used
      if(dorelay){
        //Relay message to all clients
        relay(toSend);
      }
      //Reset dorelay if it had been set to false
      else{
        dorelay = true;
      }
    });
    //Handles connection closing
    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
        //Loop through client list and remove client from array so that
        //server won't attempt to send to clients that have disconnected
        for( var i = 0; i < clientArray.length; i++){
          if ( clientArray[i] === socket) {
            clientArray.splice(i, 1);
          }
        }
        //Relay message to all clients that a user has disconnected
        relay("left/" + socket.name)
    });
//Port and host that the server should listen on are specified here
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

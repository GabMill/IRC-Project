const electron = require('electron');
const net = require('net');
//Set host address (local) and port number to connect to
var HOST = '127.0.0.1';
var PORT = 8080;
//Create new socket object
var client = new net.Socket();
//Connect to server
client.connect(PORT, HOST, () => {
  //Logs connection to console
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        //Handle user input
        var button = document.getElementById("sendButton");
        button.addEventListener("click",function(e){
          var input = document.getElementById("messageField").value
          //Split user input with '/' delimiter to process and send to server
          msg = input.split('/');
          //Create variable to hold string to send to server
          var toSend;
          //First section of the string entered by user should contain
          //a command - this switch statement processes that command to determine
          //what needs to be sent to the server
          switch(msg[0]) {
          //list command allows user to list rooms or members of rooms
          //Usage: list/rooms for room listing, list/users/(roomname) for users in room
            case 'list':
            //If user is listing rooms, create command to send to server
              if(msg[1] === 'rooms')
              {
                toSend = "list/rooms"
                break;
              }
              //If user is listing rooms, create command to send to server
              //"msg[2]" will be the room the user wants to list members of
              else if(msg[1] === 'users')
              {
                toSend = "list/users/" + msg[2];
                break;
              }
              else {
                console.log("Bad list input");
                break;
              }
            //User is setting username
            //Usage: uname/(username)
            case 'uname':
              toSend = input;
              break;
            //User is creating a new room
            //Usage: new/(roomname)
            case 'new':
              toSend = input;
              break;
            //User is joining a room
            //Usage: join/(roomname)
            case 'join':
              toSend = input;
              break;
            //User is leaving a room
            //Usage: leave/(roomname)
            case 'leave':
              toSend = input;
              break;
            //User is sending a message to a specific room(s)
            //Usage: room/roomname/(message)
            //A user may send to multiple rooms seperated by colons
            //Ex: room/Room1:Room2:Room3/message
            case 'room':
              toSend = input;
              break;
            //User is sending message to another user
            //Usage: dm/(user)/message
            case 'dm':
              toSend = input;
              break;
            //Default behavior - if user enters string that doesn't contain a
            //specific command, it is sent to the server as a message that
            //will be relayed to the "All" room
            default:
              toSend = "msg/" + input
              break;
          }
          //Send string to the server once input has been processed and formatted
          //for server
          client.write(toSend);
          document.getElementById("messageField").value = '';
          e.preventDefault();
        },false);
});

//Handler for data received from server
client.on('data', (data) => {
  //Log data to console for debugging
      console.log('DATA: ' + data);
      //Split string by '/' delimiter and switch
      var recv = data.toString('utf8').split('/');
      switch(recv[0]) {
        //uname command from server indicates another client has connected.
        //The second part of the string will be the name of the new user
        case 'uname':
          console.log(recv[1] + " just joined the room");
          //Insert message into table (I know this is a really awful way to
          //do this but I was crunched on time)
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + " just joined!";
          break;
        //msg command from server indicates the client is receiving a message
        //from a room they have joined or another user
        case 'msg':
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + "(" + recv[2] + "): " + recv[3];
          break;
        //left command from server indicates a user has disconnected from the
        //server - log to chat window
        case 'left':
          var temp = document.getElementById("thread").insertRow(-1);
          temp.innerHTML = recv[1] + " just left";
          console.log(recv[1] + " just left");
          break;
        //list command from server indicates user requested to list rooms or
        //users in a specific room. The response from the server is logged to the
        //chat window
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
  //This handles the connection closing when the server quits/crashes.
  var temp = document.getElementById("thread").insertRow(-1);
  temp.innerHTML = "Connection to server lost (server likely crashed)";
  console.log('Connection closed');
});

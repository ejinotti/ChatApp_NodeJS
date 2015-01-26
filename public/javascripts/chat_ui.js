function ChatUI (socket) {
  this.socket = socket;
  this.rooms = {};

  this.socket.on("message", this.handleMessage);
  this.socket.on("nicknameChangeResult", this.handleNickChange);
  this.socket.on("joinRoomResult", this.handleJoinRoom);
  this.socket.on("roomList", this.handleRoomList);

  $("#sendmsg").on("submit", this.processUserInput);
}

ChatUI.prototype.handleMessage = function (data) {
  var $li = $('<li>');

  if (data.bold) {
    $li.html('<b>' + _.escape(data.message) + '</b>');
  } else {
    $li.html(_.escape(data.message));
  }

  $('#chat').find('ul').append($li);
};

ChatUI.prototype.handleNickChange = function (data) {
  if (data.success) {
    $('.nick').html(_.escape(data.message));
  } else {
    var $li = $('<li>');
    $li.html('<b>' + _.escape(data.message) + '</b>');
    $('#chat').find('ul').append($li);
  }
};

ChatUI.prototype.handleJoinRoom = function (data) {

};

ChatUI.prototype.handleRoomList = function (data) {

};

ChatUI.prototype.processUserInput = function (event) {
  event.preventDefault();

  var $inputEl = $(this).find('input');

  var input = $inputEl.val();

  if (input[0] === "/") {
    try {
      chat.processCommand(input);
    } catch (err) {
      if (typeof err === "string") {
        var $li = $('<li>');
        $li.html('<b>' + err + '</b>');
        $('#chat').find('ul').append($li);
      } else {
        throw err;
      }
    }
  } else if (input.length > 0){
    chat.sendMessage(input);
  }

  $inputEl.val("");
};

ChatUI.prototype.processCommand = function (cmd) {
  var matchData = [];

  if ((matchData = cmd.match(/^\/nick\s+(.*)/))) {
    var nick = matchData[1];

    if (nick.match(/^[a-zA-Z]\w*$/)) {
      this.socket.emit('nicknameChangeRequest', nick);
    } else {
      throw "Invalid Nickname!";
    }
  } else if ((matchData = cmd.match(/^\/join\s+(.*)/))) {
    var room = matchData[1];

    if (room.match(/^[\w|\d]+$/)) {
      this.socket.emit('joinRoomRequest', room);
    } else {
      throw "Invalid Room!";
    }
  } else if (cmd.match(/^\/leave\s+/)) {
    this.socket.emit("leaveRoomRequest");
  } else {
    throw "Invalid Command!";
  }
};

//
// $(document).ready(function () {
//   var socket = io();
//   var chat = new Chat(socket);
//
//   // display msgs from server.
//   socket.on('message', function (data) {
//
//     var $li = $('<li>');
//
//     if (data.bold) {
//       $li.html('<b>' + _.escape(data.message) + '</b>');
//     } else {
//       $li.html(_.escape(data.message));
//     }
//
//     $('#chat').find('ul').append($li);
//   });
//
//   // handle nick change response
//   socket.on('nicknameChangeResult', function (data) {
//     if (data.success) {
//       $('.nick').html(_.escape(data.message));
//     } else {
//       var $li = $('<li>');
//       $li.html('<b>' + _.escape(data.message) + '</b>');
//       $('#chat').find('ul').append($li);
//     }
//   });
//
//   // handle user input
//   $('#sendmsg').on('submit', function (event) {
//     event.preventDefault();
//
//     var $inputEl = $(this).find('input');
//
//     var input = $inputEl.val();
//
//     if (input[0] === "/") {
//       try {
//         chat.processCommand(input);
//       } catch (err) {
//         if (typeof err === "string") {
//           var $li = $('<li>');
//           $li.html('<b>' + err + '</b>');
//           $('#chat').find('ul').append($li);
//         } else {
//           throw err;
//         }
//       }
//     } else if (input.length > 0){
//       chat.sendMessage(input);
//     }
//
//     $inputEl.val("");
//   });
//
// });

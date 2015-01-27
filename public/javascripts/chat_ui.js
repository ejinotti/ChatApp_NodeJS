function ChatUI (socket) {
  this.socket = socket;
  this.$rooms = {};
  this.currentRoom = null;

  this.template = _.template($("script.template").html());

  debugger;

  this.socket.on("message", this.handleMessage);
  this.socket.on("nicknameChangeResult", this.handleNickChange);
  this.socket.on("joinRoomResult", this.handleJoinRoomResult);
  this.socket.on("roomJoin", this.handleRoomJoin);
  this.socket.on("roomLeave", this.handleRoomLeave);

  $("#sendmsg").on("submit", this.processUserInput);
}

ChatUI.prototype.handleMessage = function (data) {
  var $li = $('<li>');

  if (data.bold) {
    $li.html('<b>' + _.escape(data.message) + '</b>');
  } else {
    $li.html(_.escape(data.message));
  }

  this.$rooms[data.room].find("ul.room-chat").append($li);
};

ChatUI.prototype.handleNickChange = function (data) {
  if (data.success) {
    $('#nick').html(_.escape(data.message));
  } else {
    this.handleMessage({
      room: this.currentRoom,
      message: data.message,
      bold: true
    });
  }
};

ChatUI.prototype.handleJoinRoomResult = function (data) {
  this.currentRoom && this.$rooms[this.currentRoom].hide();

  this.currentRoom = data.room;

  var content = this.template({ roomName: data.room });
  this.$rooms[data.room] = $(content).find("section.room");

  var that = this;
  data.nicks.forEach(function (nick) {
    that.handleRoomJoin({ room: data.room, nick: nick });
  });

  $("#chat").append(this.$currentRoom);
};

ChatUI.prototype.handleRoomJoin = function (data) {
  var $li = $("<li>");
  $li.html(_.escape(data.nick));
  this.$rooms[data.room].find("ul.room-list").append($li);
};

ChatUI.prototype.handleRoomLeave = function (data) {
  this.$rooms[data.room].find("ul.room-list").find("li").filter(function () {
    return $(this).text === data.nick;
  }).remove();
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
        this.handleMessage({ message: err, bold: true });
      } else {
        throw err;
      }
    }
  } else if (input.length > 0){
    this.socket.emit("message", {
      room: this.currentRoom,
      message: input
    });
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
  } else if (cmd.match(/^\/leave\s+$/)) {
    this.socket.emit("leaveRoomRequest", this.currentRoom);
  } else {
    throw "Invalid Command!";
  }
};

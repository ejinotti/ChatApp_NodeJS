function ChatUI (socket) {
  console.log("new ChatUI created..");
  this.socket = socket;
  this.currentRoom = null;

  this.template = _.template($("script.template").html());

  // debugger;

  this.socket.on("message", this.handleMessage.bind(this));
  this.socket.on("nicknameChangeResult", this.handleNickChange.bind(this));
  this.socket.on("joinRoomResult", this.handleJoinRoomResult.bind(this));
  this.socket.on("roomJoin", this.handleRoomJoin.bind(this));
  this.socket.on("roomLeave", this.handleRoomLeave.bind(this));

  $("#sendmsg").on("submit", this.processUserInput.bind(this));
}

ChatUI.prototype.getRoom = function (roomName) {
  return $(".room").filter(function () {
    return $(this).data("room") === roomName;
  });
};

ChatUI.prototype.hideRoom = function (roomName) {
  this.getRoom.hide();
};

ChatUI.prototype.showRoom = function (roomName) {
  this.getRoom.show();
};

ChatUI.prototype.handleMessage = function (data) {
  var $li = $('<li>');

  if (data.bold) {
    $li.html('<b>' + _.escape(data.message) + '</b>');
  } else {
    $li.html(_.escape(data.message));
  }

  this.getRoom(data.room).find(".room-chat").append($li);
};

ChatUI.prototype.handleNickChange = function (data) {
  console.log("received nick change result..");

  if (data.success) {
    console.log("success, new nick is: " + data.message);
    $('#nick').text(data.message);
  } else {
    this.handleMessage({
      room: this.currentRoom,
      message: data.message,
      bold: true
    });
  }
};

ChatUI.prototype.handleJoinRoomResult = function (data) {
  console.log("JoinRoomResult received..");
  console.log("data.room = " + data.room);
  console.log(data.nicks);

  this.currentRoom && this.hideRoom(this.currentRoom);

  this.currentRoom = data.room;

  // debugger;

  $("#room-tabs").append($("<li>").text(data.room));
  var content = this.template({ roomName: data.room });
  $("#chat").append(content);

  var that = this;
  data.nicks.forEach(function (nick) {
    that.handleRoomJoin({ room: data.room, nick: nick });
  });

  // debugger;

};

ChatUI.prototype.handleRoomJoin = function (data) {
  console.log("handleRoomJoin, room = " + data.room + ", nick = " + data.nick);
  // console.log(this.getRoom(data.room));
  // console.log(this);
  // debugger;
  var $li = $("<li>").text(data.nick);
  this.getRoom(data.room).find(".room-list").append($li);
};

ChatUI.prototype.handleRoomLeave = function (data) {
  this.$rooms[data.room].find("ul.room-list").find("li").filter(function () {
    return $(this).text === data.nick;
  }).remove();
};

ChatUI.prototype.processUserInput = function (event) {
  event.preventDefault();

  var $inputEl = $(event.target).find('input');

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

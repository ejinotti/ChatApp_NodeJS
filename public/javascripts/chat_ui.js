function ChatUI (socket) {
  console.log("new ChatUI created..");
  this.socket = socket;
  this.currentRoom = null;

  this.template = _.template($("script.template").html());
  this.templateTab = _.template($("script.template-tab").html());

  this.socket.on("message", this.handleMessage.bind(this));
  this.socket.on("nicknameChangeResult", this.handleNickChange.bind(this));
  this.socket.on("joinRoomResult", this.handleJoinRoomResult.bind(this));
  this.socket.on("roomJoin", this.handleRoomJoin.bind(this));
  this.socket.on("roomLeave", this.handleRoomLeave.bind(this));

  $("#sendmsg").on("submit", this.processUserInput.bind(this));
  $("#room-tabs").on("click", "li", this.selectRoom.bind(this));
  $("#room-tabs").on("click", "span", this.closeRoom.bind(this));
}

ChatUI.prototype.getRoom = function (roomName) {
  return $(".room").filter(function () {
    return $(this).data("room") === roomName;
  });
};

ChatUI.prototype.getRoomChat = function (roomName) {
  return this.getRoom(roomName).find(".room-chat");
};

ChatUI.prototype.getRoomList = function (roomName) {
  return this.getRoom(roomName).find(".room-list");
};

ChatUI.prototype.hideRoom = function (roomName) {
  this.getRoom(roomName).hide();
};

ChatUI.prototype.showRoom = function (roomName) {
  this.getRoom(roomName).show();
};

ChatUI.prototype.selectRoom = function (event) {
  var newRoom = $(event.currentTarget).data("room");

  console.log("selectRoom => " + newRoom);

  this.hideRoom(this.currentRoom);
  this.showRoom(newRoom);

  this.currentRoom = newRoom;
};

ChatUI.prototype.closeRoom = function (event) {
  event.stopPropagation();

  var killRoom = $(event.currentTarget).data("room");

  console.log("closeRoom => " + killRoom);

  this.leaveRoom(killRoom);
};

ChatUI.prototype.handleMessage = function (data) {
  var $li = $("<li>");

  if (data.bold) {
    $li.html("<b>" + _.escape(data.message) + "</b>");
  } else {
    $li.text(data.message);
  }

  this.getRoomChat(data.room).append($li);
};

ChatUI.prototype.handleNickChange = function (data) {
  console.log("received nick change result..");

  if (data.success) {
    console.log("success, new nick is: " + data.message);
    $("#nick").text(data.message);
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

  var content = this.templateTab({ roomName: data.room });
  $("#room-tabs").append(content);

  content = this.template({ roomName: data.room });
  $("#chat").append(content);

  var that = this;
  data.nicks.forEach(function (nick) {
    that.handleRoomJoin({ room: data.room, nick: nick });
  });
};

ChatUI.prototype.leaveRoom = function (room) {
  this.socket.emit("leaveRoomRequest", room);
  this.getRoom(room).remove();

  var $killTab = $("#room-tabs li").filter(function () {
    return $(this).data("room") === room;
  });

  if (room !== this.currentRoom) {
    $killTab.remove();
    return;
  }

  var $nextTab = $killTab.next();
  var $prevTab = $killTab.prev();

  if ($nextTab.length) {
    this.currentRoom = $nextTab.data("room");
    this.showRoom(this.currentRoom);
  } else if ($prevTab.length) {
    this.currentRoom = $prevTab.data("room");
    this.showRoom(this.currentRoom);
  } else {
    this.currentRoom = null;
  }

  $killTab.remove();
};

ChatUI.prototype.handleRoomJoin = function (data) {
  console.log("RoomJoin received..");
  console.log("data.room = " + data.room);
  console.log("data.nick = " + data.nick);

  var $li = $("<li>").text(data.nick);
  this.getRoomList(data.room).append($li);
};

ChatUI.prototype.handleRoomLeave = function (data) {
  console.log("RoomLeave received..");
  console.log("data.room = " + data.room);
  console.log("data.nick = " + data.nick);

  this.getRoomList(data.room).find("li").filter(function () {
    return $(this).text() === data.nick;
  }).remove();
};

ChatUI.prototype.processUserInput = function (event) {
  event.preventDefault();

  var $inputEl = $(event.target).find("input");

  var input = $inputEl.val();

  if (input[0] === "/") {
    try {
      this.processCommand(input);
    } catch (err) {
      if (typeof err === "string") {
        this.handleMessage({
          room: this.currentRoom, message: err, bold: true
        });
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
      this.socket.emit("nicknameChangeRequest", nick);
    } else {
      throw "Invalid Nickname!";
    }
  } else if ((matchData = cmd.match(/^\/join\s+(.*)/))) {
    var room = matchData[1];

    if (room.match(/^[\w|\d]+$/)) {
      this.socket.emit("joinRoomRequest", room);
    } else {
      throw "Invalid Room!";
    }
  } else if (cmd.match(/^\/leave\s*$/)) {
    this.leaveRoom(this.currentRoom);
  } else {
    throw "Invalid Command!";
  }
};

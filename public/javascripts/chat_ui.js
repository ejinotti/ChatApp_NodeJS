function ChatUI (socket) {
  this.socket = socket;
  this.currentRoom = null;

  this.template = _.template($("script.template").html());
  this.templateTab = _.template($("script.template-tab").html());

  this.socket.on("message", this.handleMessage.bind(this));
  this.socket.on("nicknameChangeResult", this.handleNickChange.bind(this));
  this.socket.on("joinRoomResult", this.handleJoinRoomResult.bind(this));
  this.socket.on("roomJoin", this.handleRoomJoin.bind(this));
  this.socket.on("roomLeave", this.handleRoomLeave.bind(this));
  this.socket.on("roomNick", this.handleRoomNick.bind(this));

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

ChatUI.prototype.getRoomTab = function (roomName) {
  return $("#room-tabs li").filter(function () {
    return $(this).data("room") === roomName;
  });
};

ChatUI.prototype.hideRoom = function (roomName) {
  this.getRoomTab(roomName).removeClass("active");
  this.getRoom(roomName).hide();
};

ChatUI.prototype.showRoom = function (roomName) {
  this.getRoomTab(roomName).addClass("active");
  this.getRoom(roomName).show();
};

ChatUI.prototype.selectRoom = function (event) {
  var newRoom = $(event.currentTarget).data("room");

  this.hideRoom(this.currentRoom);
  this.showRoom(newRoom);

  this.currentRoom = newRoom;
};

ChatUI.prototype.closeRoom = function (event) {
  event.stopPropagation();

  var killRoom = $(event.currentTarget).data("room");
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

  var $killTab = this.getRoomTab(room);

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
  var $li = $("<li>").text(data.nick);
  this.getRoomList(data.room).append($li);
};

ChatUI.prototype.handleRoomLeave = function (data) {
  this.getRoomList(data.room).find("li").filter(function () {
    return $(this).text() === data.nick;
  }).remove();
};

ChatUI.prototype.handleRoomNick = function (data) {
  this.getRoomList(data.room).find("li").filter(function () {
    return $(this).text() === data.oldNick;
  }).text(data.newNick);
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

#zChat
**zChat** is a chat app in Node.JS, using
[Socket.IO](http://socket.io/)
for cross-platform, two-way communication with sockets.  Multi-room participation
is supported, and a tabbed UI for managing rooms is provided via jQuery and CSS.

**commands:**
+ **/nick [new-nick]** = change your nickname.
+ **/join [room-name]** = join a room.
+ **/leave** = leave current room.
+ Can also click on tabs to switch room focus and leave rooms.

######Design
The major design choice with this project was how to keep the server code clean
and modular.  My decision was to create the ChatConnection class and spawn a new
one for each incoming client connection.

**TODO:**
+ auto-scrolling etc.
+ server file caching.
+ direct messaging.
+ channel ops: kick, ban, etc.
+ *think of more stuff..*

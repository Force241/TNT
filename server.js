const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // serves index.html + jk.js

let waitingUser = null; // queue for stranger matching

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waitingUser) {
    // Pair with waiting user
    io.to(waitingUser).emit("match", socket.id);
    io.to(socket.id).emit("match", waitingUser);
    waitingUser = null;
  } else {
    // Put this user in waiting queue
    waitingUser = socket.id;
  }

  // Relay signals only between matched peers
  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("offer", (id, description) => {
    socket.broadcast.emit("offer", id, description);
  });

  socket.on("answer", (id, description) => {
    socket.broadcast.emit("answer", description);
  });

  socket.on("candidate", (id, candidate) => {
    socket.broadcast.emit("candidate", candidate);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

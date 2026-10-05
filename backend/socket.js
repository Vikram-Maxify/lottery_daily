// socket.js
let io = null;

module.exports = {
  init: (socketIoInstance) => {
    io = socketIoInstance;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized. Call init(io) first.");
    }
    return io;
  },
};
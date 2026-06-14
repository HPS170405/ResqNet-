import User from '../models/User.js';
import ChatMessage from '../models/ChatMessage.js';

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join specific room based on user role (e.g. admins join admin room for updates)
    socket.on('join-room', (role) => {
      socket.join(role);
      console.log(`Socket ${socket.id} joined room: ${role}`);
    });

    // Chat history channel
    socket.on('get-chat-history', async () => {
      try {
        const messages = await ChatMessage.find({}).sort({ createdAt: -1 }).limit(30);
        socket.emit('chat-history', messages.reverse());
      } catch (err) {
        console.error('Error getting chat history:', err.message);
      }
    });

    // Chat messaging channel
    socket.on('send-chat-message', async (data) => {
      const { sender, name, role, message } = data;
      if (!sender || !message) return;

      try {
        const newMessage = await ChatMessage.create({
          sender,
          name,
          role,
          message
        });

        // Broadcast to all connected sockets
        io.emit('new-chat-message', newMessage);
      } catch (err) {
        console.error('Error sending chat message:', err.message);
      }
    });

    // Volunteer / Responder location update channel
    socket.on('update-location', async (data) => {
      const { userId, longitude, latitude, status } = data;
      
      if (!userId || longitude === undefined || latitude === undefined) return;

      try {
        // Find and update location in database
        const user = await User.findById(userId);
        if (user) {
          user.location = {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          };
          if (status) user.status = status;
          await user.save();

          // Broadcast coordinates to all active admins and responders on the map
          io.emit('responder-location-updated', {
            userId: user._id,
            name: user.name,
            role: user.role,
            coordinates: [longitude, latitude],
            status: user.status,
            skills: user.skills
          });
        }
      } catch (err) {
        console.error('Error updating real-time coordinate via socket:', err.message);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });
};

export default socketHandlers;

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors()); // Habilita CORS para todas las rutas

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // La URL de nuestro cliente React con Vite
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);

  // --- NUEVA LÓGICA DE SALAS ---

  // Escuchar cuando un usuario quiere unirse a una sala
  socket.on('join:room', (roomCode) => {
    // El método .join() suscribe el socket a la sala indicada
    socket.join(roomCode);
    console.log(`🙋‍♂️ Cliente ${socket.id} se unió a la sala: ${roomCode}`);
    
    // Opcional: Notificar a los demás en la sala que un nuevo usuario ha entrado
    // 'socket.to(roomCode)' emite a todos en la sala EXCEPTO al que acaba de entrar
    socket.to(roomCode).emit('chat:message', {
      from: 'SISTEMA',
      body: `Un nuevo usuario se ha unido al chat.`
    });
  });

  // --- LÓGICA DE MENSAJES MODIFICADA ---

  // Ahora el evento de mensaje debe saber a qué sala enviar el mensaje
  socket.on('chat:message', (data) => {
    const { room, ...messageData } = data; // Extraemos la sala del objeto de datos
    console.log(`✉️ Mensaje recibido para la sala ${room}:`, messageData);

    // El cambio más importante es aquí:
    // En lugar de 'io.emit', usamos 'io.to(room).emit'
    // Esto asegura que el mensaje solo se envíe a los clientes en esa sala específica.
    io.to(room).emit('chat:message', messageData);
  });

  socket.on('disconnect', () => {
    console.log(`👋 Cliente desconectado: ${socket.id}`);
    // Aquí podríamos añadir lógica para notificar que un usuario se fue de una sala
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Servidor escuchando en el puerto ${PORT}`));

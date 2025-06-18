import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Inicializamos la aplicación de Express
const app = express();
app.use(cors());

// Creamos un servidor HTTP a partir de la aplicación de Express
const server = http.createServer(app);

// Creamos el servidor de Socket.IO y lo adjuntamos al servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "*", // Para producción, es mejor especificar la URL de tu frontend
    methods: ["GET", "POST"]
  }
});

// Ruta de Express para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Servidor Activo</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            code { background: #eee; padding: 0.2rem 0.4rem; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Servidor de WebSocket Activo</h1>
            <p>El backend está funcionando correctamente.</p>
            <p><strong>URL:</strong> <code>${serverUrl}</code></p>
            <p><small>El cliente debe conectar usando la opción <strong>transports: ['websocket']</strong>.</small></p>
        </div>
    </body>
    </html>
  `);
});


// Endpoint para verificar el estado del servidor
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor funcionando correctamente" });
});

// Toda tu lógica de Socket.IO va aquí
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado por WebSocket: ${socket.id}`);

  socket.on('join:room', (roomCode) => {
    socket.join(roomCode);
    console.log(`🙋‍♂️ Cliente ${socket.id} se unió a la sala: ${roomCode}`);
    socket.to(roomCode).emit('chat:message', {
      from: 'SISTEMA',
      body: `Un nuevo usuario se ha unido al chat.`
    });
  });

  socket.on('chat:message', (data) => {
    const { room, ...messageData } = data;
    if (room) {
      console.log(`✉️ Mensaje para la sala ${room}:`, messageData);
      io.to(room).emit('chat:message', messageData);
    } else {
      console.log(`⚠️ Mensaje recibido sin sala:`, messageData);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`👋 Cliente desconectado: ${socket.id}. Razón: ${reason}`);
  });
});

// En lugar de usar server.listen(), que solo funciona para servidores de larga duración,
// exportamos el servidor completo. Vercel sabe cómo manejar esto.
export default server;

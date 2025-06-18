import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();

// --- CONFIGURACIÓN DE CORS ---
// Habilitar CORS para aceptar cualquier origen.
// app.use(cors()) es suficiente para las rutas HTTP de Express.
app.use(cors());

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    // Para Socket.IO, especificamos explícitamente que acepte cualquier origen con "*".
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// --- NUEVA RUTA VISUAL ---
// Esta ruta servirá una página simple para verificar que el servidor está en línea.
app.get('/', (req, res) => {
  // Construimos dinámicamente la URL del servidor
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  
  // Enviamos una respuesta HTML estilizada
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF--8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Servidor Activo</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #f4f7f9;
                color: #333;
            }
            .container {
                text-align: center;
                padding: 40px;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #007aff;
                margin-bottom: 1rem;
            }
            p {
                font-size: 1.1rem;
                color: #555;
            }
            code {
                background-color: #e8e8e8;
                padding: 0.2rem 0.5rem;
                border-radius: 6px;
                font-size: 1rem;
                color: #d63384;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Servidor de WebSocket Activo</h1>
            <p>El backend para tu aplicación de chat está funcionando.</p>
            <p><strong>Path del Servidor:</strong> <code>${serverUrl}</code></p>
            <p><strong>Configuración CORS:</strong> Abierta a cualquier origen.</p>
            <p><small>El puerto es gestionado automáticamente por Vercel.</small></p>
        </div>
    </body>
    </html>
  `);
});


// --- LÓGICA DEL CHAT CON SOCKET.IO ---
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);

  // Unirse a una sala
  socket.on('join:room', (roomCode) => {
    socket.join(roomCode);
    console.log(`🙋‍♂️ Cliente ${socket.id} se unió a la sala: ${roomCode}`);
    socket.to(roomCode).emit('chat:message', {
      from: 'SISTEMA',
      body: `Un nuevo usuario se ha unido al chat.`
    });
  });

  // Recibir y reenviar mensajes a la sala correcta
  socket.on('chat:message', (data) => {
    const { room, ...messageData } = data;
    if (room) {
      console.log(`✉️ Mensaje recibido para la sala ${room}:`, messageData);
      io.to(room).emit('chat:message', messageData);
    } else {
      console.log(`⚠️ Mensaje recibido sin sala:`, messageData);
    }
  });

  // Desconexión de un cliente
  socket.on('disconnect', () => {
    console.log(`👋 Cliente desconectado: ${socket.id}`);
    // Aquí podrías añadir lógica para notificar que un usuario se fue de una sala específica
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Servidor escuchando en el puerto ${PORT}`));

// Exporta la app para que Vercel la pueda usar.
// En Vercel, no se usa el listen, sino que se exporta el handler.
// Sin embargo, tener el listen() permite que funcione localmente.
export default app;

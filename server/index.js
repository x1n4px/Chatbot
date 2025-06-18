import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors()); // Habilita CORS para todas las rutas

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // La URL de nuestro cliente React con Vite
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
        <meta charset="UTF-8">
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
            <p><small>El puerto es gestionado automáticamente por Vercel.</small></p>
        </div>
    </body>
    </html>
  `);
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

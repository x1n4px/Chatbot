import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
 
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
function App() {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState(''); // <-- NUEVO: Estado para el código de la sala
  const [isChatActive, setIsChatActive] = useState(false); // Renombrado para más claridad

  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messageListRef = useRef(null);

  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    
    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // AHORA ENVIAMOS TAMBIÉN LA SALA
    socket.emit('chat:message', {
      from: nickname,
      body: newMessage.trim(),
      room: room, // <-- NUEVO: Incluimos la sala en el mensaje
    });

    setNewMessage('');
  };
  
  const handleJoinChat = (e) => {
    e.preventDefault();
    if (nickname.trim() === '' || room.trim() === '') return;

    // ENVIAMOS EL EVENTO PARA UNIRSE A LA SALA
    socket.emit('join:room', room);
    
    setIsChatActive(true);
  }

  // Si el chat no está activo, mostramos el formulario para unirse
  if (!isChatActive) {
    return (
      <div className="join-container">
        <h1>Unirse a un Chat</h1>
        <form onSubmit={handleJoinChat} className="message-form">
          <input
            type="text"
            className="message-input"
            placeholder="Escribe tu apodo..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          {/* CAMPO NUEVO PARA EL CÓDIGO DE SALA */}
          <input
            type="text"
            className="message-input"
            placeholder="Código de la sala..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button type="submit">Entrar al Chat</button>
        </form>
      </div>
    );
  }

  // Si el chat ya está activo, mostramos la interfaz del chat
  return (
    <div className="chat-container">
      <h3>Sala: {room}</h3> {/* Mostramos la sala actual */}
      <div className="message-list" ref={messageListRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.from === nickname || msg.from === 'SISTEMA' ? 'my-message' : ''}`}
          >
            <span className="from">{msg.from === nickname ? 'Tú' : msg.from}</span>
            {msg.body}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          className="message-input"
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoFocus
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default App

import './Home.css';
import { GoogleLogin } from 'react-google-login';
import { useEffect, useState, useRef } from 'react';
import { gapi } from 'gapi-script';

// Parece que no se usa, pero le da estilos al chat
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  SendButton,
  TypingIndicator
} from "@chatscope/chat-ui-kit-react";

import React  from 'react';

const clientId = "759143959718-add95sbrvk9elamjjn4331vnk15hrf30.apps.googleusercontent.com";

const URLAPI = 'http://localhost:4223/taylor_swift'

function Home() {

  const [googleId, setGoogleId] = useState(null);
  const [canciones, setCanciones] = useState([]);

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId:clientId,
        scope: ""
      })
    };
    gapi.load('client:auth2', start);
  });

  const onSuccess = (res) => {
    console.log("LOGIN SUCCESS! Current user: ", res.profileObj);
    console.log();
    setGoogleId(res.profileObj.googleId);
    if(localStorage.getItem(res.profileObj.googleId)){
      setCanciones(JSON.parse(localStorage.getItem(res.profileObj.googleId)));
    } else {
      setCanciones(JSON.parse("[]"));
    }
  }

  const onFailure = (res) => {
    console.log("LOGIN FAILED! res: ", res);
  }
  
  const inputRef = useRef();
  const [msgInputValue, setMsgInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [temperature, setTemperature] = useState(50);
  const [showSlider, setShowSlider] = useState(false);

  // Al clickear una canción, se cambian los mensajes
  const handleChosenSong = (song) => {
    const startString = {
      text: song.inicio,
      direction: 'outgoing',
    };
    const lyrics = {
      text: song.letra,
      direction: 'incoming',
    };
    setMessages([startString, lyrics]);
  }

  const cancionesSideBar = canciones.map((cancion) => <button onClick={() => handleChosenSong(cancion)}>{cancion.nombre}</button>);

  const handleToggleSlider = () => {
    setShowSlider(!showSlider);
  };

  const handleSliderChange = (event) => {
    setTemperature(event.target.value);
  };

  // Esta función es la encargada de comunicarse con el API
  const getSongLyrics = async (start_string) => {
    const data = {
      model: 'taylor_swift',
      start_string,
      temperature: temperature/100,
    };
  
    try {
      const response = await fetch(URLAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
      }
  
      const responseData = await response.json();
      return responseData.prediction;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  
  const handleSend = async (message) => {
    setIsTyping(true);
    const newMessage = {
      text: message,
      direction: 'outgoing',
    };
  
    // Actualiza el estado para incluir el nuevo mensaje
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  
    try {
      const response = await getSongLyrics(message);
      const responseMessage = {
        text: response,
        direction: 'incoming',
      };
      setMessages((prevMessages) => [...prevMessages, responseMessage]);

      // Se almacena la canción en el localStorage
      if (googleId) {
        const cancionesActuales = JSON.parse(localStorage.getItem(googleId)) || [];
        const length = cancionesActuales.length + 1;
        const nuevaCancion = { nombre: `Canción ${length}`, inicio: message, letra: response };

        cancionesActuales.push(nuevaCancion);
        localStorage.setItem(googleId, JSON.stringify(cancionesActuales));

        // La canción se agrega también a las canciones mostradas en el sidebar
        setCanciones([...canciones, nuevaCancion]);
      }

    } catch (error) {
      const errorMessage = {
        text: 'Hubo un error, trata de nuevo más tarde',
        direction: 'incoming',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setIsTyping(false);
  
    setMsgInputValue("");
    inputRef.current.focus();
  };
  

  return (
    <div>
      {googleId ? (     
        <>
        <div className='header'>
          <h3 style={{textAlign: 'center', flexGrow: '1'}}>Generador de canciones de Taylor Swift</h3>
          {/* Para la temperatura */}
          <div className='config' onClick={handleToggleSlider}>
            <span style={{ fontSize: '1.5em' }}>⚙️</span>
          </div>

          {showSlider && (
            <div className='temperature'>
              <p style={{textAlign: 'center', marginBottom:'0'}}>Temperatura</p>
              <div className="slidecontainer">
                <input type="range" min="1" max="100" value={temperature} className="slider" id="myRange" onChange={handleSliderChange} />
              </div>
              <p style={{textAlign: 'center', marginTop: '0px'}}>{temperature}</p>
            </div>
          )}
        </div>
        <div class="sidebar">
            {cancionesSideBar}
          </div>
        <div className='chatcontainer'>
          <MainContainer>
            <ChatContainer>

              {/* Las canciones generadas van acá */}
              <MessageList typingIndicator={isTyping && <TypingIndicator content="Generando canción..." />}>
                {messages.map((message, index) => (
                  <Message
                    key={index}
                    model={{
                      message: message.text, // Supongo que el mensaje tiene una propiedad 'text'
                      direction: message.direction,
                    }}
                  />
                ))}
              </MessageList>

              <div as={MessageInput} style={{
                display: "flex",
                flexDirection: "row",
                borderTop: "1px dashed #d1dbe4"
              }}>
                <MessageInput ref={inputRef} onChange={msg => setMsgInputValue(msg)} value={msgInputValue} 
                  sendButton={false} attachButton={false} onSend={handleSend} 
                  placeholder='Escriba el inicio de la canción aquí...'
                  style={{
                  flexGrow: 1,
                  borderTop: 0,
                  flexShrink: "initial"
                }} />
                <SendButton onClick={() => handleSend(msgInputValue)} disabled={msgInputValue.length === 0} style={{
                  fontSize: "1.2em",
                  marginLeft: 0,
                  paddingLeft: "0.2em",
                  paddingRight: "0.2em"
                }} />        
              </div>         
            </ChatContainer>
          </MainContainer>
        </div>
        </>
      ) : (
        <div className='login-card'>
          <h1 className='login-card-title'>Login</h1>
          <GoogleLogin className='center'
            clientId={clientId}
            buttonText='Usar Google'
            onSuccess={onSuccess}
            onFailure={onFailure}
            cookiePolicy={'single_host_origin'}
            isSignedIn={false}
          />
        </div>
      )}
    </div>
  );
}

export default Home;

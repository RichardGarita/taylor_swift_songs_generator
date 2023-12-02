import './App.css';
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

function App() {

  const onSuccess = (res) => {
    console.log("LOGIN SUCCESS! Current user: ", res.profileObj);
    setGoogleId(res.profileObj.googleId);
  }

  const onFailure = (res) => {
    console.log("LOGIN FAILED! res: ", res);
  }
  
  const [googleId, setGoogleId] = useState(null);

  //localStorage.setItem('111045705164865416538', JSON.stringify(letras));

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId:clientId,
        scope: ""
      })
    };
    gapi.load('client:auth2', start);
  });

  const inputRef = useRef();
  const [msgInputValue, setMsgInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [temperature, setTemperature] = useState(50);
  const [showSlider, setShowSlider] = useState(false);
  

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
        <div style={{ position: "relative", height: "500px" }}>
          <h3 style={{textAlign: 'center'}}>Generador de canciones de Taylor Swift</h3>

          {/* Para la temperatura */}
          <div
            style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              cursor: 'pointer',
            }}
            onClick={handleToggleSlider}
          >
            <span style={{ fontSize: '1.5em' }}>⚙️</span>
          </div>

          {showSlider && (
            <div
              style={{
                position: 'fixed',
                top: '15px',
                right: '70px',
                width: '200px',
                zIndex: '999',
              }}
            >
              <p style={{textAlign: 'center', marginBottom:'0'}}>Temperatura</p>
              <div className="slidecontainer">
                <input type="range" min="1" max="100" value={temperature} className="slider" id="myRange" onChange={handleSliderChange} />
              </div>
              <p style={{textAlign: 'center', marginTop: '0px'}}>{temperature}</p>
            </div>
          )}
          
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

export default App;

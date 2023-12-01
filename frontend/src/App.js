import './App.css';
import { GoogleLogin } from 'react-google-login';
import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import React  from 'react';

const clientId = "759143959718-add95sbrvk9elamjjn4331vnk15hrf30.apps.googleusercontent.com";

function App() {

  const onSuccess = (res) => {
    console.log("LOGIN SUCCESS! Current user: ", res.profileObj);
    setGoogleId(res.profileObj.googleId);
  }

  const onFailure = (res) => {
    console.log("LOGIN FAILED! res: ", res);
  }
  
  const [googleId, setGoogleId] = useState(null);

  let letras = [{
    "nombre" : "Cancion 1", 
    "Letra" : "Baby, we're the new romantics"
  },
  {
    "nombre" : "Cancion 2", 
    "Letra" : [
      "We need love",
      "But all we want is danger",
      "We team up",
      "Then switch sides like a record changer",
      "The rumors are terrible and cruel",
      "But honey, most of them are true"
    ]
  }];

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

  return (
    <div>
      {googleId ? (
        <div>
          <h1>Identificador del usuario:</h1>
          <h2>{googleId}</h2>
          <h3>Canciones guardadas: {localStorage.getItem(googleId)}</h3>











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

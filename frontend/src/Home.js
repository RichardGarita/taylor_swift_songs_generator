import './Home.css';
import { GoogleLogin } from 'react-google-login';
import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import React  from 'react';

const clientId = "759143959718-add95sbrvk9elamjjn4331vnk15hrf30.apps.googleusercontent.com";

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

  const cancionesSideBar = canciones.map((cancion) => <a href="#">{cancion.nombre}</a>);
  
  return (
    <div>
      {googleId ? (
        <div>      
          <div class="sidebar">
            {cancionesSideBar}
          </div>
          <div class="content">
            <h1>Identificador del usuario:</h1>
            <h2>{googleId}</h2>
            <h3>Canciones guardadas: {localStorage.getItem(googleId)}</h3>
          </div>
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

export default Home;

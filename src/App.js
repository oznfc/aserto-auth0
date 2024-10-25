import './App.css';
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from 'oidc-react';
import { useAserto } from '@aserto/aserto-react';

function App() {
  const auth = useAuth();
  const isAuthenticated = auth.userData?.id_token ? true : false;
  const [message, setMessage] = useState(false);
  const { init, loading, getDisplayState, error: asertoError } = useAserto()

  const accessSensitiveInformation = useCallback(async () => {
    try {
      if (!auth.isLoading) {
        const accessToken = auth.userData?.id_token;
        const sensitiveInformationURL = `${process.env.REACT_APP_API_ORIGIN}/api/protected`;
        const sensitiveDataResponse = await fetch(sensitiveInformationURL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log("sensitiveDataResponse:", sensitiveDataResponse)
        try {

          const res = await sensitiveDataResponse.json();
          console.log("res.secretMessage:", res.secretMessage)
          setMessage(res.secretMessage);
        } catch (e) {
          //In case no access is given, the response will return 403 and not return a JSON response
          console.log("sensitiveDataResponse:", sensitiveDataResponse)
          setMessage(sensitiveDataResponse.status);
        }
      }
    } catch (e) {
      console.log(e.message);
    }
  }, [auth.isLoading, auth.userData?.id_token]);

  //If the user logs out, redirect them to the login page
  useEffect(() => {
    if (!auth.isLoading && !isAuthenticated) {
      auth.signIn();
    }
  });

  useEffect(() => {
    async function initAserto() {
      try {
        const token = auth.userData?.id_token

        if (token) {
          await init({
            serviceUrl: 'http://localhost:8080',
            accessToken: token,
            policyRoot: 'asertodemo',
            throwOnError: false
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (!asertoError && isAuthenticated) {
      initAserto();
    }

    if (!loading && !isAuthenticated) {
      auth.signIn()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, auth.userData?.id_token, auth.isLoading]);

  if (asertoError) {
    return (
      <div>
        <h1>Error encountered</h1>
        <p>{asertoError}</p>
      </div>
    )
  }

  const displayState =
    loading || asertoError
      ? { visible: false, enabled: false }
      : getDisplayState('GET', '/api/protected')

  console.log(displayState)
  return (
    <div className="container">
      <div className="header">
        <div className="logo-container">
          <div className="logo"></div>
          <div className="brand-name"></div>
        </div>
      </div>

      <div className="user-controls">
        {isAuthenticated && (
          <>
            <div className="user-info">{auth.userData?.profile?.email}</div>
            <div className="seperator"></div>
            <div className="auth-button">
              <div onClick={() => auth.signOut("/")}>Log Out</div>
            </div>
          </>
        )}
        {!isAuthenticated && (
          <div className="auth-button">
            <div onClick={() => auth.signIn("/")}>Login</div>
          </div>
        )}
      </div>

      <div className="main">
        {isAuthenticated && (
          <>
            <div className="top-main">
              <div className="welcome-message">
                Welcome {auth.userData?.profile?.email}!
              </div>
              <div>
                {!message && (
                  <button
                    className="primary-button"
                    disabled={!displayState.enabled}
                    onClick={() => accessSensitiveInformation()}
                  >
                    Get Sensitive Resource
                  </button>
                )}
                <div className="message-container">
                  {message && message !== 403 && message !== 401 && (
                    <>
                      <div className="lottie"></div>
                      <div className="message">{message}</div>
                    </>
                  )}
                  {message && message === 401 && (
                    <>
                      <div className="sad-lottie"></div>
                      <div className="message">
                        No access to sensitive information
                      </div>
                    </>
                  )}
                  {message && message === 403 && (
                    <>
                      <div className="sad-lottie"></div>
                      <div className="message">
                        No access to sensitive information
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="center-main">
              {displayState.visible && (
                <div>You have been identified as an `admin`.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
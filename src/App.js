import { useEffect, useState } from "react";
import {  BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./components/dashboard/dashboard.component";
import Documents from "./components/documents/documents.component";
import Applications from "./components/applications/applications.component";
import ProfileSettingsModal from "./containers/profileSettings";
import AuthAPI from "./adapters/auth";
import { isMobile } from "react-device-detect"; 
import { authConfirmationContext, profileSettingsContext } from "./context/appContext";
import AuthenticateUser from "./components/authentication/authUser.component";
import { useStore } from "./store/store";
import * as mutations from "./graphql/mutations";


function App() {
  const [profileSettingsVisible, setProfileSettings] = useState(false);
  const noAuthenticatedUserMessage = "The user is not authenticated";
  const user = useStore(state => state.about);
  const setUserId = useStore(state => state.setId);

  /**
   * Displays the profile settings component
   * @returns sets the state to the toggle value
   */
  function toggleProfileSettings(){
    return setProfileSettings(!profileSettingsVisible);
  }

  // Set user to false then render the Authentication component;
  function confirmSignOut(){
    return setUserId(null);
  }

  // Check if the current user is authenticated 
  async function confirmAuthentication(){
    const isAuthenticated = await AuthAPI.getCurrentAuthenticatedUser();
    
    if (isAuthenticated && isAuthenticated.attributes['custom:userId']){
      const userId = isAuthenticated.attributes['custom:userId'];
      return setUserId(userId);
    } 
    
    return;
  }
  
  useEffect(() => {
    async function getCurrentAuthenticatedUser(){
      const authenticatedUser = await AuthAPI.getCurrentAuthenticatedUser();
      if (authenticatedUser){
        
        // no current authenticated user
        if (authenticatedUser === noAuthenticatedUserMessage){
          return
        } else {
          // get user id
          const userId = authenticatedUser.attributes['custom:userId'];

          return setUserId(userId);
        }
      } 
    } 
    
    getCurrentAuthenticatedUser();

  }, []);
  
  if (isMobile){
    return <></> // no mobile support for now
  } else {
    if (user.id){
      return (
        <profileSettingsContext.Provider value={ toggleProfileSettings }>
          {profileSettingsVisible ? <ProfileSettingsModal/> : null}
          <Router>
            <Switch>
                <Route exact path="/">
                  <Dashboard/> 
                </Route>
                <Route path="/applications">
                  <Applications/>
                </Route>
                <Route path="/documents">
                  <Documents/>
                </Route>
              </Switch>
          </Router>
        </profileSettingsContext.Provider>
      )
    } else {
      return (
        <authConfirmationContext.Provider value={ confirmAuthentication }>
          <AuthenticateUser/>
        </authConfirmationContext.Provider>
      )
    }
  }
}

export default App;

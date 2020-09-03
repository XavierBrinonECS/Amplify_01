import React, { useState, useEffect } from 'react';
import './App.css';

import { Auth, Hub } from "aws-amplify";

/**
 * @typedef { 'signUp' | 'confirmSignUp' | 'signIn' | 'signedIn'} formType
 */

/**
 * @typedef formState
 * @property { string } username   - The user's username
 * @property { string } password   - The user's password
 * @property { string } email      - The user's email
 * @property { string } authCode   - The user's authentication code
 * @property { formType } formType - Meta property to help identify the form used
 */

/** @type { formState } */
const initialFormState = {
  username: '',
  password: '',
  email: '',
  authCode: '',
  formType: 'signUp'
}

function App () {
  const [formState, setFormState] = useState(initialFormState)
  const { formType } = formState

  useEffect(() => {
    isUserAuthenticated()
    setAuthListener()
    return () => {
      Hub.remove('auth')
    }
  }, [])

  return (
    <div className="App">
      {
        formType === 'signUp'
          ? SignUp(onInputChange, formState, setFormState)
          : formType === 'signIn'
            ? SignIn(onInputChange, formState)
            : formType === 'confirmSignUp'
              ? ConfirmSignUp(onInputChange, formState, setFormState)
              : formType === 'signedIn'
                ? SignedIn()
                : null
      }
    </div>
  );

  /**
   * Updates the form at each input event.
   * @param { React.ChangeEvent<HTMLInputElement> } evt 
   */
  function onInputChange (evt) {
    evt.persist()
    setFormState(currentForm => ({
      ...currentForm,
      [evt.target.name]: evt.target.value
    }))
  }

  /**
   * Bypass the login form if user is already signed in.
   */
  async function isUserAuthenticated () {
    try {
      await Auth.currentAuthenticatedUser()
      setFormState({
        ...initialFormState,
        formType: 'signedIn'
      })
    } catch (isUserAuthenticatedError) {

    }
  }

  /**
   * Initialisation of the Hub.
   * https://docs.amplify.aws/guides/authentication/listening-for-auth-events/q/platform/js
   */
  async function setAuthListener () {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log('user signed in');
          setFormState(currentForm => ({
            ...currentForm,
            formType: 'signedIn'
          }))
          break;
        case 'signUp':
          console.log('user signed up');
          setFormState(currentForm => ({
            ...currentForm,
            formType: 'confirmSignUp'
          }))
          break;
        case 'signOut':
          console.log('user signed out');
          setFormState({
            ...initialFormState,
            formType: 'signUp'
          })
          break;
        case 'signIn_failure':
          console.log('user sign in failed');
          break;
        case 'configured':
          console.log('the Auth module is configured');
          break;
        default:
          console.log({ 'Should not happen': data })
      }
    })
  }
}

/**
 * 
 * @param {React.ChangeEvent<HTMLInputElement>} inputHandler 
 * @param { formState } formState 
 * @param { React.Dispatch<React.SetStateAction<formState>> } setFormState 
 */
function SignUp (inputHandler, formState, setFormState) {
  return <div>
    <input type="text" required name="username" onChange={inputHandler} placeholder="username" />
    <input type="password" name="password" onChange={inputHandler} placeholder="password" />
    <input type="email" name="email" onChange={inputHandler} placeholder="email" />
    <button onClick={() => signUp(formState)}>Sign Up</button>
    <button onClick={() => setSignIn(setFormState)}>already a user?</button>
  </div>
}

/**
 * 
 * @param {React.ChangeEvent<HTMLInputElement>} inputHandler 
 * @param { formState } formState 
 */
function SignIn (inputHandler, formState) {
  return <div>
    <input type="text" name="username" onChange={inputHandler} placeholder="username" />
    <input type="password" name="password" onChange={inputHandler} placeholder="password" />
    <button onClick={() => signIn(formState)}>Sign In</button>
  </div>
}

/**
 * 
 * @param {React.ChangeEvent<HTMLInputElement>} inputHandler 
 * @param { formState } formState 
 * @param { React.Dispatch<React.SetStateAction<formState>> } setFormState 
 */
function ConfirmSignUp (inputHandler, formState, setFormState) {
  return <div>
    <input type="text" name="authCode" onChange={inputHandler} placeholder="confirmation code" />
    <button onClick={() => confirmSignUp(formState, setFormState)}>Confirm Sign Up</button>
    <button onClick={() => setSignIn(setFormState)}>already a user?</button>
  </div>
}

/**
 * 
 */
function SignedIn () {
  return <div>
    <p>Hello, you can sign out now.</p>
    <button onClick={signOut}>Sign Out</button>
  </div>
}

/**
 * Asks the user to create credentials.
 * 
 * @name signUp
 * @param { formState } formState 
 */
async function signUp (formState) {
  const { username, password, email } = formState
  await Auth.signUp({
    username,
    password,
    attributes: {
      email
    }
  })
}

/**
 * User has some creds already.
 * 
 * @name signUp
 * @param { React.Dispatch<React.SetStateAction<formState>> } setFormState 
 */
async function setSignIn (setFormState) {
  setFormState(currentForm => ({
    ...currentForm,
    formType: 'signIn'
  }))
}

/**
 * After retrieveing the confirmation code from the user.
 * Asks for MFA confirmation.
 * 
 * @name confirmSignUp
 * @param { formState } formState 
 * @param { React.Dispatch<React.SetStateAction<formState>> } setFormState 
 */
async function confirmSignUp (formState, setFormState) {
  const { username, authCode: code } = formState
  await Auth.confirmSignUp(username, code, {
    // Optional. Force user confirmation irrespective of existing alias. By default set to True.
    forceAliasCreation: true
  })
  setFormState(currentForm => ({
    ...currentForm,
    formType: 'signIn'
  }))
}

/**
 * Ask credentials for authentication.
 * 
 * @name signIn
 * @param { formState } formState 
 */
async function signIn (formState) {
  const { username, password } = formState
  await Auth.signIn(username, password)
}

/**
 * Byebye.
 * 
 * @name signOut
 */
async function signOut () {
  await Auth.signOut()
}

export default App;

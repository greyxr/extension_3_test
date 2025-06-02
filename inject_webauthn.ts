import { getLogger } from './logging';
import { publicKeyCredentialToObject, webauthnParse, webauthnStringify } from './utils';
const log = getLogger('inject_webauthn');

(() => {
  class CKeyCredentials {
    static webauthnReqCounter = 0;
    static webauthnCallbacks = {};

    static create = (async (options: CredentialCreationOptions, originalCredential: PublicKeyCredential): Promise<Credential | null> => {
      const requestID = ++CKeyCredentials.webauthnReqCounter;

      const registerRequest: WebAuthnRequestMessage = {
        type: 'create',
        originalCredential: originalCredential ? webauthnStringify(publicKeyCredentialToObject(originalCredential)) : '',
        options: webauthnStringify(options),
        requestID,
      };
  
      const cb: Promise<any> = new Promise((res, _) => {
        CKeyCredentials.webauthnCallbacks[requestID] = res;
      });
  
      window.postMessage(registerRequest, window.location.origin);
  
      const webauthnResponse = await cb;
  
      // Because "options" contains functions we must stringify it, otherwise
      // object cloning is illegal.
      const credential = webauthnParse(webauthnResponse.resp.credential);
      credential.getClientExtensionResults = () => ({});
      credential.__proto__ = window['PublicKeyCredential'].prototype;

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return null;
        }
      });

      credential.response.__proto__ = window['AuthenticatorAttestationResponse'].prototype;

      // We need to remove the getTransports function from the object to prevent illegal invocation on many sites
      credential.response.getTransports = undefined;

      return credential;
    }).bind(navigator.credentials);

    static get = (async (options: CredentialRequestOptions, originalCredential: PublicKeyCredential): Promise<Credential | null | any> => {
      const requestID = ++CKeyCredentials.webauthnReqCounter;
      const cb: Promise<any> = new Promise((res, _) => {
        CKeyCredentials.webauthnCallbacks[requestID] = res;
      });
  
      const signRequest: WebAuthnRequestMessage = {
        type: 'sign',
        originalCredential: webauthnStringify(publicKeyCredentialToObject(originalCredential)),
        options: webauthnStringify(options),
        requestID,
      };
      window.postMessage(signRequest, window.location.origin);
  
      const webauthnResponse = await cb;
  
      const credential = webauthnParse(webauthnResponse.resp.credential);
      credential.getClientExtensionResults = () => ({});
      credential.__proto__ = window['PublicKeyCredential'].prototype;

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return null;
        }
      });

      credential.response.__proto__ = window['AuthenticatorAssertionResponse'].prototype;

      // We need to remove the getTransports function from the object to prevent illegal invocation on many sites
      credential.response.getTransports = undefined;

      return credential;
    }).bind(navigator.credentials);
  }
  let passToOrig = true;
  let gotPassToOrig = false;

  // *** remove replacing of navigator.credentials in favor of our own
  // replacements performed above

  window.addEventListener('message', (evt) => {
    const msg = evt.data;
    if (msg.message && msg.message === 'passToOrig') {
      passToOrig = msg.val;
      gotPassToOrig = true;
      log.debug('passToOrig set', passToOrig);
    } else if (['create_response', 'sign_response'].indexOf(msg.type) > -1) {
      log.debug('relevant message', msg);
      if (msg.requestID && msg.resp && CKeyCredentials.webauthnCallbacks[msg.requestID]) {
        CKeyCredentials.webauthnCallbacks[msg.requestID](msg);
        delete (CKeyCredentials.webauthnCallbacks[msg.requestID]);
      }
    }
  }, true);


  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Custom overrides of functions to create/get credentials
  // ==========================================================================

  // Override navigator.credentials.create - this should give us control of
  // credential creation on most websites.

  const create = navigator.credentials.create.bind(navigator.credentials);
  navigator.credentials.create = async function() {
    log.debug('called navigator.credentials.create ', arguments);

    await delay(200); // Wait for 1 second (1000 milliseconds)

    let realCred = "";
    if (passToOrig) {
      // call the real create so that the user gets expected interaction
      log.debug('getting real credential from authenticator');
      realCred = await create(...arguments);
      log.debug('got real credential', realCred);
    }

    // create our fake credential
    log.debug('processing credential');
    const cred = await CKeyCredentials.create(arguments[0], realCred);
    log.debug('credential processed');

    // return the fake credential
    return cred;
  };

  // Override navigator.credentials.get - this should give us control of
  // credential getting on most websites.
  const get = navigator.credentials.get.bind(navigator.credentials);
  navigator.credentials.get = async function() {
    log.debug('navigator.credentials.get called', arguments);

    // call the real get so that the user gets expected interaction
    log.debug('getting real signature from authenticator');
    let realCred = await get(...arguments);
    log.debug('got real signature', realCred);

    // get the credential from our fake store
    log.debug('processing signature');
    const cred = await CKeyCredentials.get(arguments[0], realCred);
    log.debug('credential signature');

    // return the fake credential
    return cred;
  };

  // Override window.chrome.runtime.connect - this gives us control of
  // credential creation on Google since they use the low-level MessagePort API
  // to create credentials.
  //
  // See 3.1 in the spec for more info about the low-level API:
  // https://fidoalliance.org/specs/u2f-specs-1.0-bt-nfc-id-amendment/fido-u2f-javascript-api.html
  //
  // See the chrome docs for more info about window.chrome.runtime.connect:
  // https://developer.chrome.com/extensions/runtime#method-connect for more

  // Note: This seems to be unused
  if (window.chrome && window.chrome.runtime) {
    const connect = window.chrome.runtime.connect.bind(window.chrome.runtime);
    window.chrome.runtime.connect = function() {
      // make the real connect call and store the resulting port
      const port = connect(...arguments);

      // override postMessage so that we can modify the message before posting it
      const postMessage = port.postMessage.bind(port);
      port.postMessage = function(msg: any) {
        log.debug('port.postMessage called', msg);

        // TODO: modify posted message as needed

        // post message so that user gets expected interaction
        postMessage(msg);
      };

      // keep track of real listeners
      const listeners: Array<(msg: any, port: MessagePort) => void> = [];

      // add a real listener to modify message and forward it to real listeners
      port.onMessage.addListener(async function(msg: any, port: MessagePort) {
        log.debug('message received', msg, port);

        // ignore irrelevant messages
        if (!['u2f_register_response', 'u2f_sign_response'].includes(msg.type)) {
          listeners.forEach((l) => l(msg, port));
          return;
        }

        // TODO: modify received message as needed

        // forward modified message to listeners
        listeners.forEach((l) => l(msg, port));
      });

      // override onMessage.addListener - store listeners instead of adding them
      port.onMessage.addListener = listeners.push.bind(listeners);

      // return the modified port
      return port;
    };
  }

  log.debug('injected');
})();

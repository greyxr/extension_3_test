// import { getLogger } from './logging';
import { WebAuthnRequestMessage } from './types/types';
import { byteArrayToBase64, publicKeyCredentialToObject, webauthnParse, webauthnStringify } from './utils';
// const log = getLogger('inject_webauthn');

(() => {
  function logHelper(...msg: any[]): void {
    console.log('[Inject] ', msg);
  }

  class CKeyCredentials {
    static webauthnReqCounter = 0;
    static webauthnCallbacks = {};

    static create = (async (options: CredentialCreationOptions, originalCredential: PublicKeyCredential): Promise<Credential | null> => {
      const requestID = ++CKeyCredentials.webauthnReqCounter;

      logHelper('in static create');

      const registerRequest: WebAuthnRequestMessage = {
        type: 'create',
        originalCredential: originalCredential ? webauthnStringify(publicKeyCredentialToObject(originalCredential)) : '',
        options: webauthnStringify(options),
        requestID,
      };

      logHelper('setting callback')
  
      const cb: Promise<any> = new Promise((res, _) => {
        CKeyCredentials.webauthnCallbacks[requestID] = res;
      });

      logHelper('posting register request')
  
      window.postMessage(registerRequest, window.location.origin);
  
      const webauthnResponse = await cb;

      logHelper('got webauthn response:', webauthnResponse)
  
      // Because "options" contains functions we must stringify it, otherwise
      // object cloning is illegal.
      const credential = webauthnParse(webauthnResponse.resp.credential);
      credential.getClientExtensionResults = () => ({});
      credential.__proto__ = window['PublicKeyCredential'].prototype;

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return "platform";
        }
      });

      Object.defineProperty(credential, 'toJSON', {
        value: function() { return {
          id: this.id,
          rawId: byteArrayToBase64(new Uint8Array(this.rawId), true),
          response: {
            attestationObject: byteArrayToBase64(new Uint8Array(this.response.attestationObject)),
            clientDataJSON: byteArrayToBase64(new Uint8Array(this.response.clientDataJSON))
          },
          type: this.type,
          authenticatorAttachment: this.authenticatorAttachment
        } },
        configurable: true,
        writable: true
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

      logHelper("Sending sign request")
  
      const webauthnResponse = await cb;

      logHelper("Received sign request")
  
      const credential = webauthnParse(webauthnResponse.resp.credential);
      credential.getClientExtensionResults = () => ({});

      Object.defineProperty(credential, 'toJSON', {
        value: function() { return {
          id: this.id,
          rawId: byteArrayToBase64(this.rawId, true),
          response: {
            // attestationObject: byteArrayToBase64(new Uint8Array(this.response.attestationObject)),
            clientDataJSON: byteArrayToBase64(new Uint8Array(this.response.clientDataJSON)),
            authenticatorData: byteArrayToBase64(new Uint8Array(this.response.authenticatorData)),
            signature: byteArrayToBase64(new Uint8Array(this.response.signature)),
            userHandle: byteArrayToBase64(this.response.userHandle),
          },
          type: this.type,
          authenticatorAttachment: this.authenticatorAttachment
        } },
        configurable: true,
        writable: true
      });

      credential.__proto__ = window['PublicKeyCredential'].prototype;

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return "platform";
        }
      });

      credential.response.__proto__ = window['AuthenticatorAssertionResponse'].prototype;

      // We need to remove the getTransports function from the object to prevent illegal invocation on many sites
      credential.response.getTransports = undefined;

      logHelper("Returning credential:", credential)
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
      logHelper('passToOrig set', passToOrig);
    } else if (['create_response', 'sign_response'].indexOf(msg.type) > -1) {
      logHelper('relevant message', msg);
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
    logHelper('called navigator.credentials.create ', arguments);

    await delay(200); // Wait for 1 second (1000 milliseconds)

    let realCred: Credential | null = null
    if (passToOrig) {
      // call the real create so that the user gets expected interaction
      logHelper('getting real credential from authenticator');
      realCred = await create(...arguments);
      if (!realCred) {
        logHelper('create call failed');
        return null;
      }
      logHelper('got real credential', realCred);
    }

    // create our fake credential
    logHelper('processing credential');
    const cred = await CKeyCredentials.create(arguments[0], realCred as PublicKeyCredential);
    logHelper('credential processed');

    // return the fake credential
    return cred;
  };

  // Override navigator.credentials.get - this should give us control of
  // credential getting on most websites.
  const get = navigator.credentials.get.bind(navigator.credentials);
  navigator.credentials.get = async function() {
    logHelper('navigator.credentials.get called', arguments);

    // call the real get so that the user gets expected interaction
    logHelper('getting real signature from authenticator');
    let realCred = await get(...arguments);
    logHelper('got real signature', realCred);

    // get the credential from our fake store
    logHelper('processing signature');
    const cred = await CKeyCredentials.get(arguments[0], realCred as PublicKeyCredential);
    logHelper('credential signature');

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
        logHelper('port.postMessage called', msg);

        // TODO: modify posted message as needed

        // post message so that user gets expected interaction
        postMessage(msg);
      };

      // keep track of real listeners
      const listeners: Array<(msg: any, port: chrome.runtime.Port) => void> = [];

      // add a real listener to modify message and forward it to real listeners
      port.onMessage.addListener(async function(msg: any, port: chrome.runtime.Port) {
        logHelper('message received', msg, port);

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

  logHelper('injected');
})();

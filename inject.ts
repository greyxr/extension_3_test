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

    static create = (async (options: CredentialCreationOptions, originalCredential: PublicKeyCredential): Promise<PublicKeyCredential | null> => {
      logHelper('In static create method');
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

      logHelper('registerRequest', registerRequest);
  
      window.postMessage(registerRequest, window.location.origin);

      logHelper('posted message');
  
      const webauthnResponse = await cb;

      logHelper('webauthnResponse', webauthnResponse);
  
      // Because "options" contains functions we must stringify it, otherwise
      // object cloning is illegal.
      const credential = webauthnParse(webauthnResponse.resp.credential);
      credential.getClientExtensionResults = () => ({});
      credential.__proto__ = window['PublicKeyCredential'].prototype;

      logHelper('credential', credential);

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return "platform";
        }
      });

      // Convert attestationObject and clientDataJson to ArrayBuffers from Uint8Arrays
      // credential.authenticatorAttachment = "platform";
      credential.response.attestationObject = new Uint8Array(credential.response.attestationObject).buffer;
      credential.response.clientDataJSON = new Uint8Array(credential.response.clientDataJSON).buffer;
      credential.rawId = new Uint8Array(credential.rawId).buffer;

      credential.response.__proto__ = window['AuthenticatorAttestationResponse'].prototype;

      // We need to remove the getTransports function from the object to prevent illegal invocation on many sites
      // credential.response.getTransports = undefined;

      // const response = credential!.response as AuthenticatorAttestationResponse;
      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'getPublicKey', {
      //   value: () => new ArrayBuffer(),
      //   configurable: true
      // });
      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'getPublicKeyAlgorithm', {
      //   value: () => 0,
      //   configurable: true
      // });

      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'clientDataJSON', {
      //   value: () => new ArrayBuffer(),
      //   configurable: true
      // });
      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'getTransports', {
      //   value: () => [],
      //   configurable: true
      // });
      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'getAuthenticatorData', {
      //   value: () => new ArrayBuffer(),
      //   configurable: true
      // });
      // Object.defineProperty(credential!.response as AuthenticatorAttestationResponse, 'attestationObject', {
      //   get: function() { return new ArrayBuffer() }
      // });
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
        } }
      });

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

      logHelper('posted message');
  
      const webauthnResponse = await cb;

      logHelper('webauthnResponse', webauthnResponse);
  
      const credential = webauthnParse(webauthnResponse.resp.credential);
      logHelper('credential', credential);
      credential.getClientExtensionResults = () => ({});
      credential.__proto__ = window['PublicKeyCredential'].prototype;

      // We need to add an empty authenticatorAttachment to prevent illegal invocation on many sites
      Object.defineProperty(credential, 'authenticatorAttachment', {
        get() {
          return null;
        }
      });

      logHelper('added authenticatorAttachment');

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
      logHelper('passToOrig set', passToOrig);
    } else if (['create_response', 'sign_response'].indexOf(msg.type) > -1) {
      logHelper('relevant message', msg);
      if (msg.requestID && msg.resp && CKeyCredentials.webauthnCallbacks[msg.requestID]) {
        logHelper('calling callback', msg);
        CKeyCredentials.webauthnCallbacks[msg.requestID](msg);
        logHelper('callback called');
        delete (CKeyCredentials.webauthnCallbacks[msg.requestID]);
        logHelper('callback deleted');
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

    let realCred: PublicKeyCredential | null = null
    if (passToOrig) {
      // call the real create so that the user gets expected interaction
      logHelper('getting real credential from authenticator');
      realCred = await create(...arguments) as PublicKeyCredential | null;
      if (!realCred) {
        logHelper('create call failed');
        return null;
      }
      logHelper('got real credential', realCred);
    }

    // create our fake credential
    logHelper('processing credential');
    const cred = await CKeyCredentials.create(arguments[0], realCred!);
    const oldCred = realCred!.response
    logHelper('oldCred', oldCred);
    const newCred = cred!.response;
    logHelper('newCred', newCred);
    logHelper('credential processed');
    console.log(cred);
    console.log(realCred);

    // const credResponse = cred!.response as AuthenticatorAttestationResponse
    // const realCredResponse = realCred!.response as AuthenticatorAttestationResponse
    // const newResponse: AuthenticatorAttestationResponse = {
    //   // ...realCredResponse,
    //   // attestationObject: new ArrayBuffer(), // credResponse.attestationObject,
    //   // clientDataJSON: credResponse.clientDataJSON,
    //   // getAuthenticatorData: () => new ArrayBuffer(),
    //   // getPublicKey: () => new ArrayBuffer(),
    //   // getPublicKeyAlgorithm: () => 0,
    //   // getTransports: () => []
    // }

    // if (realCred) {
    //   Object.defineProperty(realCred, 'response', {
    //     get() { return null; }
    //   });
    // }

    // console.log(cred);
    // console.log(realCred);

    // if (cred && realCred) {
    //   const attestationResponse = cred.response as AuthenticatorAttestationResponse;
    //   const realAttestationResponse = realCred.response as AuthenticatorAttestationResponse;
    //   Object.defineProperty(attestationResponse, 'attestationObject', {
    //     value: realAttestationResponse.attestationObject,
    //     configurable: true
    //   });
    // }


    // if (cred) {
    //   Object.defineProperty(cred, 'attestationObject', {
    //     get() { return realCred!.rawId; }
    //   });
    // }
    // if (realCred) {
    //   Object.defineProperty(realCred, 'authenticatorAttachment', {
    //     get() { return "cross-platform"; }
    //   });
    // }

      // Object.defineProperty(cred.response, 'getPublicKey', {
      //   get() { return "testKey" }
      // });

    // if (realCred) {
    //   Object.defineProperty(realCred, 'response', {
    //     get() { return cred!.response; }
    //   });
    // }

    // return the fake credential
    // logHelper('testing different response methods')
    // const response2 = realCred!.response as AuthenticatorAttestationResponse;
    // console.log(response2)
    // console.log(response2.getAuthenticatorData());
    // console.log(response2.getPublicKey());
    // console.log(response2.getPublicKeyAlgorithm());
    // console.log(response2.getTransports());
    // console.log("done")
    // logHelper('testing different response methods')
    // const response = cred!.response as AuthenticatorAttestationResponse;
    // console.log(response)
    // console.log(cred?.getClientExtensionResults())
    // console.log(response.attestationObject)
    // console.log(response.getAuthenticatorData());
    // console.log(response.getPublicKey());
    // console.log(response.getPublicKeyAlgorithm());
    // console.log(response.getTransports());
    // console.log("done")
    return cred
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
    return realCred;
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

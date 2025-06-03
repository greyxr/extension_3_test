(function() {
  try {
      const origGet = navigator.credentials.get;
      const origCreate = navigator.credentials.create;
    
      navigator.credentials.get = async function(options) {
        console.log("navigator.credentials.get called with:", options);
        let origCred = null;
        try {
          origCred = await origGet.apply(this, arguments)
          return origCred;
        } catch (error) {
          console.log("navigator.credentials.get error:", error);
          return null
        } finally {
          window.postMessage({ type: 'CREDENTIAL_API_CALL', method: 'get', credential: origCred ?? "" }, '*');
        }
      };
    
      navigator.credentials.create = async function(options) {
        console.log("navigator.credentials.create called with:", options);
        let origCred = null;
        try {
          origCred = await origCreate.apply(this, arguments)
          return origCred;
        } catch (error) {
          console.log("navigator.credentials.create error:", error);
          return null
        } finally {
          window.postMessage({ type: 'CREDENTIAL_API_CALL', method: 'create', credential: origCred ?? "" }, '*');
        }
      };
    } catch (error) {
      console.log("Error in inject.js:", error);
    }
  })();
  
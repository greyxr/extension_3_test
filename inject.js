(function() {
  const origGet = navigator.credentials.get;
  const origCreate = navigator.credentials.create;

  navigator.credentials.get = function(options) {
    console.log("navigator.credentials.get called with:", options);
    window.postMessage({ type: 'CREDENTIAL_API_CALL', method: 'get' }, '*');
    return origGet.apply(this, arguments);
  };

  navigator.credentials.create = function(options) {
    console.log("navigator.credentials.create called with:", options);
    window.postMessage({ type: 'CREDENTIAL_API_CALL', method: 'create' }, '*');
    return origCreate.apply(this, arguments);
  };
})();

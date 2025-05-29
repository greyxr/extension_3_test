# Credentials API Logger Chrome Extension

This is a minimal Chrome extension that intercepts and logs calls to the Credentials API (`navigator.credentials`).

## Features

- Logs all calls to `navigator.credentials.get()`
- Logs all calls to `navigator.credentials.create()`
- Preserves original functionality while adding logging

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing this extension

## Usage

Once installed, the extension will automatically log all calls to the Credentials API in the browser's console. To view the logs:

1. Open Chrome DevTools (F12 or Right-click > Inspect)
2. Go to the "Console" tab
3. Look for messages prefixed with "[Credentials API Logger]"

The extension will log:
- When a credentials.get() or credentials.create() call is intercepted
- The arguments passed to these methods
- The return values from these methods

## Files

- `manifest.json`: Extension configuration
- `content.js`: Main logic for intercepting Credentials API calls 
// Buffer polyfill
import { Buffer } from 'buffer/';
globalThis.Buffer = Buffer;

// Events polyfill
import { EventEmitter } from 'events';
globalThis.EventEmitter = EventEmitter;

// Stream polyfill
import stream from 'stream-browserify';
globalThis.stream = stream;

// Process polyfill
globalThis.process = {
  env: {
    NODE_DEBUG: false
  }
}; 
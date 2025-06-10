/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 7:
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ 48:
/***/ ((module) => {

"use strict";


function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError =
  /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(typeof actual);
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.F = codes;


/***/ }),

/***/ 59:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const {MT, SIMPLE, SYMS} = __webpack_require__(452)

/**
 * A CBOR Simple Value that does not map onto a known constant.
 */
class Simple {
  /**
   * Creates an instance of Simple.
   *
   * @param {number} value The simple value's integer value.
   */
  constructor(value) {
    if (typeof value !== 'number') {
      throw new Error(`Invalid Simple type: ${typeof value}`)
    }
    if ((value < 0) || (value > 255) || ((value | 0) !== value)) {
      throw new Error(`value must be a small positive integer: ${value}`)
    }
    this.value = value
  }

  /**
   * Debug string for simple value.
   *
   * @returns {string} Formated string of `simple(value)`.
   */
  toString() {
    return `simple(${this.value})`
  }

  /**
   * Debug string for simple value.
   *
   * @param {number} depth How deep are we?
   * @param {object} opts Options.
   * @returns {string} Formatted string of `simple(value)`.
   */
  [Symbol.for('nodejs.util.inspect.custom')](depth, opts) {
    return `simple(${this.value})`
  }

  /**
   * Push the simple value onto the CBOR stream.
   *
   * @param {object} gen The generator to push onto.
   * @returns {boolean} True on success.
   */
  encodeCBOR(gen) {
    return gen._pushInt(this.value, MT.SIMPLE_FLOAT)
  }

  /**
   * Is the given object a Simple?
   *
   * @param {any} obj Object to test.
   * @returns {boolean} Is it Simple?
   */
  static isSimple(obj) {
    return obj instanceof Simple
  }

  /**
   * Decode from the CBOR additional information into a JavaScript value.
   * If the CBOR item has no parent, return a "safe" symbol instead of
   * `null` or `undefined`, so that the value can be passed through a
   * stream in object mode.
   *
   * @param {number} val The CBOR additional info to convert.
   * @param {boolean} [has_parent=true] Does the CBOR item have a parent?
   * @param {boolean} [parent_indefinite=false] Is the parent element
   *   indefinitely encoded?
   * @returns {(null|undefined|boolean|symbol|Simple)} The decoded value.
   * @throws {Error} Invalid BREAK.
   */
  static decode(val, has_parent = true, parent_indefinite = false) {
    switch (val) {
      case SIMPLE.FALSE:
        return false
      case SIMPLE.TRUE:
        return true
      case SIMPLE.NULL:
        if (has_parent) {
          return null
        }
        return SYMS.NULL
      case SIMPLE.UNDEFINED:
        if (has_parent) {
          return undefined
        }
        return SYMS.UNDEFINED
      case -1:
        if (!has_parent || !parent_indefinite) {
          throw new Error('Invalid BREAK')
        }
        return SYMS.BREAK
      default:
        return new Simple(val)
    }
  }
}

module.exports = Simple


/***/ }),

/***/ 141:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/

var Buffer = (__webpack_require__(861).Buffer);
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.I = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

/***/ }),

/***/ 157:
/***/ ((module) => {

module.exports = function () {
  throw new Error('Readable.from is not available in the browser')
};


/***/ }),

/***/ 207:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Encoder = __webpack_require__(274)
const ObjectRecorder = __webpack_require__(744)
const {Buffer} = __webpack_require__(287)

/**
 * Implement value sharing.
 *
 * @see {@link cbor.schmorp.de/value-sharing}
 */
class SharedValueEncoder extends Encoder {
  constructor(opts) {
    super(opts)
    this.valueSharing = new ObjectRecorder()
  }

  /**
   * @param {object} obj Object to encode.
   * @param {import('./encoder').ObjectOptions} [opts] Options for encoding
   *   this object.
   * @returns {boolean} True on success.
   * @throws {Error} Loop detected.
   * @ignore
   */
  _pushObject(obj, opts) {
    if (obj !== null) {
      const shared = this.valueSharing.check(obj)
      switch (shared) {
        case ObjectRecorder.FIRST:
          // Prefix with tag 28
          this._pushTag(28)
          break
        case ObjectRecorder.NEVER:
          // Do nothing
          break
        default:
          return this._pushTag(29) && this._pushIntNum(shared)
      }
    }
    return super._pushObject(obj, opts)
  }

  /**
   * Between encoding runs, stop recording, and start outputing correct tags.
   */
  stopRecording() {
    this.valueSharing.stop()
  }

  /**
   * Remove the existing recording and start over.  Do this between encoding
   * pairs.
   */
  clearRecording() {
    this.valueSharing.clear()
  }

  /**
   * Encode one or more JavaScript objects, and return a Buffer containing the
   * CBOR bytes.
   *
   * @param {...any} objs The objects to encode.
   * @returns {Buffer} The encoded objects.
   */
  static encode(...objs) {
    const enc = new SharedValueEncoder()
    // eslint-disable-next-line no-empty-function
    enc.on('data', () => {}) // Sink all writes

    for (const o of objs) {
      enc.pushAny(o)
    }
    enc.stopRecording()
    enc.removeAllListeners('data')
    return enc._encodeAll(objs)
  }

  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Encode one or more JavaScript objects canonically (slower!), and return
   * a Buffer containing the CBOR bytes.
   *
   * @param {...any} objs The objects to encode.
   * @returns {Buffer} Never.
   * @throws {Error} Always.  This combination doesn't work at the moment.
   */
  static encodeCanonical(...objs) {
    throw new Error('Cannot encode canonically in a SharedValueEncoder, which serializes objects multiple times.')
  }

  /**
   * Encode one JavaScript object using the given options.
   *
   * @param {any} obj The object to encode.
   * @param {import('./encoder').EncodingOptions} [options={}]
   *   Passed to the Encoder constructor.
   * @returns {Buffer} The encoded objects.
   * @static
   */
  static encodeOne(obj, options) {
    const enc = new SharedValueEncoder(options)
    // eslint-disable-next-line no-empty-function
    enc.on('data', () => {}) // Sink all writes
    enc.pushAny(obj)
    enc.stopRecording()
    enc.removeAllListeners('data')
    return enc._encodeAll([obj])
  }

  /**
   * Encode one JavaScript object using the given options in a way that
   * is more resilient to objects being larger than the highWaterMark
   * number of bytes.  As with the other static encode functions, this
   * will still use a large amount of memory.  Use a stream-based approach
   * directly if you need to process large and complicated inputs.
   *
   * @param {any} obj The object to encode.
   * @param {import('./encoder').EncodingOptions} [options={}]
   *   Passed to the Encoder constructor.
   * @returns {Promise<Buffer>} A promise for the encoded buffer.
   */
  static encodeAsync(obj, options) {
    return new Promise((resolve, reject) => {
      /** @type {Buffer[]} */
      const bufs = []
      const enc = new SharedValueEncoder(options)
      // eslint-disable-next-line no-empty-function
      enc.on('data', () => {})
      enc.on('error', reject)
      enc.on('finish', () => resolve(Buffer.concat(bufs)))
      enc.pushAny(obj)
      enc.stopRecording()
      enc.removeAllListeners('data')
      enc.on('data', buf => bufs.push(buf))
      enc.pushAny(obj)
      enc.end()
    })
  }
}

module.exports = SharedValueEncoder


/***/ }),

/***/ 238:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).



var ERR_STREAM_PREMATURE_CLOSE = (__webpack_require__(48)/* .codes */ .F).ERR_STREAM_PREMATURE_CLOSE;
function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    callback.apply(this, args);
  };
}
function noop() {}
function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}
function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;
  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };
  var writableEnded = stream._writableState && stream._writableState.finished;
  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };
  var readableEnded = stream._readableState && stream._readableState.endEmitted;
  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };
  var onerror = function onerror(err) {
    callback.call(stream, err);
  };
  var onclose = function onclose() {
    var err;
    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };
  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };
  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }
  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}
module.exports = eos;

/***/ }),

/***/ 251:
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 256:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const stream = __webpack_require__(310)
const {Buffer} = __webpack_require__(287)
const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true})

/**
 * @typedef {object} NoFilterOptions
 * @property {string|Buffer} [input=null] Input source data.
 * @property {BufferEncoding} [inputEncoding=null] Encoding name for input,
 *   ignored if input is not a String.
 * @property {number} [highWaterMark=16384] The maximum number of bytes to
 *   store in the internal buffer before ceasing to read from the underlying
 *   resource. Default=16kb, or 16 for objectMode streams.
 * @property {BufferEncoding} [encoding=null] If specified, then buffers
 *   will be decoded to strings using the specified encoding.
 * @property {boolean} [objectMode=false] Whether this stream should behave
 *   as a stream of objects. Meaning that stream.read(n) returns a single
 *   value instead of a Buffer of size n.
 * @property {boolean} [decodeStrings=true] Whether or not to decode
 *   strings into Buffers before passing them to _write().
 * @property {boolean} [watchPipe=true] Whether to watch for 'pipe' events,
 *   setting this stream's objectMode based on the objectMode of the input
 *   stream.
 * @property {boolean} [readError=false] If true, when a read() underflows,
 *   throw an error.
 * @property {boolean} [allowHalfOpen=true] If set to false, then the
 *   stream will automatically end the writable side when the readable side
 *   ends.
 * @property {boolean} [autoDestroy=true] Whether this stream should
 *   automatically call .destroy() on itself after ending.
 * @property {BufferEncoding} [defaultEncoding='utf8'] The default encoding
 *   that is used when no encoding is specified as an argument to
 *   stream.write().
 * @property {boolean} [emitClose=true] Whether or not the stream should
 *   emit 'close' after it has been destroyed.
 * @property {number} [readableHighWaterMark] Sets highWaterMark for the
 *   readable side of the stream. Has no effect if highWaterMark is provided.
 * @property {boolean} [readableObjectMode=false] Sets objectMode for
 *   readable side of the stream. Has no effect if objectMode is true.
 * @property {number} [writableHighWaterMark] Sets highWaterMark for the
 *   writable side of the stream. Has no effect if highWaterMark is provided.
 * @property {boolean} [writableObjectMode=false] Sets objectMode for
 *   writable side of the stream. Has no effect if objectMode is true.
 */

/**
 * NoFilter stream.  Can be used to sink or source data to and from
 * other node streams.  Implemented as the "identity" Transform stream
 * (hence the name), but allows for inspecting data that is in-flight.
 *
 * Allows passing in source data (input, inputEncoding) at creation
 * time.  Source data can also be passed in the options object.
 *
 * @example <caption>source and sink</caption>
 * const source = new NoFilter('Zm9v', 'base64')
 * source.pipe(process.stdout)
 * const sink = new Nofilter()
 * // NOTE: 'finish' fires when the input is done writing
 * sink.on('finish', () => console.log(n.toString('base64')))
 * process.stdin.pipe(sink)
 */
class NoFilter extends stream.Transform {
  /**
   * Create an instance of NoFilter.
   *
   * @param {string|Buffer|BufferEncoding|NoFilterOptions} [input] Source data.
   * @param {BufferEncoding|NoFilterOptions} [inputEncoding] Encoding
   *   name for input, ignored if input is not a String.
   * @param {NoFilterOptions} [options] Other options.
   */
  constructor(input, inputEncoding, options = {}) {
    let inp = null
    let inpE = /** @type {BufferEncoding?} */ (null)
    switch (typeof input) {
      case 'object':
        if (Buffer.isBuffer(input)) {
          inp = input
        } else if (input) {
          options = input
        }
        break
      case 'string':
        inp = input
        break
      case 'undefined':
        break
      default:
        throw new TypeError('Invalid input')
    }
    switch (typeof inputEncoding) {
      case 'object':
        if (inputEncoding) {
          options = inputEncoding
        }
        break
      case 'string':
        inpE = /** @type {BufferEncoding} */ (inputEncoding)
        break
      case 'undefined':
        break
      default:
        throw new TypeError('Invalid inputEncoding')
    }
    if (!options || typeof options !== 'object') {
      throw new TypeError('Invalid options')
    }
    if (inp == null) {
      inp = options.input
    }
    if (inpE == null) {
      inpE = options.inputEncoding
    }
    delete options.input
    delete options.inputEncoding
    const watchPipe = options.watchPipe == null ? true : options.watchPipe
    delete options.watchPipe
    const readError = Boolean(options.readError)
    delete options.readError
    super(options)

    this.readError = readError

    if (watchPipe) {
      this.on('pipe', readable => {
        // @ts-ignore: TS2339 (using internal interface)
        const om = readable._readableState.objectMode
        // @ts-ignore: TS2339 (using internal interface)
        if ((this.length > 0) && (om !== this._readableState.objectMode)) {
          throw new Error(
            'Do not switch objectMode in the middle of the stream'
          )
        }

        // @ts-ignore: TS2339 (using internal interface)
        this._readableState.objectMode = om
        // @ts-ignore: TS2339 (using internal interface)
        this._writableState.objectMode = om
      })
    }

    if (inp != null) {
      this.end(inp, inpE)
    }
  }

  /**
   * Is the given object a {NoFilter}?
   *
   * @param {object} obj The object to test.
   * @returns {boolean} True if obj is a NoFilter.
   */
  static isNoFilter(obj) {
    return obj instanceof this
  }

  /**
   * The same as nf1.compare(nf2). Useful for sorting an Array of NoFilters.
   *
   * @param {NoFilter} nf1 The first object to compare.
   * @param {NoFilter} nf2 The second object to compare.
   * @returns {number} -1, 0, 1 for less, equal, greater.
   * @throws {TypeError} Arguments not NoFilter instances.
   * @example
   * const arr = [new NoFilter('1234'), new NoFilter('0123')]
   * arr.sort(NoFilter.compare)
   */
  static compare(nf1, nf2) {
    if (!(nf1 instanceof this)) {
      throw new TypeError('Arguments must be NoFilters')
    }
    if (nf1 === nf2) {
      return 0
    }
    return nf1.compare(nf2)
  }

  /**
   * Returns a buffer which is the result of concatenating all the
   * NoFilters in the list together. If the list has no items, or if
   * the totalLength is 0, then it returns a zero-length buffer.
   *
   * If length is not provided, it is read from the buffers in the
   * list. However, this adds an additional loop to the function, so
   * it is faster to provide the length explicitly if you already know it.
   *
   * @param {Array<NoFilter>} list Inputs.  Must not be all either in object
   *   mode, or all not in object mode.
   * @param {number} [length=null] Number of bytes or objects to read.
   * @returns {Buffer|Array} The concatenated values as an array if in object
   *   mode, otherwise a Buffer.
   * @throws {TypeError} List not array of NoFilters.
   */
  static concat(list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('list argument must be an Array of NoFilters')
    }
    if ((list.length === 0) || (length === 0)) {
      return Buffer.alloc(0)
    }
    if ((length == null)) {
      length = list.reduce((tot, nf) => {
        if (!(nf instanceof NoFilter)) {
          throw new TypeError('list argument must be an Array of NoFilters')
        }
        return tot + nf.length
      }, 0)
    }
    let allBufs = true
    let allObjs = true
    const bufs = list.map(nf => {
      if (!(nf instanceof NoFilter)) {
        throw new TypeError('list argument must be an Array of NoFilters')
      }
      const buf = nf.slice()
      if (Buffer.isBuffer(buf)) {
        allObjs = false
      } else {
        allBufs = false
      }
      return buf
    })
    if (allBufs) {
      // @ts-ignore: TS2322, tsc can't see the type checking above
      return Buffer.concat(bufs, length)
    }
    if (allObjs) {
      return [].concat(...bufs).slice(0, length)
    }
    // TODO: maybe coalesce buffers, counting bytes, and flatten in arrays
    // counting objects?  I can't imagine why that would be useful.
    throw new Error('Concatenating mixed object and byte streams not supported')
  }

  /**
   * @ignore
   */
  _transform(chunk, encoding, callback) {
    // @ts-ignore: TS2339 (using internal interface)
    if (!this._readableState.objectMode && !Buffer.isBuffer(chunk)) {
      chunk = Buffer.from(chunk, encoding)
    }
    this.push(chunk)
    callback()
  }

  /**
   * @returns {Buffer[]} The current internal buffers.  They are layed out
   *   end to end.
   * @ignore
   */
  _bufArray() {
    // @ts-ignore: TS2339 (using internal interface)
    let bufs = this._readableState.buffer
    // HACK: replace with something else one day.  This is what I get for
    // relying on internals.
    if (!Array.isArray(bufs)) {
      let b = bufs.head
      bufs = []
      while (b != null) {
        bufs.push(b.data)
        b = b.next
      }
    }
    return bufs
  }

  /**
   * Pulls some data out of the internal buffer and returns it.
   * If there is no data available, then it will return null.
   *
   * If you pass in a size argument, then it will return that many bytes. If
   * size bytes are not available, then it will return null, unless we've
   * ended, in which case it will return the data remaining in the buffer.
   *
   * If you do not specify a size argument, then it will return all the data in
   * the internal buffer.
   *
   * @param {number} [size=null] Number of bytes to read.
   * @returns {string|Buffer|null} If no data or not enough data, null.  If
   *   decoding output a string, otherwise a Buffer.
   * @throws Error If readError is true and there was underflow.
   * @fires NoFilter#read When read from.
   */
  read(size) {
    const buf = super.read(size)
    if (buf != null) {
      /**
       * Read event. Fired whenever anything is read from the stream.
       *
       * @event NoFilter#read
       * @param {Buffer|string|object} buf What was read.
       */
      this.emit('read', buf)
      if (this.readError && (buf.length < size)) {
        throw new Error(`Read ${buf.length}, wanted ${size}`)
      }
    } else if (this.readError) {
      throw new Error(`No data available, wanted ${size}`)
    }
    return buf
  }

  /**
   * Read the full number of bytes asked for, no matter how long it takes.
   * Fail if an error occurs in the meantime, or if the stream finishes before
   * enough data is available.
   *
   * Note: This function won't work fully correctly if you are using
   * stream-browserify (for example, on the Web).
   *
   * @param {number} size The number of bytes to read.
   * @returns {Promise<string|Buffer>} A promise for the data read.
   */
  readFull(size) {
    let onReadable = null
    let onFinish = null
    let onError = null
    return new Promise((resolve, reject) => {
      if (this.length >= size) {
        resolve(this.read(size))
        return
      }

      // Added in Node 12.19.  This won't work with stream-browserify yet.
      // If it's needed, file a bug, and I'll do a work-around.
      if (this.writableFinished) {
        // Already finished writing, so no more coming.
        reject(new Error(`Stream finished before ${size} bytes were available`))
        return
      }

      onReadable = chunk => {
        if (this.length >= size) {
          resolve(this.read(size))
        }
      }
      onFinish = () => {
        reject(new Error(`Stream finished before ${size} bytes were available`))
      }
      onError = reject
      this.on('readable', onReadable)
      this.on('error', onError)
      this.on('finish', onFinish)
    }).finally(() => {
      if (onReadable) {
        this.removeListener('readable', onReadable)
        this.removeListener('error', onError)
        this.removeListener('finish', onFinish)
      }
    })
  }

  /**
   * Return a promise fulfilled with the full contents, after the 'finish'
   * event fires.  Errors on the stream cause the promise to be rejected.
   *
   * @param {Function} [cb=null] Finished/error callback used in *addition*
   *   to the promise.
   * @returns {Promise<Buffer|string>} Fulfilled when complete.
   */
  promise(cb) {
    let done = false
    return new Promise((resolve, reject) => {
      this.on('finish', () => {
        const data = this.read()
        if ((cb != null) && !done) {
          done = true
          cb(null, data)
        }
        resolve(data)
      })
      this.on('error', er => {
        if ((cb != null) && !done) {
          done = true
          cb(er)
        }
        reject(er)
      })
    })
  }

  /**
   * Returns a number indicating whether this comes before or after or is the
   * same as the other NoFilter in sort order.
   *
   * @param {NoFilter} other The other object to compare.
   * @returns {number} -1, 0, 1 for less, equal, greater.
   * @throws {TypeError} Arguments must be NoFilters.
   */
  compare(other) {
    if (!(other instanceof NoFilter)) {
      throw new TypeError('Arguments must be NoFilters')
    }
    if (this === other) {
      return 0
    }

    const buf1 = this.slice()
    const buf2 = other.slice()
    // These will both be buffers because of the check above.
    if (Buffer.isBuffer(buf1) && Buffer.isBuffer(buf2)) {
      return buf1.compare(buf2)
    }
    throw new Error('Cannot compare streams in object mode')
  }

  /**
   * Do these NoFilter's contain the same bytes?  Doesn't work if either is
   * in object mode.
   *
   * @param {NoFilter} other Other NoFilter to compare against.
   * @returns {boolean} Equal?
   */
  equals(other) {
    return this.compare(other) === 0
  }

  /**
   * Read bytes or objects without consuming them.  Useful for diagnostics.
   * Note: as a side-effect, concatenates multiple writes together into what
   * looks like a single write, so that this concat doesn't have to happen
   * multiple times when you're futzing with the same NoFilter.
   *
   * @param {number} [start=0] Beginning offset.
   * @param {number} [end=length] Ending offset.
   * @returns {Buffer|Array} If in object mode, an array of objects.  Otherwise,
   *   concatenated array of contents.
   */
  slice(start, end) {
    // @ts-ignore: TS2339 (using internal interface)
    if (this._readableState.objectMode) {
      return this._bufArray().slice(start, end)
    }
    const bufs = this._bufArray()
    switch (bufs.length) {
      case 0: return Buffer.alloc(0)
      case 1: return bufs[0].slice(start, end)
      default: {
        const b = Buffer.concat(bufs)
        // TODO: store the concatented bufs back
        // @_readableState.buffer = [b]
        return b.slice(start, end)
      }
    }
  }

  /**
   * Get a byte by offset.  I didn't want to get into metaprogramming
   * to give you the `NoFilter[0]` syntax.
   *
   * @param {number} index The byte to retrieve.
   * @returns {number} 0-255.
   */
  get(index) {
    return this.slice()[index]
  }

  /**
   * Return an object compatible with Buffer's toJSON implementation, so that
   * round-tripping will produce a Buffer.
   *
   * @returns {string|Array|{type: 'Buffer',data: number[]}} If in object mode,
   *   the objects.  Otherwise, JSON text.
   * @example <caption>output for 'foo', not in object mode</caption>
   * ({
   *   type: 'Buffer',
   *   data: [102, 111, 111],
   * })
   */
  toJSON() {
    const b = this.slice()
    if (Buffer.isBuffer(b)) {
      return b.toJSON()
    }
    return b
  }

  /**
   * Decodes and returns a string from buffer data encoded using the specified
   * character set encoding. If encoding is undefined or null, then encoding
   * defaults to 'utf8'. The start and end parameters default to 0 and
   * NoFilter.length when undefined.
   *
   * @param {BufferEncoding} [encoding='utf8'] Which to use for decoding?
   * @param {number} [start=0] Start offset.
   * @param {number} [end=length] End offset.
   * @returns {string} String version of the contents.
   */
  toString(encoding, start, end) {
    const buf = this.slice(start, end)
    if (!Buffer.isBuffer(buf)) {
      return JSON.stringify(buf)
    }
    if (!encoding || (encoding === 'utf8')) {
      return td.decode(buf)
    }
    return buf.toString(encoding)
  }

  /**
   * @ignore
   */
  [Symbol.for('nodejs.util.inspect.custom')](depth, options) {
    const bufs = this._bufArray()
    const hex = bufs.map(b => {
      if (Buffer.isBuffer(b)) {
        return options.stylize(b.toString('hex'), 'string')
      }
      return JSON.stringify(b)
    }).join(', ')
    return `${this.constructor.name} [${hex}]`
  }

  /**
   * Current readable length, in bytes.
   *
   * @returns {number} Length of the contents.
   */
  get length() {
    // @ts-ignore: TS2339 (using internal interface)
    return this._readableState.length
  }

  /**
   * Write a JavaScript BigInt to the stream.  Negative numbers will be
   * written as their 2's complement version.
   *
   * @param {bigint} val The value to write.
   * @returns {boolean} True on success.
   */
  writeBigInt(val) {
    let str = val.toString(16)
    if (val < 0) {
      // Two's complement
      // Note: str always starts with '-' here.
      const sz = BigInt(Math.floor(str.length / 2))
      const mask = BigInt(1) << (sz * BigInt(8))
      val = mask + val
      str = val.toString(16)
    }
    if (str.length % 2) {
      str = `0${str}`
    }
    return this.push(Buffer.from(str, 'hex'))
  }

  /**
   * Read a variable-sized JavaScript unsigned BigInt from the stream.
   *
   * @param {number} [len=null] Number of bytes to read or all remaining
   *   if null.
   * @returns {bigint} A BigInt.
   */
  readUBigInt(len) {
    const b = this.read(len)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return BigInt(`0x${b.toString('hex')}`)
  }

  /**
   * Read a variable-sized JavaScript signed BigInt from the stream in 2's
   * complement format.
   *
   * @param {number} [len=null] Number of bytes to read or all remaining
   *   if null.
   * @returns {bigint} A BigInt.
   */
  readBigInt(len) {
    const b = this.read(len)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    let ret = BigInt(`0x${b.toString('hex')}`)
    // Negative?
    if (b[0] & 0x80) {
      // Two's complement
      const mask = BigInt(1) << (BigInt(b.length) * BigInt(8))
      ret -= mask
    }
    return ret
  }

  /**
   * Write an 8-bit unsigned integer to the stream.  Adds 1 byte.
   *
   * @param {number} value 0..255.
   * @returns {boolean} True on success.
   */
  writeUInt8(value) {
    const b = Buffer.from([value])
    return this.push(b)
  }

  /**
   * Write a little-endian 16-bit unsigned integer to the stream.  Adds
   * 2 bytes.
   *
   * @param {number} value 0..65535.
   * @returns {boolean} True on success.
   */
  writeUInt16LE(value) {
    const b = Buffer.alloc(2)
    b.writeUInt16LE(value)
    return this.push(b)
  }

  /**
   * Write a big-endian 16-bit unsigned integer to the stream.  Adds
   * 2 bytes.
   *
   * @param {number} value 0..65535.
   * @returns {boolean} True on success.
   */
  writeUInt16BE(value) {
    const b = Buffer.alloc(2)
    b.writeUInt16BE(value)
    return this.push(b)
  }

  /**
   * Write a little-endian 32-bit unsigned integer to the stream.  Adds
   * 4 bytes.
   *
   * @param {number} value 0..2**32-1.
   * @returns {boolean} True on success.
   */
  writeUInt32LE(value) {
    const b = Buffer.alloc(4)
    b.writeUInt32LE(value)
    return this.push(b)
  }

  /**
   * Write a big-endian 32-bit unsigned integer to the stream.  Adds
   * 4 bytes.
   *
   * @param {number} value 0..2**32-1.
   * @returns {boolean} True on success.
   */
  writeUInt32BE(value) {
    const b = Buffer.alloc(4)
    b.writeUInt32BE(value)
    return this.push(b)
  }

  /**
   * Write a signed 8-bit integer to the stream.  Adds 1 byte.
   *
   * @param {number} value (-128)..127.
   * @returns {boolean} True on success.
   */
  writeInt8(value) {
    const b = Buffer.from([value])
    return this.push(b)
  }

  /**
   * Write a signed little-endian 16-bit integer to the stream.  Adds 2 bytes.
   *
   * @param {number} value (-32768)..32767.
   * @returns {boolean} True on success.
   */
  writeInt16LE(value) {
    const b = Buffer.alloc(2)
    b.writeUInt16LE(value)
    return this.push(b)
  }

  /**
   * Write a signed big-endian 16-bit integer to the stream.  Adds 2 bytes.
   *
   * @param {number} value (-32768)..32767.
   * @returns {boolean} True on success.
   */
  writeInt16BE(value) {
    const b = Buffer.alloc(2)
    b.writeUInt16BE(value)
    return this.push(b)
  }

  /**
   * Write a signed little-endian 32-bit integer to the stream.  Adds 4 bytes.
   *
   * @param {number} value (-2**31)..(2**31-1).
   * @returns {boolean} True on success.
   */
  writeInt32LE(value) {
    const b = Buffer.alloc(4)
    b.writeUInt32LE(value)
    return this.push(b)
  }

  /**
   * Write a signed big-endian 32-bit integer to the stream.  Adds 4 bytes.
   *
   * @param {number} value (-2**31)..(2**31-1).
   * @returns {boolean} True on success.
   */
  writeInt32BE(value) {
    const b = Buffer.alloc(4)
    b.writeUInt32BE(value)
    return this.push(b)
  }

  /**
   * Write a little-endian 32-bit float to the stream.  Adds 4 bytes.
   *
   * @param {number} value 32-bit float.
   * @returns {boolean} True on success.
   */
  writeFloatLE(value) {
    const b = Buffer.alloc(4)
    b.writeFloatLE(value)
    return this.push(b)
  }

  /**
   * Write a big-endian 32-bit float to the stream.  Adds 4 bytes.
   *
   * @param {number} value 32-bit float.
   * @returns {boolean} True on success.
   */
  writeFloatBE(value) {
    const b = Buffer.alloc(4)
    b.writeFloatBE(value)
    return this.push(b)
  }

  /**
   * Write a little-endian 64-bit double to the stream.  Adds 8 bytes.
   *
   * @param {number} value 64-bit float.
   * @returns {boolean} True on success.
   */
  writeDoubleLE(value) {
    const b = Buffer.alloc(8)
    b.writeDoubleLE(value)
    return this.push(b)
  }

  /**
   * Write a big-endian 64-bit float to the stream.  Adds 8 bytes.
   *
   * @param {number} value 64-bit float.
   * @returns {boolean} True on success.
   */
  writeDoubleBE(value) {
    const b = Buffer.alloc(8)
    b.writeDoubleBE(value)
    return this.push(b)
  }

  /**
   * Write a signed little-endian 64-bit BigInt to the stream.  Adds 8 bytes.
   *
   * @param {bigint} value BigInt.
   * @returns {boolean} True on success.
   */
  writeBigInt64LE(value) {
    const b = Buffer.alloc(8)
    b.writeBigInt64LE(value)
    return this.push(b)
  }

  /**
   * Write a signed big-endian 64-bit BigInt to the stream.  Adds 8 bytes.
   *
   * @param {bigint} value BigInt.
   * @returns {boolean} True on success.
   */
  writeBigInt64BE(value) {
    const b = Buffer.alloc(8)
    b.writeBigInt64BE(value)
    return this.push(b)
  }

  /**
   * Write an unsigned little-endian 64-bit BigInt to the stream.  Adds 8 bytes.
   *
   * @param {bigint} value Non-negative BigInt.
   * @returns {boolean} True on success.
   */
  writeBigUInt64LE(value) {
    const b = Buffer.alloc(8)
    b.writeBigUInt64LE(value)
    return this.push(b)
  }

  /**
   * Write an unsigned big-endian 64-bit BigInt to the stream.  Adds 8 bytes.
   *
   * @param {bigint} value Non-negative BigInt.
   * @returns {boolean} True on success.
   */
  writeBigUInt64BE(value) {
    const b = Buffer.alloc(8)
    b.writeBigUInt64BE(value)
    return this.push(b)
  }

  /**
   * Read an unsigned 8-bit integer from the stream.  Consumes 1 byte.
   *
   * @returns {number} Value read.
   */
  readUInt8() {
    const b = this.read(1)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readUInt8()
  }

  /**
   * Read a little-endian unsigned 16-bit integer from the stream.
   * Consumes 2 bytes.
   *
   * @returns {number} Value read.
   */
  readUInt16LE() {
    const b = this.read(2)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readUInt16LE()
  }

  /**
   * Read a little-endian unsigned 16-bit integer from the stream.
   * Consumes 2 bytes.
   *
   * @returns {number} Value read.
   */
  readUInt16BE() {
    const b = this.read(2)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readUInt16BE()
  }

  /**
   * Read a little-endian unsigned 32-bit integer from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readUInt32LE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readUInt32LE()
  }

  /**
   * Read a little-endian unsigned 16-bit integer from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readUInt32BE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readUInt32BE()
  }

  /**
   * Read a signed 8-bit integer from the stream.  Consumes 1 byte.
   *
   * @returns {number} Value read.
   */
  readInt8() {
    const b = this.read(1)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readInt8()
  }

  /**
   * Read a little-endian signed 16-bit integer from the stream.
   * Consumes 2 bytes.
   *
   * @returns {number} Value read.
   */
  readInt16LE() {
    const b = this.read(2)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readInt16LE()
  }

  /**
   * Read a little-endian signed 16-bit integer from the stream.
   * Consumes 2 bytes.
   *
   * @returns {number} Value read.
   */
  readInt16BE() {
    const b = this.read(2)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readInt16BE()
  }

  /**
   * Read a little-endian signed 32-bit integer from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readInt32LE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readInt32LE()
  }

  /**
   * Read a little-endian signed 16-bit integer from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readInt32BE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readInt32BE()
  }

  /**
   * Read a 32-bit little-endian float from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readFloatLE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readFloatLE()
  }

  /**
   * Read a 32-bit big-endian float from the stream.
   * Consumes 4 bytes.
   *
   * @returns {number} Value read.
   */
  readFloatBE() {
    const b = this.read(4)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readFloatBE()
  }

  /**
   * Read a 64-bit little-endian float from the stream.
   * Consumes 8 bytes.
   *
   * @returns {number} Value read.
   */
  readDoubleLE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readDoubleLE()
  }

  /**
   * Read a 64-bit big-endian float from the stream.
   * Consumes 8 bytes.
   *
   * @returns {number} Value read.
   */
  readDoubleBE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readDoubleBE()
  }

  /**
   * Read a signed 64-bit little-endian BigInt from the stream.
   * Consumes 8 bytes.
   *
   * @returns {bigint} Value read.
   */
  readBigInt64LE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readBigInt64LE()
  }

  /**
   * Read a signed 64-bit big-endian BigInt from the stream.
   * Consumes 8 bytes.
   *
   * @returns {bigint} Value read.
   */
  readBigInt64BE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readBigInt64BE()
  }

  /**
   * Read an unsigned 64-bit little-endian BigInt from the stream.
   * Consumes 8 bytes.
   *
   * @returns {bigint} Value read.
   */
  readBigUInt64LE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readBigUInt64LE()
  }

  /**
   * Read an unsigned 64-bit big-endian BigInt from the stream.
   * Consumes 8 bytes.
   *
   * @returns {bigint} Value read.
   */
  readBigUInt64BE() {
    const b = this.read(8)
    if (!Buffer.isBuffer(b)) {
      return null
    }
    return b.readBigUInt64BE()
  }
}

module.exports = NoFilter


/***/ }),

/***/ 274:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const stream = __webpack_require__(310)
const NoFilter = __webpack_require__(256)
const utils = __webpack_require__(328)
const constants = __webpack_require__(452)
const {
  MT, NUMBYTES, SHIFT32, SIMPLE, SYMS, TAG, BI,
} = constants
const {Buffer} = __webpack_require__(287)

const HALF = (MT.SIMPLE_FLOAT << 5) | NUMBYTES.TWO
const FLOAT = (MT.SIMPLE_FLOAT << 5) | NUMBYTES.FOUR
const DOUBLE = (MT.SIMPLE_FLOAT << 5) | NUMBYTES.EIGHT
const TRUE = (MT.SIMPLE_FLOAT << 5) | SIMPLE.TRUE
const FALSE = (MT.SIMPLE_FLOAT << 5) | SIMPLE.FALSE
const UNDEFINED = (MT.SIMPLE_FLOAT << 5) | SIMPLE.UNDEFINED
const NULL = (MT.SIMPLE_FLOAT << 5) | SIMPLE.NULL

const BREAK = Buffer.from([0xff])
const BUF_NAN = Buffer.from('f97e00', 'hex')
const BUF_INF_NEG = Buffer.from('f9fc00', 'hex')
const BUF_INF_POS = Buffer.from('f97c00', 'hex')
const BUF_NEG_ZERO = Buffer.from('f98000', 'hex')

/**
 * Generate the CBOR for a value.  If you are using this, you'll either need
 * to call {@link Encoder.write} with a Buffer, or look into the internals of
 * Encoder to reuse existing non-documented behavior.
 *
 * @callback EncodeFunction
 * @param {Encoder} enc The encoder to use.
 * @param {any} val The value to encode.
 * @returns {boolean} True on success.
 */

/* eslint-disable jsdoc/check-types */
/**
 * A mapping from tag number to a tag decoding function.
 *
 * @typedef {Object.<string, EncodeFunction>} SemanticMap
 */
/* eslint-enable jsdoc/check-types */

/**
 * @type {SemanticMap}
 * @private
 */
const SEMANTIC_TYPES = {}

/**
 * @type {SemanticMap}
 * @private
 */
let current_SEMANTIC_TYPES = {}

/**
 * @param {string} str String to normalize.
 * @returns {"number"|"float"|"int"|"string"} Normalized.
 * @throws {TypeError} Invalid input.
 * @private
 */
function parseDateType(str) {
  if (!str) {
    return 'number'
  }
  switch (str.toLowerCase()) {
    case 'number':
      return 'number'
    case 'float':
      return 'float'
    case 'int':
    case 'integer':
      return 'int'
    case 'string':
      return 'string'
  }
  throw new TypeError(`dateType invalid, got "${str}"`)
}

/**
 * @typedef ObjectOptions
 * @property {boolean} [indefinite = false] Force indefinite encoding for this
 *   object.
 * @property {boolean} [skipTypes = false] Do not use available type mappings
 *   for this object, but encode it as a "normal" JS object would be.
 */

/**
 * @typedef EncodingOptions
 * @property {any[]|object} [genTypes=[]] Array of pairs of
 *   `type`, `function(Encoder)` for semantic types to be encoded.  Not
 *   needed for Array, Date, Buffer, Map, RegExp, Set, or URL.
 *   If an object, the keys are the constructor names for the types.
 * @property {boolean} [canonical=false] Should the output be
 *   canonicalized.
 * @property {boolean|WeakSet} [detectLoops=false] Should object loops
 *   be detected?  This will currently add memory to track every part of the
 *   object being encoded in a WeakSet.  Do not encode
 *   the same object twice on the same encoder, without calling
 *   `removeLoopDetectors` in between, which will clear the WeakSet.
 *   You may pass in your own WeakSet to be used; this is useful in some
 *   recursive scenarios.
 * @property {("number"|"float"|"int"|"string")} [dateType="number"] -
 *   how should dates be encoded?  "number" means float or int, if no
 *   fractional seconds.
 * @property {any} [encodeUndefined=undefined] How should an
 *   "undefined" in the input be encoded.  By default, just encode a CBOR
 *   undefined.  If this is a buffer, use those bytes without re-encoding
 *   them.  If this is a function, the function will be called (which is a
 *   good time to throw an exception, if that's what you want), and the
 *   return value will be used according to these rules.  Anything else will
 *   be encoded as CBOR.
 * @property {boolean} [disallowUndefinedKeys=false] Should
 *   "undefined" be disallowed as a key in a Map that is serialized?  If
 *   this is true, encode(new Map([[undefined, 1]])) will throw an
 *   exception.  Note that it is impossible to get a key of undefined in a
 *   normal JS object.
 * @property {boolean} [collapseBigIntegers=false] Should integers
 *   that come in as ECMAscript bigint's be encoded
 *   as normal CBOR integers if they fit, discarding type information?
 * @property {number} [chunkSize=4096] Number of characters or bytes
 *   for each chunk, if obj is a string or Buffer, when indefinite encoding.
 * @property {boolean} [omitUndefinedProperties=false] When encoding
 *   objects or Maps, do not include a key if its corresponding value is
 *   `undefined`.
 */

/**
 * Transform JavaScript values into CBOR bytes.  The `Writable` side of
 * the stream is in object mode.
 *
 * @extends stream.Transform
 */
class Encoder extends stream.Transform {
  /**
   * Creates an instance of Encoder.
   *
   * @param {EncodingOptions} [options={}] Options for the encoder.
   */
  constructor(options = {}) {
    const {
      canonical = false,
      encodeUndefined,
      disallowUndefinedKeys = false,
      dateType = 'number',
      collapseBigIntegers = false,
      detectLoops = false,
      omitUndefinedProperties = false,
      genTypes = [],
      ...superOpts
    } = options

    super({
      ...superOpts,
      readableObjectMode: false,
      writableObjectMode: true,
    })

    this.canonical = canonical
    this.encodeUndefined = encodeUndefined
    this.disallowUndefinedKeys = disallowUndefinedKeys
    this.dateType = parseDateType(dateType)
    this.collapseBigIntegers = this.canonical ? true : collapseBigIntegers

    /** @type {WeakSet?} */
    this.detectLoops = undefined
    if (typeof detectLoops === 'boolean') {
      if (detectLoops) {
        this.detectLoops = new WeakSet()
      }
    } else if (detectLoops instanceof WeakSet) {
      this.detectLoops = detectLoops
    } else {
      throw new TypeError('detectLoops must be boolean or WeakSet')
    }
    this.omitUndefinedProperties = omitUndefinedProperties

    this.semanticTypes = {...Encoder.SEMANTIC_TYPES}

    if (Array.isArray(genTypes)) {
      for (let i = 0, len = genTypes.length; i < len; i += 2) {
        this.addSemanticType(genTypes[i], genTypes[i + 1])
      }
    } else {
      for (const [k, v] of Object.entries(genTypes)) {
        this.addSemanticType(k, v)
      }
    }
  }

  /**
   * Transforming.
   *
   * @param {any} fresh Buffer to transcode.
   * @param {BufferEncoding} encoding Name of encoding.
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _transform(fresh, encoding, cb) {
    const ret = this.pushAny(fresh)
    // Old transformers might not return bool.  undefined !== false
    cb((ret === false) ? new Error('Push Error') : undefined)
  }

  /**
   * Flushing.
   *
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  // eslint-disable-next-line class-methods-use-this
  _flush(cb) {
    cb()
  }

  /**
   * @param {number} val Number(0-255) to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushUInt8(val) {
    const b = Buffer.allocUnsafe(1)
    b.writeUInt8(val, 0)
    return this.push(b)
  }

  /**
   * @param {number} val Number(0-65535) to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushUInt16BE(val) {
    const b = Buffer.allocUnsafe(2)
    b.writeUInt16BE(val, 0)
    return this.push(b)
  }

  /**
   * @param {number} val Number(0..2**32-1) to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushUInt32BE(val) {
    const b = Buffer.allocUnsafe(4)
    b.writeUInt32BE(val, 0)
    return this.push(b)
  }

  /**
   * @param {number} val Number to encode as 4-byte float.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushFloatBE(val) {
    const b = Buffer.allocUnsafe(4)
    b.writeFloatBE(val, 0)
    return this.push(b)
  }

  /**
   * @param {number} val Number to encode as 8-byte double.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushDoubleBE(val) {
    const b = Buffer.allocUnsafe(8)
    b.writeDoubleBE(val, 0)
    return this.push(b)
  }

  /**
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushNaN() {
    return this.push(BUF_NAN)
  }

  /**
   * @param {number} obj Positive or negative infinity.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushInfinity(obj) {
    const half = (obj < 0) ? BUF_INF_NEG : BUF_INF_POS
    return this.push(half)
  }

  /**
   * Choose the best float representation for a number and encode it.
   *
   * @param {number} obj A number that is known to be not-integer, but not
   *   how many bytes of precision it needs.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushFloat(obj) {
    if (this.canonical) {
      // TODO: is this enough slower to hide behind canonical?
      // It's certainly enough of a hack (see utils.parseHalf)

      // From section 3.9:
      // If a protocol allows for IEEE floats, then additional canonicalization
      // rules might need to be added.  One example rule might be to have all
      // floats start as a 64-bit float, then do a test conversion to a 32-bit
      // float; if the result is the same numeric value, use the shorter value
      // and repeat the process with a test conversion to a 16-bit float.  (This
      // rule selects 16-bit float for positive and negative Infinity as well.)

      // which seems pretty much backwards to me.
      const b2 = Buffer.allocUnsafe(2)
      if (utils.writeHalf(b2, obj)) {
        // I have convinced myself that there are no cases where writeHalf
        // will return true but `utils.parseHalf(b2) !== obj)`
        return this._pushUInt8(HALF) && this.push(b2)
      }
    }
    if (Math.fround(obj) === obj) {
      return this._pushUInt8(FLOAT) && this._pushFloatBE(obj)
    }

    return this._pushUInt8(DOUBLE) && this._pushDoubleBE(obj)
  }

  /**
   * Choose the best integer representation for a postive number and encode
   * it.  If the number is over MAX_SAFE_INTEGER, fall back on float (but I
   * don't remember why).
   *
   * @param {number} obj A positive number that is known to be an integer,
   *   but not how many bytes of precision it needs.
   * @param {number} mt The Major Type number to combine with the integer.
   *   Not yet shifted.
   * @param {number} [orig] The number before it was transformed to positive.
   *   If the mt is NEG_INT, and the positive number is over MAX_SAFE_INT,
   *   then we'll encode this as a float rather than making the number
   *   negative again and losing precision.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushInt(obj, mt, orig) {
    const m = mt << 5

    if (obj < 24) {
      return this._pushUInt8(m | obj)
    }
    if (obj <= 0xff) {
      return this._pushUInt8(m | NUMBYTES.ONE) && this._pushUInt8(obj)
    }
    if (obj <= 0xffff) {
      return this._pushUInt8(m | NUMBYTES.TWO) && this._pushUInt16BE(obj)
    }
    if (obj <= 0xffffffff) {
      return this._pushUInt8(m | NUMBYTES.FOUR) && this._pushUInt32BE(obj)
    }
    let max = Number.MAX_SAFE_INTEGER
    if (mt === MT.NEG_INT) {
      // Special case for Number.MIN_SAFE_INTEGER - 1
      max--
    }
    if (obj <= max) {
      return this._pushUInt8(m | NUMBYTES.EIGHT) &&
        this._pushUInt32BE(Math.floor(obj / SHIFT32)) &&
        this._pushUInt32BE(obj % SHIFT32)
    }
    if (mt === MT.NEG_INT) {
      return this._pushFloat(orig)
    }
    return this._pushFloat(obj)
  }

  /**
   * Choose the best integer representation for a number and encode it.
   *
   * @param {number} obj A number that is known to be an integer,
   *   but not how many bytes of precision it needs.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushIntNum(obj) {
    if (Object.is(obj, -0)) {
      return this.push(BUF_NEG_ZERO)
    }

    if (obj < 0) {
      return this._pushInt(-obj - 1, MT.NEG_INT, obj)
    }
    return this._pushInt(obj, MT.POS_INT)
  }

  /**
   * @param {number} obj Plain JS number to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushNumber(obj) {
    if (isNaN(obj)) {
      return this._pushNaN()
    }
    if (!isFinite(obj)) {
      return this._pushInfinity(obj)
    }
    if (Math.round(obj) === obj) {
      return this._pushIntNum(obj)
    }
    return this._pushFloat(obj)
  }

  /**
   * @param {string} obj String to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushString(obj) {
    const len = Buffer.byteLength(obj, 'utf8')
    return this._pushInt(len, MT.UTF8_STRING) && this.push(obj, 'utf8')
  }

  /**
   * @param {boolean} obj Bool to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushBoolean(obj) {
    return this._pushUInt8(obj ? TRUE : FALSE)
  }

  /**
   * @param {undefined} obj Ignored.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushUndefined(obj) {
    switch (typeof this.encodeUndefined) {
      case 'undefined':
        return this._pushUInt8(UNDEFINED)
      case 'function':
        return this.pushAny(this.encodeUndefined(obj))
      case 'object': {
        const buf = utils.bufferishToBuffer(this.encodeUndefined)
        if (buf) {
          return this.push(buf)
        }
      }
    }
    return this.pushAny(this.encodeUndefined)
  }

  /**
   * @param {null} obj Ignored.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushNull(obj) {
    return this._pushUInt8(NULL)
  }

  /**
   * @param {number} tag Tag number to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushTag(tag) {
    return this._pushInt(tag, MT.TAG)
  }

  /**
   * @param {bigint} obj BigInt to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  _pushJSBigint(obj) {
    let m = MT.POS_INT
    let tag = TAG.POS_BIGINT
    // BigInt doesn't have -0
    if (obj < 0) {
      obj = -obj + BI.MINUS_ONE
      m = MT.NEG_INT
      tag = TAG.NEG_BIGINT
    }

    if (this.collapseBigIntegers &&
        (obj <= BI.MAXINT64)) {
      // Special handiling for 64bits
      if (obj <= 0xffffffff) {
        return this._pushInt(Number(obj), m)
      }
      return this._pushUInt8((m << 5) | NUMBYTES.EIGHT) &&
        this._pushUInt32BE(Number(obj / BI.SHIFT32)) &&
        this._pushUInt32BE(Number(obj % BI.SHIFT32))
    }

    let str = obj.toString(16)
    if (str.length % 2) {
      str = `0${str}`
    }
    const buf = Buffer.from(str, 'hex')
    return this._pushTag(tag) && Encoder._pushBuffer(this, buf)
  }

  /**
   * @param {object} obj Object to encode.
   * @param {ObjectOptions} [opts] Options for encoding this object.
   * @returns {boolean} True on success.
   * @throws {Error} Loop detected.
   * @ignore
   */
  _pushObject(obj, opts) {
    if (!obj) {
      return this._pushNull(obj)
    }
    opts = {
      indefinite: false,
      skipTypes: false,
      ...opts,
    }
    if (!opts.indefinite) {
      // This will only happen the first time through for indefinite encoding
      if (this.detectLoops) {
        if (this.detectLoops.has(obj)) {
          throw new Error(`\
Loop detected while CBOR encoding.
Call removeLoopDetectors before resuming.`)
        } else {
          this.detectLoops.add(obj)
        }
      }
    }
    if (!opts.skipTypes) {
      const f = obj.encodeCBOR
      if (typeof f === 'function') {
        return f.call(obj, this)
      }
      const converter = this.semanticTypes[obj.constructor.name]
      if (converter) {
        return converter.call(obj, this, obj)
      }
    }
    const keys = Object.keys(obj).filter(k => {
      const tv = typeof obj[k]
      return (tv !== 'function') &&
        (!this.omitUndefinedProperties || (tv !== 'undefined'))
    })
    const cbor_keys = {}
    if (this.canonical) {
      // Note: this can't be a normal sort, because 'b' needs to sort before
      // 'aa'
      keys.sort((a, b) => {
        // Always strings, so don't bother to pass options.
        // hold on to the cbor versions, since there's no need
        // to encode more than once
        const a_cbor = cbor_keys[a] || (cbor_keys[a] = Encoder.encode(a))
        const b_cbor = cbor_keys[b] || (cbor_keys[b] = Encoder.encode(b))

        return a_cbor.compare(b_cbor)
      })
    }
    if (opts.indefinite) {
      if (!this._pushUInt8((MT.MAP << 5) | NUMBYTES.INDEFINITE)) {
        return false
      }
    } else if (!this._pushInt(keys.length, MT.MAP)) {
      return false
    }
    let ck = null
    for (let j = 0, len2 = keys.length; j < len2; j++) {
      const k = keys[j]
      if (this.canonical && ((ck = cbor_keys[k]))) {
        if (!this.push(ck)) { // Already a Buffer
          return false
        }
      } else if (!this._pushString(k)) {
        return false
      }
      if (!this.pushAny(obj[k])) {
        return false
      }
    }
    if (opts.indefinite) {
      if (!this.push(BREAK)) {
        return false
      }
    } else if (this.detectLoops) {
      this.detectLoops.delete(obj)
    }
    return true
  }

  /**
   * @param {any[]} objs Array of supported things.
   * @returns {Buffer} Concatenation of encodings for the supported things.
   * @ignore
   */
  _encodeAll(objs) {
    const bs = new NoFilter({highWaterMark: this.readableHighWaterMark})
    this.pipe(bs)
    for (const o of objs) {
      this.pushAny(o)
    }
    this.end()
    return bs.read()
  }

  /**
   * Add an encoding function to the list of supported semantic types.  This
   * is useful for objects for which you can't add an encodeCBOR method.
   *
   * @param {string|Function} type The type to encode.
   * @param {EncodeFunction} fun The encoder to use.
   * @returns {EncodeFunction?} The previous encoder or undefined if there
   *   wasn't one.
   * @throws {TypeError} Invalid function.
   */
  addSemanticType(type, fun) {
    const typeName = (typeof type === 'string') ? type : type.name
    const old = this.semanticTypes[typeName]

    if (fun) {
      if (typeof fun !== 'function') {
        throw new TypeError('fun must be of type function')
      }
      this.semanticTypes[typeName] = fun
    } else if (old) {
      delete this.semanticTypes[typeName]
    }
    return old
  }

  /**
   * Push any supported type onto the encoded stream.
   *
   * @param {any} obj The thing to encode.
   * @returns {boolean} True on success.
   * @throws {TypeError} Unknown type for obj.
   */
  pushAny(obj) {
    switch (typeof obj) {
      case 'number':
        return this._pushNumber(obj)
      case 'bigint':
        return this._pushJSBigint(obj)
      case 'string':
        return this._pushString(obj)
      case 'boolean':
        return this._pushBoolean(obj)
      case 'undefined':
        return this._pushUndefined(obj)
      case 'object':
        return this._pushObject(obj)
      case 'symbol':
        switch (obj) {
          case SYMS.NULL:
            return this._pushNull(null)
          case SYMS.UNDEFINED:
            return this._pushUndefined(undefined)
          // TODO: Add pluggable support for other symbols
          default:
            throw new TypeError(`Unknown symbol: ${obj.toString()}`)
        }
      default:
        throw new TypeError(
          `Unknown type: ${typeof obj}, ${(typeof obj.toString === 'function') ? obj.toString() : ''}`
        )
    }
  }

  /**
   * Encode an array and all of its elements.
   *
   * @param {Encoder} gen Encoder to use.
   * @param {any[]} obj Array to encode.
   * @param {object} [opts] Options.
   * @param {boolean} [opts.indefinite=false] Use indefinite encoding?
   * @returns {boolean} True on success.
   */
  static pushArray(gen, obj, opts) {
    opts = {
      indefinite: false,
      ...opts,
    }
    const len = obj.length
    if (opts.indefinite) {
      if (!gen._pushUInt8((MT.ARRAY << 5) | NUMBYTES.INDEFINITE)) {
        return false
      }
    } else if (!gen._pushInt(len, MT.ARRAY)) {
      return false
    }
    for (let j = 0; j < len; j++) {
      if (!gen.pushAny(obj[j])) {
        return false
      }
    }
    if (opts.indefinite) {
      if (!gen.push(BREAK)) {
        return false
      }
    }
    return true
  }

  /**
   * Remove the loop detector WeakSet for this Encoder.
   *
   * @returns {boolean} True when the Encoder was reset, else false.
   */
  removeLoopDetectors() {
    if (!this.detectLoops) {
      return false
    }
    this.detectLoops = new WeakSet()
    return true
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {Date} obj Date to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushDate(gen, obj) {
    switch (gen.dateType) {
      case 'string':
        return gen._pushTag(TAG.DATE_STRING) &&
          gen._pushString(obj.toISOString())
      case 'int':
        return gen._pushTag(TAG.DATE_EPOCH) &&
          gen._pushIntNum(Math.round(obj.getTime() / 1000))
      case 'float':
        // Force float
        return gen._pushTag(TAG.DATE_EPOCH) &&
          gen._pushFloat(obj.getTime() / 1000)
      case 'number':
      default:
        // If we happen to have an integral number of seconds,
        // use integer.  Otherwise, use float.
        return gen._pushTag(TAG.DATE_EPOCH) &&
          gen.pushAny(obj.getTime() / 1000)
    }
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {Buffer} obj Buffer to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushBuffer(gen, obj) {
    return gen._pushInt(obj.length, MT.BYTE_STRING) && gen.push(obj)
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {NoFilter} obj Buffer to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushNoFilter(gen, obj) {
    return Encoder._pushBuffer(gen, /** @type {Buffer} */ (obj.slice()))
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {RegExp} obj RegExp to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushRegexp(gen, obj) {
    return gen._pushTag(TAG.REGEXP) && gen.pushAny(obj.source)
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {Set} obj Set to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushSet(gen, obj) {
    if (!gen._pushTag(TAG.SET)) {
      return false
    }
    if (!gen._pushInt(obj.size, MT.ARRAY)) {
      return false
    }
    for (const x of obj) {
      if (!gen.pushAny(x)) {
        return false
      }
    }
    return true
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {URL} obj URL to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushURL(gen, obj) {
    return gen._pushTag(TAG.URI) && gen.pushAny(obj.toString())
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {object} obj Boxed String, Number, or Boolean object to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushBoxed(gen, obj) {
    return gen.pushAny(obj.valueOf())
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {Map} obj Map to encode.
   * @returns {boolean} True on success.
   * @throws {Error} Map key that is undefined.
   * @ignore
   */
  static _pushMap(gen, obj, opts) {
    opts = {
      indefinite: false,
      ...opts,
    }
    let entries = [...obj.entries()]
    if (gen.omitUndefinedProperties) {
      entries = entries.filter(([k, v]) => v !== undefined)
    }
    if (opts.indefinite) {
      if (!gen._pushUInt8((MT.MAP << 5) | NUMBYTES.INDEFINITE)) {
        return false
      }
    } else if (!gen._pushInt(entries.length, MT.MAP)) {
      return false
    }
    // Memoizing the cbor only helps in certain cases, and hurts in most
    // others.  Just avoid it.
    if (gen.canonical) {
      // Keep the key/value pairs together, so we don't have to do odd
      // gets with object keys later
      const enc = new Encoder({
        genTypes: gen.semanticTypes,
        canonical: gen.canonical,
        detectLoops: Boolean(gen.detectLoops), // Give enc its own loop detector
        dateType: gen.dateType,
        disallowUndefinedKeys: gen.disallowUndefinedKeys,
        collapseBigIntegers: gen.collapseBigIntegers,
      })
      const bs = new NoFilter({highWaterMark: gen.readableHighWaterMark})
      enc.pipe(bs)
      entries.sort(([a], [b]) => {
        // Both a and b are the keys
        enc.pushAny(a)
        const a_cbor = bs.read()
        enc.pushAny(b)
        const b_cbor = bs.read()
        return a_cbor.compare(b_cbor)
      })
      for (const [k, v] of entries) {
        if (gen.disallowUndefinedKeys && (typeof k === 'undefined')) {
          throw new Error('Invalid Map key: undefined')
        }
        if (!(gen.pushAny(k) && gen.pushAny(v))) {
          return false
        }
      }
    } else {
      for (const [k, v] of entries) {
        if (gen.disallowUndefinedKeys && (typeof k === 'undefined')) {
          throw new Error('Invalid Map key: undefined')
        }
        if (!(gen.pushAny(k) && gen.pushAny(v))) {
          return false
        }
      }
    }
    if (opts.indefinite) {
      if (!gen.push(BREAK)) {
        return false
      }
    }
    return true
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param {NodeJS.TypedArray} obj Array to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushTypedArray(gen, obj) {
    // See https://tools.ietf.org/html/rfc8746

    let typ = 0b01000000
    let sz = obj.BYTES_PER_ELEMENT
    const {name} = obj.constructor

    if (name.startsWith('Float')) {
      typ |= 0b00010000
      sz /= 2
    } else if (!name.includes('U')) {
      typ |= 0b00001000
    }
    if (name.includes('Clamped') || ((sz !== 1) && !utils.isBigEndian())) {
      typ |= 0b00000100
    }
    typ |= {
      1: 0b00,
      2: 0b01,
      4: 0b10,
      8: 0b11,
    }[sz]
    if (!gen._pushTag(typ)) {
      return false
    }
    return Encoder._pushBuffer(
      gen,
      Buffer.from(obj.buffer, obj.byteOffset, obj.byteLength)
    )
  }

  /**
   * @param {Encoder} gen Encoder.
   * @param { ArrayBuffer } obj Array to encode.
   * @returns {boolean} True on success.
   * @ignore
   */
  static _pushArrayBuffer(gen, obj) {
    return Encoder._pushBuffer(gen, Buffer.from(obj))
  }

  /**
   * Encode the given object with indefinite length.  There are apparently
   * some (IMO) broken implementations of poorly-specified protocols that
   * REQUIRE indefinite-encoding.  See the example for how to add this as an
   * `encodeCBOR` function to an object or class to get indefinite encoding.
   *
   * @param {Encoder} gen The encoder to use.
   * @param {string|Buffer|Array|Map|object} [obj] The object to encode.  If
   *   null, use "this" instead.
   * @param {EncodingOptions} [options={}] Options for encoding.
   * @returns {boolean} True on success.
   * @throws {Error} No object to encode or invalid indefinite encoding.
   * @example <caption>Force indefinite encoding:</caption>
   * const o = {
   *   a: true,
   *   encodeCBOR: cbor.Encoder.encodeIndefinite,
   * }
   * const m = []
   * m.encodeCBOR = cbor.Encoder.encodeIndefinite
   * cbor.encodeOne([o, m])
   */
  static encodeIndefinite(gen, obj, options = {}) {
    if (obj == null) {
      if (this == null) {
        throw new Error('No object to encode')
      }
      obj = this
    }

    // TODO: consider other options
    const {chunkSize = 4096} = options

    let ret = true
    const objType = typeof obj
    let buf = null
    if (objType === 'string') {
      // TODO: make sure not to split surrogate pairs at the edges of chunks,
      // since such half-surrogates cannot be legally encoded as UTF-8.
      ret = ret && gen._pushUInt8((MT.UTF8_STRING << 5) | NUMBYTES.INDEFINITE)
      let offset = 0
      while (offset < obj.length) {
        const endIndex = offset + chunkSize
        ret = ret && gen._pushString(obj.slice(offset, endIndex))
        offset = endIndex
      }
      ret = ret && gen.push(BREAK)
    } else if ((buf = utils.bufferishToBuffer(obj))) {
      ret = ret && gen._pushUInt8((MT.BYTE_STRING << 5) | NUMBYTES.INDEFINITE)
      let offset = 0
      while (offset < buf.length) {
        const endIndex = offset + chunkSize
        ret = ret && Encoder._pushBuffer(gen, buf.slice(offset, endIndex))
        offset = endIndex
      }
      ret = ret && gen.push(BREAK)
    } else if (Array.isArray(obj)) {
      ret = ret && Encoder.pushArray(gen, obj, {
        indefinite: true,
      })
    } else if (obj instanceof Map) {
      ret = ret && Encoder._pushMap(gen, obj, {
        indefinite: true,
      })
    } else {
      if (objType !== 'object') {
        throw new Error('Invalid indefinite encoding')
      }
      ret = ret && gen._pushObject(obj, {
        indefinite: true,
        skipTypes: true,
      })
    }
    return ret
  }

  /**
   * Encode one or more JavaScript objects, and return a Buffer containing the
   * CBOR bytes.
   *
   * @param {...any} objs The objects to encode.
   * @returns {Buffer} The encoded objects.
   */
  static encode(...objs) {
    return new Encoder()._encodeAll(objs)
  }

  /**
   * Encode one or more JavaScript objects canonically (slower!), and return
   * a Buffer containing the CBOR bytes.
   *
   * @param {...any} objs The objects to encode.
   * @returns {Buffer} The encoded objects.
   */
  static encodeCanonical(...objs) {
    return new Encoder({
      canonical: true,
    })._encodeAll(objs)
  }

  /**
   * Encode one JavaScript object using the given options.
   *
   * @param {any} obj The object to encode.
   * @param {EncodingOptions} [options={}] Passed to the Encoder constructor.
   * @returns {Buffer} The encoded objects.
   * @static
   */
  static encodeOne(obj, options) {
    return new Encoder(options)._encodeAll([obj])
  }

  /**
   * Encode one JavaScript object using the given options in a way that
   * is more resilient to objects being larger than the highWaterMark
   * number of bytes.  As with the other static encode functions, this
   * will still use a large amount of memory.  Use a stream-based approach
   * directly if you need to process large and complicated inputs.
   *
   * @param {any} obj The object to encode.
   * @param {EncodingOptions} [options={}] Passed to the Encoder constructor.
   * @returns {Promise<Buffer>} A promise for the encoded buffer.
   */
  static encodeAsync(obj, options) {
    return new Promise((resolve, reject) => {
      const bufs = []
      const enc = new Encoder(options)
      enc.on('data', buf => bufs.push(buf))
      enc.on('error', reject)
      enc.on('finish', () => resolve(Buffer.concat(bufs)))
      enc.pushAny(obj)
      enc.end()
    })
  }

  /**
   * The currently supported set of semantic types.  May be modified by plugins.
   *
   * @type {SemanticMap}
   */
  static get SEMANTIC_TYPES() {
    return current_SEMANTIC_TYPES
  }

  static set SEMANTIC_TYPES(val) {
    current_SEMANTIC_TYPES = val
  }

  /**
   * Reset the supported semantic types to the original set, before any
   * plugins modified the list.
   */
  static reset() {
    Encoder.SEMANTIC_TYPES = {...SEMANTIC_TYPES}
  }
}

Object.assign(SEMANTIC_TYPES, {
  Array: Encoder.pushArray,
  Date: Encoder._pushDate,
  Buffer: Encoder._pushBuffer,
  [Buffer.name]: Encoder._pushBuffer, // Might be mangled
  Map: Encoder._pushMap,
  NoFilter: Encoder._pushNoFilter,
  [NoFilter.name]: Encoder._pushNoFilter, // Mßight be mangled
  RegExp: Encoder._pushRegexp,
  Set: Encoder._pushSet,
  ArrayBuffer: Encoder._pushArrayBuffer,
  Uint8ClampedArray: Encoder._pushTypedArray,
  Uint8Array: Encoder._pushTypedArray,
  Uint16Array: Encoder._pushTypedArray,
  Uint32Array: Encoder._pushTypedArray,
  Int8Array: Encoder._pushTypedArray,
  Int16Array: Encoder._pushTypedArray,
  Int32Array: Encoder._pushTypedArray,
  Float32Array: Encoder._pushTypedArray,
  Float64Array: Encoder._pushTypedArray,
  URL: Encoder._pushURL,
  Boolean: Encoder._pushBoxed,
  Number: Encoder._pushBoxed,
  String: Encoder._pushBoxed,
})

// Safari needs to get better.
if (typeof BigUint64Array !== 'undefined') {
  SEMANTIC_TYPES[BigUint64Array.name] = Encoder._pushTypedArray
}
if (typeof BigInt64Array !== 'undefined') {
  SEMANTIC_TYPES[BigInt64Array.name] = Encoder._pushTypedArray
}

Encoder.reset()
module.exports = Encoder


/***/ }),

/***/ 287:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



const base64 = __webpack_require__(526)
const ieee754 = __webpack_require__(251)
const customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

const K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    const arr = new Uint8Array(1)
    const proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  const buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  const valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  const b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  const length = byteLength(string, encoding) | 0
  let buf = createBuffer(length)

  const actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  const length = array.length < 0 ? 0 : checked(array.length) | 0
  const buf = createBuffer(length)
  for (let i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    const copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  let buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    const len = checked(obj.length) | 0
    const buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  let x = a.length
  let y = b.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  let i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  const buffer = Buffer.allocUnsafe(length)
  let pos = 0
  for (i = 0; i < list.length; ++i) {
    let buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
        buf.copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  const len = string.length
  const mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  let loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  const i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  const len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  const len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  const len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  const length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  let str = ''
  const max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  let x = thisEnd - thisStart
  let y = end - start
  const len = Math.min(x, y)

  const thisCopy = this.slice(thisStart, thisEnd)
  const targetCopy = target.slice(start, end)

  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  let indexSize = 1
  let arrLength = arr.length
  let valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  let i
  if (dir) {
    let foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      let found = true
      for (let j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  const remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i
  for (i = 0; i < length; ++i) {
    const parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  const remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  const res = []

  let i = start
  while (i < end) {
    const firstByte = buf[i]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  const bytes = buf.slice(start, end)
  let res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (let i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  const len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  const newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  let val = this[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const lo = first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24

  const hi = this[++offset] +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    last * 2 ** 24

  return BigInt(lo) + (BigInt(hi) << BigInt(32))
})

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const hi = first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  const lo = this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last

  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
})

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let i = byteLength
  let mul = 1
  let val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = this[offset + 4] +
    this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 +
    (last << 24) // Overflow

  return (BigInt(val) << BigInt(32)) +
    BigInt(first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24)
})

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) +
    BigInt(this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
})

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let mul = 1
  let i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let i = byteLength - 1
  let mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function wrtBigUInt64LE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  return offset
}

function wrtBigUInt64BE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = 0
  let mul = 1
  let sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  const len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      const code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  let i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    const bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    const len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {}
function E (sym, getMessage, Base) {
  errors[sym] = class NodeError extends Base {
    constructor () {
      super()

      Object.defineProperty(this, 'message', {
        value: getMessage.apply(this, arguments),
        writable: true,
        configurable: true
      })

      // Add the error code to the name to include it in the stack trace.
      this.name = `${this.name} [${sym}]`
      // Access the stack to generate the error message including the error code
      // from the name.
      this.stack // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete this.name
    }

    get code () {
      return sym
    }

    set code (value) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }

    toString () {
      return `${this.name} [${sym}]: ${this.message}`
    }
  }
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
  function (name) {
    if (name) {
      return `${name} is outside of buffer bounds`
    }

    return 'Attempt to access memory outside buffer bounds'
  }, RangeError)
E('ERR_INVALID_ARG_TYPE',
  function (name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
  }, TypeError)
E('ERR_OUT_OF_RANGE',
  function (str, range, input) {
    let msg = `The value of "${str}" is out of range.`
    let received = input
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    }
    msg += ` It must be ${range}. Received ${received}`
    return msg
  }, RangeError)

function addNumericalSeparator (val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}

// CHECK FUNCTIONS
// ===============

function checkBounds (buf, offset, byteLength) {
  validateNumber(offset, 'offset')
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1))
  }
}

function checkIntBI (value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === 'bigint' ? 'n' : ''
    let range
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                `${(byteLength + 1) * 8 - 1}${n}`
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
  }
  checkBounds(buf, offset, byteLength)
}

function validateNumber (value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
}

function boundsError (value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type)
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
  }

  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
  }

  throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                    `>= ${type ? 1 : 0} and <= ${length}`,
                                    value)
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  let c, hi, lo
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  let i
  for (i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

// Return not function with Error if BigInt not supported
function defineBigIntMethod (fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
}

function BufferBigIntNotDefined () {
  throw new Error('BigInt not supported')
}


/***/ }),

/***/ 291:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var ERR_INVALID_OPT_VALUE = (__webpack_require__(48)/* .codes */ .F).ERR_INVALID_OPT_VALUE;
function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}
function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }
    return Math.floor(hwm);
  }

  // Default value
  return state.objectMode ? 16 : 16 * 1024;
}
module.exports = {
  getHighWaterMark: getHighWaterMark
};

/***/ }),

/***/ 310:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = (__webpack_require__(7).EventEmitter);
var inherits = __webpack_require__(698);

inherits(Stream, EE);
Stream.Readable = __webpack_require__(412);
Stream.Writable = __webpack_require__(708);
Stream.Duplex = __webpack_require__(382);
Stream.Transform = __webpack_require__(610);
Stream.PassThrough = __webpack_require__(600);
Stream.finished = __webpack_require__(238)
Stream.pipeline = __webpack_require__(758)

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};


/***/ }),

/***/ 328:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


const {Buffer} = __webpack_require__(287)
const NoFilter = __webpack_require__(256)
const stream = __webpack_require__(310)
const constants = __webpack_require__(452)
const {NUMBYTES, SHIFT32, BI, SYMS} = constants
const MAX_SAFE_HIGH = 0x1fffff

/**
 * Convert a UTF8-encoded Buffer to a JS string.  If possible, throw an error
 * on invalid UTF8.  Byte Order Marks are not looked at or stripped.
 *
 * @private
 */
const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true})
exports.utf8 = buf => td.decode(buf)
exports.utf8.checksUTF8 = true

function isReadable(s) {
  // Is this a readable stream?  In the webpack version, instanceof isn't
  // working correctly.
  if (s instanceof stream.Readable) {
    return true
  }
  return ['read', 'on', 'pipe'].every(f => typeof s[f] === 'function')
}

exports.isBufferish = function isBufferish(b) {
  return b &&
    (typeof b === 'object') &&
    ((Buffer.isBuffer(b)) ||
      (b instanceof Uint8Array) ||
      (b instanceof Uint8ClampedArray) ||
      (b instanceof ArrayBuffer) ||
      (b instanceof DataView))
}

exports.bufferishToBuffer = function bufferishToBuffer(b) {
  if (Buffer.isBuffer(b)) {
    return b
  } else if (ArrayBuffer.isView(b)) {
    return Buffer.from(b.buffer, b.byteOffset, b.byteLength)
  } else if (b instanceof ArrayBuffer) {
    return Buffer.from(b)
  }
  return null
}

exports.parseCBORint = function parseCBORint(ai, buf) {
  switch (ai) {
    case NUMBYTES.ONE:
      return buf.readUInt8(0)
    case NUMBYTES.TWO:
      return buf.readUInt16BE(0)
    case NUMBYTES.FOUR:
      return buf.readUInt32BE(0)
    case NUMBYTES.EIGHT: {
      const f = buf.readUInt32BE(0)
      const g = buf.readUInt32BE(4)
      if (f > MAX_SAFE_HIGH) {
        return (BigInt(f) * BI.SHIFT32) + BigInt(g)
      }
      return (f * SHIFT32) + g
    }
    default:
      throw new Error(`Invalid additional info for int: ${ai}`)
  }
}

exports.writeHalf = function writeHalf(buf, half) {
  // Assume 0, -0, NaN, Infinity, and -Infinity have already been caught

  // HACK: everyone settle in.  This isn't going to be pretty.
  // Translate cn-cbor's C code (from Carsten Borman):

  // uint32_t be32;
  // uint16_t be16, u16;
  // union {
  //   float f;
  //   uint32_t u;
  // } u32;
  // u32.f = float_val;

  const u32 = Buffer.allocUnsafe(4)
  u32.writeFloatBE(half, 0)
  const u = u32.readUInt32BE(0)

  // If ((u32.u & 0x1FFF) == 0) { /* worth trying half */

  // hildjj: If the lower 13 bits aren't 0,
  // we will lose precision in the conversion.
  // mant32 = 24bits, mant16 = 11bits, 24-11 = 13
  if ((u & 0x1FFF) !== 0) {
    return false
  }

  // Sign, exponent, mantissa
  //   int s16 = (u32.u >> 16) & 0x8000;
  //   int exp = (u32.u >> 23) & 0xff;
  //   int mant = u32.u & 0x7fffff;

  let s16 = (u >> 16) & 0x8000 // Top bit is sign
  const exp = (u >> 23) & 0xff // Then 5 bits of exponent
  const mant = u & 0x7fffff

  // Hildjj: zeros already handled.  Assert if you don't believe me.
  //   if (exp == 0 && mant == 0)
  //     ;              /* 0.0, -0.0 */

  //   else if (exp >= 113 && exp <= 142) /* normalized */
  //     s16 += ((exp - 112) << 10) + (mant >> 13);

  if ((exp >= 113) && (exp <= 142)) {
    s16 += ((exp - 112) << 10) + (mant >> 13)
  } else if ((exp >= 103) && (exp < 113)) {
    // Denormalized numbers
    //   else if (exp >= 103 && exp < 113) { /* denorm, exp16 = 0 */
    //     if (mant & ((1 << (126 - exp)) - 1))
    //       goto float32;         /* loss of precision */
    //     s16 += ((mant + 0x800000) >> (126 - exp));

    if (mant & ((1 << (126 - exp)) - 1)) {
      return false
    }
    s16 += ((mant + 0x800000) >> (126 - exp))
  } else {
  //   } else if (exp == 255 && mant == 0) { /* Inf */
  //     s16 += 0x7c00;

    // hildjj: Infinity already handled

    //   } else
    //     goto float32;           /* loss of range */

    return false
  }

  // Done
  //   ensure_writable(3);
  //   u16 = s16;
  //   be16 = hton16p((const uint8_t*)&u16);
  buf.writeUInt16BE(s16)
  return true
}

exports.parseHalf = function parseHalf(buf) {
  const sign = buf[0] & 0x80 ? -1 : 1
  const exp = (buf[0] & 0x7C) >> 2
  const mant = ((buf[0] & 0x03) << 8) | buf[1]
  if (!exp) {
    return sign * 5.9604644775390625e-8 * mant
  } else if (exp === 0x1f) {
    return sign * (mant ? NaN : Infinity)
  }
  return sign * (2 ** (exp - 25)) * (1024 + mant)
}

exports.parseCBORfloat = function parseCBORfloat(buf) {
  switch (buf.length) {
    case 2:
      return exports.parseHalf(buf)
    case 4:
      return buf.readFloatBE(0)
    case 8:
      return buf.readDoubleBE(0)
    default:
      throw new Error(`Invalid float size: ${buf.length}`)
  }
}

exports.hex = function hex(s) {
  return Buffer.from(s.replace(/^0x/, ''), 'hex')
}

exports.bin = function bin(s) {
  s = s.replace(/\s/g, '')
  let start = 0
  let end = (s.length % 8) || 8
  const chunks = []
  while (end <= s.length) {
    chunks.push(parseInt(s.slice(start, end), 2))
    start = end
    end += 8
  }
  return Buffer.from(chunks)
}

exports.arrayEqual = function arrayEqual(a, b) {
  if ((a == null) && (b == null)) {
    return true
  }
  if ((a == null) || (b == null)) {
    return false
  }
  return (a.length === b.length) && a.every((elem, i) => elem === b[i])
}

exports.bufferToBigInt = function bufferToBigInt(buf) {
  return BigInt(`0x${buf.toString('hex')}`)
}

exports.cborValueToString = function cborValueToString(val, float_bytes = -1) {
  switch (typeof val) {
    case 'symbol': {
      switch (val) {
        case SYMS.NULL:
          return 'null'
        case SYMS.UNDEFINED:
          return 'undefined'
        case SYMS.BREAK:
          return 'BREAK'
      }
      // Impossible in node 10
      /* istanbul ignore if */
      if (val.description) {
        return val.description
      }
      // On node10, Symbol doesn't have description.  Parse it out of the
      // toString value, which looks like `Symbol(foo)`.
      const s = val.toString()
      const m = s.match(/^Symbol\((?<name>.*)\)/)
      /* istanbul ignore if */
      if (m && m.groups.name) {
        // Impossible in node 12+
        /* istanbul ignore next */
        return m.groups.name
      }
      return 'Symbol'
    }
    case 'string':
      return JSON.stringify(val)
    case 'bigint':
      return val.toString()
    case 'number': {
      const s = Object.is(val, -0) ? '-0' : String(val)
      return (float_bytes > 0) ? `${s}_${float_bytes}` : s
    }
    case 'object': {
      if (!val) {
        return 'null'
      }
      const buf = exports.bufferishToBuffer(val)
      if (buf) {
        const hex = buf.toString('hex')
        return (float_bytes === -Infinity) ? hex : `h'${hex}'`
      }
      if (val && typeof val[Symbol.for('nodejs.util.inspect.custom')] === 'function') {
        return val[Symbol.for('nodejs.util.inspect.custom')]()
      }
      // Shouldn't get non-empty arrays here
      if (Array.isArray(val)) {
        return '[]'
      }
      // This should be all that is left
      return '{}'
    }
  }
  return String(val)
}

exports.guessEncoding = function guessEncoding(input, encoding) {
  if (typeof input === 'string') {
    return new NoFilter(input, (encoding == null) ? 'hex' : encoding)
  }
  const buf = exports.bufferishToBuffer(input)
  if (buf) {
    return new NoFilter(buf)
  }
  if (isReadable(input)) {
    return input
  }
  throw new Error('Unknown input type')
}

const B64URL_SWAPS = {
  '=': '',
  '+': '-',
  '/': '_',
}

/**
 * @param {Buffer|Uint8Array|Uint8ClampedArray|ArrayBuffer|DataView} buf
 *   Buffer to convert.
 * @returns {string} Base64url string.
 * @private
 */
exports.base64url = function base64url(buf) {
  return exports.bufferishToBuffer(buf)
    .toString('base64')
    .replace(/[=+/]/g, c => B64URL_SWAPS[c])
}

/**
 * @param {Buffer|Uint8Array|Uint8ClampedArray|ArrayBuffer|DataView} buf
 *   Buffer to convert.
 * @returns {string} Base64 string.
 * @private
 */
exports.base64 = function base64(buf) {
  return exports.bufferishToBuffer(buf).toString('base64')
}

exports.isBigEndian = function isBigEndian() {
  const array = new Uint8Array(4)
  const view = new Uint32Array(array.buffer)
  return !((view[0] = 1) & array[0])
}


/***/ }),

/***/ 340:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 345:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(7).EventEmitter;


/***/ }),

/***/ 382:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(606);
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
};
/*</replacement>*/

module.exports = Duplex;
var Readable = __webpack_require__(412);
var Writable = __webpack_require__(708);
__webpack_require__(698)(Duplex, Readable);
{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}
function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;
  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;
    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}
Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

// the no-half-open enforcer
function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(onEndNT, this);
}
function onEndNT(self) {
  self.end();
}
Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

/***/ }),

/***/ 412:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(606);
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



module.exports = Readable;

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = (__webpack_require__(7).EventEmitter);
var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(345);
/*</replacement>*/

var Buffer = (__webpack_require__(287).Buffer);
var OurUint8Array = (typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*<replacement>*/
var debugUtil = __webpack_require__(838);
var debug;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/

var BufferList = __webpack_require__(726);
var destroyImpl = __webpack_require__(896);
var _require = __webpack_require__(291),
  getHighWaterMark = _require.getHighWaterMark;
var _require$codes = (__webpack_require__(48)/* .codes */ .F),
  ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
  ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;

// Lazy loaded to improve the startup performance.
var StringDecoder;
var createReadableStreamAsyncIterator;
var from;
__webpack_require__(698)(Readable, Stream);
var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];
function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}
function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || __webpack_require__(382);
  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true;

  // Should close be emitted on destroy. Defaults to true.
  this.emitClose = options.emitClose !== false;

  // Should .destroy() be called after 'end' (and potentially 'finish')
  this.autoDestroy = !!options.autoDestroy;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = (__webpack_require__(141)/* .StringDecoder */ .I);
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}
function Readable(options) {
  Duplex = Duplex || __webpack_require__(382);
  if (!(this instanceof Readable)) return new Readable(options);

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5
  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex);

  // legacy
  this.readable = true;
  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }
  Stream.call(this);
}
Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;
  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }
  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};
function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  }

  // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.
  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}
function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}
function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }
  return er;
}
Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = (__webpack_require__(141)/* .StringDecoder */ .I);
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder;
  // If setEncoding(null), decoder.encoding equals utf8
  this._readableState.encoding = this._readableState.decoder.encoding;

  // Iterate over current buffer to convert already stored Buffers:
  var p = this._readableState.buffer.head;
  var content = '';
  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }
  this._readableState.buffer.clear();
  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
};

// Don't raise the hwm > 1GB
var MAX_HWM = 0x40000000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }
  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }
  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;
  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }
  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }
  if (ret !== null) this.emit('data', ret);
  return ret;
};
function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;
  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;
    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}
function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);
  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  }

  // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.
  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}
function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};
Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;
  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }
  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);
    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);
  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }
  return dest;
};
function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}
Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    for (var i = 0; i < len; i++) dests[i].emit('unpipe', this, {
      hasUnpiped: false
    });
    return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;
  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0;

    // Try start flowing on next tick if stream isn't explicitly paused
    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);
      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }
  return res;
};
Readable.prototype.addListener = Readable.prototype.on;
Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);
  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }
  return res;
};
Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);
  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }
  return res;
};
function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;
  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true;

    // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}
function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()
    state.flowing = !state.readableListening;
    resume(this, state);
  }
  state.paused = false;
  return this;
};
function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}
function resume_(stream, state) {
  debug('resume', state.reading);
  if (!state.reading) {
    stream.read(0);
  }
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}
Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  this._readableState.paused = true;
  return this;
};
function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null);
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;
  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }
    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };
  return this;
};
if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = __webpack_require__(955);
    }
    return createReadableStreamAsyncIterator(this);
  };
}
Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
});

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}
function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);
  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}
function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length);

  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;
      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}
if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = __webpack_require__(157);
    }
    return from(Readable, iterable, opts);
  };
}
function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

/***/ }),

/***/ 452:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * @enum {number}
 */
exports.MT = {
  POS_INT: 0,
  NEG_INT: 1,
  BYTE_STRING: 2,
  UTF8_STRING: 3,
  ARRAY: 4,
  MAP: 5,
  TAG: 6,
  SIMPLE_FLOAT: 7,
}

/**
 * @enum {number}
 */
exports.TAG = {
  DATE_STRING: 0,
  DATE_EPOCH: 1,
  POS_BIGINT: 2,
  NEG_BIGINT: 3,
  DECIMAL_FRAC: 4,
  BIGFLOAT: 5,
  BASE64URL_EXPECTED: 21,
  BASE64_EXPECTED: 22,
  BASE16_EXPECTED: 23,
  CBOR: 24,
  URI: 32,
  BASE64URL: 33,
  BASE64: 34,
  REGEXP: 35,
  MIME: 36,
  // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
  SET: 258,
}

/**
 * @enum {number}
 */
exports.NUMBYTES = {
  ZERO: 0,
  ONE: 24,
  TWO: 25,
  FOUR: 26,
  EIGHT: 27,
  INDEFINITE: 31,
}

/**
 * @enum {number}
 */
exports.SIMPLE = {
  FALSE: 20,
  TRUE: 21,
  NULL: 22,
  UNDEFINED: 23,
}

exports.SYMS = {
  NULL: Symbol.for('github.com/hildjj/node-cbor/null'),
  UNDEFINED: Symbol.for('github.com/hildjj/node-cbor/undef'),
  PARENT: Symbol.for('github.com/hildjj/node-cbor/parent'),
  BREAK: Symbol.for('github.com/hildjj/node-cbor/break'),
  STREAM: Symbol.for('github.com/hildjj/node-cbor/stream'),
}

exports.SHIFT32 = 0x100000000

exports.BI = {
  MINUS_ONE: BigInt(-1),
  NEG_MAX: BigInt(-1) - BigInt(Number.MAX_SAFE_INTEGER),
  MAXINT32: BigInt('0xffffffff'),
  MAXINT64: BigInt('0xffffffffffffffff'),
  SHIFT32: BigInt(exports.SHIFT32),
}



/***/ }),

/***/ 526:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 557:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const constants = __webpack_require__(452)
const utils = __webpack_require__(328)
const INTERNAL_JSON = Symbol('INTERNAL_JSON')

function setBuffersToJSON(obj, fn) {
  // The data item tagged can be a byte string or any other data item.  In the
  // latter case, the tag applies to all of the byte string data items
  // contained in the data item, except for those contained in a nested data
  // item tagged with an expected conversion.
  if (utils.isBufferish(obj)) {
    obj.toJSON = fn
  } else if (Array.isArray(obj)) {
    for (const v of obj) {
      setBuffersToJSON(v, fn)
    }
  } else if (obj && (typeof obj === 'object')) {
    // FFS, complexity in the protocol.

    // There's some circular dependency in here.
    // eslint-disable-next-line no-use-before-define
    if (!(obj instanceof Tagged) || (obj.tag < 21) || (obj.tag > 23)) {
      for (const v of Object.values(obj)) {
        setBuffersToJSON(v, fn)
      }
    }
  }
}

function b64this() {
  // eslint-disable-next-line no-invalid-this
  return utils.base64(this)
}

function b64urlThis() {
  // eslint-disable-next-line no-invalid-this
  return utils.base64url(this)
}

function hexThis() {
  // eslint-disable-next-line no-invalid-this
  return this.toString('hex')
}

function swapEndian(ab, size, byteOffset, byteLength) {
  const dv = new DataView(ab)
  const [getter, setter] = {
    2: [dv.getUint16, dv.setUint16],
    4: [dv.getUint32, dv.setUint32],
    8: [dv.getBigUint64, dv.setBigUint64],
  }[size]

  const end = byteOffset + byteLength
  for (let offset = byteOffset; offset < end; offset += size) {
    setter.call(dv, offset, getter.call(dv, offset, true))
  }
}

/**
 * Convert a tagged value to a more interesting JavaScript type.  Errors
 * thrown in this function will be captured into the "err" property of the
 * original Tagged instance.
 *
 * @callback TagFunction
 * @param {any} value The value inside the tag.
 * @param {Tagged} tag The enclosing Tagged instance; useful if you want to
 *   modify it and return it.  Also available as "this".
 * @returns {any} The transformed value.
 */

/* eslint-disable jsdoc/check-types */
/**
 * A mapping from tag number to a tag decoding function.
 *
 * @typedef {Object.<string, TagFunction>} TagMap
 */
/* eslint-enable jsdoc/check-types */

/**
 * @type {TagMap}
 * @private
 */
const TAGS = {
  // Standard date/time string; see Section 3.4.1
  0: v => new Date(v),
  // Epoch-based date/time; see Section 3.4.2
  1: v => new Date(v * 1000),
  // Positive bignum; see Section 3.4.3
  2: v => utils.bufferToBigInt(v),
  // Negative bignum; see Section 3.4.3
  3: v => constants.BI.MINUS_ONE - utils.bufferToBigInt(v),
  // Expected conversion to base64url encoding; see Section 3.4.5.2
  21: (v, tag) => {
    if (utils.isBufferish(v)) {
      tag[INTERNAL_JSON] = b64urlThis
    } else {
      setBuffersToJSON(v, b64urlThis)
    }
    return tag
  },
  // Expected conversion to base64 encoding; see Section 3.4.5.2
  22: (v, tag) => {
    if (utils.isBufferish(v)) {
      tag[INTERNAL_JSON] = b64this
    } else {
      setBuffersToJSON(v, b64this)
    }
    return tag
  },
  // Expected conversion to base16 encoding; see Section Section 3.4.5.2
  23: (v, tag) => {
    if (utils.isBufferish(v)) {
      tag[INTERNAL_JSON] = hexThis
    } else {
      setBuffersToJSON(v, hexThis)
    }
    return tag
  },
  // URI; see Section 3.4.5.3
  32: v => new URL(v),
  // Base64url; see Section 3.4.5.3
  33: (v, tag) => {
    // If any of the following apply:
    // -  the encoded text string contains non-alphabet characters or
    //    only 1 alphabet character in the last block of 4 (where
    //    alphabet is defined by Section 5 of [RFC4648] for tag number 33
    //    and Section 4 of [RFC4648] for tag number 34), or
    if (!v.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error('Invalid base64url characters')
    }
    const last = v.length % 4
    if (last === 1) {
      throw new Error('Invalid base64url length')
    }
    // -  the padding bits in a 2- or 3-character block are not 0, or
    if (last === 2) {
      // The last 4 bits of the last character need to be zero.
      if ('AQgw'.indexOf(v[v.length - 1]) === -1) {
        throw new Error('Invalid base64 padding')
      }
    } else if (last === 3) {
      // The last 2 bits of the last character need to be zero.
      if ('AEIMQUYcgkosw048'.indexOf(v[v.length - 1]) === -1) {
        throw new Error('Invalid base64 padding')
      }
    }

    //    Or
    // -  the base64url encoding has padding characters,
    // (caught above)

    // the string is invalid.
    return tag
  },
  // Base64; see Section 3.4.5.3
  34: (v, tag) => {
    // If any of the following apply:
    // -  the encoded text string contains non-alphabet characters or
    //    only 1 alphabet character in the last block of 4 (where
    //    alphabet is defined by Section 5 of [RFC4648] for tag number 33
    //    and Section 4 of [RFC4648] for tag number 34), or
    const m = v.match(/^[a-zA-Z0-9+/]+(?<padding>={0,2})$/)
    if (!m) {
      throw new Error('Invalid base64 characters')
    }
    if ((v.length % 4) !== 0) {
      throw new Error('Invalid base64 length')
    }
    // -  the padding bits in a 2- or 3-character block are not 0, or
    if (m.groups.padding === '=') {
      // The last 4 bits of the last character need to be zero.
      if ('AQgw'.indexOf(v[v.length - 2]) === -1) {
        throw new Error('Invalid base64 padding')
      }
    } else if (m.groups.padding === '==') {
      // The last 2 bits of the last character need to be zero.
      if ('AEIMQUYcgkosw048'.indexOf(v[v.length - 3]) === -1) {
        throw new Error('Invalid base64 padding')
      }
    }

    // -  the base64 encoding has the wrong number of padding characters,
    // (caught above)
    // the string is invalid.
    return tag
  },
  // Regular expression; see Section 2.4.4.3
  35: v => new RegExp(v),
  // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
  258: v => new Set(v),
}

const TYPED_ARRAY_TAGS = {
  64: Uint8Array,
  65: Uint16Array,
  66: Uint32Array,
  // 67: BigUint64Array,  Safari doesn't implement
  68: Uint8ClampedArray,
  69: Uint16Array,
  70: Uint32Array,
  // 71: BigUint64Array,  Safari doesn't implement
  72: Int8Array,
  73: Int16Array,
  74: Int32Array,
  // 75: BigInt64Array,  Safari doesn't implement
  // 76: reserved
  77: Int16Array,
  78: Int32Array,
  // 79: BigInt64Array,  Safari doesn't implement
  // 80: not implemented, float16 array
  81: Float32Array,
  82: Float64Array,
  // 83: not implemented, float128 array
  // 84: not implemented, float16 array
  85: Float32Array,
  86: Float64Array,
  // 87: not implemented, float128 array
}

// Safari
if (typeof BigUint64Array !== 'undefined') {
  TYPED_ARRAY_TAGS[67] = BigUint64Array
  TYPED_ARRAY_TAGS[71] = BigUint64Array
}
if (typeof BigInt64Array !== 'undefined') {
  TYPED_ARRAY_TAGS[75] = BigInt64Array
  TYPED_ARRAY_TAGS[79] = BigInt64Array
}

function _toTypedArray(val, tagged) {
  if (!utils.isBufferish(val)) {
    throw new TypeError('val not a buffer')
  }
  const {tag} = tagged
  // See https://tools.ietf.org/html/rfc8746
  const TypedClass = TYPED_ARRAY_TAGS[tag]
  if (!TypedClass) {
    throw new Error(`Invalid typed array tag: ${tag}`)
  }
  const little = tag & 0b00000100
  const float = (tag & 0b00010000) >> 4
  const sz = 2 ** (float + (tag & 0b00000011))

  if ((!little !== utils.isBigEndian()) && (sz > 1)) {
    swapEndian(val.buffer, sz, val.byteOffset, val.byteLength)
  }

  const ab = val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength)
  return new TypedClass(ab)
}

for (const n of Object.keys(TYPED_ARRAY_TAGS)) {
  TAGS[n] = _toTypedArray
}

/**
 * @type {TagMap}
 * @private
 */
let current_TAGS = {}

/**
 * A CBOR tagged item, where the tag does not have semantics specified at the
 * moment, or those semantics threw an error during parsing. Typically this will
 * be an extension point you're not yet expecting.
 */
class Tagged {
  /**
   * Creates an instance of Tagged.
   *
   * @param {number} tag The number of the tag.
   * @param {any} value The value inside the tag.
   * @param {Error} [err] The error that was thrown parsing the tag, or null.
   */
  constructor(tag, value, err) {
    this.tag = tag
    this.value = value
    this.err = err
    if (typeof this.tag !== 'number') {
      throw new Error(`Invalid tag type (${typeof this.tag})`)
    }
    if ((this.tag < 0) || ((this.tag | 0) !== this.tag)) {
      throw new Error(`Tag must be a positive integer: ${this.tag}`)
    }
  }

  toJSON() {
    if (this[INTERNAL_JSON]) {
      return this[INTERNAL_JSON].call(this.value)
    }
    const ret = {
      tag: this.tag,
      value: this.value,
    }
    if (this.err) {
      ret.err = this.err
    }
    return ret
  }

  /**
   * Convert to a String.
   *
   * @returns {string} String of the form '1(2)'.
   */
  toString() {
    return `${this.tag}(${JSON.stringify(this.value)})`
  }

  /**
   * Push the simple value onto the CBOR stream.
   *
   * @param {object} gen The generator to push onto.
   * @returns {boolean} True on success.
   */
  encodeCBOR(gen) {
    gen._pushTag(this.tag)
    return gen.pushAny(this.value)
  }

  /**
   * If we have a converter for this type, do the conversion.  Some converters
   * are built-in.  Additional ones can be passed in.  If you want to remove
   * a built-in converter, pass a converter in whose value is 'null' instead
   * of a function.
   *
   * @param {object} converters Keys in the object are a tag number, the value
   *   is a function that takes the decoded CBOR and returns a JavaScript value
   *   of the appropriate type.  Throw an exception in the function on errors.
   * @returns {any} The converted item.
   */
  convert(converters) {
    let f = (converters == null) ? undefined : converters[this.tag]
    if (f === null) { // === is intentional. null has semantic meaning as above
      return this
    }
    if (typeof f !== 'function') {
      f = Tagged.TAGS[this.tag]
      if (typeof f !== 'function') {
        return this
      }
    }
    try {
      return f.call(this, this.value, this)
    } catch (error) {
      if (error && error.message && (error.message.length > 0)) {
        this.err = error.message
      } else {
        this.err = error
      }
      return this
    }
  }

  /**
   * The current set of supported tags.  May be modified by plugins.
   *
   * @type {TagMap}
   * @static
   */
  static get TAGS() {
    return current_TAGS
  }

  static set TAGS(val) {
    current_TAGS = val
  }

  /**
   * Reset the supported tags to the original set, before any plugins modified
   * the list.
   */
  static reset() {
    Tagged.TAGS = {...TAGS}
  }
}
Tagged.INTERNAL_JSON = INTERNAL_JSON
Tagged.reset()
module.exports = Tagged


/***/ }),

/***/ 600:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;
var Transform = __webpack_require__(610);
__webpack_require__(698)(PassThrough, Transform);
function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}
PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),

/***/ 606:
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 610:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;
var _require$codes = (__webpack_require__(48)/* .codes */ .F),
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
  ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
  ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
var Duplex = __webpack_require__(382);
__webpack_require__(698)(Transform, Duplex);
function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;
  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }
  ts.writechunk = null;
  ts.writecb = null;
  if (data != null)
    // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}
function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;
  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}
function prefinish() {
  var _this = this;
  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}
Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};
Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;
  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};
Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};
function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null)
    // single equals check for both `null` and `undefined`
    stream.push(data);

  // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}

/***/ }),

/***/ 643:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!__webpack_require__.g.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = __webpack_require__.g.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}


/***/ }),

/***/ 698:
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ 708:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(606);
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;
  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(643)
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(345);
/*</replacement>*/

var Buffer = (__webpack_require__(287).Buffer);
var OurUint8Array = (typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
var destroyImpl = __webpack_require__(896);
var _require = __webpack_require__(291),
  getHighWaterMark = _require.getHighWaterMark;
var _require$codes = (__webpack_require__(48)/* .codes */ .F),
  ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
  ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
  ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
  ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
  ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
  ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
var errorOrDestroy = destroyImpl.errorOrDestroy;
__webpack_require__(698)(Writable, Stream);
function nop() {}
function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || __webpack_require__(382);
  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // Should close be emitted on destroy. Defaults to true.
  this.emitClose = options.emitClose !== false;

  // Should .destroy() be called after 'finish' (and potentially 'end')
  this.autoDestroy = !!options.autoDestroy;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}
WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};
(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}
function Writable(options) {
  Duplex = Duplex || __webpack_require__(382);

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5
  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex);

  // legacy.
  this.writable = true;
  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }
  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};
function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END();
  // TODO: defer error events consistently everywhere, not just the cb
  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var er;
  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }
  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }
  return true;
}
Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);
  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }
  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};
Writable.prototype.cork = function () {
  this._writableState.corked++;
};
Writable.prototype.uncork = function () {
  var state = this._writableState;
  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};
Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};
Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}
Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;
  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }
  return ret;
}
function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}
function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}
function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}
function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;
    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }
    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}
function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;
  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }
    if (entry === null) state.lastBufferedRequest = null;
  }
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}
Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};
Writable.prototype._writev = null;
Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;
  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending) endWritable(this, state, cb);
  return this;
};
Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});
function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      errorOrDestroy(stream, err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}
function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;
        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }
  return need;
}
function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}
function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }

  // reuse the free corkReq.
  state.corkedRequestsFree.next = corkReq;
}
Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  cb(err);
};

/***/ }),

/***/ 726:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var _require = __webpack_require__(287),
  Buffer = _require.Buffer;
var _require2 = __webpack_require__(340),
  inspect = _require2.inspect;
var custom = inspect && inspect.custom || 'inspect';
function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}
module.exports = /*#__PURE__*/function () {
  function BufferList() {
    _classCallCheck(this, BufferList);
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;
      while (p = p.next) ret += s + p.data;
      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;
      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }
      return ret;
    }

    // Consumes a specified amount of bytes or characters from the buffered data.
  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;
      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }
      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    }

    // Consumes a specified amount of characters from the buffered data.
  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      this.length -= c;
      return ret;
    }

    // Consumes a specified amount of bytes from the buffered data.
  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      this.length -= c;
      return ret;
    }

    // Make sure the linked list only shows the minimal necessary information.
  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);
  return BufferList;
}();

/***/ }),

/***/ 727:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Gp: () => (/* binding */ base64ToByteArray),
  u3: () => (/* binding */ byteArrayToBase64)
});

// UNUSED EXPORTS: concatenate, getDomainFromOrigin, getOriginFromUrl, parseWebauthnCreateResponse, prepareWebauthnCreateRequest, publicKeyCredentialToObject, webauthnParse, webauthnStringify

// EXTERNAL MODULE: ./node_modules/base64-js/index.js
var base64_js = __webpack_require__(526);
;// ./lib/base64url.modern.ts

function ensureUint8Array(arg) {
    if (arg instanceof ArrayBuffer) {
        return new Uint8Array(arg);
    }
    return arg;
}
function base64UrlToMime(code) {
    return code.replace(/-/g, '+').replace(/_/g, '/') + '===='.substring(0, (4 - (code.length % 4)) % 4);
}
function mimeBase64ToUrl(code) {
    return code.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64url_modern_fromByteArray(bytes) {
    return mimeBase64ToUrl(base64js.fromByteArray(ensureUint8Array(bytes)));
}
function base64url_modern_toByteArray(code) {
    return base64js.toByteArray(base64UrlToMime(code));
}

;// ./utils.ts
/* provided dependency */ var Buffer = __webpack_require__(287)["Buffer"];

// We need to construct the originalCredentialObject explicitly
// https://stackoverflow.com/a/75318025
function publicKeyCredentialToObject(c) {
    let response = {
        clientDataJSON: c.response.clientDataJSON
    };
    if (c.response instanceof AuthenticatorAssertionResponse) {
        response = {
            ...response,
            authenticatorData: c.response.authenticatorData,
            signature: c.response.signature,
            userHandle: c.response.userHandle
        };
    }
    else if (c.response instanceof AuthenticatorAttestationResponse) {
        response = {
            ...response,
            attestationObject: c.response.attestationObject
        };
    }
    return {
        type: c.type,
        id: c.id,
        rawId: c.rawId,
        response
    };
}
// Instead of re-writing all of the webauthn types, handle byte arrays manually
function webauthnStringify(o) {
    return JSON.stringify(o, (k, v) => {
        if (v) {
            if (v.constructor.name === 'ArrayBuffer') {
                // Because Buffer.from(ArrayBuffer) was not working on firefox
                v = new Uint8Array(v);
            }
            if (v.constructor.name === 'Uint8Array') {
                return {
                    data: Buffer.from(v).toString('base64'),
                    kr_ser_ty: 'Uint8Array',
                };
            }
        }
        return v;
    });
}
function webauthnParse(j) {
    return JSON.parse(j, (k, v) => {
        if (v && v.kr_ser_ty === 'Uint8Array') {
            return Uint8Array.from(Buffer.from(v.data, 'base64'));
        }
        if (v && v.kr_ser_ty === 'ArrayBuffer') {
            return Buffer.from(v.data, 'base64').buffer;
        }
        return v;
    });
}
// Converts byte data for a webauthn create request into base64url
function prepareWebauthnCreateRequest(keyResp) {
    return {
        type: 'public-key',
        id: keyResp.id,
        rawId: keyResp.id,
        authenticatorAttachment: null,
        clientExtensionResults: {},
        response: {
            attestationObject: fromByteArray(keyResp.response.attestationObject),
            clientDataJSON: fromByteArray(keyResp.response.clientDataJSON),
            transports: [],
        }
    };
}
// authenticatorAttachment: null,
//         getClientExtensionResults: () => ({}),
//         id: keyID,
//         rawId: base64ToByteArray(keyID, true),
//         response: {
//             attestationObject,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
//             transports:[],
//         },
//         type: 'public-key',
// Parse the base64url data in the response
function parseWebauthnCreateResponse(resp) {
    let respCopy = JSON.parse(JSON.stringify(resp)); // TODO: Replace with structuredClone
    respCopy.user.id = toByteArray(respCopy.user.id);
    respCopy.challenge = toByteArray(respCopy.challenge);
    return respCopy;
}
function concatenate(...arrays) {
    const totalLength = arrays.map(({ length }) => length).reduce((v1, v2) => v1 + v2, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
// Copyright 2014 Google Inc. All rights reserved
//
// Use of this source code is governed by a BSD-style
// license that can be found at
// https://developers.google.com/open-source/licenses/bsd
/**
 * Gets the scheme + origin from a web url.
 * @param {string} url Input url
 * @return {?string} Scheme and origin part if url parses
 */
function getOriginFromUrl(url) {
    const re = new RegExp('^(https?://)[^/]+/?');
    const originarray = re.exec(url);
    if (originarray == null) {
        return null;
    }
    let origin = originarray[0];
    while (origin.charAt(origin.length - 1) === '/') {
        origin = origin.substring(0, origin.length - 1);
    }
    return origin;
}
function getDomainFromOrigin(origin) {
    return origin.replace(new RegExp('^https?://'), '')
        .replace(new RegExp(':[0-9]+$'), '');
}
function byteArrayToBase64(arr, urlEncoded = false) {
    const result = btoa(String.fromCharCode(...arr));
    if (urlEncoded) {
        return result.replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
    return result;
}
function base64ToByteArray(str, urlEncoded = false) {
    let rawInput = str;
    if (urlEncoded) {
        rawInput = padString(rawInput)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
    }
    return Uint8Array.from(atob(rawInput), (c) => c.charCodeAt(0));
}
function padString(input) {
    let result = input;
    while (result.length % 4) {
        result += '=';
    }
    return result;
}


/***/ }),

/***/ 737:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const BinaryParseStream = __webpack_require__(957)
const Tagged = __webpack_require__(557)
const Simple = __webpack_require__(59)
const utils = __webpack_require__(328)
const NoFilter = __webpack_require__(256)
const stream = __webpack_require__(310)
const constants = __webpack_require__(452)
const {MT, NUMBYTES, SYMS, BI} = constants
const {Buffer} = __webpack_require__(287)

const COUNT = Symbol('count')
const MAJOR = Symbol('major type')
const ERROR = Symbol('error')
const NOT_FOUND = Symbol('not found')

function parentArray(parent, typ, count) {
  const a = []

  a[COUNT] = count
  a[SYMS.PARENT] = parent
  a[MAJOR] = typ
  return a
}

function parentBufferStream(parent, typ) {
  const b = new NoFilter()

  b[COUNT] = -1
  b[SYMS.PARENT] = parent
  b[MAJOR] = typ
  return b
}

class UnexpectedDataError extends Error {
  constructor(byte, value) {
    super(`Unexpected data: 0x${byte.toString(16)}`)
    this.name = 'UnexpectedDataError'
    this.byte = byte
    this.value = value
  }
}

/**
 * Things that can act as inputs, from which a NoFilter can be created.
 *
 * @typedef {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
 *   |DataView|stream.Readable} BufferLike
 */
/**
 * @typedef ExtendedResults
 * @property {any} value The value that was found.
 * @property {number} length The number of bytes of the original input that
 *   were read.
 * @property {Buffer} bytes The bytes of the original input that were used
 *   to produce the value.
 * @property {Buffer} [unused] The bytes that were left over from the original
 *   input.  This property only exists if {@linkcode Decoder.decodeFirst} or
 *   {@linkcode Decoder.decodeFirstSync} was called.
 */
/**
 * @typedef DecoderOptions
 * @property {number} [max_depth=-1] The maximum depth to parse.
 *   Use -1 for "until you run out of memory".  Set this to a finite
 *   positive number for un-trusted inputs.  Most standard inputs won't nest
 *   more than 100 or so levels; I've tested into the millions before
 *   running out of memory.
 * @property {Tagged.TagMap} [tags] Mapping from tag number to function(v),
 *   where v is the decoded value that comes after the tag, and where the
 *   function returns the correctly-created value for that tag.
 * @property {boolean} [preferMap=false] If true, prefer to generate Map
 *   instances to plain objects, even if there are no entries in the map
 *   or if all of the keys are strings.
 * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
 *   be generated instead of node Buffers.  This might turn on some more
 *   changes in the future, so forward-compatibility is not guaranteed yet.
 * @property {BufferEncoding} [encoding='hex'] The encoding of the input.
 *   Ignored if input is a Buffer.
 * @property {boolean} [required=false] Should an error be thrown when no
 *   data is in the input?
 * @property {boolean} [extendedResults=false] If true, emit extended
 *   results, which will be an object with shape {@link ExtendedResults}.
 *   The value will already have been null-checked.
 * @property {boolean} [preventDuplicateKeys=false] If true, error is
 *   thrown if a map has duplicate keys.
 */
/**
 * @callback decodeCallback
 * @param {Error} [error] If one was generated.
 * @param {any} [value] The decoded value.
 * @returns {void}
 */
/**
 * @param {DecoderOptions|decodeCallback|string} opts Options,
 *   the callback, or input incoding.
 * @param {decodeCallback} [cb] Called on completion.
 * @returns {{options: DecoderOptions, cb: decodeCallback}} Normalized.
 * @throws {TypeError} On unknown option type.
 * @private
 */
function normalizeOptions(opts, cb) {
  switch (typeof opts) {
    case 'function':
      return {options: {}, cb: /** @type {decodeCallback} */ (opts)}
    case 'string':
      return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
    case 'object':
      return {options: opts || {}, cb}
    default:
      throw new TypeError('Unknown option type')
  }
}

/**
 * Decode a stream of CBOR bytes by transforming them into equivalent
 * JavaScript data.  Because of the limitations of Node object streams,
 * special symbols are emitted instead of NULL or UNDEFINED.  Fix those
 * up by calling {@link Decoder.nullcheck}.
 *
 * @extends BinaryParseStream
 */
class Decoder extends BinaryParseStream {
  /**
   * Create a parsing stream.
   *
   * @param {DecoderOptions} [options={}] Options.
   */
  constructor(options = {}) {
    const {
      tags = {},
      max_depth = -1,
      preferMap = false,
      preferWeb = false,
      required = false,
      encoding = 'hex',
      extendedResults = false,
      preventDuplicateKeys = false,
      ...superOpts
    } = options

    super({defaultEncoding: encoding, ...superOpts})

    this.running = true
    this.max_depth = max_depth
    this.tags = tags
    this.preferMap = preferMap
    this.preferWeb = preferWeb
    this.extendedResults = extendedResults
    this.required = required
    this.preventDuplicateKeys = preventDuplicateKeys

    if (extendedResults) {
      this.bs.on('read', this._onRead.bind(this))
      this.valueBytes = /** @type {NoFilter} */ (new NoFilter())
    }
  }

  /**
   * Check the given value for a symbol encoding a NULL or UNDEFINED value in
   * the CBOR stream.
   *
   * @param {any} val The value to check.
   * @returns {any} The corrected value.
   * @throws {Error} Nothing was found.
   * @static
   * @example
   * myDecoder.on('data', val => {
   *   val = Decoder.nullcheck(val)
   *   // ...
   * })
   */
  static nullcheck(val) {
    switch (val) {
      case SYMS.NULL:
        return null
      case SYMS.UNDEFINED:
        return undefined
      // Leaving this in for now as belt-and-suspenders, but I'm pretty sure
      // it can't happen.
      /* istanbul ignore next */
      case NOT_FOUND:
        /* istanbul ignore next */
        throw new Error('Value not found')
      default:
        return val
    }
  }

  /**
   * Decode the first CBOR item in the input, synchronously.  This will throw
   * an exception if the input is not valid CBOR, or if there are more bytes
   * left over at the end (if options.extendedResults is not true).
   *
   * @param {BufferLike} input If a Readable stream, must have
   *   received the `readable` event already, or you will get an error
   *   claiming "Insufficient data".
   * @param {DecoderOptions|string} [options={}] Options or encoding for input.
   * @returns {ExtendedResults|any} The decoded value.
   * @throws {UnexpectedDataError} Data is left over after decoding.
   * @throws {Error} Insufficient data.
   * @static
   */
  static decodeFirstSync(input, options = {}) {
    if (input == null) {
      throw new TypeError('input required')
    }
    ({options} = normalizeOptions(options))
    const {encoding = 'hex', ...opts} = options
    const c = new Decoder(opts)
    const s = utils.guessEncoding(input, encoding)

    // For/of doesn't work when you need to call next() with a value
    // generator created by parser will be "done" after each CBOR entity
    // parser will yield numbers of bytes that it wants
    const parser = c._parse()
    let state = parser.next()

    while (!state.done) {
      const b = s.read(state.value)

      if ((b == null) || (b.length !== state.value)) {
        throw new Error('Insufficient data')
      }
      if (c.extendedResults) {
        c.valueBytes.write(b)
      }
      state = parser.next(b)
    }

    let val = null
    if (c.extendedResults) {
      val = state.value
      val.unused = s.read()
    } else {
      val = Decoder.nullcheck(state.value)
      if (s.length > 0) {
        const nextByte = s.read(1)

        s.unshift(nextByte)
        throw new UnexpectedDataError(nextByte[0], val)
      }
    }
    return val
  }

  /**
   * Decode all of the CBOR items in the input into an array.  This will throw
   * an exception if the input is not valid CBOR; a zero-length input will
   * return an empty array.
   *
   * @param {BufferLike} input What to parse?
   * @param {DecoderOptions|string} [options={}] Options or encoding
   *   for input.
   * @returns {Array<ExtendedResults>|Array<any>} Array of all found items.
   * @throws {TypeError} No input provided.
   * @throws {Error} Insufficient data provided.
   * @static
   */
  static decodeAllSync(input, options = {}) {
    if (input == null) {
      throw new TypeError('input required')
    }
    ({options} = normalizeOptions(options))
    const {encoding = 'hex', ...opts} = options
    const c = new Decoder(opts)
    const s = utils.guessEncoding(input, encoding)
    const res = []

    while (s.length > 0) {
      const parser = c._parse()
      let state = parser.next()

      while (!state.done) {
        const b = s.read(state.value)

        if ((b == null) || (b.length !== state.value)) {
          throw new Error('Insufficient data')
        }
        if (c.extendedResults) {
          c.valueBytes.write(b)
        }
        state = parser.next(b)
      }
      res.push(Decoder.nullcheck(state.value))
    }
    return res
  }

  /**
   * Decode the first CBOR item in the input.  This will error if there are
   * more bytes left over at the end (if options.extendedResults is not true),
   * and optionally if there were no valid CBOR bytes in the input.  Emits the
   * {Decoder.NOT_FOUND} Symbol in the callback if no data was found and the
   * `required` option is false.
   *
   * @param {BufferLike} input What to parse?
   * @param {DecoderOptions|decodeCallback|string} [options={}] Options, the
   *   callback, or input encoding.
   * @param {decodeCallback} [cb] Callback.
   * @returns {Promise<ExtendedResults|any>} Returned even if callback is
   *   specified.
   * @throws {TypeError} No input provided.
   * @static
   */
  static decodeFirst(input, options = {}, cb = null) {
    if (input == null) {
      throw new TypeError('input required')
    }
    ({options, cb} = normalizeOptions(options, cb))
    const {encoding = 'hex', required = false, ...opts} = options

    const c = new Decoder(opts)
    let v = /** @type {any} */ (NOT_FOUND)
    const s = utils.guessEncoding(input, encoding)
    const p = new Promise((resolve, reject) => {
      c.on('data', val => {
        v = Decoder.nullcheck(val)
        c.close()
      })
      c.once('error', er => {
        if (c.extendedResults && (er instanceof UnexpectedDataError)) {
          v.unused = c.bs.slice()
          return resolve(v)
        }
        if (v !== NOT_FOUND) {
          // Typescript work-around
          // eslint-disable-next-line dot-notation
          er['value'] = v
        }
        v = ERROR
        c.close()
        return reject(er)
      })
      c.once('end', () => {
        switch (v) {
          case NOT_FOUND:
            if (required) {
              return reject(new Error('No CBOR found'))
            }
            return resolve(v)
          // Pretty sure this can't happen, but not *certain*.
          /* istanbul ignore next */
          case ERROR:
            /* istanbul ignore next */
            return undefined
          default:
            return resolve(v)
        }
      })
    })

    if (typeof cb === 'function') {
      p.then(val => cb(null, val), cb)
    }
    s.pipe(c)
    return p
  }

  /**
   * @callback decodeAllCallback
   * @param {Error} error If one was generated.
   * @param {Array<ExtendedResults>|Array<any>} value All of the decoded
   *   values, wrapped in an Array.
   */

  /**
   * Decode all of the CBOR items in the input.  This will error if there are
   * more bytes left over at the end.
   *
   * @param {BufferLike} input What to parse?
   * @param {DecoderOptions|decodeAllCallback|string} [options={}]
   *   Decoding options, the callback, or the input encoding.
   * @param {decodeAllCallback} [cb] Callback.
   * @returns {Promise<Array<ExtendedResults>|Array<any>>} Even if callback
   *   is specified.
   * @throws {TypeError} No input specified.
   * @static
   */
  static decodeAll(input, options = {}, cb = null) {
    if (input == null) {
      throw new TypeError('input required')
    }
    ({options, cb} = normalizeOptions(options, cb))
    const {encoding = 'hex', ...opts} = options

    const c = new Decoder(opts)
    const vals = []

    c.on('data', val => vals.push(Decoder.nullcheck(val)))

    const p = new Promise((resolve, reject) => {
      c.on('error', reject)
      c.on('end', () => resolve(vals))
    })

    if (typeof cb === 'function') {
      p.then(v => cb(undefined, v), er => cb(er, undefined))
    }
    utils.guessEncoding(input, encoding).pipe(c)
    return p
  }

  /**
   * Stop processing.
   */
  close() {
    this.running = false
    this.__fresh = true
  }

  /**
   * Only called if extendedResults is true.
   *
   * @ignore
   */
  _onRead(data) {
    this.valueBytes.write(data)
  }

  /**
   * @returns {Generator<number, any, Buffer>} Yields a number of bytes,
   *   returns anything, next returns a Buffer.
   * @throws {Error} Maximum depth exceeded.
   * @yields {number} Number of bytes to read.
   * @ignore
   */
  *_parse() {
    let parent = null
    let depth = 0
    let val = null

    while (true) {
      if ((this.max_depth >= 0) && (depth > this.max_depth)) {
        throw new Error(`Maximum depth ${this.max_depth} exceeded`)
      }

      const [octet] = yield 1
      if (!this.running) {
        this.bs.unshift(Buffer.from([octet]))
        throw new UnexpectedDataError(octet)
      }
      const mt = octet >> 5
      const ai = octet & 0x1f
      const parent_major = (parent == null) ? undefined : parent[MAJOR]
      const parent_length = (parent == null) ? undefined : parent.length

      switch (ai) {
        case NUMBYTES.ONE:
          this.emit('more-bytes', mt, 1, parent_major, parent_length)
          ;[val] = yield 1
          break
        case NUMBYTES.TWO:
        case NUMBYTES.FOUR:
        case NUMBYTES.EIGHT: {
          const numbytes = 1 << (ai - 24)

          this.emit('more-bytes', mt, numbytes, parent_major, parent_length)
          const buf = yield numbytes
          val = (mt === MT.SIMPLE_FLOAT) ?
            buf :
            utils.parseCBORint(ai, buf)
          break
        }
        case 28:
        case 29:
        case 30:
          this.running = false
          throw new Error(`Additional info not implemented: ${ai}`)
        case NUMBYTES.INDEFINITE:
          switch (mt) {
            case MT.POS_INT:
            case MT.NEG_INT:
            case MT.TAG:
              throw new Error(`Invalid indefinite encoding for MT ${mt}`)
          }
          val = -1
          break
        default:
          val = ai
      }
      switch (mt) {
        case MT.POS_INT:
          // Val already decoded
          break
        case MT.NEG_INT:
          if (val === Number.MAX_SAFE_INTEGER) {
            val = BI.NEG_MAX
          } else {
            val = (typeof val === 'bigint') ? BI.MINUS_ONE - val : -1 - val
          }
          break
        case MT.BYTE_STRING:
        case MT.UTF8_STRING:
          switch (val) {
            case 0:
              this.emit('start-string', mt, val, parent_major, parent_length)
              if (mt === MT.UTF8_STRING) {
                val = ''
              } else {
                val = this.preferWeb ? new Uint8Array(0) : Buffer.allocUnsafe(0)
              }
              break
            case -1:
              this.emit('start', mt, SYMS.STREAM, parent_major, parent_length)
              parent = parentBufferStream(parent, mt)
              depth++
              continue
            default:
              this.emit('start-string', mt, val, parent_major, parent_length)
              val = yield val
              if (mt === MT.UTF8_STRING) {
                val = utils.utf8(val)
              } else if (this.preferWeb) {
                val = new Uint8Array(val.buffer, val.byteOffset, val.length)
              }
          }
          break
        case MT.ARRAY:
        case MT.MAP:
          switch (val) {
            case 0:
              if (mt === MT.MAP) {
                val = (this.preferMap) ? new Map() : {}
              } else {
                val = []
              }
              break
            case -1:
              this.emit('start', mt, SYMS.STREAM, parent_major, parent_length)
              parent = parentArray(parent, mt, -1)
              depth++
              continue
            default:
              this.emit('start', mt, val, parent_major, parent_length)
              parent = parentArray(parent, mt, val * (mt - 3))
              depth++
              continue
          }
          break
        case MT.TAG:
          this.emit('start', mt, val, parent_major, parent_length)
          parent = parentArray(parent, mt, 1)
          parent.push(val)
          depth++
          continue
        case MT.SIMPLE_FLOAT:
          if (typeof val === 'number') {
            if ((ai === NUMBYTES.ONE) && (val < 32)) {
              throw new Error(
                `Invalid two-byte encoding of simple value ${val}`
              )
            }
            const hasParent = (parent != null)
            val = Simple.decode(
              val,
              hasParent,
              hasParent && (parent[COUNT] < 0)
            )
          } else {
            val = utils.parseCBORfloat(val)
          }
      }
      this.emit('value', val, parent_major, parent_length, ai)
      let again = false
      while (parent != null) {
        if (val === SYMS.BREAK) {
          parent[COUNT] = 1
        } else if (Array.isArray(parent)) {
          parent.push(val)
        } else {
          // Assert: parent instanceof NoFilter
          const pm = parent[MAJOR]

          if ((pm != null) && (pm !== mt)) {
            this.running = false
            throw new Error('Invalid major type in indefinite encoding')
          }
          parent.write(val)
        }

        if ((--parent[COUNT]) !== 0) {
          again = true
          break
        }
        --depth
        delete parent[COUNT]

        if (Array.isArray(parent)) {
          switch (parent[MAJOR]) {
            case MT.ARRAY:
              val = parent
              break
            case MT.MAP: {
              let allstrings = !this.preferMap

              if ((parent.length % 2) !== 0) {
                throw new Error(`Invalid map length: ${parent.length}`)
              }
              for (
                let i = 0, len = parent.length;
                allstrings && (i < len);
                i += 2
              ) {
                if ((typeof parent[i] !== 'string') ||
                    (parent[i] === '__proto__')) {
                  allstrings = false
                  break
                }
              }
              if (allstrings) {
                val = {}
                for (let i = 0, len = parent.length; i < len; i += 2) {
                  if (this.preventDuplicateKeys &&
                    Object.prototype.hasOwnProperty.call(val, parent[i])) {
                    throw new Error('Duplicate keys in a map')
                  }
                  val[parent[i]] = parent[i + 1]
                }
              } else {
                val = new Map()
                for (let i = 0, len = parent.length; i < len; i += 2) {
                  if (this.preventDuplicateKeys && val.has(parent[i])) {
                    throw new Error('Duplicate keys in a map')
                  }
                  val.set(parent[i], parent[i + 1])
                }
              }
              break
            }
            case MT.TAG: {
              const t = new Tagged(parent[0], parent[1])

              val = t.convert(this.tags)
              break
            }
          }
        } else /* istanbul ignore else */ if (parent instanceof NoFilter) {
          // Only parent types are Array and NoFilter for (Array/Map) and
          // (bytes/string) respectively.
          switch (parent[MAJOR]) {
            case MT.BYTE_STRING:
              val = parent.slice()
              if (this.preferWeb) {
                val = new Uint8Array(
                  /** @type {Buffer} */ (val).buffer,
                  /** @type {Buffer} */ (val).byteOffset,
                  /** @type {Buffer} */ (val).length
                )
              }
              break
            case MT.UTF8_STRING:
              val = parent.toString('utf-8')
              break
          }
        }
        this.emit('stop', parent[MAJOR])

        const old = parent
        parent = parent[SYMS.PARENT]
        delete old[SYMS.PARENT]
        delete old[MAJOR]
      }
      if (!again) {
        if (this.extendedResults) {
          const bytes = this.valueBytes.slice()
          const ret = {
            value: Decoder.nullcheck(val),
            bytes,
            length: bytes.length,
          }

          this.valueBytes = new NoFilter()
          return ret
        }
        return val
      }
    }
  }
}

Decoder.NOT_FOUND = NOT_FOUND
module.exports = Decoder


/***/ }),

/***/ 744:
/***/ ((module) => {

"use strict";


/**
 * Record objects that pass by in a stream.  If the same object is used more
 * than once, it can be value-shared using shared values.
 *
 * @see {@link http://cbor.schmorp.de/value-sharing}
 */
class ObjectRecorder {
  constructor() {
    this.clear()
  }

  /**
   * Clear all of the objects that have been seen.  Revert to recording mode.
   */
  clear() {
    this.map = new WeakMap()
    this.count = 0
    this.recording = true
  }

  /**
   * Stop recording.
   */
  stop() {
    this.recording = false
  }

  /**
   * Determine if wrapping a tag 28 or 29 around an object that has been
   * reused is appropriate.  This method stores state for which objects have
   * been seen.
   *
   * @param {object} obj Any object about to be serialized.
   * @returns {number} If recording: -1 for first use, index for second use.
   *   If not recording, -1 for never-duplicated, -2 for first use, index for
   *   subsequent uses.
   * @throws {Error} Recording does not match playback.
   */
  check(obj) {
    const val = this.map.get(obj)
    if (val) {
      if (val.length > 1) {
        if (val[0] || this.recording) {
          return val[1]
        }

        val[0] = true
        return ObjectRecorder.FIRST
      }
      if (!this.recording) {
        return ObjectRecorder.NEVER
      }
      val.push(this.count++)
      // Second use while recording
      return val[1]
    }
    if (!this.recording) {
      throw new Error('New object detected when not recording')
    }
    this.map.set(obj, [false])
    // First use while recording
    return ObjectRecorder.NEVER
  }
}

ObjectRecorder.NEVER = -1
ObjectRecorder.FIRST = -2

module.exports = ObjectRecorder


/***/ }),

/***/ 758:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).



var eos;
function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}
var _require$codes = (__webpack_require__(48)/* .codes */ .F),
  ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
  ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}
function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}
function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = __webpack_require__(238);
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true;

    // request.destroy just do .end - .abort is what we want
    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}
function call(fn) {
  fn();
}
function pipe(from, to) {
  return from.pipe(to);
}
function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}
function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }
  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];
  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }
  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}
module.exports = pipeline;

/***/ }),

/***/ 772:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* unused harmony exports CKEY_ID2, getCompatibleKey, getCompatibleKeyFromCryptoKey */
/* harmony import */ var cbor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(881);
/* harmony import */ var cbor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cbor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(727);
/* provided dependency */ var Buffer = __webpack_require__(287)["Buffer"];


// Generated with pseudo random values via
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
/*export const CKEY_ID = new Uint8Array([
    194547236, 76082241, 3628762690, 4137210381,
    1214244733, 1205845608, 840015201, 3897052717,
    4072880437, 4027233456, 675224361, 2305433287,
    74291263, 3461796691, 701523034, 3178201666,
    3992003567, 1410532, 4234129691, 1438515639,
]);*/
// export const CKEY_ID = new Uint8Array([
//     36, 65, 66, 13, 125, 104, 97, 45, 53, 176, 41, 199, 63, 83, 90, 66, 239, 228, 27, 183]);
// Copied from krypton
function counterToBytes(c) {
    const bytes = new Uint8Array(4);
    // Sadly, JS TypedArrays are whatever-endian the platform is,
    // so Uint32Array is not at all useful here (or anywhere?),
    // and we must manually pack the counter (big endian as per spec).
    bytes[0] = 0xFF & c >>> 24;
    bytes[1] = 0xFF & c >>> 16;
    bytes[2] = 0xFF & c >>> 8;
    bytes[3] = 0xFF & c;
    return bytes;
}
const coseEllipticCurveNames = {
    1: 'SHA-256',
    2: 'SHA-384',
    3: 'SHA-512',
};
const ellipticNamedCurvesToCOSE = {
    'P-256': -7,
    'P-384': -35,
    'P-512': -36,
};
// interface DERCompatibleKey {
//     algorithm: number;
//     privateKey: CryptoKey;
//     publicKey?: CryptoKey;
//     generateClientData(challenge: ArrayBuffer, extraOptions: any): Promise<string>;
//     generateAuthenticatorData(rpID: string, counter: number, rawId): Promise<Uint8Array>;
//     sign(clientData: Uint8Array): Promise<any>;
// }
const CKEY_ID2 = new Uint8Array([
    194547236, 76082241, 3628762690, 4137210381,
    1214244733, 1205845608, 840015201, 3897052717,
    4072880437, 4027233456, 675224361, 2305433287,
    74291263, 3461796691, 701523034, 3178201666,
    3992003567, 1410532, 4234129691, 1438515639,
]);
class ECDSA {
    static async fromKey(key) {
        return new ECDSA(ellipticNamedCurvesToCOSE[key.algorithm.namedCurve], key);
    }
    static async fromCOSEAlgorithm(algorithm) {
        // Creating the key
        let namedCurve = null;
        for (const k in ellipticNamedCurvesToCOSE) {
            if (ellipticNamedCurvesToCOSE[k] === algorithm) {
                namedCurve = k;
                break;
            }
        }
        if (!namedCurve) {
            throw new Error(`could not find a named curve for algorithm ${algorithm}`);
        }
        const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve }, true, ['sign']);
        return new ECDSA(algorithm, keyPair.privateKey, keyPair.publicKey);
    }
    constructor(algorithm, privateKey, publicKey) {
        this.algorithm = algorithm;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        if (!(algorithm in ECDSA.ellipticCurveKeys)) {
            throw new Error(`unknown ECDSA algorithm ${algorithm}`);
        }
    }
    async generateClientData(challenge, extraOptions) {
        return JSON.stringify({
            challenge: (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .byteArrayToBase64 */ .u3)(Buffer.from(challenge), true),
            hashAlgorithm: coseEllipticCurveNames[ECDSA.ellipticCurveKeys[this.algorithm]],
            ...extraOptions,
        });
    }
    // public async generateAuthenticatorData2(rpID: string, counter: number): Promise<Uint8Array> {
    //         const rpIdDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpID));
    //         const rpIdHash = new Uint8Array(rpIdDigest);
    //         // CKEY_ID2 is a HAD-specific ID
    //         let aaguid: Uint8Array;
    //         let credIdLen: Uint8Array;
    //         let encodedKey: Uint8Array;
    //         let authenticatorDataLength = rpIdHash.length + 1 + 4;
    //         if (this.publicKey) {
    //             aaguid = CKEY_ID2.slice(0, 16);
    //             // 16-bit unsigned big-endian integer.
    //             credIdLen = new Uint8Array(2);
    //             credIdLen[0] = (CKEY_ID2.length >> 8) & 0xff;
    //             credIdLen[1] = CKEY_ID2.length & 0xff;
    //             const coseKey = await this.toCOSE(this.publicKey);
    //             encodedKey = new Uint8Array(CBOR.encode(coseKey));
    //             authenticatorDataLength += aaguid.length
    //                 + credIdLen.byteLength
    //                 + CKEY_ID2.length
    //                 + encodedKey.byteLength;
    //         }
    //         const authenticatorData = new Uint8Array(authenticatorDataLength);
    //         let offset = 0;
    //         // 32 bytes for the RP ID hash
    //         authenticatorData.set(rpIdHash, 0);
    //         offset += rpIdHash.length;
    //         // 1 byte for flags
    //         // user-presence flag goes on the right-most bit
    //         authenticatorData[rpIdHash.length] = 1;
    //         if (this.publicKey) {
    //             // attestation flag goes on the 7th bit (from the right)
    //             authenticatorData[rpIdHash.length] |= (1 << 6);
    //             offset++;
    //         }
    //         // 4 bytes for the counter. big-endian uint32
    //         // https://www.w3.org/TR/webauthn/#signature-counter
    //         authenticatorData.set(counterToBytes(counter), offset);
    //         offset += counterToBytes(counter).length;
    //         if (!this.publicKey) {
    //             return authenticatorData;
    //         }
    //         // 16 bytes for the Authenticator Attestation GUID
    //         authenticatorData.set(aaguid, offset);
    //         offset += aaguid.length;
    //         // 2 bytes for the authenticator key ID length. 16-bit unsigned big-endian integer.
    //         authenticatorData.set(credIdLen, offset);
    //         offset += credIdLen.byteLength;
    //         // Variable length authenticator key ID
    //         authenticatorData.set(CKEY_ID2, offset);
    //         offset += CKEY_ID2.length;
    //         // Variable length public key
    //         authenticatorData.set(encodedKey, offset);
    //         return authenticatorData;
    //     }
    // All below need to be fixed
    async generateAuthenticatorData(rpID, counter, rawId) {
        const rpIdDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpID));
        const CKEY_ID = new Uint8Array(rawId);
        const rpIdHash = new Uint8Array(rpIdDigest);
        // CKEY_ID is a HAD-specific ID
        let aaguid = null;
        let credIdLen = null;
        let encodedKey = null;
        let authenticatorDataLength = rpIdHash.length + 1 + 4;
        if (this.publicKey) {
            // aaguid = CKEY_ID.slice(0, 16);
            aaguid = new Uint8Array(16);
            // 16-bit unsigned big-endian integer.
            credIdLen = new Uint8Array(2);
            credIdLen[0] = (CKEY_ID.length >> 8) & 0xff;
            credIdLen[1] = CKEY_ID.length & 0xff;
            const coseKey = await this.toCOSE(this.publicKey);
            encodedKey = new Uint8Array(cbor__WEBPACK_IMPORTED_MODULE_0__.encode(coseKey));
            authenticatorDataLength += aaguid.length
                + credIdLen.byteLength
                + CKEY_ID.length
                + encodedKey.byteLength;
        }
        const authenticatorData = new Uint8Array(authenticatorDataLength);
        let offset = 0;
        // 32 bytes for the RP ID hash
        authenticatorData.set(rpIdHash, 0);
        offset += rpIdHash.length;
        // 1 byte for flags
        // user-presence flag goes on the right-most bit
        authenticatorData[rpIdHash.length] = 1;
        if (this.publicKey) {
            // attestation flag goes on the 7th bit (from the right)
            authenticatorData[rpIdHash.length] |= (1 << 6);
        }
        offset++;
        // 4 bytes for the counter. big-endian uint32
        // https://www.w3.org/TR/webauthn/#signature-counter
        authenticatorData.set(counterToBytes(counter), offset);
        offset += counterToBytes(counter).length;
        if (!this.publicKey) {
            return authenticatorData;
        }
        // Previous branch should take care of not having an aaguid, but just for safety:
        // Remove this and replace with type assertions after testing
        if (!aaguid || !credIdLen || !encodedKey) {
            throw new Error("BROKEN FUNCTIONALITY IN CRYPTO");
        }
        // 16 bytes for the Authenticator Attestation GUID
        authenticatorData.set(aaguid, offset);
        offset += aaguid.length;
        // 2 bytes for the authenticator key ID length. 16-bit unsigned big-endian integer.
        authenticatorData.set(credIdLen, offset);
        offset += credIdLen.byteLength;
        // Variable length authenticator key ID
        authenticatorData.set(CKEY_ID, offset);
        offset += CKEY_ID.length;
        console.log('credId', credIdLen);
        console.log('CKEY_ID', CKEY_ID);
        // Variable length public key
        authenticatorData.set(encodedKey, offset);
        console.log('authenticator Data', (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .byteArrayToBase64 */ .u3)(authenticatorData));
        console.log('authenticator Data byte array', authenticatorData);
        return authenticatorData;
    }
    async sign(data) {
        if (!this.privateKey) {
            throw new Error('no private key available for signing');
        }
        const buffer = new Uint8Array(data).buffer;
        return crypto.subtle.sign(this.getKeyParams(), this.privateKey, buffer // data, // new TextEncoder().encode(data),
        );
    }
    async DER_encode_signature(signature) {
        console.log('Uint signature 0', signature);
        signature = new Uint8Array(signature);
        console.log('Uint signature 1', signature);
        // Extract r & s and format it in ASN1 format.
        const signHex = Array.prototype.map.call(signature, function (x) {
            return ('00' + x.toString(16)).slice(-2);
        }).join('');
        let r = signHex.substring(0, 64); // 64 Only going to workfor 256 bit keys.
        let s = signHex.substring(64);
        let rPre = true;
        let sPre = true;
        console.log('r is ', r);
        console.log('s is ', s);
        while (r.indexOf('00') === 0) {
            r = r.substring(2);
            rPre = false;
        }
        if (rPre && parseInt(r.substring(0, 2), 16) > 127) {
            r = '00' + r;
        }
        while (s.indexOf('00') === 0) {
            s = s.substring(2);
            sPre = false;
        }
        if (sPre && parseInt(s.substring(0, 2), 16) > 127) {
            s = '00' + s;
        }
        console.log('r2 is ', r);
        console.log('s2 is ', s);
        const payload = '02' + (r.length / 2).toString(16) + r +
            '02' + (s.length / 2).toString(16) + s;
        const der = '30' + (payload.length / 2).toString(16) + payload;
        console.log('DER signature', der);
        const fromHexString = (hexString) => new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        const der_uint = fromHexString(der);
        console.log('DER signature uint8Array', der_uint);
        return der_uint;
    }
    getKeyParams() {
        return { name: 'ECDSA', hash: coseEllipticCurveNames[ECDSA.ellipticCurveKeys[this.algorithm]] };
    }
    async toCOSE(key) {
        // In JWK the X and Y portions are Base64URL encoded (https://tools.ietf.org/html/rfc7517#section-3),
        // which is just the right type for COSE encoding (https://tools.ietf.org/html/rfc8152#section-7),
        // we just need to convert it to a byte array.
        const exportedKey = await crypto.subtle.exportKey('jwk', key);
        const attData = new Map();
        attData.set(1, 2); // EC2 key type
        attData.set(3, this.algorithm);
        attData.set(-1, ECDSA.ellipticCurveKeys[this.algorithm]);
        // Hopefully this assertion doesn't break
        attData.set(-2, (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .base64ToByteArray */ .Gp)(exportedKey.x, true));
        attData.set(-3, (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .base64ToByteArray */ .Gp)(exportedKey.y, true));
        return attData;
    }
}
/**
 * This maps a COSE algorithm ID https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 * to its respective COSE curve ID // Based on https://tools.ietf.org/html/rfc8152#section-13.1.
 */
ECDSA.ellipticCurveKeys = {
    [-7]: 1,
    [-35]: 2,
    [-36]: 3,
};
// ECDSA w/ SHA-256
const defaultPKParams = { alg: -7, type: 'public-key' };
const coseAlgorithmToKeyName = {
    [-7]: 'ECDSA',
    [-35]: 'ECDSA',
    [-36]: 'ECDSA',
};
const getCompatibleKey = (pkParams) => {
    for (const params of (pkParams || [defaultPKParams])) {
        const algorithmName = coseAlgorithmToKeyName[params.alg];
        console.log('algo name in crypto get getCompatibleKey', params);
        if (!algorithmName) {
            continue;
        }
        switch (algorithmName) {
            case 'ECDSA':
                return ECDSA.fromCOSEAlgorithm(params.alg);
            default:
                throw new Error(`unsupported key algorithm ${algorithmName}`);
        }
    }
    throw new Error(`unable to get key`);
};
const getCompatibleKeyFromCryptoKey = (key) => {
    switch (key.algorithm.name) {
        case 'ECDSA':
            return ECDSA.fromKey(key);
        default:
            throw new Error(`unsupported key algorithm ${key.algorithm.name}`);
    }
};


/***/ }),

/***/ 777:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const stream = __webpack_require__(310)
const Decoder = __webpack_require__(737)
const utils = __webpack_require__(328)
const NoFilter = __webpack_require__(256)
const {MT, SYMS} = __webpack_require__(452)

/**
 * Things that can act as inputs, from which a NoFilter can be created.
 *
 * @typedef {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
 *   |DataView|stream.Readable} BufferLike
 */

/**
 * @typedef DiagnoseOptions
 * @property {string} [separator='\n'] Output between detected objects.
 * @property {boolean} [stream_errors=false] Put error info into the
 *   output stream.
 * @property {number} [max_depth=-1] The maximum depth to parse.
 *   Use -1 for "until you run out of memory".  Set this to a finite
 *   positive number for un-trusted inputs.  Most standard inputs won't nest
 *   more than 100 or so levels; I've tested into the millions before
 *   running out of memory.
 * @property {object} [tags] Mapping from tag number to function(v),
 *   where v is the decoded value that comes after the tag, and where the
 *   function returns the correctly-created value for that tag.
 * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
 *   be generated instead of node Buffers.  This might turn on some more
 *   changes in the future, so forward-compatibility is not guaranteed yet.
 * @property {BufferEncoding} [encoding='hex'] The encoding of input, ignored if
 *   input is not string.
 */
/**
 * @callback diagnoseCallback
 * @param {Error} [error] If one was generated.
 * @param {string} [value] The diagnostic value.
 * @returns {void}
 */
/**
 * @param {DiagnoseOptions|diagnoseCallback|string} opts Options,
 *   the callback, or input incoding.
 * @param {diagnoseCallback} [cb] Called on completion.
 * @returns {{options: DiagnoseOptions, cb: diagnoseCallback}} Normalized.
 * @throws {TypeError} Unknown option type.
 * @private
 */
function normalizeOptions(opts, cb) {
  switch (typeof opts) {
    case 'function':
      return {options: {}, cb: /** @type {diagnoseCallback} */ (opts)}
    case 'string':
      return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
    case 'object':
      return {options: opts || {}, cb}
    default:
      throw new TypeError('Unknown option type')
  }
}

/**
 * Output the diagnostic format from a stream of CBOR bytes.
 *
 * @extends stream.Transform
 */
class Diagnose extends stream.Transform {
  /**
   * Creates an instance of Diagnose.
   *
   * @param {DiagnoseOptions} [options={}] Options for creation.
   */
  constructor(options = {}) {
    const {
      separator = '\n',
      stream_errors = false,
      // Decoder options
      tags,
      max_depth,
      preferWeb,
      encoding,
      // Stream.Transform options
      ...superOpts
    } = options
    super({
      ...superOpts,
      readableObjectMode: false,
      writableObjectMode: false,
    })

    this.float_bytes = -1
    this.separator = separator
    this.stream_errors = stream_errors
    this.parser = new Decoder({
      tags,
      max_depth,
      preferWeb,
      encoding,
    })
    this.parser.on('more-bytes', this._on_more.bind(this))
    this.parser.on('value', this._on_value.bind(this))
    this.parser.on('start', this._on_start.bind(this))
    this.parser.on('stop', this._on_stop.bind(this))
    this.parser.on('data', this._on_data.bind(this))
    this.parser.on('error', this._on_error.bind(this))
  }

  /**
   * Transforming.
   *
   * @param {any} fresh Buffer to transcode.
   * @param {BufferEncoding} encoding Name of encoding.
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _transform(fresh, encoding, cb) {
    this.parser.write(fresh, encoding, cb)
  }

  /**
   * Flushing.
   *
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _flush(cb) {
    this.parser._flush(er => {
      if (this.stream_errors) {
        if (er) {
          this._on_error(er)
        }
        return cb()
      }
      return cb(er)
    })
  }

  /**
   * Convenience function to return a string in diagnostic format.
   *
   * @param {BufferLike} input The CBOR bytes to format.
   * @param {DiagnoseOptions |diagnoseCallback|string} [options={}]
   *   Options, the callback, or the input encoding.
   * @param {diagnoseCallback} [cb] Callback.
   * @returns {Promise} If callback not specified.
   * @throws {TypeError} Input not provided.
   */
  static diagnose(input, options = {}, cb = null) {
    if (input == null) {
      throw new TypeError('input required')
    }
    ({options, cb} = normalizeOptions(options, cb))
    const {encoding = 'hex', ...opts} = options

    const bs = new NoFilter()
    const d = new Diagnose(opts)
    let p = null
    if (typeof cb === 'function') {
      d.on('end', () => cb(null, bs.toString('utf8')))
      d.on('error', cb)
    } else {
      p = new Promise((resolve, reject) => {
        d.on('end', () => resolve(bs.toString('utf8')))
        d.on('error', reject)
      })
    }
    d.pipe(bs)
    utils.guessEncoding(input, encoding).pipe(d)
    return p
  }

  /**
   * @ignore
   */
  _on_error(er) {
    if (this.stream_errors) {
      this.push(er.toString())
    } else {
      this.emit('error', er)
    }
  }

  /** @private */
  _on_more(mt, len, parent_mt, pos) {
    if (mt === MT.SIMPLE_FLOAT) {
      this.float_bytes = {
        2: 1,
        4: 2,
        8: 3,
      }[len]
    }
  }

  /** @private */
  _fore(parent_mt, pos) {
    switch (parent_mt) {
      case MT.BYTE_STRING:
      case MT.UTF8_STRING:
      case MT.ARRAY:
        if (pos > 0) {
          this.push(', ')
        }
        break
      case MT.MAP:
        if (pos > 0) {
          if (pos % 2) {
            this.push(': ')
          } else {
            this.push(', ')
          }
        }
    }
  }

  /** @private */
  _on_value(val, parent_mt, pos) {
    if (val === SYMS.BREAK) {
      return
    }
    this._fore(parent_mt, pos)
    const fb = this.float_bytes
    this.float_bytes = -1
    this.push(utils.cborValueToString(val, fb))
  }

  /** @private */
  _on_start(mt, tag, parent_mt, pos) {
    this._fore(parent_mt, pos)
    switch (mt) {
      case MT.TAG:
        this.push(`${tag}(`)
        break
      case MT.ARRAY:
        this.push('[')
        break
      case MT.MAP:
        this.push('{')
        break
      case MT.BYTE_STRING:
      case MT.UTF8_STRING:
        this.push('(')
        break
    }
    if (tag === SYMS.STREAM) {
      this.push('_ ')
    }
  }

  /** @private */
  _on_stop(mt) {
    switch (mt) {
      case MT.TAG:
        this.push(')')
        break
      case MT.ARRAY:
        this.push(']')
        break
      case MT.MAP:
        this.push('}')
        break
      case MT.BYTE_STRING:
      case MT.UTF8_STRING:
        this.push(')')
        break
    }
  }

  /** @private */
  _on_data() {
    this.push(this.separator)
  }
}

module.exports = Diagnose


/***/ }),

/***/ 838:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 861:
/***/ ((module, exports, __webpack_require__) => {

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = __webpack_require__(287)
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}


/***/ }),

/***/ 881:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Commented = __webpack_require__(893)
const Diagnose = __webpack_require__(777)
const Decoder = __webpack_require__(737)
const Encoder = __webpack_require__(274)
const Simple = __webpack_require__(59)
const Tagged = __webpack_require__(557)
const Map = __webpack_require__(903)
const SharedValueEncoder = __webpack_require__(207)

module.exports = {
  Commented,
  Diagnose,
  Decoder,
  Encoder,
  Simple,
  Tagged,
  Map,
  SharedValueEncoder,

  /**
   * Convenience name for {@linkcode Commented.comment}.
   */
  comment: Commented.comment,

  /**
   * Convenience name for {@linkcode Decoder.decodeAll}.
   */
  decodeAll: Decoder.decodeAll,

  /**
   * Convenience name for {@linkcode Decoder.decodeFirst}.
   */
  decodeFirst: Decoder.decodeFirst,

  /**
   * Convenience name for {@linkcode Decoder.decodeAllSync}.
   */
  decodeAllSync: Decoder.decodeAllSync,

  /**
   * Convenience name for {@linkcode Decoder.decodeFirstSync}.
   */
  decodeFirstSync: Decoder.decodeFirstSync,

  /**
   * Convenience name for {@linkcode Diagnose.diagnose}.
   */
  diagnose: Diagnose.diagnose,

  /**
   * Convenience name for {@linkcode Encoder.encode}.
   */
  encode: Encoder.encode,

  /**
   * Convenience name for {@linkcode Encoder.encodeCanonical}.
   */
  encodeCanonical: Encoder.encodeCanonical,

  /**
   * Convenience name for {@linkcode Encoder.encodeOne}.
   */
  encodeOne: Encoder.encodeOne,

  /**
   * Convenience name for {@linkcode Encoder.encodeAsync}.
   */
  encodeAsync: Encoder.encodeAsync,

  /**
   * Convenience name for {@linkcode Decoder.decodeFirstSync}.
   */
  decode: Decoder.decodeFirstSync,

  /**
   * The codec information for
   * {@link https://github.com/Level/encoding-down encoding-down}, which is a
   * codec framework for leveldb.  CBOR is a particularly convenient format for
   * both keys and values, as it can deal with a lot of types that JSON can't
   * handle without losing type information.
   *
   * @example
   * const level = require('level')
   * const cbor = require('cbor')
   *
   * async function putget() {
   *   const db = level('./db', {
   *     keyEncoding: cbor.leveldb,
   *     valueEncoding: cbor.leveldb,
   *   })
   *
   *   await db.put({a: 1}, 9857298342094820394820394820398234092834n)
   *   const val = await db.get({a: 1})
   * }
   */
  leveldb: {
    decode: Decoder.decodeFirstSync,
    encode: Encoder.encode,
    buffer: true,
    name: 'cbor',
  },

  /**
   * Reset everything that we can predict a plugin might have altered in good
   * faith.  For now that includes the default set of tags that decoding and
   * encoding will use.
   */
  reset() {
    Encoder.reset()
    Tagged.reset()
  },
}


/***/ }),

/***/ 893:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const stream = __webpack_require__(310)
const utils = __webpack_require__(328)
const Decoder = __webpack_require__(737)
const NoFilter = __webpack_require__(256)
const {MT, NUMBYTES, SYMS} = __webpack_require__(452)
const {Buffer} = __webpack_require__(287)

function plural(c) {
  if (c > 1) {
    return 's'
  }
  return ''
}

/**
 * @typedef CommentOptions
 * @property {number} [max_depth=10] How many times to indent
 *   the dashes.
 * @property {number} [depth=1] Initial indentation depth.
 * @property {boolean} [no_summary=false] If true, omit the summary
 *   of the full bytes read at the end.
 * @property {object} [tags] Mapping from tag number to function(v),
 *   where v is the decoded value that comes after the tag, and where the
 *   function returns the correctly-created value for that tag.
 * @property {boolean} [preferWeb=false] If true, prefer Uint8Arrays to
 *   be generated instead of node Buffers.  This might turn on some more
 *   changes in the future, so forward-compatibility is not guaranteed yet.
 * @property {BufferEncoding} [encoding='hex'] Encoding to use for input, if it
 *   is a string.
 */
/**
 * @callback commentCallback
 * @param {Error} [error] If one was generated.
 * @param {string} [commented] The comment string.
 * @returns {void}
 */
/**
 * Normalize inputs to the static functions.
 *
 * @param {CommentOptions|commentCallback|string|number} opts Encoding,
 *   max_depth, or callback.
 * @param {commentCallback} [cb] Called on completion.
 * @returns {{options: CommentOptions, cb: commentCallback}} Normalized value.
 * @throws {TypeError} Unknown option type.
 * @private
 */
function normalizeOptions(opts, cb) {
  switch (typeof opts) {
    case 'function':
      return {options: {}, cb: /** @type {commentCallback} */ (opts)}
    case 'string':
      return {options: {encoding: /** @type {BufferEncoding} */ (opts)}, cb}
    case 'number':
      return {options: {max_depth: opts}, cb}
    case 'object':
      return {options: opts || {}, cb}
    default:
      throw new TypeError('Unknown option type')
  }
}

/**
 * Generate the expanded format of RFC 8949, section 3.2.2.
 *
 * @extends stream.Transform
 */
class Commented extends stream.Transform {
  /**
   * Create a CBOR commenter.
   *
   * @param {CommentOptions} [options={}] Stream options.
   */
  constructor(options = {}) {
    const {
      depth = 1,
      max_depth = 10,
      no_summary = false,
      // Decoder options
      tags = {},
      preferWeb,
      encoding,
      // Stream.Transform options
      ...superOpts
    } = options

    super({
      ...superOpts,
      readableObjectMode: false,
      writableObjectMode: false,
    })

    this.depth = depth
    this.max_depth = max_depth
    this.all = new NoFilter()

    if (!tags[24]) {
      tags[24] = this._tag_24.bind(this)
    }
    this.parser = new Decoder({
      tags,
      max_depth,
      preferWeb,
      encoding,
    })
    this.parser.on('value', this._on_value.bind(this))
    this.parser.on('start', this._on_start.bind(this))
    this.parser.on('start-string', this._on_start_string.bind(this))
    this.parser.on('stop', this._on_stop.bind(this))
    this.parser.on('more-bytes', this._on_more.bind(this))
    this.parser.on('error', this._on_error.bind(this))
    if (!no_summary) {
      this.parser.on('data', this._on_data.bind(this))
    }
    this.parser.bs.on('read', this._on_read.bind(this))
  }

  /**
   * @param {Buffer} v Descend into embedded CBOR.
   * @private
   */
  _tag_24(v) {
    const c = new Commented({depth: this.depth + 1, no_summary: true})

    c.on('data', b => this.push(b))
    c.on('error', er => this.emit('error', er))
    c.end(v)
  }

  /**
   * Transforming.
   *
   * @param {any} fresh Buffer to transcode.
   * @param {BufferEncoding} encoding Name of encoding.
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _transform(fresh, encoding, cb) {
    this.parser.write(fresh, encoding, cb)
  }

  /**
   * Flushing.
   *
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _flush(cb) {
    // TODO: find the test that covers this, and look at the return value
    return this.parser._flush(cb)
  }

  /**
   * Comment on an input Buffer or string, creating a string passed to the
   * callback.  If callback not specified, a promise is returned.
   *
   * @param {string|Buffer|ArrayBuffer|Uint8Array|Uint8ClampedArray
   *   |DataView|stream.Readable} input Something to parse.
   * @param {CommentOptions|commentCallback|string|number} [options={}]
   *   Encoding, max_depth, or callback.
   * @param {commentCallback} [cb] If specified, called on completion.
   * @returns {Promise} If cb not specified.
   * @throws {Error} Input required.
   * @static
   */
  static comment(input, options = {}, cb = null) {
    if (input == null) {
      throw new Error('input required')
    }
    ({options, cb} = normalizeOptions(options, cb))
    const bs = new NoFilter()
    const {encoding = 'hex', ...opts} = options
    const d = new Commented(opts)
    let p = null

    if (typeof cb === 'function') {
      d.on('end', () => {
        cb(null, bs.toString('utf8'))
      })
      d.on('error', cb)
    } else {
      p = new Promise((resolve, reject) => {
        d.on('end', () => {
          resolve(bs.toString('utf8'))
        })
        d.on('error', reject)
      })
    }
    d.pipe(bs)
    utils.guessEncoding(input, encoding).pipe(d)
    return p
  }

  /**
   * @ignore
   */
  _on_error(er) {
    this.push('ERROR: ')
    this.push(er.toString())
    this.push('\n')
  }

  /**
   * @ignore
   */
  _on_read(buf) {
    this.all.write(buf)
    const hex = buf.toString('hex')

    this.push(new Array(this.depth + 1).join('  '))
    this.push(hex)

    let ind = ((this.max_depth - this.depth) * 2) - hex.length
    if (ind < 1) {
      ind = 1
    }
    this.push(new Array(ind + 1).join(' '))
    this.push('-- ')
  }

  /**
   * @ignore
   */
  _on_more(mt, len, parent_mt, pos) {
    let desc = ''

    this.depth++
    switch (mt) {
      case MT.POS_INT:
        desc = 'Positive number,'
        break
      case MT.NEG_INT:
        desc = 'Negative number,'
        break
      case MT.ARRAY:
        desc = 'Array, length'
        break
      case MT.MAP:
        desc = 'Map, count'
        break
      case MT.BYTE_STRING:
        desc = 'Bytes, length'
        break
      case MT.UTF8_STRING:
        desc = 'String, length'
        break
      case MT.SIMPLE_FLOAT:
        if (len === 1) {
          desc = 'Simple value,'
        } else {
          desc = 'Float,'
        }
        break
    }
    this.push(`${desc} next ${len} byte${plural(len)}\n`)
  }

  /**
   * @ignore
   */
  _on_start_string(mt, len, parent_mt, pos) {
    let desc = ''

    this.depth++
    switch (mt) {
      case MT.BYTE_STRING:
        desc = `Bytes, length: ${len}`
        break
      case MT.UTF8_STRING:
        desc = `String, length: ${len.toString()}`
        break
    }
    this.push(`${desc}\n`)
  }

  /**
   * @ignore
   */
  _on_start(mt, tag, parent_mt, pos) {
    this.depth++
    switch (parent_mt) {
      case MT.ARRAY:
        this.push(`[${pos}], `)
        break
      case MT.MAP:
        if (pos % 2) {
          this.push(`{Val:${Math.floor(pos / 2)}}, `)
        } else {
          this.push(`{Key:${Math.floor(pos / 2)}}, `)
        }
        break
    }
    switch (mt) {
      case MT.TAG:
        this.push(`Tag #${tag}`)
        if (tag === 24) {
          this.push(' Encoded CBOR data item')
        }
        break
      case MT.ARRAY:
        if (tag === SYMS.STREAM) {
          this.push('Array (streaming)')
        } else {
          this.push(`Array, ${tag} item${plural(tag)}`)
        }
        break
      case MT.MAP:
        if (tag === SYMS.STREAM) {
          this.push('Map (streaming)')
        } else {
          this.push(`Map, ${tag} pair${plural(tag)}`)
        }
        break
      case MT.BYTE_STRING:
        this.push('Bytes (streaming)')
        break
      case MT.UTF8_STRING:
        this.push('String (streaming)')
        break
    }
    this.push('\n')
  }

  /**
   * @ignore
   */
  _on_stop(mt) {
    this.depth--
  }

  /**
   * @private
   */
  _on_value(val, parent_mt, pos, ai) {
    if (val !== SYMS.BREAK) {
      switch (parent_mt) {
        case MT.ARRAY:
          this.push(`[${pos}], `)
          break
        case MT.MAP:
          if (pos % 2) {
            this.push(`{Val:${Math.floor(pos / 2)}}, `)
          } else {
            this.push(`{Key:${Math.floor(pos / 2)}}, `)
          }
          break
      }
    }
    const str = utils.cborValueToString(val, -Infinity)

    if ((typeof val === 'string') ||
        (Buffer.isBuffer(val))) {
      if (val.length > 0) {
        this.push(str)
        this.push('\n')
      }
      this.depth--
    } else {
      this.push(str)
      this.push('\n')
    }

    switch (ai) {
      case NUMBYTES.ONE:
      case NUMBYTES.TWO:
      case NUMBYTES.FOUR:
      case NUMBYTES.EIGHT:
        this.depth--
    }
  }

  /**
   * @ignore
   */
  _on_data() {
    this.push('0x')
    this.push(this.all.read().toString('hex'))
    this.push('\n')
  }
}

module.exports = Commented


/***/ }),

/***/ 896:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(606);


// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;
  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;
  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }
  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });
  return this;
}
function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}
function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}
function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }
  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}
function emitErrorNT(self, err) {
  self.emit('error', err);
}
function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.

  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}
module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};

/***/ }),

/***/ 903:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const {Buffer} = __webpack_require__(287)
const encoder = __webpack_require__(274)
const decoder = __webpack_require__(737)
const {MT} = __webpack_require__(452)

/**
 * Wrapper around a JavaScript Map object that allows the keys to be
 * any complex type.  The base Map object allows this, but will only
 * compare the keys by identity, not by value.  CborMap translates keys
 * to CBOR first (and base64's them to ensure by-value comparison).
 *
 * This is not a subclass of Object, because it would be tough to get
 * the semantics to be an exact match.
 *
 * @extends Map
 */
class CborMap extends Map {
  /**
   * Creates an instance of CborMap.
   *
   * @param {Iterable<any>} [iterable] An Array or other iterable
   *   object whose elements are key-value pairs (arrays with two elements, e.g.
   *   <code>[[ 1, 'one' ],[ 2, 'two' ]]</code>). Each key-value pair is added
   *   to the new CborMap; null values are treated as undefined.
   */
  constructor(iterable) {
    super(iterable)
  }

  /**
   * @ignore
   */
  static _encode(key) {
    return encoder.encodeCanonical(key).toString('base64')
  }

  /**
   * @ignore
   */
  static _decode(key) {
    return decoder.decodeFirstSync(key, 'base64')
  }

  /**
   * Retrieve a specified element.
   *
   * @param {any} key The key identifying the element to retrieve.
   *   Can be any type, which will be serialized into CBOR and compared by
   *   value.
   * @returns {any} The element if it exists, or <code>undefined</code>.
   */
  get(key) {
    return super.get(CborMap._encode(key))
  }

  /**
   * Adds or updates an element with a specified key and value.
   *
   * @param {any} key The key identifying the element to store.
   *   Can be any type, which will be serialized into CBOR and compared by
   *   value.
   * @param {any} val The element to store.
   * @returns {this} This object.
   */
  set(key, val) {
    return super.set(CborMap._encode(key), val)
  }

  /**
   * Removes the specified element.
   *
   * @param {any} key The key identifying the element to delete. Can be any
   *   type, which will be serialized into CBOR and compared by value.
   * @returns {boolean} True if an element in the Map object existed and has
   *   been removed, or false if the element does not exist.
   */
  delete(key) {
    return super.delete(CborMap._encode(key))
  }

  /**
   * Does an element with the specified key exist?
   *
   * @param {any} key The key identifying the element to check.
   *   Can be any type, which will be serialized into CBOR and compared by
   *   value.
   * @returns {boolean} True if an element with the specified key exists in
   *   the Map object; otherwise false.
   */
  has(key) {
    return super.has(CborMap._encode(key))
  }

  /**
   * Returns a new Iterator object that contains the keys for each element
   * in the Map object in insertion order.  The keys are decoded into their
   * original format.
   *
   * @yields {any} The keys of the map.
   */
  *keys() {
    for (const k of super.keys()) {
      yield CborMap._decode(k)
    }
  }

  /**
   * Returns a new Iterator object that contains the [key, value] pairs for
   * each element in the Map object in insertion order.
   *
   * @returns {IterableIterator<any>} Key value pairs.
   * @yields {any[]} Key value pairs.
   */
  *entries() {
    for (const kv of super.entries()) {
      yield [CborMap._decode(kv[0]), kv[1]]
    }
  }

  /**
   * Returns a new Iterator object that contains the [key, value] pairs for
   * each element in the Map object in insertion order.
   *
   * @returns {IterableIterator} Key value pairs.
   */
  [Symbol.iterator]() {
    return this.entries()
  }

  /**
   * Executes a provided function once per each key/value pair in the Map
   * object, in insertion order.
   *
   * @param {function(any, any, Map): undefined} fun Function to execute for
   *   each element, which takes a value, a key, and the Map being traversed.
   * @param {any} thisArg Value to use as this when executing callback.
   * @throws {TypeError} Invalid function.
   */
  forEach(fun, thisArg) {
    if (typeof fun !== 'function') {
      throw new TypeError('Must be function')
    }
    for (const kv of super.entries()) {
      fun.call(this, kv[1], CborMap._decode(kv[0]), this)
    }
  }

  /**
   * Push the simple value onto the CBOR stream.
   *
   * @param {object} gen The generator to push onto.
   * @returns {boolean} True on success.
   */
  encodeCBOR(gen) {
    if (!gen._pushInt(this.size, MT.MAP)) {
      return false
    }
    if (gen.canonical) {
      const entries = Array.from(super.entries())
        .map(kv => [Buffer.from(kv[0], 'base64'), kv[1]])
      entries.sort((a, b) => a[0].compare(b[0]))
      for (const kv of entries) {
        if (!(gen.push(kv[0]) && gen.pushAny(kv[1]))) {
          return false
        }
      }
    } else {
      for (const kv of super.entries()) {
        if (!(gen.push(Buffer.from(kv[0], 'base64')) && gen.pushAny(kv[1]))) {
          return false
        }
      }
    }
    return true
  }
}

module.exports = CborMap


/***/ }),

/***/ 955:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(606);


var _Object$setPrototypeO;
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var finished = __webpack_require__(238);
var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');
function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}
function readAndResolve(iter) {
  var resolve = iter[kLastResolve];
  if (resolve !== null) {
    var data = iter[kStream].read();
    // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'
    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}
function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}
function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }
      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}
var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },
  next: function next() {
    var _this = this;
    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];
    if (error !== null) {
      return Promise.reject(error);
    }
    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }
    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    }

    // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time
    var lastPromise = this[kLastPromise];
    var promise;
    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();
      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }
      promise = new Promise(this[kHandlePromise]);
    }
    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;
  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);
var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;
  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();
      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject];
      // reject if we are waiting for data in the Promise
      // returned by next() and store the error
      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }
      iterator[kError] = err;
      return;
    }
    var resolve = iterator[kLastResolve];
    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }
    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};
module.exports = createReadableStreamAsyncIterator;

/***/ }),

/***/ 957:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Tweaked version of nathan7's binary-parse-stream
// (see https://github.com/nathan7/binary-parse-stream)
// Uses NoFilter instead of the readable in the original.  Removes
// the ability to read -1, which was odd and un-needed.
// License for binary-parse-stream: MIT

// binary-parse-stream is now unmaintained, so I have rewritten it as
// more modern JS so I can get tsc to help check types.


const stream = __webpack_require__(310)
const NoFilter = __webpack_require__(256)

/**
 * BinaryParseStream is a TransformStream that consumes buffers and outputs
 * objects on the other end.  It expects your subclass to implement a `_parse`
 * method that is a generator.  When your generator yields a number, it'll be
 * fed a buffer of that length from the input.  When your generator returns,
 * the return value will be pushed to the output side.
 *
 * @extends stream.Transform
 */
class BinaryParseStream extends stream.Transform {
  /**
   * Creates an instance of BinaryParseStream.
   *
   * @memberof BinaryParseStream
   * @param {stream.TransformOptions} options Stream options.
   */
  constructor(options) {
    super(options)
    // Doesn't work to pass these in as opts, for some reason
    // also, work around typescript not knowing TransformStream internals
    // eslint-disable-next-line dot-notation
    this['_writableState'].objectMode = false
    // eslint-disable-next-line dot-notation
    this['_readableState'].objectMode = true

    this.bs = new NoFilter()
    this.__restart()
  }

  /**
   * Transforming.
   *
   * @param {any} fresh Buffer to transcode.
   * @param {BufferEncoding} encoding Name of encoding.
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _transform(fresh, encoding, cb) {
    this.bs.write(fresh)

    while (this.bs.length >= this.__needed) {
      let ret = null
      const chunk = (this.__needed === null) ?
        undefined :
        this.bs.read(this.__needed)

      try {
        ret = this.__parser.next(chunk)
      } catch (e) {
        return cb(e)
      }

      if (this.__needed) {
        this.__fresh = false
      }

      if (ret.done) {
        this.push(ret.value)
        this.__restart()
      } else {
        this.__needed = ret.value || Infinity
      }
    }

    return cb()
  }

  /**
   * Subclasses must override this to set their parsing behavior.  Yield a
   * number to receive a Buffer of that many bytes.
   *
   * @abstract
   * @returns {Generator<number, any, Buffer>}
   */
  /* istanbul ignore next */
  *_parse() { // eslint-disable-line class-methods-use-this, require-yield
    throw new Error('Must be implemented in subclass')
  }

  __restart() {
    this.__needed = null
    this.__parser = this._parse()
    this.__fresh = true
  }

  /**
   * Flushing.
   *
   * @param {stream.TransformCallback} cb Callback when done.
   * @ignore
   */
  _flush(cb) {
    cb(this.__fresh ? null : new Error('unexpected end of input'))
  }
}

module.exports = BinaryParseStream


/***/ }),

/***/ 987:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

"use strict";

// UNUSED EXPORTS: keyExists, saveKey

;// ./constants.ts
const constants_keyExportFormat = 'pkcs8';
const constants_ivLength = 12;
const constants_saltLength = 16;
const disabledIcons = {
    16: 'images/lock-16.png',
    32: 'images/lock-32.png',
    48: 'images/lock-48.png',
    128: 'images/lock-128.png',
};
const enabledIcons = {
    16: 'images/lock_enabled-16.png',
    32: 'images/lock_enabled-32.png',
    48: 'images/lock_enabled-48.png',
    128: 'images/lock_enabled-128.png',
};

// EXTERNAL MODULE: ./utils.ts + 1 modules
var utils = __webpack_require__(727);
;// ./storage.ts


const keyExists = (key) => {
    return new Promise(async (res, rej) => {
        chrome.storage.sync.get(key, (resp) => {
            if (!!chrome.runtime.lastError) {
                rej(chrome.runtime.lastError);
            }
            else {
                res(!!resp[key]);
            }
        });
    });
};
// export const deleteKey = (key: string) => {
//     return new Promise(async (res, _) => {
//         chrome.storage.sync.remove(key);
//         res();
//     });
// };
const getWrappingKey = async (pin, salt) => {
    const enc = new TextEncoder();
    const derivationKey = await crypto.subtle.importKey('raw', enc.encode(pin), { name: 'PBKDF2', length: 256 }, false, ['deriveBits', 'deriveKey']);
    const buffer = new Uint8Array(salt).buffer;
    const pbkdf2Params = {
        hash: 'SHA-256',
        iterations: 100000,
        name: 'PBKDF2',
        salt: buffer,
    };
    return crypto.subtle.deriveKey(pbkdf2Params, derivationKey, { name: 'AES-GCM', length: 256 }, true, ['wrapKey', 'unwrapKey']);
};
// export const fetchKey = async (key: string, pin: string): Promise<CryptoKey> => {
//     return new Promise<CryptoKey>(async (res, rej) => {
//         chrome.storage.sync.get(key, async (resp) => {
//             if (!!chrome.runtime.lastError) {
//                 rej(chrome.runtime.lastError);
//                 return;
//             }
//             const payload = base64ToByteArray(resp[key], true);
//             const saltByteLength = payload[0];
//             const ivByteLength = payload[1];
//             const keyAlgorithmByteLength = payload[2];
//             const wrappedKeyLength = payload[3];
//             let offset = 4;
//             const salt = payload.subarray(offset, offset + saltByteLength);
//             offset += saltByteLength;
//             const iv = payload.subarray(offset, offset + ivByteLength);
//             offset += ivByteLength;
//             const keyAlgorithmBytes = payload.subarray(offset, offset + keyAlgorithmByteLength);
//             offset += keyAlgorithmByteLength;
//             const keyBytes = payload.subarray(offset, offset + wrappedKeyLength);
//             offset += wrappedKeyLength;
//             const counter = payload[offset];
//             log.debug('In authentication function1.3.3');
//             const wrappingKey = await getWrappingKey(pin, salt);
//             const wrapAlgorithm: AesGcmParams = {
//                 iv,
//                 name: 'AES-GCM',
//             };
//             const unwrappingKeyAlgorithm = JSON.parse(new TextDecoder().decode(keyAlgorithmBytes));
//             window.crypto.subtle.unwrapKey(
//                 keyExportFormat,
//                 keyBytes,
//                 wrappingKey,
//                 wrapAlgorithm,
//                 unwrappingKeyAlgorithm,
//                 true,
//                 ['sign'],
//             ).then(res, rej);
//         });
//     });
// };
// export const incrementCounter = async (key: string, pin: string, incrementValue: number = 1): Promise<void> => {
//     return new Promise(async (res, rej) => {
//         chrome.storage.sync.get(key, async (resp) => {
//             if (!!chrome.runtime.lastError) {
//                 rej(chrome.runtime.lastError);
//                 return;
//             }
//             let payload = base64ToByteArray(resp[key], true);
//             const saltByteLength = payload[0];
//             const ivByteLength = payload[1];
//             const keyAlgorithmByteLength = payload[2];
//             const wrappedKeyLength = payload[3];
//             let offset = 4;
//             offset += saltByteLength;
//             offset += ivByteLength;
//             offset += keyAlgorithmByteLength;
//             offset += wrappedKeyLength;
//             // Update the counder
//             payload[offset] = payload[offset] + incrementValue;
//             chrome.storage.sync.set({ [key]: byteArrayToBase64(payload, true) }, () => {
//                 if (!!chrome.runtime.lastError) {
//                     rej(chrome.runtime.lastError);
//                 } else {
//                     res();
//                 }
//             });
//         });
//     });
// }
// export const fetchCounter = async (key: string, pin: string): Promise<number> => {
//     return new Promise<number>(async (res, rej) => {
//         chrome.storage.sync.get(key, async (resp) => {
//             if (!!chrome.runtime.lastError) {
//                 rej(chrome.runtime.lastError);
//                 return;
//             }
//             const payload = base64ToByteArray(resp[key], true);
//             const saltByteLength = payload[0];
//             const ivByteLength = payload[1];
//             const keyAlgorithmByteLength = payload[2];
//             const wrappedKeyLength = payload[3];
//             let offset = 4;
//             offset += saltByteLength;
//             offset += ivByteLength;
//             offset += keyAlgorithmByteLength;
//             offset += wrappedKeyLength;
//             const counter = payload[offset];
//             res(counter);
//         });
//     });
// }
const saveKey = (key, privateKey, pin) => {
    return new Promise(async (res, rej) => {
        if (!pin) {
            rej('no pin provided');
            return;
        }
        const salt = crypto.getRandomValues(new Uint8Array(saltLength));
        const wrappingKey = await getWrappingKey(pin, salt);
        const iv = crypto.getRandomValues(new Uint8Array(ivLength));
        const wrapAlgorithm = {
            iv,
            name: 'AES-GCM',
        };
        const wrappedKeyBuffer = await crypto.subtle.wrapKey(keyExportFormat, privateKey, wrappingKey, wrapAlgorithm);
        const wrappedKey = new Uint8Array(wrappedKeyBuffer);
        const keyAlgorithm = new TextEncoder().encode(JSON.stringify(privateKey.algorithm));
        const counter = 11;
        const payload = concatenate(Uint8Array.of(saltLength, ivLength, keyAlgorithm.length, wrappedKey.length), salt, iv, keyAlgorithm, wrappedKey, Uint8Array.from([counter]));
        chrome.storage.sync.set({ [key]: byteArrayToBase64(payload, true) }, () => {
            if (!!chrome.runtime.lastError) {
                rej(chrome.runtime.lastError);
            }
            else {
                res();
            }
        });
    });
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/* unused harmony exports DirectAttestationError, NoKeysRequestedError, generateRegistrationKeyAndAttestation */
/* harmony import */ var cbor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(881);
/* harmony import */ var cbor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cbor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(772);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(987);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(727);
/* provided dependency */ var Buffer = __webpack_require__(287)["Buffer"];


// import { fetchCounter, fetchKey, incrementCounter, keyExists, saveKey } from './storage';


const DIRECT_ATTESTATION_ERROR = 'We are being requested to create a key with "direct" attestation\nWe can only perform self-attestation, therefore we will not be provisioning any keys';
const NO_KEYS_REQUESTED_ERROR = 'No keys requested';
class DirectAttestationError extends Error {
    constructor() {
        super(DIRECT_ATTESTATION_ERROR);
    }
}
class NoKeysRequestedError extends Error {
    constructor() {
        super(NO_KEYS_REQUESTED_ERROR);
    }
}
// export const generateRegistrationKeyAndAttestation2 = async (
//     origin: string,
//     publicKeyCreationOptions: PublicKeyCredentialCreationOptions,
//     pin: string,
// ): Promise<PublicKeyCredential> => {
//     if (publicKeyCreationOptions.attestation === 'direct') {
//         console.log('We are being requested to create a key with "direct" attestation');
//         console.log(`We can only perform self-attestation, therefore we will not be provisioning any keys`);
//         return null;
//     }
//     const rp = publicKeyCreationOptions.rp;
//     const rpID = rp.id || getDomainFromOrigin(origin);
//     const user = publicKeyCreationOptions.user;
//     const userID = byteArrayToBase64(new Uint8Array(user.id as ArrayBuffer));
//     // Generate a random string
//     const randomString = Math.random().toString(36).substr(2, 8);
//     const keyID = window.btoa(`${userID}@${rpID}_${randomString}`);
//     // First check if there is already a key for this rp ID
//     if (await keyExists(keyID)) {
//         throw new Error(`key with id ${keyID} already exists`);
//     }
//     console.log('key ID', keyID);
//     const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);
//     // TODO Increase key counter
//     const authenticatorData = await compatibleKey.generateAuthenticatorData2(rpID, 10);
//     const clientData = await compatibleKey.generateClientData(
//         publicKeyCreationOptions.challenge as ArrayBuffer,
//         { origin, type: 'webauthn.create' },
//     );
//     console.log('client Data', clientData);
//     console.log('rpID passed to crypto function', rpID);
//     const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
//     // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
//     const clientDataHash = new Uint8Array(clientDataDigest);
//     console.log('original hash', clientDataHash);
//     console.log('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
//     console.log('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
//     console.log('authenticator Data uint8', authenticatorData);
//     const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
//     mergedArray.set(authenticatorData);
//     mergedArray.set(clientDataHash, authenticatorData.length);
//     console.log('merged Data uint8', mergedArray);
//     const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));
//     const attestationObject = CBOR.encodeCanonical({
//         attStmt: {
//             alg: compatibleKey.algorithm,
//             sig: signature,
//         },
//         authData: authenticatorData,
//         fmt: 'packed',
//     }).buffer;
//     // Now that we have built all we need, let's save the key
//     await saveKey(keyID, compatibleKey.privateKey, pin);
//     return {
//         getClientExtensionResults: () => ({}),
//         id: keyID,
//         rawId: base64ToByteArray(keyID),
//         response: {
//             attestationObject,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData)),
//         },
//         type: 'public-key',
//     } as PublicKeyCredential;
// };
const generateRegistrationKeyAndAttestation = async (origin, publicKeyCreationOptions, pin, main_id, rawId) => {
    if (publicKeyCreationOptions.attestation === 'direct') {
        console.log(DIRECT_ATTESTATION_ERROR);
        throw new DirectAttestationError();
    }
    const CKEY_ID = new Uint8Array(rawId); // new Uint8Array([
    // 36, 65, 66, 13, 125, 104, 97, 45, 53, 176, 41, 199, 63, 83, 90, 66, 239, 228, 27, 183]);
    const rp = publicKeyCreationOptions.rp;
    const rpID = rp.id || getDomainFromOrigin(origin);
    const user = publicKeyCreationOptions.user;
    const userID = byteArrayToBase64(new Uint8Array(user.id), true);
    const keyID = byteArrayToBase64(CKEY_ID, true);
    // First check if there is already a key for this rp ID
    if (await keyExists(keyID)) {
        throw new Error(`key with id ${keyID} already exists`);
    }
    console.log('key ID', keyID);
    console.log('key ID type', typeof keyID);
    console.log('pub key cred params', publicKeyCreationOptions.pubKeyCredParams);
    const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);
    const authenticatorData = await compatibleKey.generateAuthenticatorData(rpID, 10, rawId);
    const clientData = await compatibleKey.generateClientData(publicKeyCreationOptions.challenge, { origin, type: 'webauthn.create' });
    console.log('client Data', clientData);
    console.log('rpID passed to crypto function', rpID);
    const clientDataDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
    const clientDataHash = new Uint8Array(clientDataDigest);
    console.log('original hash', clientDataHash);
    console.log('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
    console.log('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
    console.log('authenticator Data uint8', authenticatorData);
    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    console.log('merged Data uint8', mergedArray);
    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));
    const attestationObject_buffer = CBOR.encodeCanonical({
        attStmt: {
            alg: compatibleKey.algorithm,
            sig: signature,
        },
        authData: authenticatorData,
        fmt: 'packed',
    });
    console.log('stepp 6');
    // .buffer might break this
    const attestationObject = new Uint8Array(attestationObject_buffer.buffer);
    console.log('raw attestation object', attestationObject);
    // Now that we have built all we need, let's save the key
    await saveKey(keyID, compatibleKey.privateKey, pin);
    return {
        getClientExtensionResults: () => ({}),
        id: keyID,
        rawId: base64ToByteArray(keyID, true),
        response: {
            attestationObject,
            clientDataJSON: base64ToByteArray(btoa(clientData), true),
        },
        type: 'public-key',
    };
};
// function str2ab(str) {
//   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
//   var bufView = new Uint16Array(buf);
//   for (var i=0, strLen=str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }
// export const generateKeyRequestAndAttestation = async (
//     origin: string,
//     publicKeyRequestOptions: PublicKeyCredentialRequestOptions,
//     pin: string,
// ): Promise<Credential> => {
//     console.log('In authentication function1');
//     if (!publicKeyRequestOptions.allowCredentials) {
//         console.log(NO_KEYS_REQUESTED_ERROR);
//         throw new NoKeysRequestedError();
//     }
//     // For now we will only worry about the first entry
//     const requestedCredential = publicKeyRequestOptions.allowCredentials[0];
//     console.log(requestedCredential);
//     const keyIDArray: ArrayBuffer = requestedCredential.id as ArrayBuffer;
//     console.log('In authentication function1.2', keyIDArray);
//     const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);
//     console.log('In authentication function1.3', keyID);
//     const key = await fetchKey(keyID, pin);
//     console.log('In authentication function2');
//     if (!key) {
//         throw new Error(`key with id ${keyID} not found`);
//     }
//     const compatibleKey = await getCompatibleKeyFromCryptoKey(key);
//     const clientData = await compatibleKey.generateClientData(
//         publicKeyRequestOptions.challenge as ArrayBuffer,
//         {
//             origin,
//             type: 'webauthn.get',
//         },
//     );
//     console.log('In authentication function3');
//     const rpID = publicKeyRequestOptions.rpId || getDomainFromOrigin(origin);
//     const authenticatorData = await compatibleKey.generateAuthenticatorData(
//       rpID,
//       await fetchCounter(keyID, pin),
//       Array.from(new Uint8Array(keyIDArray)),
//     );
//     const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
//     const clientDataHash = new Uint8Array(clientDataDigest);
//     // Increment counter
//     await incrementCounter(keyID, pin);
//     const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
//     mergedArray.set(authenticatorData);
//     mergedArray.set(clientDataHash, authenticatorData.length);
//     console.log('merged array', mergedArray);
//     const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));
//     return {
//         id: keyID,
//         rawId: keyIDArray,
//         response: {
//             authenticatorData,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
//             signature,
//             // userHandle: new ArrayBuffer(0), // This should be nullable
//             userHandle: null
//         },
//         type: 'public-key',
//     } as Credential;
// };

})();

/******/ })()
;
//# sourceMappingURL=webauthn.js.map
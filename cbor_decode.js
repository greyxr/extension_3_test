import * as CBOR from 'cbor'

const decoded_func = (base64url) => {
    // Replace URL-safe characters
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' if necessary
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode to a binary string
    const binaryString = atob(base64);
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

const good_cbor_string = 'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUOusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWBdAAAAAOqbjWZNAR0hPOS2tIy1ddQAELtBHSxK38AfBIyMoLutT2alAQIDJiABIVgga35QvgMdrnLHnE-gK55utNvP6jDjmHLZwPMLs5eopd8iWCAP6ZObDry-g_uAINGMH3Wb1qlq6YoqdaJ8qkqsQvq1mg'
const bad_cbor_string = 'o2dhdHRTdG10oGhhdXRoRGF0YViUOusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWBBAAAACgAAAAAAAAAAAAAAAAAAAAAAEHmWRVp6yL5EuDoSgCFziwqlAQIDJiABIVggLJSrHiIx3V-VTE53eNRvZOxQIUtAunFQf863Hyj8WZoiWCDXPR3_Q-WLIsnUfsUZTHBTPQJLj10lZ35nF6PzrZCdk2NmbXRkbm9uZQ'

console.log('Decoding good cbor string')
const good_cbor_bytes = decoded_func(good_cbor_string)
const decoded_good_cbor = CBOR.decodeFirstSync(good_cbor_bytes)
console.log('Decoded good cbor:', decoded_good_cbor)

console.log('Decoding bad cbor string')
const bad_cbor_bytes = decoded_func(bad_cbor_string)
const decoded_bad_cbor = CBOR.decodeFirstSync(bad_cbor_bytes)
console.log('Decoded bad cbor:', decoded_bad_cbor)
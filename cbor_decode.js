import pkg from 'cbor';
const { decodeFirstSync } = pkg;

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

function parseAuthData(authDataBuffer) {
  const view = new DataView(authDataBuffer.buffer, authDataBuffer.byteOffset, authDataBuffer.byteLength);
  let offset = 0;

  const rpIdHash = authDataBuffer.slice(offset, offset + 32);
  offset += 32;

  const flags = authDataBuffer[offset];
  offset += 1;

  const signCount = view.getUint32(offset, false); // big-endian
  offset += 4;

  const result = {
    rpIdHash,
    flags,
    signCount,
  };

  const attested = (flags & 0x40) !== 0;
  if (attested) {
    const aaguid = authDataBuffer.slice(offset, offset + 16);
    offset += 16;

    const credIdLen = view.getUint16(offset, false);
    offset += 2;

    const credId = authDataBuffer.slice(offset, offset + credIdLen);
    offset += credIdLen;

    const cosePublicKey = authDataBuffer.slice(offset);

    Object.assign(result, {
      aaguid,
      credIdLen,
      credId,
      cosePublicKey
    });
  }

  return result;
}

function formatAAGUID(aaguidBytes) {
  const hex = [...aaguidBytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}


// const good_cbor_string = 'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUOusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWBdAAAAAOqbjWZNAR0hPOS2tIy1ddQAELtBHSxK38AfBIyMoLutT2alAQIDJiABIVgga35QvgMdrnLHnE-gK55utNvP6jDjmHLZwPMLs5eopd8iWCAP6ZObDry-g_uAINGMH3Wb1qlq6YoqdaJ8qkqsQvq1mg'
// const bad_cbor_string = 'OusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWAFAAAADA-VTE53eNRvZOxQIUtAunFQf863Hyj8WZoiWCDXPR3_Q-WLIsnUfsUZTHBTPQJLj10lZ35nF6PzrZCdk2NmbXRkbm9uZQ'

// console.log('Decoding good cbor string')
// const good_cbor_bytes = decoded_func(good_cbor_string)
// const decoded_good_cbor = decodeFirstSync(good_cbor_bytes)
// const good_authData_buffer = decoded_good_cbor.authData
// const parsed_good_data = parseAuthData(good_authData_buffer)
// console.log(formatAAGUID(parsed_good_data.aaguid))
// console.log(parsed_good_data.flags)

// console.log('Decoding bad cbor string')
// const bad_cbor_bytes = decoded_func(bad_cbor_string)
// const decoded_bad_cbor = decodeFirstSync(bad_cbor_bytes)
// const bad_authData_buffer = decoded_bad_cbor.authData
// const parsed_bad_data = parseAuthData(bad_authData_buffer)
// console.log(formatAAGUID(parsed_bad_data.aaguid))
// console.log(parsed_bad_data.flags)

const goodauthDataEncoded = 'OusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWAdAAAAAA'
const badauthDataEncoded = 'OusAJGA4HG8ljoOV0wJvVx8NmnZIjc2DdjmxOu0xZWAFAAAADA'
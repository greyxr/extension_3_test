export interface WebAuthnRequestMessage {
  type: 'create' | 'sign';
  originalCredential: string;
  options: string;
  requestID: number;
}

export interface WebAuthnResponseMessage {
  type: 'create_response' | 'sign_response';
  requestID: number;
  resp: {
    credential: string;
  };
}

export interface WebAuthnErrorMessage {
  type: 'error';
  requestID: number;
  exception: string;
} 
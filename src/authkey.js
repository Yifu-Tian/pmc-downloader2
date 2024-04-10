import React, { useState } from 'react';

const AuthKeyPrompt = ({ onAuthKeySubmit }) => {
  const [authKey, setAuthKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuthKeySubmit(authKey);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Please enter your auth key:
          <input
            type="text"
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Auth key"
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AuthKeyPrompt;


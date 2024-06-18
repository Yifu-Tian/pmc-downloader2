import React from 'react';
import './styles.css';

const ProxyModal = ({ show, onClose, onEnable, useProxy }) => {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Use Proxy</h2>
	{useProxy ? (
          <p>Proxy is enabled.</p>
	) : (
	  <p>Please click the button below to enable the proxy service before you use the downloader.</p>
	)}
	{!useProxy && <button onClick={() => window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank')}>Enable</button>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ProxyModal;


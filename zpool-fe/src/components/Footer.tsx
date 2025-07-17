import React from 'react';
import '../styles/components/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="App-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>ZPool</h3>
          <p>Private & Secure Token Pool powered by FHE technology</p>
        </div>
        <div className="footer-section">
          <h4>Technology</h4>
          <ul>
            <li>Fully Homomorphic Encryption (FHE)</li>
            <li>Zero-Knowledge Proofs</li>
            <li>Privacy-Preserving Transactions</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Features</h4>
          <ul>
            <li>Private Deposits</li>
            <li>Encrypted Withdrawals</li>
            <li>Anonymous Transfers</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>Documentation</li>
            <li>GitHub</li>
            <li>Discord</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 ZPool. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ZPOOL_ADDRESS, ZPOOL_ABI } from '../contracts';
import { useToast } from '../contexts/ToastContext';
import '../styles/components/TransferNotifications.css';

interface TransferNotificationsProps {
  account: string | null;
  rpcUrl: string;
  isConnected: boolean;
}

interface TransferEvent {
  id: string;
  from: string;
  to: string;
  token: string;
  amount: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
}

export const TransferNotifications: React.FC<TransferNotificationsProps> = ({
  account,
  rpcUrl,
  isConnected
}) => {
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const { showInfo } = useToast();

  useEffect(() => {
    if (!isConnected || !rpcUrl || !account) {
      return;
    }

    let provider: ethers.JsonRpcProvider;
    let contract: ethers.Contract;

    const setupListener = async () => {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        contract = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, provider);

        // Listen for Transfer events
        contract.on('Transfer', (from: string, to: string, token: string, amount: any, event: any) => {
          const isIncoming = to.toLowerCase() === account.toLowerCase();
          const isOutgoing = from.toLowerCase() === account.toLowerCase();
          
          if (isIncoming || isOutgoing) {
            const transferEvent: TransferEvent = {
              id: `${event.transactionHash}-${event.logIndex}`,
              from,
              to,
              token,
              amount: amount.toString(),
              timestamp: Date.now(),
              type: isIncoming ? 'incoming' : 'outgoing'
            };

            setEvents(prev => [transferEvent, ...prev.slice(0, 4)]); // Keep last 5 events

            // Show notification
            if (isIncoming) {
              showInfo(`💰 Received ${amount.toString()} tokens from ${from.slice(0, 6)}...${from.slice(-4)}`);
            } else {
              showInfo(`💸 Sent ${amount.toString()} tokens to ${to.slice(0, 6)}...${to.slice(-4)}`);
            }
          }
        });

        // Listen for Deposit events
        contract.on('Deposit', (user: string, token: string, amount: any, event: any) => {
          if (user.toLowerCase() === account.toLowerCase()) {
            showInfo(`📥 Deposited ${amount.toString()} tokens`);
          }
        });

        // Listen for Withdraw events
        contract.on('Withdraw', (user: string, token: string, amount: any, event: any) => {
          if (user.toLowerCase() === account.toLowerCase()) {
            showInfo(`📤 Withdrew ${amount.toString()} tokens`);
          }
        });

      } catch (error) {
        console.error('Error setting up transfer notifications:', error);
      }
    };

    setupListener();

    return () => {
      if (contract) {
        contract.removeAllListeners();
      }
    };
  }, [isConnected, rpcUrl, account, showInfo]);

  if (!isConnected || events.length === 0) {
    return null;
  }

  return (
    <div className="transfer-notifications">
      <h4>Recent Transfers</h4>
      <div className="transfer-events">
        {events.map((event) => (
          <div key={event.id} className={`transfer-event ${event.type}`}>
            <div className="transfer-icon">
              {event.type === 'incoming' ? '💰' : '💸'}
            </div>
            <div className="transfer-details">
              <div className="transfer-amount">
                {event.type === 'incoming' ? '+' : '-'}{event.amount}
              </div>
              <div className="transfer-address">
                {event.type === 'incoming' 
                  ? `From: ${event.from.slice(0, 6)}...${event.from.slice(-4)}`
                  : `To: ${event.to.slice(0, 6)}...${event.to.slice(-4)}`
                }
              </div>
              <div className="transfer-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 
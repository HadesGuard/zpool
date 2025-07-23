import React, { useState, useEffect } from 'react';
import cacheService from '../services/cacheService';
import '../styles/components/CacheStats.css';

const CacheStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = cacheService.getStats();
      setStats(currentStats);
    };

    // Update stats immediately
    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    cacheService.clear();
    setStats(cacheService.getStats());
  };

  if (!stats) return null;

  return (
    <div className="cache-stats">
      <button 
        className="cache-stats-toggle"
        onClick={() => setIsVisible(!isVisible)}
      >
        📦 Cache Stats ({stats.size}/{stats.maxSize})
      </button>
      
      {isVisible && (
        <div className="cache-stats-panel">
          <div className="cache-stats-header">
            <h3>Cache Statistics</h3>
            <button onClick={handleClearCache} className="clear-cache-btn">
              🗑️ Clear All
            </button>
          </div>
          
          <div className="cache-stats-content">
            <div className="cache-stats-summary">
              <div className="stat-item">
                <span className="stat-label">Total Entries:</span>
                <span className="stat-value">{stats.size}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max Size:</span>
                <span className="stat-value">{stats.maxSize}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Usage:</span>
                <span className="stat-value">
                  {Math.round((stats.size / stats.maxSize) * 100)}%
                </span>
              </div>
            </div>
            
            {stats.entries.length > 0 && (
              <div className="cache-entries">
                <h4>Recent Entries:</h4>
                <div className="entries-list">
                  {stats.entries.slice(0, 10).map((entry: any, index: number) => (
                    <div key={index} className="entry-item">
                      <div className="entry-key">{entry.key}</div>
                      <div className="entry-info">
                        <span className="entry-age">
                          Age: {Math.round(entry.age / 1000)}s
                        </span>
                        <span className="entry-ttl">
                          TTL: {Math.round(entry.ttl / 1000)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStats; 
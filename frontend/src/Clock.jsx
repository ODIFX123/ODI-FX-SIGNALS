import { useEffect, useState } from 'react'
import './Clock.css'

function Clock() {
  const [times, setTimes] = useState({
    london: new Date(),
    newYork: new Date(),
    tokyo: new Date(),
    sydney: new Date(),
    dubai: new Date(),
    singapore: new Date()
  })

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      setTimes({
        london: new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })),
        newYork: new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })),
        tokyo: new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })),
        sydney: new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' })),
        dubai: new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })),
        singapore: new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }))
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const timezones = [
    { name: 'London', time: times.london, emoji: '🇬🇧', offset: 'GMT' },
    { name: 'New York', time: times.newYork, emoji: '🗽', offset: 'EST/EDT' },
    { name: 'Tokyo', time: times.tokyo, emoji: '🇯🇵', offset: 'JST' },
    { name: 'Sydney', time: times.sydney, emoji: '🦘', offset: 'AEDT/AEST' },
    { name: 'Dubai', time: times.dubai, emoji: '🌴', offset: 'GST' },
    { name: 'Singapore', time: times.singapore, emoji: '🇸🇬', offset: 'SGT' }
  ];

  return (
    <div className="clock-container">
      <div className="clock-header">
        <h1>⏰ Global Market Hours</h1>
        <p>24-Hour Trading Time Zones</p>
      </div>

      <div className="timezones-grid">
        {timezones.map((tz, index) => (
          <div key={index} className="timezone-card">
            <div className="timezone-emoji">{tz.emoji}</div>
            <div className="timezone-name">{tz.name}</div>
            <div className="timezone-offset">{tz.offset}</div>
            <div className="timezone-time">{formatTime(tz.time)}</div>
            <div className="timezone-date">{formatDate(tz.time)}</div>
          </div>
        ))}
      </div>

      <div className="market-status">
        <h3>📊 Market Status</h3>
        <div className="status-info">
          <p>🟢 Markets open during your local trading hours</p>
          <p>⏱️ Sync trades with these global time zones</p>
          <p>💹 XAUUSD trades 24/5</p>
        </div>
      </div>
    </div>
  );
}

export default Clock;

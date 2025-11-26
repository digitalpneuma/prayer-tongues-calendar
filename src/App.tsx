import React, { useRef } from 'react';
import { Calendar } from './components/Calendar';
import './App.css';

function App() {
  const calendarRef = useRef<{ goToToday: () => void }>(null);

  const handleTodayClick = () => {
    calendarRef.current?.goToToday();
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Prayer Tongues Calendar 2026</h1>
            <p className="subtitle">Build your prayer life progressively throughout the year</p>
          </div>
          <button onClick={handleTodayClick} className="today-button-header">
            Today
          </button>
        </div>
      </header>
      <main>
        <Calendar ref={calendarRef} />
      </main>
      <footer className="app-footer">
        <p>Track your daily prayer progress and stay committed to your spiritual growth</p>
      </footer>
    </div>
  );
}

export default App;

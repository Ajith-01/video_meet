// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import VideoCall from './VideoCall';
import { v4 as uuidv4 } from 'uuid'; // Helper for unique IDs
import './App.css'; 

// Install uuid: npm install uuid

// 1. Component to handle routing and get URL params
const MeetingPage = () => {
    // useParams() extracts route parameters (like :roomId) from the URL
    const { roomId } = useParams(); 
    
    // We need a unique ID for the current user's session.
    // In a real app, this would come from a user login token.
    // For testing, we'll generate one and store it in session storage.
    let userId = sessionStorage.getItem('currentUserId');
    if (!userId) {
        userId = uuidv4();
        sessionStorage.setItem('currentUserId', userId);
    }

    return <VideoCall roomId={roomId} userId={userId} />;
};

// 2. Main App Router
function App() {
    return (
        <Router>
            <div className="App">
                <header>
                    <h1>Real-Time Video Meeting App</h1>
                </header>
                <main>
                    <Routes>
                        {/* Landing/Home page: Simple button to start a new meeting */}
                        <Route path="/" element={<Home />} />
                        
                        {/* Meeting Room Route: Captures the Room ID */}
                        <Route path="/room/:roomId" element={<MeetingPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

// 3. Simple Home Page Component
const Home = () => {
    const startMeeting = () => {
        // Generate a new, unique room ID for a new meeting
        const newRoomId = uuidv4();
        // Navigate the user to the new room URL
        window.location.href = `/room/${newRoomId}`;
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Start a New Meeting</h2>
            <button 
                onClick={startMeeting}
                style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}
            >
                Create Meeting Link
            </button>
            <p style={{ marginTop: '20px', color: '#666' }}>
                Or manually enter a room ID in the URL: /room/your-meeting-code
            </p>
        </div>
    );
};

export default App;
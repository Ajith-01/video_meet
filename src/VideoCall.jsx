// src/VideoCall.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

// This is the URL of your Node.js Signaling Server running on port 3001
const SERVER_URL = 'https://meet-server-7l39.onrender.com'; 

// STUN Server Configuration for NAT Traversal
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

// ⭐️ NEW: Dedicated component for rendering a remote user's video
const Video = ({ peer, peerID }) => {
    const ref = useRef();

    useEffect(() => {
        // When the remote stream arrives, attach it to this video element
        peer.on("stream", stream => {
            ref.current.srcObject = stream;
        });
    }, [peer]);

    return (
        <div style={{ border: '2px solid red', width: '300px', height: '225px', position: 'relative' }}>
            <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%' }} />
            <span style={{ position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px' }}>{peerID}</span>
        </div>
    );
}


const VideoCall = ({ roomId, userId }) => {
    // Current user's video stream
    const localVideoRef = useRef(null); 
    
    // ⭐️ NEW STATE: Array to hold all connected peers for rendering
    const [peers, setPeers] = useState([]);
    
    // Ref for the Socket.io connection instance
    const socketRef = useRef(); 
    
    // Ref to manage multiple Peer connections (WebRTC objects)
    const peersRef = useRef([]); // WebRTC objects for internal logic


    // --- Helper functions for WebRTC ---
    
    // Creates the Peer object and sends the initial Offer (initiator: true)
    function createPeer(userToSignal, callerId, stream) {
        const peer = new Peer({
            initiator: true, 
            trickle: false, 
            stream,
            config: ICE_SERVERS 
        });

        peer.on('signal', signal => {
            socketRef.current.emit('sendingSignal', { userToSignal, signal, callerId });
        });
        
        // Removed: peer.on('stream', ...) because the stream handler is now in the <Video> component

        return peer;
    }

    // Creates the Peer object and sends the Answer (initiator: false)
    function addPeer(incomingSignal, callerId, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: ICE_SERVERS 
        });

        peer.on('signal', signal => {
            socketRef.current.emit('returningSignal', { signal, callerId });
        });

        peer.signal(incomingSignal);

        // Removed: peer.on('stream', ...) because the stream handler is now in the <Video> component

        return peer;
    }
    // ------------------------------------
    
    useEffect(() => {
        socketRef.current = io(SERVER_URL);
        
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideoRef.current.srcObject = stream;
                
                socketRef.current.emit('joinRoom', { roomId, userId });

                // 4. Handle 'userJoined' Event (Receiving Offer)
                socketRef.current.on('userJoined', (newUserId) => {
                    const peer = createPeer(newUserId, socketRef.current.id, stream);
                    
                    peersRef.current.push({ peerID: newUserId, peer });
                    setPeers(currentPeers => [...currentPeers, { peerID: newUserId, peer }]); // Add to state
                });

                // 5. Handle 'userSignal' Event (Receiving Offer)
                socketRef.current.on('userSignal', (payload) => {
                    const peer = addPeer(payload.signal, payload.callerId, stream);
                    
                    peersRef.current.push({ peerID: payload.callerId, peer });
                    setPeers(currentPeers => [...currentPeers, { peerID: payload.callerId, peer }]); // Add to state
                });

                // 6. Handle 'receivingReturnSignal' Event (Receiving the Answer)
                socketRef.current.on('receivingReturnSignal', (payload) => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                       item.peer.signal(payload.signal);
                    }
                });

                // 7. Handle 'userLeft' Event (Clean up)
                socketRef.current.on('userLeft', (id) => {
                    const peerObj = peersRef.current.find(p => p.peerID === id);
                    if (peerObj) {
                        peerObj.peer.destroy();
                    }
                    
                    // Update Ref and State
                    peersRef.current = peersRef.current.filter(p => p.peerID !== id);
                    setPeers(currentPeers => currentPeers.filter(p => p.peerID !== id));
                });
            })
            .catch(error => {
                console.error("Error accessing media devices: ", error);
                alert("Please allow camera and microphone access to join the meeting.");
            });

        // Cleanup function for useEffect 
        return () => {
             // Clean up all peer connections before disconnecting socket
             peersRef.current.forEach(peerObj => peerObj.peer.destroy());
             peersRef.current = [];
             setPeers([]);
             if (socketRef.current) {
                 socketRef.current.disconnect();
             }
        };
    }, [roomId, userId]); 


    // Simple UI rendering
    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                
                {/* 1. Local Video */}
                <div style={{ border: '2px solid green', width: '300px', height: '225px', position: 'relative' }}>
                    <video ref={localVideoRef} muted autoPlay playsInline style={{ width: '100%', height: '100%' }} />
                    <span style={{ position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px' }}>{userId} (You)</span>
                </div>

                {/* 2. Remote Videos: Map over the 'peers' state array */}
                {peers.map((peerObj) => (
                    <Video key={peerObj.peerID} peer={peerObj.peer} peerID={peerObj.peerID} />
                ))}

            </div>
        </div>
    );
};

export default VideoCall;
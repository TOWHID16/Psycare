// phycare/frontend/src/contexts/CallContext.jsx

import React, { createContext, useState, useEffect, useRef, useContext } from "react";
import Peer from "peerjs";
import { SocketContext } from "./SocketContext.jsx";
import { useAuth } from "./AuthContext.jsx";

export const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallContextProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const { currentUser } = useAuth();
    
    const [stream, setStream] = useState(null);
    const [call, setCall] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [myPeer, setMyPeer] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [otherUserId, setOtherUserId] = useState(null); // Tracks the other user in the call
    const myVideo = useRef(null);

    useEffect(() => {
        if (currentUser && socket && !myPeer) {
            // --- CHANGE: Added the debug level to the Peer constructor ---
            const peer = new Peer(undefined, {
                debug: 2, // Provides detailed logs for troubleshooting
            });
            setMyPeer(peer);

            peer.on('open', (id) => {
                socket.emit('peer-ready', { userId: currentUser._id, peerId: id });
            });

            peer.on('call', (incomingCall) => {
                setCall(incomingCall);
            });
            
            socket.on('call-ended', () => {
                leaveCall(false); // Clean up locally if the other user hangs up
            });
            
            return () => { 
                socket.off('call-ended');
                peer.destroy(); 
            };
        }
    }, [currentUser, socket]);
    
    const startMediaStream = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
        } catch (error) {
            console.error("CallContext: ERROR accessing media devices:", error);
        }
    };

    const callUser = (recipientUserId, appointmentId) => {
        socket.emit('get-peer-id', { userId: recipientUserId }, (recipientPeerId) => {
            if (recipientPeerId && stream && myPeer) {
                setOtherUserId(recipientUserId); // Keep track of who we are calling
                const options = { metadata: { appointmentId } };
                const outgoingCall = myPeer.call(recipientPeerId, stream, options);
                setCall(outgoingCall);

                outgoingCall.on('stream', (remoteUserStream) => {
                    setRemoteStream(remoteUserStream);
                    setCallAccepted(true);
                });
            } else {
                console.error("PeerJS: Recipient is not available or stream is not ready.");
            }
        });
    };

    const answerCall = () => {
        if (call && stream) {
            setOtherUserId(call.peer); // Keep track of the caller's Peer ID
            call.answer(stream);
            setCallAccepted(true);
            
            call.on('stream', (remoteUserStream) => {
                setRemoteStream(remoteUserStream);
            });

            // Clear the incoming call object to dismiss any notifications
            setCall(null);
        }
    };

    const leaveCall = (shouldSignal = true) => {
        // Tell the other user the call is ending
        if (shouldSignal && otherUserId) {
            socket.emit('end-call', { to: otherUserId });
        }

        if (call) call.close();
        setCall(null);
        setCallAccepted(false);
        setRemoteStream(null);
        setOtherUserId(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const rejectCall = () => {
        if (call) {
            call.close();
        }
        setCall(null);
    };

    return (
        <CallContext.Provider value={{ myVideo, stream, remoteStream, call, callAccepted, startMediaStream, callUser, answerCall, leaveCall, rejectCall }}>
            {children}
        </CallContext.Provider>
    );
};
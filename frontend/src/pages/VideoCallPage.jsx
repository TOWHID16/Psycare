// phycare/frontend/src/pages/VideoCallPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const VideoCallPage = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { 
        myVideo, stream, remoteStream, call, callAccepted, 
        startMediaStream, callUser, answerCall, leaveCall,
        isMuted, isVideoOff, toggleAudio, toggleVideo // Make sure to get toggle functions
    } = useCall();
    const userVideo = useRef();

    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        if (remoteStream && userVideo.current) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        const setup = async () => {
            try {
                await startMediaStream();
                const response = await api.get(`/appointments/${appointmentId}`);
                const appointment = response.data.data;

                if (currentUser.role === 'doctor') {
                    const patient = { _id: appointment.patientId._id, name: appointment.patientId.name };
                    setOtherUser(patient);
                } else {
                    const doctor = { _id: appointment.doctorId._id, name: appointment.doctorId.fullName };
                    setOtherUser(doctor);
                }
            } catch (error)
 {
                console.error("Failed to setup call:", error);
            }
        };
        setup();
        
        return () => leaveCall();
    }, [appointmentId, currentUser]);
    
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#202124', color: 'white' }}>
            {callAccepted && <video ref={userVideo} playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {stream && <video ref={myVideo} playsInline muted autoPlay style={{ position: 'absolute', bottom: '20px', right: '20px', width: '250px' }} />}
            
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                {/* Patient is receiving an incoming call */}
                {call && !callAccepted && currentUser.role === 'patient' && (
                    <div>
                        <p>Dr. {otherUser?.name} is calling...</p>
                        <button onClick={answerCall} style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Answer</button>
                    </div>
                )}
                
                {/* --- CHANGE #1: Display a "Start Call" button for the doctor to prevent race condition --- */}
                {!callAccepted && otherUser && !call && currentUser.role === 'doctor' && (
                    <div>
                        <p>Ready to call {otherUser.name}?</p>
                        <button onClick={() => callUser(otherUser._id, appointmentId)} style={{ padding: '10px 20px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Start Call
                        </button>
                    </div>
                )}

                {/* Patient is waiting for the call */}
                {!callAccepted && otherUser && !call && currentUser.role === 'patient' && (
                    <p>Waiting for Dr. {otherUser.name} to start the call...</p>
                )}

                {/* Message for when the doctor is actively calling */}
                {call && !callAccepted && currentUser.role === 'doctor' && (
                     <p>Calling {otherUser.name}...</p>
                )}
            </div>
            
            {/* --- CHANGE #2: Restored the full set of call control buttons --- */}
            {stream && (
                <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' }}>
                    <button onClick={toggleAudio} style={{ background: isMuted ? '#dc3545' : '#3c4043', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer' }}>
                        {isMuted ? <MicOff /> : <Mic />}
                    </button>
                    <button onClick={() => navigate(-1)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '70px', height: '50px', cursor: 'pointer' }}>
                        <PhoneOff />
                    </button>
                    <button onClick={toggleVideo} style={{ background: isVideoOff ? '#dc3545' : '#3c4043', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer' }}>
                        {isVideoOff ? <VideoOff /> : <Video />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default VideoCallPage;
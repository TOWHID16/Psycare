// phycare/frontend/src/components/IncomingCallNotification.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { useAuth } from '../contexts/AuthContext';

const IncomingCallNotification = () => {
    // --- CHANGE #1: Get the new rejectCall function ---
    const { call, rejectCall } = useCall(); 
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleAcceptCall = () => {
        if (call && call.metadata && call.metadata.appointmentId) {
            navigate(`/call/${call.metadata.appointmentId}`);
        } else {
            console.error("Cannot accept call: appointmentId is missing.");
        }
    };

    if (!call || !call.peer || currentUser.role !== 'patient') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            padding: '16px', background: 'white', color: 'black', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '280px'
        }}>
            <div style={{ textAlign: 'center' }}>
                <p>
                    <span style={{ fontWeight: 'bold' }}>Incoming Video Call</span>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                    <button 
                        onClick={handleAcceptCall} 
                        style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    >
                        <Phone size={20} />
                    </button>
                    {/* --- CHANGE #2: Attach the rejectCall function to the button's onClick handler --- */}
                    <button 
                        onClick={rejectCall}
                        style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallNotification;
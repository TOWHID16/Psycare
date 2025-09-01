// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Contexts ---
import { AuthProvider } from './contexts/AuthContext';
import { SocketContextProvider } from './contexts/SocketContext';
import { CallContextProvider } from './contexts/CallContext';

// --- Pages and Components ---
import HomePage from './pages/HomePage.jsx';
import SignupOptionsPage from './pages/SignupOptionsPage.jsx';
import PatientSignupPage from './pages/PatientSignupPage.jsx';
import DoctorSignupForm from './pages/DoctorSignupForm.jsx';
import PatientLoginPage from './pages/PatientLoginPage.jsx';
import DoctorLoginPage from './pages/DoctorLoginPage.jsx';
import PatientApp from './pages/PatientApp.jsx';
import DoctorApp from './pages/DoctorApp.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import IncomingCallNotification from './components/IncomingCallNotification.jsx';
import VideoCallPage from './pages/VideoCallPage.jsx';

// --- Layouts ---

// Layout for public pages with Navbar and Footer
const PublicLayout = () => (
  <>
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </>
);

// Layout for login/signup pages
const AuthLayout = () => (
    <Outlet />
);

// --- Main App Component ---

export default function App() {
  return (
    <AuthProvider>
      <SocketContextProvider>
        <CallContextProvider>
          <div className="flex flex-col min-h-screen"> 
            <ToastContainer position="top-right" autoClose={3000} theme="light" />
            
            {/* This component will now listen for calls globally */}
            <IncomingCallNotification />

            <Routes>
              {/* Public Pages */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/signup-options" element={<SignupOptionsPage />} />
              </Route>

              {/* Auth Pages */}
              <Route element={<AuthLayout />}>
                <Route path="/patient-login" element={<PatientLoginPage />} />
                <Route path="/doctor-login" element={<DoctorLoginPage />} />
                <Route path="/patient-signup" element={<PatientSignupPage />} />
                <Route path="/doctor-signup" element={<DoctorSignupForm />} />
              </Route>

              {/* Protected Pages */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app/*" element={<PatientApp />} />
                <Route path="/doctor/*" element={<DoctorApp />} />
                {/* New route for the video call page */}
                <Route path="/call/:appointmentId" element={<VideoCallPage />} />
              </Route>
            </Routes>
          </div>
        </CallContextProvider>
      </SocketContextProvider>
    </AuthProvider>
  );
}
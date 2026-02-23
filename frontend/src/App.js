import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/ParticipantDashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetail from './pages/EventDetail';
import ParticipantClubs from './pages/ParticipantClubs';
import ParticipantProfile from './pages/ParticipantProfile';
import OrganizerDetailParticipant from './pages/OrganizerDetailParticipant';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerProfile from './pages/OrganizerProfile';
import OngoingEvents from './pages/OngoingEvents';
import EventDetailOrganizer from './pages/EventDetailOrganizer';
import EventFeedback from './pages/EventFeedback';
import PaymentApprovals from './pages/PaymentApprovals';
import QRScanner from './pages/QRScanner';
import PasswordResetRequest from './pages/PasswordResetRequest';
import AdminDashboard from './pages/AdminDashboard';
import PasswordResetManagement from './pages/PasswordResetManagement';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes - Participant */}
            <Route
              path="/participant/dashboard"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <ParticipantDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/browse-events"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <BrowseEvents />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/event/:eventId"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <EventDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/clubs"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <ParticipantClubs />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/organizers/:organizerId"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <OrganizerDetailParticipant />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/profile"
              element={
                <PrivateRoute allowedRoles={['participant']}>
                  <ParticipantProfile />
                </PrivateRoute>
              }
            />
            
            {/* Protected Routes - Organizer */}
            <Route
              path="/organizer/dashboard"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/profile"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <OrganizerProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/ongoing-events"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <OngoingEvents />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/event/:eventId"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <EventDetailOrganizer />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/event/:eventId/feedback"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <EventFeedback />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/event/:eventId/payment-approvals"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <PaymentApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/event/:eventId/qr-scanner"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <QRScanner />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/password-reset"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <PasswordResetRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/create-event"
              element={
                <PrivateRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Protected Routes - Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/password-resets"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <PasswordResetManagement />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

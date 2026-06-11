import React, { useState, useEffect } from 'react';
import { useBooking } from './context/BookingContext';
import SearchConsole from './components/SearchConsole';
import RoomCard from './components/RoomCard';
import AdminDashboard from './components/AdminDashboard';
import { BedDouble, Shield, User, X, Check, Loader2, Lock, AlertCircle } from 'lucide-react';

export default function App() {
  const { 
    rooms, 
    bookings,
    role, 
    setRole, 
    bookingRoom, 
    setBookingRoom, 
    placeBooking, 
    isLoading,
    errorMsg,
    currentUser,
    loginUser,
    registerUser,
    logoutUser 
  } = useBooking();

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  
  // Auth Page State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [guestTab, setGuestTab] = useState('explore'); // 'explore' | 'bookings'

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isRegistering) {
      const res = await registerUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.error || 'Registration failed.');
      }
    } else {
      const res = await loginUser(authUsername, authPassword);
      if (res.success) {
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(res.error || 'Invalid credentials.');
      }
    }
  };
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [nights, setNights] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  // Initialize dates: Check-in (today), Check-out (tomorrow)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setCheckIn(formatDate(today));
    setCheckOut(formatDate(tomorrow));
  }, [bookingRoom]);

  // Update dynamic nights and totalPrice when dates or room changes
  useEffect(() => {
    if (bookingRoom && checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = end - start;
      const calculatedNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      setNights(calculatedNights);
      setTotalPrice(calculatedNights * bookingRoom.price);
    }
  }, [checkIn, checkOut, bookingRoom]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }

    const payload = {
      roomId: bookingRoom._id,
      customerName,
      checkIn,
      checkOut
    };

    const success = await placeBooking(payload);
    if (success) {
      setCustomerName('');
      alert('🎉 Booking confirmed successfully! Enjoy your stay.');
    }
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">
            <BedDouble className="w-6 h-6" />
          </div>
          <div className="logo-text">
            <h1 className="text-gradient-neon">PromptInn</h1>
            <p>AI Booking Engine</p>
          </div>
        </div>

        {/* User / Admin Switcher or User Info */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {currentUser.role === 'admin' && (
              <div className="role-switcher">
                <button
                  onClick={() => setRole('user')}
                  className={`role-btn ${role === 'user' ? 'active' : ''}`}
                >
                  <User className="w-3.5 h-3.5" /> Guest Portal
                </button>
                
                <button
                  onClick={() => setRole('admin')}
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                >
                  <Shield className="w-3.5 h-3.5" /> Admin Console
                </button>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>
                Hello, <strong style={{ color: 'white' }}>{currentUser.username}</strong>
                {currentUser.role === 'admin' && <span className="badge badge-accent" style={{ marginLeft: '6px', fontSize: '0.6rem', padding: '2px 6px' }}>Admin</span>}
              </span>
              <button
                onClick={logoutUser}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content body */}
      <main className="main-content">
        {errorMsg && (
          <div className="error-alert">
            <span className="error-dot" />
            {errorMsg}
          </div>
        )}

        {!currentUser ? (
          /* GLOBAL LOGIN / REGISTER GATEWAY */
          <div className="auth-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            minHeight: '65vh'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '420px',
              padding: '2.5rem 2rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top Accent Line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, hsl(var(--accent-primary)) 0%, hsl(var(--accent-secondary)) 100%)'
              }} />

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'hsl(var(--accent-primary) / 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: '1px solid hsl(var(--accent-primary) / 0.2)'
                }}>
                  <Lock className="w-6 h-6" style={{ color: 'hsl(var(--accent-primary))' }} />
                </div>
                <h2 className="text-gradient-neon" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '6px' }}>
                  {isRegistering ? 'Create Account' : 'Welcome to PromptInn'}
                </h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>
                  {isRegistering ? 'Register to search and book luxury hotels.' : 'Please sign in to access search and booking features.'}
                </p>
              </div>

              {authError && (
                <div className="error-alert" style={{ marginBottom: '1.5rem' }}>
                  <span className="error-dot" />
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="e.g. your_name"
                    className="form-input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem', padding: '12px' }}
                >
                  {isLoading ? 'Processing...' : isRegistering ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--accent-secondary))',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        ) : role === 'user' ? (
          /* GUEST PORTAL VIEW */
          <div className="search-console-container">
            {/* Sub-Tab Navigation for Guest */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '10px' }}>
              <button
                onClick={() => setGuestTab('explore')}
                className="btn"
                style={{
                  background: guestTab === 'explore' ? 'hsl(var(--accent-primary) / 0.12)' : 'transparent',
                  border: guestTab === 'explore' ? '1px solid hsl(var(--accent-primary) / 0.3)' : '1px solid transparent',
                  color: guestTab === 'explore' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))',
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  borderRadius: '8px'
                }}
              >
                Explore Rooms
              </button>
              <button
                onClick={() => setGuestTab('bookings')}
                className="btn"
                style={{
                  background: guestTab === 'bookings' ? 'hsl(var(--accent-primary) / 0.12)' : 'transparent',
                  border: guestTab === 'bookings' ? '1px solid hsl(var(--accent-primary) / 0.3)' : '1px solid transparent',
                  color: guestTab === 'bookings' ? 'hsl(var(--accent-primary))' : 'hsl(var(--text-secondary))',
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  borderRadius: '8px'
                }}
              >
                My Reservations ({bookings.length})
              </button>
            </div>

            {guestTab === 'explore' ? (
              <>
                <div className="guest-header">
                  <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '4px' }}>Discover Your Next Stay</h2>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Use natural language to find exactly what you want. No menus or sliders required.</p>
                </div>

                <SearchConsole />

                {/* Search Listings Grid */}
                <div className="listings-section">
                  <div className="section-title-row">
                    <h3 className="section-subtitle">
                      {isLoading ? 'Searching...' : `Available Listings (${rooms.length})`}
                    </h3>
                  </div>

                  {isLoading ? (
                    <div className="loading-container">
                      <Loader2 className="w-8 h-8" />
                      <span>Parsing prompt and querying database...</span>
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="empty-state glass-panel">
                      <p className="empty-state-title">No matching rooms found.</p>
                      <p className="empty-state-subtitle">Try softening your search parameters, e.g., "cheap hotels in London".</p>
                    </div>
                  ) : (
                    <div className="listings-grid">
                      {rooms.map((room) => (
                        <RoomCard key={room._id} room={room} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* MY RESERVATIONS VIEW */
              <div className="bookings-section" style={{ marginTop: '1rem' }}>
                <h2 className="text-gradient-neon" style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem' }}>Your Reservation History</h2>
                
                {bookings.length === 0 ? (
                  <div className="empty-state glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <p className="empty-state-title">No bookings found.</p>
                    <p className="empty-state-subtitle" style={{ marginTop: '0.5rem' }}>You haven't reserved any rooms yet. Switch to "Explore Rooms" to find your perfect stay!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookings.map((booking) => (
                      <div key={booking._id} className="glass-panel" style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {/* Room Meta details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1', minWidth: '250px' }}>
                          <img
                            src={booking.room?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80'}
                            alt={booking.room?.title}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                          />
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                              {booking.room?.title || 'Deleted Room Listing'}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                              {booking.room?.location || 'Unknown Location'}
                            </p>
                            <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                              {booking.room?.price ? `$${booking.room.price} / night` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Booking Dates */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: '600', textTransform: 'uppercase' }}>Stay Duration</span>
                          <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>
                            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                            {Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)))} night(s)
                          </span>
                        </div>

                        {/* Booking Price & Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: '120px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Total Paid</span>
                          <span className="text-gradient-neon" style={{ fontSize: '1.4rem', fontWeight: '800' }}>
                            ${booking.totalPrice}
                          </span>
                          <span className="badge badge-accent" style={{ marginTop: '6px', background: 'hsl(var(--accent-success) / 0.15)', color: '#34d399', border: '1px solid hsl(var(--accent-success) / 0.3)' }}>
                            {booking.status || 'Confirmed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ADMIN PORTAL VIEW */
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>PromptInn AI Hotel Booking Engine · Powered by Context API, Node, Express, Mongoose, and Gemini API</p>
      </footer>

      {/* Booking Input Dialog Overlay */}
      {bookingRoom && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <div className="modal-header-text">
                <span className="badge badge-accent" style={{ marginBottom: '6px', width: 'fit-content' }}>Confirm Booking</span>
                <h3 className="text-gradient-neon" style={{ fontSize: '1.25rem' }}>{bookingRoom.title}</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginTop: '2px' }}>{bookingRoom.location}</p>
              </div>
              <button
                onClick={() => setBookingRoom(null)}
                className="modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="modal-form">
              <div className="form-group">
                <label>Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="form-input-field"
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="form-input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="form-input-field"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="price-breakdown-box">
                <div className="price-breakdown-row">
                  <span>Price per night:</span>
                  <span>${bookingRoom.price}</span>
                </div>
                <div className="price-breakdown-row">
                  <span>Duration:</span>
                  <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                </div>
                <div className="price-breakdown-total">
                  <span>Total Price:</span>
                  <span>${totalPrice}</span>
                </div>
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary text-xs"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

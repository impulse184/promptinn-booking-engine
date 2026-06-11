import React, { useState, useEffect } from 'react';
import { useBooking } from './context/BookingContext';
import SearchConsole from './components/SearchConsole';
import RoomCard from './components/RoomCard';
import AdminDashboard from './components/AdminDashboard';
import { 
  BedDouble, 
  Shield, 
  User, 
  X, 
  Check, 
  Loader2, 
  Lock, 
  AlertCircle,
  Star,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle
} from 'lucide-react';

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

  // Booking & Payment States
  const [customerName, setCustomerName] = useState('');
  const [bookingStep, setBookingStep] = useState('details'); // 'details' | 'payment' | 'success'
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  
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

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    setBookingStep('payment');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      alert('Please enter complete mock card details.');
      return;
    }

    setIsPaying(true);
    // Simulate a brief mock payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const payload = {
      roomId: bookingRoom._id,
      customerName,
      checkIn,
      checkOut
    };

    const bookingResult = await placeBooking(payload);
    setIsPaying(false);
    if (bookingResult) {
      setConfirmedBooking(bookingResult);
      setBookingStep('success');
    } else {
      alert('Reservation failed. Please check room availability.');
    }
  };

  const handleCloseBookingModal = () => {
    setBookingRoom(null);
    setBookingStep('details');
    setConfirmedBooking(null);
    setCustomerName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
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
                              {booking.room?.price ? `₹${booking.room.price} / night` : 'N/A'}
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
                            ₹{booking.totalPrice}
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
          <div className="modal-content glass-panel modal-content-large" style={{ position: 'relative' }}>
            
            {/* Close Button */}
            <button
              onClick={handleCloseBookingModal}
              className="modal-close-btn"
              style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
            >
              <X className="w-5 h-5" />
            </button>

            {/* LEFT PANE: Details & Location Map */}
            <div className="details-left-pane">
              {/* Hotel Image Banner */}
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '320px', width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
                <img
                  src={bookingRoom.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"}
                  alt={bookingRoom.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{bookingRoom.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <h2 className="text-gradient-neon" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
                  {bookingRoom.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
                  <MapPin className="w-4 h-4" />
                  <span>{bookingRoom.location}</span>
                </div>
              </div>

              {/* Room Description */}
              <div>
                <h4 style={{ color: 'white', fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>About this listing</h4>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {bookingRoom.description}
                </p>
              </div>

              {/* Amenities List */}
              <div>
                <h4 style={{ color: 'white', fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>Features & Amenities</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {bookingRoom.amenities.map((amenity) => {
                    const maps = {
                      wifi: { label: 'Free Wi-Fi', class: 'badge-accent' },
                      pool: { label: 'Swimming Pool', class: 'badge-cyan' },
                      gym: { label: 'Fitness Center', class: 'badge-outline' },
                      spa: { label: 'Spa & Wellness', class: 'badge-accent' },
                      parking: { label: 'Valet Parking', class: 'badge-outline' },
                      ac: { label: 'Air Conditioning', class: 'badge-cyan' },
                      kitchen: { label: 'Fully Equipped Kitchen', class: 'badge-outline' },
                      breakfast: { label: 'Breakfast Included', class: 'badge-accent' },
                      pets: { label: 'Pet Friendly', class: 'badge-outline' }
                    };
                    const item = maps[amenity.toLowerCase()] || { label: amenity, class: 'badge-outline' };
                    return (
                      <span key={amenity} className={`badge ${item.class}`} style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px' }}>
                        {item.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Location Map */}
              <div>
                <h4 style={{ color: 'white', fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>Location Map</h4>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginBottom: '12px' }}>Explore the neighborhood and transport links below.</p>
                
                <div className="map-embed-wrapper" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', height: '260px' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(bookingRoom.mapQuery || bookingRoom.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                    title="Hotel Location Map"
                  ></iframe>
                </div>
              </div>

            </div>

            {/* RIGHT PANE: Booking, Payment, or Success Steps */}
            <div className="details-right-pane">
              
              {/* STEP 1: Details & Setup Dates */}
              {bookingStep === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Reservation Setup</span>
                    <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.35rem', marginTop: '4px' }}>Book Your Stay</h3>
                  </div>

                  <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
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

                    {/* Pricing breakdown box */}
                    <div className="price-breakdown-box" style={{ marginTop: 'auto', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="price-breakdown-row">
                        <span>Rate:</span>
                        <span style={{ color: 'white', fontWeight: '600' }}>₹{bookingRoom.price} / night</span>
                      </div>
                      <div className="price-breakdown-row">
                        <span>Duration:</span>
                        <span style={{ color: 'white', fontWeight: '600' }}>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                      </div>
                      <div className="price-breakdown-total" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '10px' }}>
                        <span>Total Estimate:</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800' }}>₹{totalPrice}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '12px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CreditCard className="w-4 h-4" />
                      Proceed to Checkout
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: Secure Mock Checkout */}
              {bookingStep === 'payment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock className="w-3 h-3" /> Secure Mock Payment
                    </span>
                    <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.35rem', marginTop: '4px' }}>Complete Checkout</h3>
                  </div>

                  <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '0.75rem', color: '#34d399', lineHeight: '1.4' }}>
                      <strong>⚠️ Simulation Gateway:</strong>
                      This is a secure mock sandbox. You can enter any mock card details to proceed. No real charges will be made.
                    </div>

                    <div className="form-group">
                      <label>Name on Card</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. JOHN DOE"
                        className="form-input-field"
                      />
                    </div>

                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength="19"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const matches = v.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];
                          for (let i=0, len=match.length; i<len; i+=4) {
                            parts.push(match.substring(i, i+4));
                          }
                          if (parts.length > 0) {
                            setCardNumber(parts.join(' '));
                          } else {
                            setCardNumber(v);
                          }
                        }}
                        placeholder="4111 2222 3333 4444"
                        className="form-input-field"
                      />
                    </div>

                    <div className="form-row-grid">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          required
                          maxLength="5"
                          value={cardExpiry}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
                            if (v.length >= 2) {
                              setCardExpiry(v.substring(0,2) + '/' + v.substring(2,4));
                            } else {
                              setCardExpiry(v);
                            }
                          }}
                          placeholder="MM/YY"
                          className="form-input-field"
                        />
                      </div>

                      <div className="form-group">
                        <label>CVC / CVV</label>
                        <input
                          type="password"
                          required
                          maxLength="3"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                          placeholder="123"
                          className="form-input-field"
                        />
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        <span>Booking Charge:</span>
                        <span>{nights} night(s) Stay</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '700', color: 'white', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                        <span>Total Price (INR):</span>
                        <span style={{ color: 'hsl(var(--accent-secondary))' }}>₹{totalPrice}</span>
                      </div>
                    </div>

                    <div className="modal-action-row" style={{ border: 'none', padding: 0 }}>
                      <button
                        type="button"
                        onClick={() => setBookingStep('details')}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isPaying}
                        className="btn btn-primary"
                        style={{ flex: 2, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {isPaying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Authorization...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Pay & Confirm
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: Booking Success! */}
              {bookingStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '1.5rem', padding: '1rem' }}>
                  
                  {/* Glowing success badge */}
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                    <CheckCircle className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.5rem', marginBottom: '6px' }}>Booking Confirmed!</h3>
                    <p style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '500' }}>Your mock payment was completed successfully.</p>
                  </div>

                  {/* Booking Receipt Summary Card */}
                  <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '4px' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Reference ID:</span>
                      <strong style={{ fontFamily: 'monospace', color: 'white' }}>{confirmedBooking?._id?.substring(0, 8).toUpperCase() || 'PINN-CONF'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Guest Name:</span>
                      <span style={{ color: 'white', fontWeight: '600' }}>{confirmedBooking?.customerName}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Room Title:</span>
                      <span style={{ color: 'white', fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingRoom.title}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Check-in:</span>
                      <span style={{ color: 'white', fontWeight: '600' }}>{new Date(checkIn).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Check-out:</span>
                      <span style={{ color: 'white', fontWeight: '600' }}>{new Date(checkOut).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'white', fontWeight: '700' }}>Total Paid:</span>
                      <strong style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: '800' }}>₹{totalPrice}</strong>
                    </div>
                  </div>

                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    A notification has been sent. You can review and manage this reservation anytime in your <strong>"My Reservations"</strong> tab.
                  </p>

                  <button
                    onClick={handleCloseBookingModal}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    Close & Explore More
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

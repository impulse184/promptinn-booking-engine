import React, { useState, useEffect } from 'react';
import { useBooking } from './context/BookingContext';
import SearchConsole from './components/SearchConsole';
import RoomCard from './components/RoomCard';
import AdminDashboard from './components/AdminDashboard';
import { BedDouble, Shield, User, X, Check, Loader2 } from 'lucide-react';

export default function App() {
  const { 
    rooms, 
    role, 
    setRole, 
    bookingRoom, 
    setBookingRoom, 
    placeBooking, 
    isLoading,
    errorMsg 
  } = useBooking();

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
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
    <div className="min-h-screen flex flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--bg-primary))]/85 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[hsl(var(--accent-primary))] to-[hsl(var(--accent-secondary))] flex items-center justify-center shadow-lg shadow-[hsl(var(--accent-primary))]/20">
            <BedDouble className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight font-heading text-white">PromptInn</h1>
            <p className="text-[0.65rem] text-[hsl(var(--accent-secondary))] font-bold uppercase tracking-wider">AI Booking Engine</p>
          </div>
        </div>

        {/* User / Admin Switcher */}
        <div className="flex bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setRole('user')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold font-heading transition-all cursor-pointer ${
              role === 'user'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Guest Portal
          </button>
          
          <button
            onClick={() => setRole('admin')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold font-heading transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Admin Console
          </button>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {errorMsg && (
          <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {errorMsg}
          </div>
        )}

        {role === 'user' ? (
          /* GUEST PORTAL VIEW */
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-extrabold font-heading text-gradient">Discover Your Next Stay</h2>
              <p className="text-slate-400 text-sm">Use natural language to find exactly what you want. No menus or sliders required.</p>
            </div>

            <SearchConsole />

            {/* Search Listings Grid */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {isLoading ? 'Searching...' : `Available Listings (${rooms.length})`}
                </h3>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                  <Loader2 className="w-8 h-8 text-[hsl(var(--accent-primary))] animate-spin" />
                  <span className="text-sm font-medium">Parsing prompt and querying database...</span>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-16 glass-panel border-dashed border-slate-800 text-slate-500">
                  <p className="text-base font-semibold text-slate-400">No matching rooms found.</p>
                  <p className="text-xs mt-1">Try softening your search parameters, e.g., "cheap hotels in London".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rooms.map((room) => (
                    <RoomCard key={room._id} room={room} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ADMIN PORTAL VIEW */
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950/40 border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-medium mt-auto">
        <p>PromptInn AI Hotel Booking Engine · Powered by Context API, Node, Express, Mongoose, and Gemini API</p>
      </footer>

      {/* Booking Input Dialog Overlay */}
      {bookingRoom && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="badge badge-accent mb-1.5 text-[0.65rem]">Confirm Booking</span>
                <h3 className="text-xl font-bold font-heading text-white">{bookingRoom.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{bookingRoom.location}</p>
              </div>
              <button
                onClick={() => setBookingRoom(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 text-sm mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Price per night:</span>
                  <span className="font-semibold text-slate-200">${bookingRoom.price}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Duration:</span>
                  <span className="font-semibold text-slate-200">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                </div>
                <div className="border-t border-slate-800/80 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-300">Total Price:</span>
                  <span className="text-[hsl(var(--accent-secondary))] font-heading text-base">${totalPrice}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
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

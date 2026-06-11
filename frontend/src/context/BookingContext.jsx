import React, { createContext, useState, useEffect, useContext } from 'react';

const BookingContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || '';

export const BookingProvider = ({ children }) => {
  const [prompt, setPrompt] = useState('');
  const [lastParsedQuery, setLastParsedQuery] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [rooms, setRooms] = useState([]); // Matches search
  const [allRooms, setAllRooms] = useState([]); // Admin list / all rooms
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [bookingRoom, setBookingRoom] = useState(null); // Room currently being booked
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all rooms
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setAllRooms(data);
      // If we aren't performing a custom query search, default listing shows all
      if (!prompt) {
        setRooms(data);
      }
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Cannot connect to the backend server. Make sure it is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger natural language search
  const searchByPrompt = async (searchText) => {
    if (!searchText.trim()) {
      clearSearch();
      return;
    }
    
    setIsLoading(true);
    setPrompt(searchText);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchText })
      });
      
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      setRooms(data.rooms);
      setLastParsedQuery(data.filter);
      setExplanation(data.explanation);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('AI Search error. Please verify backend state.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search state
  const clearSearch = () => {
    setPrompt('');
    setLastParsedQuery(null);
    setExplanation('');
    setRooms(allRooms);
  };

  // Admin CRUD: Create Room
  const createRoom = async (roomData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      if (!res.ok) throw new Error('Failed to create room');
      await fetchRooms();
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin CRUD: Update Room
  const updateRoom = async (id, roomData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      if (!res.ok) throw new Error('Failed to update room');
      await fetchRooms();
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin CRUD: Delete Room
  const deleteRoom = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete room');
      await fetchRooms();
      await fetchBookings();
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Bookings: Place Booking
  const placeBooking = async (bookingData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Booking failed');
      }
      
      await fetchRooms();
      await fetchBookings();
      setBookingRoom(null);
      return true;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data on load
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  return (
    <BookingContext.Provider value={{
      prompt,
      lastParsedQuery,
      explanation,
      rooms,
      allRooms,
      bookings,
      isLoading,
      role,
      bookingRoom,
      errorMsg,
      setRole,
      setBookingRoom,
      searchByPrompt,
      clearSearch,
      createRoom,
      updateRoom,
      deleteRoom,
      placeBooking,
      refreshData: fetchRooms
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

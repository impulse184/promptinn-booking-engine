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
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = sessionStorage.getItem('promptinn_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [role, setRole] = useState(() => {
    const stored = sessionStorage.getItem('promptinn_user');
    if (stored) {
      const u = JSON.parse(stored);
      return u.role;
    }
    return 'user';
  });
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

  // Fetch bookings (optional userId filter)
  const fetchBookings = async (userId) => {
    try {
      const url = userId ? `${API_BASE}/api/bookings?userId=${userId}` : `${API_BASE}/api/bookings`;
      const res = await fetch(url);
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create room');
      }
      await fetchRooms();
      return { success: true };
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      return { success: false, error: err.message };
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update room');
      }
      await fetchRooms();
      return { success: true };
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      return { success: false, error: err.message };
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
      await fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
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
        body: JSON.stringify({ ...bookingData, userId: currentUser?._id })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Booking failed');
      }
      
      const data = await res.json();
      await fetchRooms();
      await fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
      return data;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users (Admin only)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Create user (Admin)
  const createUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create user');
      }
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Update user (Admin)
  const updateUser = async (id, userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user');
      }
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Delete user (Admin)
  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
      await fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Update booking (Admin/User)
  const updateBooking = async (id, bookingData) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update booking');
      }
      await fetchRooms();
      await fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Delete booking (Admin/User)
  const deleteBooking = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete booking');
      await fetchRooms();
      await fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const loginUser = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setCurrentUser(data.user);
      sessionStorage.setItem('promptinn_user', JSON.stringify(data.user));
      setRole(data.user.role);
      setErrorMsg('');
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCurrentUser(data.user);
      sessionStorage.setItem('promptinn_user', JSON.stringify(data.user));
      setRole(data.user.role);
      setErrorMsg('');
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('promptinn_user');
    setRole('user');
  };

  // Fetch initial data on load or when user session changes
  useEffect(() => {
    fetchRooms();
    fetchBookings(currentUser?.role === 'admin' ? null : currentUser?._id);
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

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
      currentUser,
      loginUser,
      registerUser,
      logoutUser,
      setRole,
      setBookingRoom,
      searchByPrompt,
      clearSearch,
      createRoom,
      updateRoom,
      deleteRoom,
      placeBooking,
      users,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      updateBooking,
      deleteBooking,
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

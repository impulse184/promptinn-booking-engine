import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  Coins, 
  BedDouble, 
  FileText, 
  CheckCircle, 
  Users, 
  UserPlus, 
  Calendar 
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    allRooms, 
    bookings, 
    users,
    currentUser,
    createRoom, 
    updateRoom, 
    deleteRoom,
    createUser,
    updateUser,
    deleteUser,
    updateBooking,
    deleteBooking
  } = useBooking();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'bookings', 'users'
  
  // Room Form Modal States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    rating: '4.5',
    amenitiesString: '',
    image: '',
    totalRooms: '5'
  });

  // User Form Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });

  // Booking Form Modal States
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    customerName: '',
    roomId: '',
    checkIn: '',
    checkOut: ''
  });

  // --- Room Operations ---
  const resetRoomForm = () => {
    setRoomFormData({
      title: '',
      description: '',
      location: '',
      price: '',
      rating: '4.5',
      amenitiesString: '',
      image: '',
      totalRooms: '5'
    });
  };

  const handleOpenAddRoom = () => {
    resetRoomForm();
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      title: room.title,
      description: room.description,
      location: room.location,
      price: room.price.toString(),
      rating: room.rating.toString(),
      amenitiesString: room.amenities.join(', '),
      image: room.image,
      totalRooms: room.totalRooms.toString(),
      availableRooms: room.availableRooms.toString()
    });
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    const cleanAmenities = roomFormData.amenitiesString
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0);

    const payload = {
      title: roomFormData.title,
      description: roomFormData.description,
      location: roomFormData.location,
      price: Number(roomFormData.price),
      rating: Number(roomFormData.rating),
      amenities: cleanAmenities,
      image: roomFormData.image,
      totalRooms: Number(roomFormData.totalRooms)
    };

    if (editingRoom) {
      payload.availableRooms = Number(roomFormData.availableRooms) || Number(roomFormData.totalRooms);
      const success = await updateRoom(editingRoom._id, payload);
      if (success) setEditingRoom(null);
    } else {
      const success = await createRoom(payload);
      if (success) setShowAddRoomModal(false);
    }
  };

  const handleRoomDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing? This will also cancel all related reservations.')) {
      await deleteRoom(id);
    }
  };

  // --- User Operations ---
  const resetUserForm = () => {
    setUserFormData({
      username: '',
      password: '',
      role: 'user'
    });
  };

  const handleOpenAddUser = () => {
    resetUserForm();
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: user.password || '',
      role: user.role
    });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: userFormData.username,
      password: userFormData.password,
      role: userFormData.role
    };

    if (editingUser) {
      const res = await updateUser(editingUser._id, payload);
      if (res.success) {
        setEditingUser(null);
      } else {
        alert(res.error);
      }
    } else {
      const res = await createUser(payload);
      if (res.success) {
        setShowAddUserModal(false);
      } else {
        alert(res.error);
      }
    }
  };

  const handleUserDelete = async (id) => {
    if (id === currentUser?._id) {
      alert("You cannot delete your own administrative account!");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their reservations.')) {
      await deleteUser(id);
    }
  };

  // --- Booking Operations ---
  const handleOpenEditBooking = (booking) => {
    setEditingBooking(booking);
    setBookingFormData({
      customerName: booking.customerName,
      roomId: booking.room?._id || '',
      checkIn: new Date(booking.checkIn).toISOString().split('T')[0],
      checkOut: new Date(booking.checkOut).toISOString().split('T')[0]
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customerName: bookingFormData.customerName,
      roomId: bookingFormData.roomId,
      checkIn: bookingFormData.checkIn,
      checkOut: bookingFormData.checkOut
    };

    const res = await updateBooking(editingBooking._id, payload);
    if (res.success) {
      setEditingBooking(null);
    } else {
      alert(res.error);
    }
  };

  const handleBookingDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel/delete this booking? The room vacancy will be automatically restored.')) {
      await deleteBooking(id);
    }
  };

  // --- Calculations ---
  const totalBookings = bookings.length;
  const activeRooms = allRooms.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalAvailableRooms = allRooms.reduce((sum, r) => sum + r.availableRooms, 0);

  return (
    <div className="admin-dashboard-container">
      {/* Admin Header */}
      <div className="admin-header-row">
        <div className="admin-header-text">
          <h2 className="text-gradient-neon">Administrator Workspace</h2>
          <p>Manage listings, rooms, guest reservations, and user accounts.</p>
        </div>
        
        {activeTab === 'inventory' && (
          <button onClick={handleOpenAddRoom} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Plus className="w-4 h-4" /> Add Room Listing
          </button>
        )}
        {activeTab === 'users' && (
          <button onClick={handleOpenAddUser} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        )}
      </div>

      {/* Analytics Stats Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <BedDouble className="w-5 h-5" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Listings</span>
            <span className="stat-value">{activeRooms}</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{totalBookings}</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <Coins className="w-5 h-5" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Gross Revenue</span>
            <span className="stat-value" style={{ color: '#10b981' }}>${totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <Users className="w-5 h-5" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Users List</span>
            <span className="stat-value">{users.length} users</span>
          </div>
        </div>
      </div>

      {/* Glassmorphic Tab switcher */}
      <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '6px', marginBottom: '24px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <BedDouble className="w-4 h-4" /> Room Inventory
        </button>
        
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <FileText className="w-4 h-4" /> Guest Bookings
        </button>

        <button 
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Users className="w-4 h-4" /> User Management
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="admin-workspace-grid" style={{ gridTemplateColumns: '1fr', display: 'block' }}>
        
        {/* TAB 1: Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="admin-section-card glass-panel" style={{ width: '100%' }}>
            <h3 className="admin-section-card-title">
              <BedDouble className="w-4 h-4 text-gradient-neon" /> Active Listings
            </h3>
            
            <div className="table-responsive">
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>Room Details</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Inventory</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allRooms.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem 0' }}>
                        No rooms found. Click "Add Room Listing" to populate listings.
                      </td>
                    </tr>
                  ) : (
                    allRooms.map((room) => (
                      <tr key={room._id}>
                        <td className="table-room-meta">
                          <img src={room.image} alt={room.title} className="table-room-img" />
                          <div className="table-room-text">
                            <div className="table-room-title">{room.title}</div>
                            <div className="table-room-desc">{room.description}</div>
                          </div>
                        </td>
                        <td style={{ color: 'hsl(var(--text-secondary))' }}>{room.location}</td>
                        <td style={{ fontWeight: '700', color: 'white' }}>${room.price}/night</td>
                        <td>
                          <span style={{ fontWeight: '600' }}>
                            {room.availableRooms} / {room.totalRooms}
                          </span>
                        </td>
                        <td>
                          <div className="table-action-row" style={{ justifyContent: 'flex-end' }}>
                            <button onClick={() => handleOpenEditRoom(room)} className="action-btn-small action-btn-edit" title="Edit Listing">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRoomDelete(room._id)} className="action-btn-small action-btn-delete" title="Delete Listing">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="admin-section-card glass-panel" style={{ width: '100%' }}>
            <h3 className="admin-section-card-title">
              <FileText className="w-4 h-4 text-gradient-neon" /> Guest Reservations Log
            </h3>
            
            <div className="table-responsive">
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Booked Room</th>
                    <th>Price</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem 0' }}>
                        No reservations logged yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td style={{ fontWeight: '600', color: 'white' }}>{booking.customerName}</td>
                        <td style={{ color: 'hsl(var(--text-secondary))' }}>{booking.room?.title || 'Deleted Room'}</td>
                        <td style={{ fontWeight: '700', color: '#10b981' }}>${booking.totalPrice}</td>
                        <td style={{ color: 'hsl(var(--text-secondary))' }}>{new Date(booking.checkIn).toLocaleDateString()}</td>
                        <td style={{ color: 'hsl(var(--text-secondary))' }}>{new Date(booking.checkOut).toLocaleDateString()}</td>
                        <td>
                          <div className="table-action-row" style={{ justifyContent: 'flex-end' }}>
                            <button onClick={() => handleOpenEditBooking(booking)} className="action-btn-small action-btn-edit" title="Edit Booking Details">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleBookingDelete(booking._id)} className="action-btn-small action-btn-delete" title="Cancel Reservation">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Users Management */}
        {activeTab === 'users' && (
          <div className="admin-section-card glass-panel" style={{ width: '100%' }}>
            <h3 className="admin-section-card-title">
              <Users className="w-4 h-4 text-gradient-neon" /> Registered User Accounts
            </h3>
            
            <div className="table-responsive">
              <table className="listings-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role Badge</th>
                    <th>Password (Plaintext)</th>
                    <th>Account Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem 0' }}>
                        No users registered in database.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: '16px 12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span>{user.username}</span>
                        </td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: 'hsl(var(--text-muted))' }}>{user.password}</td>
                        <td style={{ color: 'hsl(var(--text-secondary))' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="table-action-row" style={{ justifyContent: 'flex-end' }}>
                            <button onClick={() => handleOpenEditUser(user)} className="action-btn-small action-btn-edit" title="Edit User">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleUserDelete(user._id)} 
                              className="action-btn-small action-btn-delete" 
                              title="Delete Account"
                              disabled={user._id === currentUser?._id}
                              style={{ opacity: user._id === currentUser?._id ? 0.3 : 1, cursor: user._id === currentUser?._id ? 'not-allowed' : 'pointer' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL 1: Add / Edit Room Listing --- */}
      {(showAddRoomModal || editingRoom) && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 className="text-gradient-neon" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {editingRoom ? 'Modify Hotel Room Listing' : 'Publish New Room Listing'}
            </h3>
            
            <form onSubmit={handleRoomSubmit} className="modal-form">
              <div className="form-group">
                <label>Listing Title</label>
                <input
                  type="text"
                  required
                  value={roomFormData.title}
                  onChange={(e) => setRoomFormData({ ...roomFormData, title: e.target.value })}
                  placeholder="e.g. Kyoto Traditional Machiya Loft"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  rows="3"
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                  placeholder="Describe the room, building, experience, and accessibility..."
                  className="form-input-field"
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    required
                    value={roomFormData.location}
                    onChange={(e) => setRoomFormData({ ...roomFormData, location: e.target.value })}
                    placeholder="e.g. Kyoto, Japan"
                    className="form-input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Nightly Rate (USD)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomFormData.price}
                    onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })}
                    placeholder="e.g. 150"
                    className="form-input-field"
                  />
                </div>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Total Inventory Count</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={roomFormData.totalRooms}
                    onChange={(e) => setRoomFormData({ ...roomFormData, totalRooms: e.target.value })}
                    placeholder="e.g. 5"
                    className="form-input-field"
                  />
                </div>

                {editingRoom && (
                  <div className="form-group">
                    <label>Currently Available</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={roomFormData.totalRooms}
                      value={roomFormData.availableRooms}
                      onChange={(e) => setRoomFormData({ ...roomFormData, availableRooms: e.target.value })}
                      placeholder="e.g. 3"
                      className="form-input-field"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Amenities (comma-separated list)</label>
                <input
                  type="text"
                  value={roomFormData.amenitiesString}
                  onChange={(e) => setRoomFormData({ ...roomFormData, amenitiesString: e.target.value })}
                  placeholder="wifi, pool, spa, ac, kitchen, breakfast, pets, gym, parking"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={roomFormData.image}
                  onChange={(e) => setRoomFormData({ ...roomFormData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="form-input-field"
                />
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setEditingRoom(null);
                  }}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                
                <button type="submit" className="btn btn-primary text-xs" style={{ padding: '8px 16px' }}>
                  {editingRoom ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Add / Edit User Account --- */}
      {(showAddUserModal || editingUser) && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <h3 className="text-gradient-neon" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {editingUser ? 'Modify User Profile' : 'Register New User Account'}
            </h3>
            
            <form onSubmit={handleUserSubmit} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  placeholder="e.g. johndoe"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="text"
                  required
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="e.g. pass1234"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Access Role</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="form-input-field"
                  style={{ backgroundColor: 'rgba(15,23,42,0.85)', color: 'white' }}
                >
                  <option value="user">User (Guest)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                  }}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                
                <button type="submit" className="btn btn-primary text-xs" style={{ padding: '8px 16px' }}>
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Edit Booking Details --- */}
      {editingBooking && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '480px' }}>
            <h3 className="text-gradient-neon" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Edit Reservation Details
            </h3>
            
            <form onSubmit={handleBookingSubmit} className="modal-form">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.customerName}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, customerName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Assigned Room</label>
                <select
                  required
                  value={bookingFormData.roomId}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, roomId: e.target.value })}
                  className="form-input-field"
                  style={{ backgroundColor: 'rgba(15,23,42,0.85)', color: 'white' }}
                >
                  <option value="" disabled>Select a room listing</option>
                  {allRooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.title} (${room.price}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label>Check In Date</label>
                  <input
                    type="date"
                    required
                    value={bookingFormData.checkIn}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, checkIn: e.target.value })}
                    className="form-input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Check Out Date</label>
                  <input
                    type="date"
                    required
                    value={bookingFormData.checkOut}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, checkOut: e.target.value })}
                    className="form-input-field"
                  />
                </div>
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                
                <button type="submit" className="btn btn-primary text-xs" style={{ padding: '8px 16px' }}>
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

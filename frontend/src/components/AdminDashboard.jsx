import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { Plus, Edit2, Trash2, ShieldAlert, Coins, BedDouble, FileText, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { allRooms, bookings, createRoom, updateRoom, deleteRoom } = useBooking();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    rating: '4.5',
    amenitiesString: '',
    image: '',
    totalRooms: '5'
  });

  const resetForm = () => {
    setFormData({
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

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmenities = formData.amenitiesString
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0);

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      price: Number(formData.price),
      rating: Number(formData.rating),
      amenities: cleanAmenities,
      image: formData.image,
      totalRooms: Number(formData.totalRooms)
    };

    if (editingRoom) {
      payload.availableRooms = Number(formData.availableRooms) || Number(formData.totalRooms);
      const success = await updateRoom(editingRoom._id, payload);
      if (success) setEditingRoom(null);
    } else {
      const success = await createRoom(payload);
      if (success) setShowAddModal(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing? This will also remove any related bookings.')) {
      await deleteRoom(id);
    }
  };

  // Metrics Calculations
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
          <p>Manage room inventory, configure listings, and track guest reservations.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Plus className="w-4 h-4" /> Add Room Listing
        </button>
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
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Net Vacancy</span>
            <span className="stat-value">{totalAvailableRooms} rooms</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Listings Table & Bookings list */}
      <div className="admin-workspace-grid">
        
        {/* Listings Section */}
        <div className="admin-section-card glass-panel">
          <h3 className="admin-section-card-title">
            <BedDouble className="w-4 h-4 text-gradient-neon" /> Room Inventory
          </h3>
          
          <div className="table-responsive">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Room Details</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Inventory</th>
                  <th style={{ textRight: 'true', textAlign: 'right' }}>Actions</th>
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
                        <img
                          src={room.image}
                          alt={room.title}
                          className="table-room-img"
                        />
                        <div className="table-room-text">
                          <div className="table-room-title">{room.title}</div>
                          <div className="table-room-desc">{room.description}</div>
                        </div>
                      </td>
                      <td style={{ color: 'hsl(var(--text-secondary))' }}>{room.location}</td>
                      <td style={{ fontWeight: '700', color: 'white' }}>${room.price}</td>
                      <td>
                        <span style={{ fontWeight: '600' }}>
                          {room.availableRooms} / {room.totalRooms}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-row">
                          <button
                            onClick={() => handleOpenEdit(room)}
                            className="action-btn-small action-btn-edit"
                            title="Edit Listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
                            className="action-btn-small action-btn-delete"
                            title="Delete Listing"
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

        {/* Bookings Section */}
        <div className="admin-section-card glass-panel">
          <h3 className="admin-section-card-title">
            <FileText className="w-4 h-4 text-gradient-neon" /> Recent Reservations
          </h3>

          <div className="bookings-stack">
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem 0', fontSize: '0.8rem' }}>
                No reservations logged yet.
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="booking-item-card">
                  <div className="booking-item-header">
                    <span className="booking-customer-name">{booking.customerName}</span>
                    <span className="booking-price">${booking.totalPrice}</span>
                  </div>
                  
                  <div className="booking-meta-row">
                    <div>
                      Room: <span>{booking.room?.title || 'Deleted Room'}</span>
                    </div>
                    <div>
                      Dates: <span>
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Listing Modal Overlay */}
      {(showAddModal || editingRoom) && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 className="text-gradient-neon" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {editingRoom ? 'Modify Hotel Room Listing' : 'Publish New Room Listing'}
            </h3>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Listing Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Kyoto Traditional Machiya Loft"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
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
                      max={formData.totalRooms}
                      value={formData.availableRooms}
                      onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
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
                  value={formData.amenitiesString}
                  onChange={(e) => setFormData({ ...formData, amenitiesString: e.target.value })}
                  placeholder="wifi, pool, spa, ac, kitchen, breakfast, pets, gym, parking"
                  className="form-input-field"
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="form-input-field"
                />
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                  style={{ padding: '8px 16px' }}
                >
                  {editingRoom ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

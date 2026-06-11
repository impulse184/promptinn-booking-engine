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
      // Retain or reset available rooms properly based on total rooms diff
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
    <div className="w-full flex flex-col gap-8">
      {/* Admin Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-gradient-neon">Administrator Workspace</h2>
          <p className="text-slate-400 text-sm">Manage room inventory, configure listings, and track guest reservations.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Room Listing
        </button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-[hsl(var(--accent-primary))/0.15] rounded-xl text-[hsl(var(--accent-primary))]">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Active Listings</span>
            <h4 className="text-xl font-bold font-heading mt-0.5 text-white">{activeRooms}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-[hsl(var(--accent-secondary))/0.15] rounded-xl text-[hsl(var(--accent-secondary))]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Bookings</span>
            <h4 className="text-xl font-bold font-heading mt-0.5 text-white">{totalBookings}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Gross Revenue</span>
            <h4 className="text-xl font-bold font-heading mt-0.5 text-emerald-400">${totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/15 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Net Vacancy</span>
            <h4 className="text-xl font-bold font-heading mt-0.5 text-white">{totalAvailableRooms} rooms</h4>
          </div>
        </div>
      </div>

      {/* Main Grid: Listings Table & Bookings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listings Section */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold font-heading border-b border-slate-800 pb-3 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-[hsl(var(--accent-primary))]" /> Room Inventory
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="py-3 px-2">Room Details</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Inventory</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {allRooms.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No rooms found. Click "Add Room Listing" to populate listings.
                    </td>
                  </tr>
                ) : (
                  allRooms.map((room) => (
                    <tr key={room._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-2 flex items-center gap-3">
                        <img
                          src={room.image}
                          alt={room.title}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800"
                        />
                        <div>
                          <div className="font-bold text-white leading-snug">{room.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{room.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-slate-300">{room.location}</td>
                      <td className="py-4 px-2 font-bold text-white">${room.price}</td>
                      <td className="py-4 px-2">
                        <span className="text-slate-300 font-medium">
                          {room.availableRooms} / {room.totalRooms}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(room)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Edit Listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
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
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold font-heading border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[hsl(var(--accent-secondary))]" /> Recent Reservations
          </h3>

          <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No reservations logged yet.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2.5 text-xs text-slate-400"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{booking.customerName}</span>
                    <span className="font-bold text-emerald-400 text-sm">${booking.totalPrice}</span>
                  </div>
                  
                  <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-1">
                    <div>
                      <span className="text-slate-500 font-medium">Room:</span>{' '}
                      <span className="text-slate-200 font-semibold">{booking.room?.title || 'Deleted Room'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Dates:</span>{' '}
                      <span className="text-slate-300 font-medium">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-heading text-white">
              {editingRoom ? 'Modify Hotel Room Listing' : 'Publish New Room Listing'}
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Listing Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Kyoto Traditional Machiya Loft"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the room, building, experience, and accessibility..."
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Kyoto, Japan"
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Nightly Rate (USD)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 150"
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Total Inventory Count</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                    placeholder="e.g. 5"
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                  />
                </div>

                {editingRoom && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 font-medium">Currently Available</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={formData.totalRooms}
                      value={formData.availableRooms}
                      onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                      placeholder="e.g. 3"
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Amenities (comma-separated list)</label>
                <input
                  type="text"
                  value={formData.amenitiesString}
                  onChange={(e) => setFormData({ ...formData, amenitiesString: e.target.value })}
                  placeholder="wifi, pool, spa, ac, kitchen, breakfast, pets, gym, parking"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-[hsl(var(--accent-primary))]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
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

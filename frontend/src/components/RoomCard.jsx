import React from 'react';
import { useBooking } from '../context/BookingContext';
import { Star, MapPin, Calendar } from 'lucide-react';

export default function RoomCard({ room }) {
  const { setBookingRoom } = useBooking();

  // Helper to map amenity code names to beautiful display tags
  const renderAmenityBadge = (amenity) => {
    const maps = {
      wifi: { label: 'Wi-Fi', class: 'badge-accent' },
      pool: { label: 'Pool', class: 'badge-cyan' },
      gym: { label: 'Gym', class: 'badge-outline' },
      spa: { label: 'Spa', class: 'badge-accent' },
      parking: { label: 'Parking', class: 'badge-outline' },
      ac: { label: 'A/C', class: 'badge-cyan' },
      kitchen: { label: 'Kitchen', class: 'badge-outline' },
      breakfast: { label: 'Breakfast Included', class: 'badge-accent' },
      pets: { label: 'Pet-Friendly', class: 'badge-outline' }
    };

    const item = maps[amenity.toLowerCase()] || { label: amenity, class: 'badge-outline' };
    return (
      <span key={amenity} className={`badge ${item.class}`}>
        {item.label}
      </span>
    );
  };

  const isSoldOut = room.availableRooms <= 0;

  return (
    <div className="room-card glass-panel glass-panel-hover">
      {/* Room Image */}
      <div className="room-card-image-wrapper">
        <img
          src={room.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"}
          alt={room.title}
          className="room-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
          }}
        />
        <div className="room-rating-badge">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{room.rating.toFixed(1)}</span>
        </div>

        {/* Available Rooms Pill */}
        {isSoldOut ? (
          <span className="room-status-badge sold-out">
            Fully Booked
          </span>
        ) : (
          <span className={`room-status-badge ${
            room.availableRooms <= 2 ? 'low-inventory' : 'available'
          }`}>
            {room.availableRooms} {room.availableRooms === 1 ? 'room' : 'rooms'} left
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="room-card-body">
        <div className="room-card-info">
          {/* Location */}
          <div className="room-card-location">
            <MapPin className="w-3.5 h-3.5" />
            <span>{room.location}</span>
          </div>

          {/* Title */}
          <h3 className="room-card-title">
            {room.title}
          </h3>

          {/* Description */}
          <p className="room-card-desc">
            {room.description}
          </p>
        </div>

        {/* Amenities List */}
        <div className="room-card-amenities">
          {room.amenities.map(renderAmenityBadge)}
        </div>

        {/* Pricing and Action */}
        <div className="room-card-footer">
          <div className="room-card-price">
            <h4>₹{room.price}</h4>
            <span>/ night</span>
          </div>

          <button
            onClick={() => setBookingRoom(room)}
            disabled={isSoldOut}
            className={`btn btn-primary`}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

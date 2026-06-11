import React from 'react';
import { useBooking } from '../context/BookingContext';
import { Star, MapPin, Calendar, Check } from 'lucide-react';

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
      <span key={amenity} className={`badge ${item.class} text-[0.7rem] font-semibold`}>
        {item.label}
      </span>
    );
  };

  const isSoldOut = room.availableRooms <= 0;

  return (
    <div className="glass-panel glass-panel-hover flex flex-col overflow-hidden h-full">
      {/* Room Image */}
      <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
        <img
          src={room.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"}
          alt={room.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
          }}
        />
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-white">{room.rating.toFixed(1)}</span>
        </div>

        {/* Available Rooms Pill */}
        <div className="absolute bottom-3 left-4">
          {isSoldOut ? (
            <span className="px-2 py-1 text-[0.7rem] bg-rose-500/90 backdrop-blur-sm text-white font-bold rounded-md uppercase tracking-wider">
              Fully Booked
            </span>
          ) : (
            <span className={`px-2 py-1 text-[0.7rem] backdrop-blur-sm text-white font-semibold rounded-md uppercase tracking-wider ${
              room.availableRooms <= 2 ? 'bg-amber-500/90' : 'bg-slate-900/90'
            }`}>
              {room.availableRooms} {room.availableRooms === 1 ? 'room' : 'rooms'} left
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--accent-secondary))] font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span>{room.location}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white font-heading leading-tight hover:text-[hsl(var(--accent-primary))] transition-colors">
            {room.title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
            {room.description}
          </p>
        </div>

        {/* Amenities List */}
        <div className="flex flex-wrap gap-1.5 my-1">
          {room.amenities.map(renderAmenityBadge)}
        </div>

        {/* Pricing and Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div>
            <span className="text-2xl font-extrabold text-white font-heading">${room.price}</span>
            <span className="text-xs text-slate-500 font-medium"> / night</span>
          </div>

          <button
            onClick={() => setBookingRoom(room)}
            disabled={isSoldOut}
            className={`btn btn-primary text-xs font-bold py-2 px-4 ${
              isSoldOut ? 'bg-slate-800 text-slate-500 border-none cursor-not-allowed shadow-none hover:filter-none' : ''
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

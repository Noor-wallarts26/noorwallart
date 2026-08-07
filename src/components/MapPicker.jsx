import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapPicker.css';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Click & drag handler on map
const MapClickHandler = ({ position, onMarkerMove }) => {
  useMapEvents({
    click(e) {
      onMarkerMove(e.latlng.lat, e.latlng.lng);
    }
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onMarkerMove(pos.lat, pos.lng);
        }
      }}
    />
  ) : null;
};

const MapPicker = ({ onLocationSelect, defaultLat, defaultLng }) => {
  const initialCenter = {
    lat: Number(defaultLat) || 13.0827,
    lng: Number(defaultLng) || 80.2707
  };

  const [position, setPosition] = useState(
    defaultLat && defaultLng ? { lat: Number(defaultLat), lng: Number(defaultLng) } : null
  );
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [detectedAddressStr, setDetectedAddressStr] = useState('');
  const mapRef = useRef(null);

  // Reverse geocode coordinates
  const reverseGeocode = async (lat, lng) => {
    setLoadingAddress(true);
    setPermissionError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      const addrObj = data?.address || {};
      const fullAddressText = data?.display_name || '';

      setDetectedAddressStr(fullAddressText);

      onLocationSelect({
        lat,
        lng,
        address: fullAddressText,
        addressObj: addrObj
      });
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      onLocationSelect({ lat, lng, address: '', addressObj: {} });
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMarkerMove = (lat, lng) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  // GPS "Use My Current Location" Handler
  const handleGetCurrentLocation = (e) => {
    if (e) e.preventDefault();
    setPermissionError('');

    if (!navigator.geolocation) {
      setPermissionError("Location permission is required to automatically detect your current location. You can also manually select your location on the map.");
      return;
    }

    setLoadingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);

        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 16);
        }

        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setLoadingAddress(false);
        console.warn("Geolocation permission error:", err);
        setPermissionError("Location permission is required to automatically detect your current location. You can also manually select your location on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="map-picker-container" style={{ marginBottom: '1.25rem' }}>
      <div className="map-picker-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
          <MapPin size={18} color="#10B981" />
          Google Maps Location Picker
        </label>
        <button 
          className="btn-location" 
          onClick={handleGetCurrentLocation}
          type="button"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 0.95rem', borderRadius: '10px',
            backgroundColor: '#10B981', color: '#FFFFFF',
            border: 'none', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
            transition: 'background 0.2s'
          }}
        >
          <Navigation size={16} /> 
          Use My Current Location
        </button>
      </div>

      <div className="map-wrapper" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <MapContainer
          center={position || initialCenter}
          zoom={15}
          scrollWheelZoom={true}
          ref={mapRef}
          style={{ height: '280px', width: '100%', borderRadius: '12px', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler position={position} onMarkerMove={handleMarkerMove} />
        </MapContainer>
      </div>

      {loadingAddress && (
        <p style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '0.5rem' }}>
          ⏳ Reverse-geocoding coordinates...
        </p>
      )}

      {detectedAddressStr && !loadingAddress && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
          backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
          borderRadius: '8px', padding: '0.6rem 0.8rem',
          marginTop: '0.5rem', color: '#166534', fontSize: '0.82rem'
        }}>
          <CheckCircle2 size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <span><strong>Detected Location:</strong> {detectedAddressStr}</span>
        </div>
      )}

      {permissionError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5',
          borderRadius: '8px', padding: '0.6rem 0.8rem',
          marginTop: '0.5rem', color: '#991B1B', fontSize: '0.82rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{permissionError}</span>
        </div>
      )}

      {!position && !loadingAddress && !permissionError && (
        <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.4rem' }}>
          💡 Tap <strong>Use My Current Location</strong> above or click anywhere on the map to pin your exact delivery spot.
        </p>
      )}
    </div>
  );
};

export default MapPicker;

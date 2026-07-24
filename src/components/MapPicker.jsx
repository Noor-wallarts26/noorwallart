import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapPicker.css';

// Fix for default Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle clicks on the map and update marker
const MapEvents = ({ position, setPosition, fetchAddress }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    }
  });

  // Re-center map when position changes programmatically (like GPS)
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPos = marker.getLatLng();
          setPosition(newPos);
          fetchAddress(newPos.lat, newPos.lng);
        },
      }}
    />
  ) : null;
};

const MapPicker = ({ onLocationSelect, defaultAddress }) => {
  // Default to somewhere in Chennai or India
  const defaultCenter = { lat: 13.0827, lng: 80.2707 }; 
  
  const [position, setPosition] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAddress = async (lat, lng) => {
    setLoadingAddress(true);
    setErrorMsg('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      const data = await response.json();
      
      if (data && data.display_name) {
        onLocationSelect({
          lat,
          lng,
          address: data.display_name,
          addressObj: data.address
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setErrorMsg("Could not fetch address automatically. Please type it.");
      onLocationSelect({ lat, lng, address: '' });
    }
    setLoadingAddress(false);
  };

  const handleGetCurrentLocation = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setLoadingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        fetchAddress(latitude, longitude);
      },
      (err) => {
        setLoadingAddress(false);
        setErrorMsg("Unable to retrieve your location. Please check your browser permissions.");
      }
    );
  };

  return (
    <div className="map-picker-container">
      <div className="map-picker-header">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={18} color="var(--primary)" />
          Pin your location
        </label>
        <button 
          className="btn-location" 
          onClick={handleGetCurrentLocation}
          title="Use my current GPS location"
        >
          <Navigation size={16} /> 
          Allow your live location
        </button>
      </div>

      <div className="map-wrapper">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents 
            position={position} 
            setPosition={setPosition} 
            fetchAddress={fetchAddress} 
          />
        </MapContainer>
      </div>
      
      {loadingAddress && <p className="map-loading-text">Getting address...</p>}
      {errorMsg && <p className="map-error-text">{errorMsg}</p>}
      {!position && !loadingAddress && (
        <p className="map-hint-text">Click on the map or use the GPS button to set your delivery location.</p>
      )}
    </div>
  );
};

export default MapPicker;

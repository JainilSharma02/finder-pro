import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MessageCircle, Star, MapPin, Navigation, Info, Layers, ExternalLink } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/messageTemplate';

// Google Maps Tile Configurations
const MAP_STYLES = {
  streets: {
    label: 'Default',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
  },
  satellite: {
    label: 'Satellite',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>'
  }
};

/**
 * Creates a Google Maps style pin icon.
 */
const createGooglePin = (isFocused = false, index = null) => {
  const pinColor = isFocused ? '#22D3D8' : '#EA4335';
  const shadowColor = isFocused ? 'rgba(34,211,216,0.6)' : 'rgba(234,67,53,0.5)';

  return new L.DivIcon({
    className: 'custom-google-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 6px ${shadowColor}); transform: translate(-50%, -100%);">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 24 30" fill="none">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 10.5 29.25 11.25 29.85C11.47 30.03 11.74 30.12 12 30.12C12.26 30.12 12.53 30.03 12.75 29.85C13.5 29.25 24 20.25 24 12C24 5.37 18.63 0 12 0Z" fill="${pinColor}"/>
          <circle cx="12" cy="11" r="5" fill="#FFFFFF"/>
          <circle cx="12" cy="11" r="2.5" fill="${isFocused ? '#0A0A0B' : '#EA4335'}"/>
        </svg>
        ${index !== null ? `<span style="position: absolute; top: 5px; font-size: 9px; font-weight: 800; color: #FFFFFF; pointer-events: none;">${index}</span>` : ''}
        <div style="width: 10px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: -2px;"></div>
      </div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38]
  });
};

/**
 * Controller to manage smooth map flying and bounds fitting
 */
const MapController = ({ validLeads, focusLead }) => {
  const map = useMap();
  const prevLeadsLengthRef = useRef(0);

  useEffect(() => {
    if (focusLead && focusLead.coordinates && focusLead.coordinates.lat) {
      map.flyTo([focusLead.coordinates.lat, focusLead.coordinates.lon], 16, {
        duration: 1.2
      });
    } else if (validLeads.length > 0 && validLeads.length !== prevLeadsLengthRef.current) {
      prevLeadsLengthRef.current = validLeads.length;
      const bounds = L.latLngBounds(validLeads.map(l => [l.coordinates.lat, l.coordinates.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [validLeads, focusLead, map]);

  return null;
};

const LeadMap = ({ leads = [], focusLead = null, className = '' }) => {
  const [mapStyle, setMapStyle] = useState('streets');
  const [mapCenter, setMapCenter] = useState([21.1702, 72.8311]); // Default India (Surat area)
  const [zoom, setZoom] = useState(13);

  // Filter leads with valid coordinates
  const validLeads = leads.filter(l => l.coordinates && typeof l.coordinates.lat === 'number' && typeof l.coordinates.lon === 'number');

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(15);
      });
    }
  };

  const currentLayer = MAP_STYLES[mapStyle] || MAP_STYLES.streets;

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden border border-surface-border bg-[#0A0A0B] shadow-2xl ${className}`}>
      
      {/* Top Bar: Google Maps Style Layer Switcher */}
      <div className="absolute top-4 right-4 z-[800] flex items-center bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-surface-border">
        <div className="flex items-center gap-1">
          {Object.entries(MAP_STYLES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setMapStyle(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapStyle === key
                  ? 'bg-primary text-black shadow-sm font-bold'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Left: Google Maps Brand Badge */}
      <div className="absolute top-4 left-4 z-[800]">
        <div className="px-3.5 py-1.5 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-surface-border rounded-xl flex items-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EA4335] animate-ping" />
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
            <span className="text-foreground-muted font-normal ml-0.5">Maps View</span>
          </span>
        </div>
      </div>

      {/* Bottom Left: Interactive Leads Counter */}
      <div className="absolute bottom-6 left-6 z-[800]">
        <div className="px-4 py-2 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-surface-border rounded-xl flex items-center gap-2 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-[#EA4335]" />
          <span className="text-xs font-bold text-foreground">
            {validLeads.length} Pins Placed
          </span>
        </div>
      </div>

      {/* Bottom Right: Location GPS button */}
      <div className="absolute bottom-6 right-6 z-[800] flex flex-col gap-2">
        <button
          onClick={handleGetCurrentLocation}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-surface-border flex items-center justify-center text-foreground hover:text-primary transition-all shadow-xl active:scale-95"
          title="Center on my location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />

        {/* Clean Google Maps Tile Layer - No Watermarks! */}
        <TileLayer
          key={mapStyle}
          attribution={currentLayer.attribution}
          url={currentLayer.url}
          subdomains={currentLayer.subdomains}
          maxZoom={currentLayer.maxZoom}
        />

        <MapController validLeads={validLeads} focusLead={focusLead} />

        {validLeads.map((lead, idx) => {
          const isFocused = focusLead && (focusLead.placeId === lead.placeId || focusLead._id === lead._id);

          return (
            <Marker
              key={lead.placeId || lead._id || idx}
              position={[lead.coordinates.lat, lead.coordinates.lon]}
              icon={createGooglePin(isFocused)}
            >
              <Popup className="google-style-popup">
                <div className="p-3 w-64 text-slate-900 dark:text-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold leading-snug line-clamp-2">
                      {lead.businessName}
                    </h4>
                    {lead.rating && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[11px] font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {lead.rating}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">
                    {lead.category || 'Business'}
                  </p>

                  <div className="space-y-1.5 mb-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#EA4335] mt-0.5 shrink-0" />
                      <p className="line-clamp-2 leading-relaxed">{lead.address}</p>
                    </div>

                    {lead.phone && (
                      <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <span>📞</span>
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <a
                      href={buildWhatsAppUrl(lead.whatsappNumber || lead.phone, `Hi ${lead.businessName}, found you on Lead Finder Pro.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    {lead.mapsLink && (
                      <a
                        href={lead.mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Global CSS for Google Maps style popups and markers */}
      <style>{`
        .leaflet-container {
          background: #e5e3df !important;
          font-family: inherit;
        }
        .google-style-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          color: #1a1a1a !important;
          border-radius: 14px !important;
          padding: 0 !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
        }
        @media (prefers-color-scheme: dark) {
          .google-style-popup .leaflet-popup-content-wrapper {
            background: #18181b !important;
            color: #f4f4f5 !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
        }
        .google-style-popup .leaflet-popup-tip {
          background: #ffffff !important;
        }
        @media (prefers-color-scheme: dark) {
          .google-style-popup .leaflet-popup-tip {
            background: #18181b !important;
          }
        }
        .google-style-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .custom-google-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #333333 !important;
          border: none !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f0f0f0 !important;
        }
      `}</style>
    </div>
  );
};

export default LeadMap;

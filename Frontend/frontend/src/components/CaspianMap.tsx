import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { toNumber } from '../reportMeta';
import type { MapMarker } from '../types';

type CaspianMapProps = {
  markers: MapMarker[];
};

const markerMeta = {
  catch: { className: 'approved', label: '✓' },
  eco: { className: 'eco', label: '!' },
  risk: { className: 'warning', label: '!' },
};

export function CaspianMap({ markers }: CaspianMapProps) {
  return (
    <MapContainer center={[43.9, 51.2]} zoom={6} scrollWheelZoom className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker) => {
        const meta = markerMeta[marker.kind];
        const icon = L.divIcon({
          className: `catch-marker ${meta.className}`,
          html: `<span>${meta.label}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        return (
          <Marker
            key={marker.id}
            position={[toNumber(marker.latitude), toNumber(marker.longitude)]}
            icon={icon}
          >
            <Popup>
              <strong>{marker.title}</strong>
              <p>{marker.markerType}</p>
              <p>{marker.description}</p>
              <p><b>Плюсы:</b> {marker.pluses.join(', ')}</p>
              <p><b>Минусы:</b> {marker.minuses.join(', ')}</p>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

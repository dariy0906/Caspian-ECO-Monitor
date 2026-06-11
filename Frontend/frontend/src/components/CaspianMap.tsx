import L from 'leaflet';
import { useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { toNumber } from '../reportMeta';
import type { MapMarker } from '../types';

type MapNoteAction = 'add_plus' | 'add_minus' | 'remove_plus' | 'remove_minus';

type CaspianMapProps = {
  markers: MapMarker[];
  canEditNotes?: boolean;
  onMarkerNote?: (markerId: string, action: MapNoteAction, text: string) => Promise<void>;
};

const markerMeta = {
  catch: { className: 'approved', label: '🐟' },
  eco: { className: 'eco', label: '!' },
  risk: { className: 'warning', label: '!' },
};

export function CaspianMap({ markers, canEditNotes = false, onMarkerNote }: CaspianMapProps) {
  return (
    <MapContainer center={[43.9, 51.2]} zoom={6} scrollWheelZoom className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker) => {
        const meta = markerMeta[marker.kind];
        const loadClass =
          marker.kind === 'catch' && marker.loadLevel
            ? `catch-${marker.loadLevel}`
            : meta.className;
        const fishStats = Object.entries(marker.fishStats || {});
        const icon = L.divIcon({
          className: `catch-marker ${loadClass}`,
          html: `<span>${meta.label}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        return (
          <Marker
            key={`${marker.id}-${marker.updatedAt || ''}`}
            position={[toNumber(marker.latitude), toNumber(marker.longitude)]}
            icon={icon}
          >
            <Popup>
              <strong>{marker.title}</strong>
              <p>{marker.markerType}</p>
              <p>{marker.description}</p>
              {marker.kind === 'catch' ? (
                <div className="map-popup-analytics">
                  <p><b>Общий улов:</b> {Math.round(marker.totalWeight || 0)} кг</p>
                  <p><b>Виды рыб:</b></p>
                  <ul>
                    {fishStats.map(([fish, weight]) => (
                      <li key={fish}>🐟 {fish} — {Math.round(weight)} кг</li>
                    ))}
                  </ul>
                  <p><b>Количество уловов:</b> {marker.catchCount || 0}</p>
                </div>
              ) : null}
              <MapMarkerNotes
                marker={marker}
                canEdit={canEditNotes}
                onMarkerNote={onMarkerNote}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

function MapMarkerNotes({
  marker,
  canEdit,
  onMarkerNote,
}: {
  marker: MapMarker;
  canEdit: boolean;
  onMarkerNote?: (markerId: string, action: MapNoteAction, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(action: MapNoteAction, text: string) {
    const normalized = text.trim();
    if (!normalized || !onMarkerNote) {
      return;
    }

    setSaving(true);
    await onMarkerNote(marker.id, action, normalized);
    setDraft('');
    setSaving(false);
  }

  return (
    <div className="map-notes">
      <div>
        <b>Плюсы:</b>
        <div className="map-note-list">
          {marker.pluses.map((item) => (
            <span key={item}>
              {item}
              {canEdit ? (
                <button type="button" onClick={() => submit('remove_plus', item)} disabled={saving}>
                  убрать
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <div>
        <b>Минусы:</b>
        <div className="map-note-list">
          {marker.minuses.map((item) => (
            <span key={item}>
              {item}
              {canEdit ? (
                <button type="button" onClick={() => submit('remove_minus', item)} disabled={saving}>
                  убрать
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {canEdit ? (
        <div className="map-note-editor">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Новое наблюдение"
          />
          <div>
            <button type="button" onClick={() => submit('add_plus', draft)} disabled={saving}>
              + плюс
            </button>
            <button type="button" onClick={() => submit('add_minus', draft)} disabled={saving}>
              + минус
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

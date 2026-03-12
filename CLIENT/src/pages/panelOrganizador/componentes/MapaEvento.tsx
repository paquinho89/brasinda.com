import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapaEventoProps {
  coordenadas?: [number, number];
  direccion?: string;
  editable?: boolean;
  onChangeCoordenadas?: (coords: [number, number]) => void;
}

const defaultPosition: [number, number] = [42.135, -7.627]; // Ourense por defecto

// Definir o icono de marcador de forma compatible
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

import { useRef } from "react";

export default function MapaEvento({ coordenadas, direccion, editable = false, onChangeCoordenadas }: MapaEventoProps) {
  const position: [number, number] =
    coordenadas && coordenadas.length === 2 ? coordenadas : defaultPosition;

  function ClickHandler() {
    useMapEvent('click', (e) => {
      if (editable && onChangeCoordenadas) {
        const { lat, lng } = e.latlng;
        onChangeCoordenadas([lat, lng]);
      }
    });
    return null;
  }

  return (
    <div style={{ width: "100%", height: "300px", marginTop: 16 }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          // @ts-ignore
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {editable && <ClickHandler />}
        {coordenadas && coordenadas.length === 2 && (
          <Marker position={coordenadas} icon={markerIcon as L.Icon}>
            <Popup>{direccion || "Evento"}</Popup>
          </Marker>
        )}
      </MapContainer>
      {editable && (
        <div className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
          Fai clic no mapa para cambiar a localización do evento.
        </div>
      )}
    </div>
  );
}

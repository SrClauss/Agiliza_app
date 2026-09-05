"use client";
import React, { useEffect, useRef } from 'react';

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  onLocationChange: (lat: number, lng: number, addressText?: string) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function MapPicker({ lat, lng, radiusKm, onLocationChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const defaultLat = lat || -23.5505;
  const defaultLng = lng || -46.6333;

  useEffect(() => {
    // 1. Carregar CSS do Leaflet se ainda não existir
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Carregar JS do Leaflet se ainda não existir
    const initMap = () => {
      if (!window.L || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
      mapInstanceRef.current = map;

      // Tile Layer (OpenStreetMap CartoDB / Standard)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Icone customizado verde/roxo
      const customIcon = window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Marker arrastável
      const marker = window.L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);
      markerRef.current = marker;

      // Círculo de Raio
      const circle = window.L.circle([defaultLat, defaultLng], {
        color: '#B3F63F',
        fillColor: '#B3F63F',
        fillOpacity: 0.15,
        radius: radiusKm * 1000
      }).addTo(map);
      circleRef.current = circle;

      // Ao arrastar o marcador
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        circle.setLatLng(position);
        fetchReverseGeocode(position.lat, position.lng);
      });

      // Ao clicar no mapa
      map.on('click', async (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        fetchReverseGeocode(newLat, newLng);
      });
    };

    const fetchReverseGeocode = async (lLat: number, lLng: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lLat}&lon=${lLng}`);
        const data = await res.json();
        const road = data.address?.road || data.address?.suburb || '';
        const city = data.address?.city || data.address?.town || data.address?.municipality || '';
        const state = data.address?.state || '';
        const addrText = `${road ? road + ', ' : ''}${city}${state ? ' - ' + state : ''}`;
        onLocationChange(lLat, lLng, addrText);
      } catch (err) {
        onLocationChange(lLat, lLng);
      }
    };

    if (window.L) {
      initMap();
    } else {
      let script = document.getElementById('leaflet-js') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualizar centro/marcador quando lat/lng mudam externamente
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current && lat && lng) {
      const newPos = [lat, lng];
      markerRef.current.setLatLng(newPos);
      circleRef.current.setLatLng(newPos);
      mapInstanceRef.current.panTo(newPos);
    }
  }, [lat, lng]);

  // Atualizar tamanho do raio no mapa quando o slider muda
  useEffect(() => {
    if (circleRef.current && radiusKm) {
      circleRef.current.setRadius(radiusKm * 1000);
    }
  }, [radiusKm]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid var(--color-border)', marginTop: '10px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.75)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', textAlign: 'center', pointerEvents: 'none' }}>
        💡 Clique ou arraste o pino no mapa para ajustar sua base de operações exata
      </div>
    </div>
  );
}

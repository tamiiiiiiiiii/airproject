import { useEffect, useRef, useState } from 'react';
import './MapPickerModal.css';

const ALMATY_CENTER = [43.238949, 76.889709];
let leafletPromise;

function loadLeaflet() {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (leafletPromise) {
    return leafletPromise;
  }

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', () => reject(new Error('Leaflet load failed')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet load failed'));
    document.body.appendChild(script);
  });

  return leafletPromise;
}

export function MapPickerModal({ isOpen, loading, onClose, onConfirm }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapRef.current) {
          return;
        }

        const map = L.map(mapRef.current, {
          center: ALMATY_CENTER,
          zoom: 11,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on('click', (event) => {
          const { lat, lng } = event.latlng;
          setSelectedPoint({ lat, lon: lng });

          if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          } else {
            markerRef.current.setLatLng([lat, lng]);
          }
        });

        leafletMapRef.current = map;
      } catch (error) {
        setMapError('Не удалось загрузить карту. Проверьте интернет и попробуйте снова.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
      setSelectedPoint(null);
      markerRef.current = null;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (selectedPoint) {
      onConfirm(selectedPoint);
    }
  };

  return (
    <div className="map-picker" role="dialog" aria-modal="true" aria-labelledby="map-picker-title">
      <button className="map-picker__backdrop" onClick={onClose} aria-label="Закрыть карту" />
      <section className="map-picker__panel">
        <header className="map-picker__header">
          <h2 id="map-picker-title">Выбор района на карте</h2>
          <button type="button" onClick={onClose} className="map-picker__close">
            Закрыть
          </button>
        </header>

        <p className="map-picker__hint">
          Кликните на карту в нужном районе. Мы определим ближайшую локацию и покажем данные по
          воздуху.
        </p>

        {mapError && <p className="map-picker__error">{mapError}</p>}
        <div className="map-picker__map" ref={mapRef} />

        <div className="map-picker__actions">
          <p className="map-picker__coords">
            {selectedPoint
              ? `Выбрано: ${selectedPoint.lat.toFixed(5)}, ${selectedPoint.lon.toFixed(5)}`
              : 'Точка пока не выбрана'}
          </p>
          <button
            type="button"
            className="map-picker__confirm"
            disabled={!selectedPoint || loading}
            onClick={handleConfirm}
          >
            {loading ? 'Загрузка...' : 'Показать данные для точки'}
          </button>
        </div>
      </section>
    </div>
  );
}

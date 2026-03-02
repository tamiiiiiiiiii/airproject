import { useEffect, useRef, useState } from 'react';
import './MapPickerModal.css';

const ALMATY_CENTER = [43.238949, 76.889709];
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
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

async function findPlaces(searchText) {
  const params = new URLSearchParams({
    name: searchText,
    count: '8',
    language: 'ru',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Поиск локаций временно недоступен.');
  }

  const data = await response.json();
  return data?.results || [];
}

function placeLabel(place) {
  return [place.name, place.admin3, place.admin2, place.admin1, place.country]
    .filter(Boolean)
    .join(', ');
}

export function MapPickerModal({ isOpen, loading, initialQuery, onClose, onConfirm }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapError, setMapError] = useState('');
  const [searchText, setSearchText] = useState(initialQuery || 'Алматы');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSearchText(initialQuery || 'Алматы');
    }
  }, [isOpen, initialQuery]);

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
      } catch {
        setMapError('Не удалось загрузить карту. Проверьте интернет и попробуйте снова.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
      setSelectedPoint(null);
      setSearchError('');
      setSearchResults([]);
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

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    try {
      const found = await findPlaces(trimmed);
      setSearchResults(found);
      if (!found.length) {
        setSearchError('Ничего не найдено. Попробуйте другой вариант названия.');
      }
    } catch (error) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const choosePlace = async (place) => {
    setSelectedPoint({ lat: place.latitude, lon: place.longitude });
    const L = await loadLeaflet();

    if (!leafletMapRef.current) {
      return;
    }

    leafletMapRef.current.setView([place.latitude, place.longitude], 13);
    if (!markerRef.current) {
      markerRef.current = L.marker([place.latitude, place.longitude]).addTo(leafletMapRef.current);
    } else {
      markerRef.current.setLatLng([place.latitude, place.longitude]);
    }
  };

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
          Можете кликнуть прямо на карту или сначала найти район/улицу в поиске справа.
        </p>

        <div className="map-picker__layout">
          <div className="map-picker__map-wrap">
            {mapError && <p className="map-picker__error">{mapError}</p>}
            <div className="map-picker__map" ref={mapRef} />
          </div>

          <aside className="map-picker__search">
            <form className="map-picker__search-form" onSubmit={handleSearch}>
              <label htmlFor="map-search">Поиск района или адреса</label>
              <input
                id="map-search"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Например: Бостандыкский район"
              />
              <button type="submit" disabled={searchLoading}>
                {searchLoading ? 'Поиск...' : 'Найти на карте'}
              </button>
            </form>

            {searchError && <p className="map-picker__search-error">{searchError}</p>}

            <div className="map-picker__results">
              {searchResults.map((place) => (
                <button
                  key={`${place.id}-${place.latitude}-${place.longitude}`}
                  type="button"
                  className="map-picker__result-item"
                  onClick={() => choosePlace(place)}
                >
                  {placeLabel(place)}
                </button>
              ))}
            </div>
          </aside>
        </div>

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

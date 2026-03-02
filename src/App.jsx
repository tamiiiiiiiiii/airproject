import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Hero } from './components/Hero/Hero';
import { SearchBar } from './components/SearchBar/SearchBar';
import { AirQualityCard } from './components/AirQualityCard/AirQualityCard';
import { DailyAirTimeline } from './components/DailyAirTimeline/DailyAirTimeline';
import { AirInfoModal } from './components/AirInfoModal/AirInfoModal';
import { MapPickerModal } from './components/MapPickerModal/MapPickerModal';
import {
  fetchAirQualityByCoordinates,
  fetchAirQualityByQuery,
  fetchDistrictOptions,
} from './services/airQualityApi';

function App() {
  const [query, setQuery] = useState('Almaty');
  const [district, setDistrict] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const locationTitle = useMemo(() => {
    if (!result) {
      return 'Введите город или страну';
    }

    const { name, admin3, admin2, admin1, country } = result.location;
    return [name, admin3, admin2, admin1, country].filter(Boolean).join(', ');
  }, [result]);

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const trimmedDistrict = district.trim();

    if (!trimmedQuery) {
      setError('Введите название города или страны.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await fetchAirQualityByQuery(trimmedQuery, trimmedDistrict);
      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapConfirm = async ({ lat, lon }) => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchAirQualityByCoordinates(lat, lon);
      setResult(payload);
      setMapModalOpen(false);
      setQuery(payload.location.name || query);
      setDistrict(payload.location.admin2 || payload.location.admin3 || '');
    } catch (requestError) {
      setResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setDistrict('');
      setDistrictOptions([]);
      setDistrictsLoading(false);
      return undefined;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setDistrictsLoading(true);

      try {
        const options = await fetchDistrictOptions(trimmedQuery);
        if (!isCancelled) {
          setDistrictOptions(options);
          setDistrict((previousDistrict) =>
            previousDistrict && !options.includes(previousDistrict) ? '' : previousDistrict
          );
        }
      } catch (requestError) {
        if (!isCancelled) {
          setDistrictOptions([]);
        }
      } finally {
        if (!isCancelled) {
          setDistrictsLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <main className="app">
      <div className="app__background" aria-hidden />
      <div className="app__container">
        <Hero />

        <SearchBar
          query={query}
          district={district}
          districtOptions={districtOptions}
          districtsLoading={districtsLoading}
          loading={loading}
          onQueryChange={setQuery}
          onDistrictChange={setDistrict}
          onOpenMap={() => setMapModalOpen(true)}
          onSubmit={handleSearch}
        />

        {error && <p className="app__error">{error}</p>}

        <section className="app__content" aria-live="polite">
          {loading && <p className="app__status">Загружаем свежие данные по воздуху...</p>}

          {!loading && !result && !error && (
            <p className="app__status">
              Начните с поиска, чтобы увидеть текущий уровень загрязнения и историю за день.
            </p>
          )}

          {!loading && result && (
            <>
              <AirQualityCard
                locationTitle={locationTitle}
                current={result.current}
                timezone={result.location.timezone}
                onOpenInfo={() => setInfoModalOpen(true)}
              />
              <DailyAirTimeline hourlyData={result.hourly} />
            </>
          )}
        </section>
      </div>

      <AirInfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <MapPickerModal
        isOpen={mapModalOpen}
        loading={loading}
        initialQuery={query}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </main>
  );
}

export default App;

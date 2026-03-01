import { useMemo, useState } from 'react';
import './App.css';
import { Hero } from './components/Hero/Hero';
import { SearchBar } from './components/SearchBar/SearchBar';
import { AirQualityCard } from './components/AirQualityCard/AirQualityCard';
import { DailyAirTimeline } from './components/DailyAirTimeline/DailyAirTimeline';
import { AirInfoModal } from './components/AirInfoModal/AirInfoModal';
import { fetchAirQualityByQuery } from './services/airQualityApi';

function App() {
  const [query, setQuery] = useState('Almaty');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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

  return (
    <main className="app">
      <div className="app__background" aria-hidden />
      <div className="app__container">
        <Hero />

        <SearchBar
          query={query}
          district={district}
          loading={loading}
          onQueryChange={setQuery}
          onDistrictChange={setDistrict}
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
    </main>
  );
}

export default App;

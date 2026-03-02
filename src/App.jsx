import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Hero } from './components/Hero/Hero';
import { SearchBar } from './components/SearchBar/SearchBar';
import { AirQualityCard } from './components/AirQualityCard/AirQualityCard';
import { DailyAirTimeline } from './components/DailyAirTimeline/DailyAirTimeline';
import { AirInfoModal } from './components/AirInfoModal/AirInfoModal';
import { KazakhstanRanking } from './components/KazakhstanRanking/KazakhstanRanking';
import { fetchAirQualityByQuery, fetchKazakhstanRanking } from './services/airQualityApi';

function App() {
  const [query, setQuery] = useState('Almaty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState('');
  const [rankingUpdatedAt, setRankingUpdatedAt] = useState('');

  const locationTitle = useMemo(() => {
    if (!result) {
      return 'Введите город или страну';
    }

    const { name, admin1, country } = result.location;
    return [name, admin1, country].filter(Boolean).join(', ');
  }, [result]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setRankingLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadRanking = async () => {
      setRankingLoading(true);
      setRankingError('');

      try {
        const data = await fetchKazakhstanRanking();
        if (!cancelled) {
          setRanking(data.ranking);
          setRankingUpdatedAt(data.updatedAt);
        }
      } catch (requestError) {
        if (!cancelled) {
          setRanking([]);
          setRankingError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setRankingLoading(false);
        }
      }
    };

    loadRanking();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Введите название города или страны.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await fetchAirQualityByQuery(trimmedQuery);
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
          loading={loading}
          onQueryChange={setQuery}
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

        <KazakhstanRanking
          loading={rankingLoading}
          error={rankingError}
          updatedAt={rankingUpdatedAt}
          ranking={ranking}
        />
      </div>

      <AirInfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </main>
  );
}

export default App;

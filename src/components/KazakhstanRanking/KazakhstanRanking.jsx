import { getAqiStatus } from '../../utils/airQuality';
import './KazakhstanRanking.css';

function formatDateTime(isoString) {
  if (!isoString) {
    return '';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));
}

export function KazakhstanRanking({ loading, error, updatedAt, ranking }) {
  return (
    <section className="kz-ranking" aria-live="polite">
      <div className="kz-ranking__header">
        <h2>Рейтинг Казахстана по качеству воздуха в реальном времени</h2>
        {updatedAt && <p className="kz-ranking__updated">Обновлено: {formatDateTime(updatedAt)}</p>}
      </div>

      {loading && <p className="kz-ranking__state">Загружаем рейтинг городов...</p>}
      {!loading && error && <p className="kz-ranking__state kz-ranking__state--error">{error}</p>}

      {!loading && !error && (
        <div className="kz-ranking__list">
          {ranking.map((item) => {
            const status = getAqiStatus(item.usAqi);

            return (
              <article key={item.city} className="kz-ranking__row">
                <p className="kz-ranking__rank">#{item.rank}</p>
                <p className="kz-ranking__city">{item.city}</p>
                <p className={`kz-ranking__badge kz-ranking__badge--${status.tone}`}>
                  {Math.round(item.usAqi)} AQI
                </p>
                <p className="kz-ranking__meta">
                  PM2.5: {typeof item.pm25 === 'number' ? item.pm25.toFixed(1) : '—'} мкг/м³
                </p>
                <p className="kz-ranking__meta">{status.label}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

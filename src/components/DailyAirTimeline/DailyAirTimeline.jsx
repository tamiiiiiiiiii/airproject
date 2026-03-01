import './DailyAirTimeline.css';
import { formatHour, getAqiStatus } from '../../utils/airQuality';

function percentFromAqi(aqi) {
  const safeAqi = typeof aqi === 'number' && !Number.isNaN(aqi) ? aqi : 0;
  return Math.max(4, Math.min((safeAqi / 220) * 100, 100));
}

function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return value.toFixed(1);
}

export function DailyAirTimeline({ hourlyData }) {
  return (
    <section className="timeline">
      <header className="timeline__header">
        <h2>Почасовая динамика качества воздуха за день</h2>
        <p>В таблице: индекс качества воздуха (US AQI), PM2.5 и PM10 по каждому часу.</p>
      </header>

      <div className="timeline__legend">
        <span>Время</span>
        <span>Уровень AQI</span>
        <span>AQI</span>
        <span>PM2.5, мкг/м³</span>
        <span>PM10, мкг/м³</span>
      </div>

      <div className="timeline__list">
        {hourlyData.map((hour) => {
          const status = getAqiStatus(hour.usAqi);

          return (
            <article key={hour.time} className="timeline__row">
              <p className="timeline__time">{formatHour(hour.time)}</p>
              <div className="timeline__bar-wrap" title={`Статус: ${status.label}`}>
                <div
                  className={`timeline__bar timeline__bar--${status.tone}`}
                  style={{ width: `${percentFromAqi(hour.usAqi)}%` }}
                />
              </div>
              <p className="timeline__aqi">{hour.usAqi ?? '—'}</p>
              <p className="timeline__particulate">{formatValue(hour.pm25)}</p>
              <p className="timeline__particulate">{formatValue(hour.pm10)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

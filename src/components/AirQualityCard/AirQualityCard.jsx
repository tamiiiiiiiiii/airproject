import './AirQualityCard.css';
import { getAqiStatus } from '../../utils/airQuality';

function formatNumber(value, digits = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return value.toFixed(digits);
}

export function AirQualityCard({ locationTitle, current, timezone, onOpenInfo }) {
  const status = getAqiStatus(current.usAqi);

  return (
    <section className="air-card">
      <div className="air-card__headline">
        <div>
          <p className="air-card__location">{locationTitle}</p>
          <p className="air-card__timezone">Часовой пояс: {timezone}</p>
        </div>
        <button type="button" className="air-card__info-btn" onClick={onOpenInfo}>
          Что означают показатели?
        </button>
      </div>

      <div className="air-card__metrics">
        <div className={`air-card__aqi air-card__aqi--${status.tone}`}>
          <p className="air-card__aqi-label">Индекс качества воздуха (US AQI)</p>
          <p className="air-card__aqi-value">{formatNumber(current.usAqi)}</p>
          <p className="air-card__aqi-status">{status.label}</p>
        </div>

        <dl className="air-card__details">
          <div>
            <dt>PM2.5 (мелкие частицы до 2.5 мкм)</dt>
            <dd>{formatNumber(current.pm25, 1)} мкг/м³</dd>
          </div>
          <div>
            <dt>PM10 (частицы до 10 мкм)</dt>
            <dd>{formatNumber(current.pm10, 1)} мкг/м³</dd>
          </div>
          <div>
            <dt>NO2 (диоксид азота)</dt>
            <dd>{formatNumber(current.nitrogenDioxide, 1)} мкг/м³</dd>
          </div>
          <div>
            <dt>O3 (озон)</dt>
            <dd>{formatNumber(current.ozone, 1)} мкг/м³</dd>
          </div>
        </dl>
      </div>

      <p className="air-card__hint">
        Чем выше значение AQI и концентрации частиц, тем хуже качество воздуха.
      </p>
    </section>
  );
}

import { useEffect } from 'react';
import './AirInfoModal.css';

const RISK_LEVELS = [
  { range: '0-50', label: 'Хорошо', risk: 'Минимальный риск для здоровья.' },
  { range: '51-100', label: 'Умеренно', risk: 'При длительном воздействии возможен легкий дискомфорт.' },
  {
    range: '101-150',
    label: 'Вредно для чувствительных групп',
    risk: 'Детям, пожилым и людям с астмой лучше снизить активность на улице.',
  },
  { range: '151-200', label: 'Вредно', risk: 'Желательно ограничить долгие прогулки и спорт на воздухе.' },
  { range: '201-300', label: 'Очень вредно', risk: 'Высокий риск для всех групп населения.' },
  { range: '301+', label: 'Опасно', risk: 'Нужно избегать пребывания на улице без необходимости.' },
];

const METRICS = [
  {
    key: 'AQI',
    name: 'US AQI',
    meaning: 'Индекс качества воздуха. Чем выше число, тем грязнее воздух.',
  },
  {
    key: 'PM2.5',
    name: 'Мелкие частицы',
    meaning: 'Очень мелкая пыль, проникает глубоко в легкие и сильнее всего влияет на здоровье.',
  },
  {
    key: 'PM10',
    name: 'Крупные частицы',
    meaning: 'Пыль и аэрозоли крупнее PM2.5, раздражают дыхательные пути.',
  },
  {
    key: 'NO2',
    name: 'Диоксид азота',
    meaning: 'Газ от транспорта и промышленности, может усиливать воспаление дыхательных путей.',
  },
  {
    key: 'O3',
    name: 'Озон у поверхности',
    meaning: 'Повышается в жаркую погоду и может вызывать кашель и раздражение горла.',
  },
];

export function AirInfoModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="air-info-modal" role="dialog" aria-modal="true" aria-labelledby="air-info-title">
      <button className="air-info-modal__backdrop" onClick={onClose} aria-label="Закрыть окно" />
      <div className="air-info-modal__panel">
        <div className="air-info-modal__header">
          <h2 id="air-info-title">Что означают показатели качества воздуха</h2>
          <button className="air-info-modal__close" onClick={onClose} type="button">
            Закрыть
          </button>
        </div>

        <section className="air-info-modal__section">
          <h3>Основные показатели</h3>
          <ul className="air-info-modal__metrics">
            {METRICS.map((metric) => (
              <li key={metric.key}>
                <strong>{metric.key}</strong> - {metric.name}. {metric.meaning}
              </li>
            ))}
          </ul>
        </section>

        <section className="air-info-modal__section">
          <h3>Шкала опасности AQI</h3>
          <div className="air-info-modal__risk-list">
            {RISK_LEVELS.map((item) => (
              <article key={item.range} className="air-info-modal__risk-item">
                <p className="air-info-modal__risk-range">{item.range}</p>
                <p className="air-info-modal__risk-label">{item.label}</p>
                <p className="air-info-modal__risk-text">{item.risk}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

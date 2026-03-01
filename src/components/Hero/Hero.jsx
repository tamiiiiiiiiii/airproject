import './Hero.css';

export function Hero() {
  return (
    <header className="hero">
      <p className="hero__eyebrow">Air Scope</p>
      <h1 className="hero__title">Уровень загрязнения воздуха по городам.</h1>
      <p className="hero__subtitle">
        Введите локацию и получите текущий индекс AQI, а также почасовую картину качества
        воздуха за весь день.
      </p>
    </header>
  );
}

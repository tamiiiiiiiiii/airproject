import './SearchBar.css';

export function SearchBar({ query, district, loading, onQueryChange, onDistrictChange, onSubmit }) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <label className="search-bar__label" htmlFor="location-search">
        Поиск города
      </label>

      <div className="search-bar__controls">
        <input
          id="location-search"
          className="search-bar__input"
          type="text"
          placeholder="Например: Алматы, Токио, Москва"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <label className="search-bar__sr-only" htmlFor="district-search">
          Поиск района
        </label>
        <input
          id="district-search"
          className="search-bar__input search-bar__input--district"
          type="text"
          placeholder="Район (опционально): Бостандыкский"
          value={district}
          onChange={(event) => onDistrictChange(event.target.value)}
        />

        <button className="search-bar__button" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать данные'}
        </button>
      </div>
    </form>
  );
}

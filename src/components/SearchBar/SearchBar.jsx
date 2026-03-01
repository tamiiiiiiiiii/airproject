import './SearchBar.css';

export function SearchBar({
  query,
  district,
  districtOptions,
  districtsLoading,
  loading,
  onQueryChange,
  onDistrictChange,
  onSubmit,
}) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <label className="search-bar__label" htmlFor="location-search">
        Поиск города...
      </label>

      <div className="search-bar__controls">
        <input
          id="location-search"
          className="search-bar__input"
          type="text"
          placeholder="Например: Алматы, Tokyo, Москва"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <label className="search-bar__sr-only" htmlFor="district-select">
          Выбрать район
        </label>
        <select
          id="district-select"
          className="search-bar__select"
          value={district}
          onChange={(event) => onDistrictChange(event.target.value)}
          disabled={!query.trim() || districtsLoading}
        >
          <option value="">
            {districtsLoading
              ? 'Загрузка районов...'
              : districtOptions.length
                ? 'Район: не выбран'
                : 'Районы не найдены'}
          </option>
          {districtOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button className="search-bar__button" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать данные'}
        </button>
      </div>
    </form>
  );
}

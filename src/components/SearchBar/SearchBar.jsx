import './SearchBar.css';

export function SearchBar({ query, loading, onQueryChange, onSubmit }) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
      <label className="search-bar__label" htmlFor="location-search">
        Поиск города или страны
      </label>

      <div className="search-bar__controls">
        <input
          id="location-search"
          className="search-bar__input"
          type="text"
          placeholder="Например: Алматы, Tokyo, Germany"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <button className="search-bar__button" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать данные'}
        </button>
      </div>
    </form>
  );
}

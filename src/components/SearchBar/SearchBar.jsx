import { useEffect, useMemo, useRef, useState } from 'react';
import './SearchBar.css';

export function SearchBar({
  query,
  district,
  districtOptions,
  districtsLoading,
  loading,
  onQueryChange,
  onDistrictChange,
  onOpenMap,
  onSubmit,
}) {
  const [isDistrictOpen, setDistrictOpen] = useState(false);
  const districtMenuRef = useRef(null);

  const districtButtonText = useMemo(() => {
    if (!query.trim()) {
      return 'Сначала введите город';
    }
    if (district) {
      return `Район: ${district}`;
    }
    if (districtsLoading) {
      return 'Загрузка районов...';
    }
    return 'Выбрать район';
  }, [district, districtsLoading, query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!districtMenuRef.current?.contains(event.target)) {
        setDistrictOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleDistrictClick = (value) => {
    onDistrictChange(value);
    setDistrictOpen(false);
  };

  const canOpenDistricts = query.trim() && !districtsLoading;

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

        <div className="search-bar__district" ref={districtMenuRef}>
          <button
            type="button"
            className="search-bar__district-trigger"
            onClick={() => canOpenDistricts && setDistrictOpen((previous) => !previous)}
            disabled={!query.trim()}
            aria-expanded={isDistrictOpen}
            aria-controls="district-dropdown"
          >
            {districtButtonText}
          </button>

          {isDistrictOpen && (
            <div id="district-dropdown" className="search-bar__district-menu" role="listbox">
              {!districtOptions.length && (
                <p className="search-bar__district-empty">По этой локации районы не найдены.</p>
              )}
              {!!districtOptions.length && (
                <>
                  <button
                    type="button"
                    className="search-bar__district-option search-bar__district-option--all"
                    onClick={() => handleDistrictClick('')}
                  >
                    Без выбора района
                  </button>
                  {districtOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`search-bar__district-option ${
                        option === district ? 'search-bar__district-option--active' : ''
                      }`}
                      onClick={() => handleDistrictClick(option)}
                    >
                      {option}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <button className="search-bar__button" type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Показать данные'}
        </button>
        <button className="search-bar__map-button" type="button" onClick={onOpenMap}>
          Выбрать на карте
        </button>
      </div>
    </form>
  );
}

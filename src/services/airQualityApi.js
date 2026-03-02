const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/reverse';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const POLLUTANTS =
  'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide';
const ALMATY_DISTRICTS = [
  'Алмалинский',
  'Алатауский',
  'Ауэзовский',
  'Бостандыкский',
  'Жетысуский',
  'Медеуский',
  'Наурызбайский',
  'Турксибский',
];

function getTodayInTimezone(timezone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}

function getCurrentHourInTimezone(timezone) {
  try {
    return Number.parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      }).format(new Date()),
      10
    );
  } catch {
    return Number.parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        hour12: false,
      }).format(new Date()),
      10
    );
  }
}

function mapHourlyData(hourly) {
  return hourly.time.map((time, index) => ({
    time,
    usAqi: hourly.us_aqi[index],
    euAqi: hourly.european_aqi[index],
    pm10: hourly.pm10[index],
    pm25: hourly.pm2_5[index],
    carbonMonoxide: hourly.carbon_monoxide[index],
    nitrogenDioxide: hourly.nitrogen_dioxide[index],
    ozone: hourly.ozone[index],
    sulphurDioxide: hourly.sulphur_dioxide[index],
  }));
}

function pickCurrentHourRecord(hourlyData, timezone) {
  const currentHour = getCurrentHourInTimezone(timezone);
  let fallback = hourlyData[0];

  for (let index = 0; index < hourlyData.length; index += 1) {
    const record = hourlyData[index];
    const hour = Number.parseInt(record.time.slice(11, 13), 10);

    if (hour <= currentHour) {
      fallback = record;
    }

    if (hour === currentHour) {
      return record;
    }
  }

  return fallback;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Не удалось получить данные от сервера.');
  }

  return response.json();
}

async function fetchLocationCandidates(query) {
  const geocodingParams = new URLSearchParams({
    name: query,
    count: '30',
    language: 'ru',
    format: 'json',
  });

  const locationData = await fetchJson(`${GEOCODING_URL}?${geocodingParams.toString()}`);
  return locationData?.results || [];
}

function normalizeText(value) {
  return (value || '').toString().toLowerCase().trim();
}

function isAlmatyQuery(query) {
  const normalizedQuery = normalizeText(query);
  return (
    normalizedQuery.includes('алматы') ||
    normalizedQuery.includes('almaty') ||
    normalizedQuery.includes('алма-ата') ||
    normalizedQuery.includes('alma-ata')
  );
}

function matchDistrict(result, districtQuery) {
  const normalizedDistrict = normalizeText(districtQuery);
  if (!normalizedDistrict) {
    return true;
  }

  const fields = [result.admin1, result.admin2, result.admin3, result.name].map(normalizeText);
  return fields.some((field) => field.includes(normalizedDistrict));
}

function toLocationPayload(source, fallbackName) {
  return {
    name: source?.name || fallbackName || 'Выбранная точка',
    country: source?.country || '',
    admin1: source?.admin1 || '',
    admin2: source?.admin2 || '',
    admin3: source?.admin3 || '',
    timezone: source?.timezone || 'UTC',
    latitude: source?.latitude,
    longitude: source?.longitude,
  };
}

async function fetchAirQualityForLocation(location) {
  const timezone = location.timezone || 'UTC';
  const today = getTodayInTimezone(timezone);
  const airParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone,
    start_date: today,
    end_date: today,
    hourly: POLLUTANTS,
  });

  const airQualityData = await fetchJson(`${AIR_QUALITY_URL}?${airParams.toString()}`);
  const hourly = airQualityData?.hourly;

  if (!hourly?.time?.length) {
    throw new Error('По этой локации нет данных о качестве воздуха.');
  }

  const mappedHourly = mapHourlyData(hourly);

  return {
    location: {
      name: location.name,
      country: location.country,
      admin1: location.admin1,
      admin2: location.admin2,
      admin3: location.admin3,
      timezone,
    },
    current: pickCurrentHourRecord(mappedHourly, timezone),
    hourly: mappedHourly,
  };
}

export async function fetchAirQualityByQuery(query, district = '') {
  const results = await fetchLocationCandidates(query);
  const location = results.find((item) => matchDistrict(item, district));

  if (!location) {
    if (district.trim()) {
      throw new Error(
        'Локация найдена, но район не совпал. Попробуйте уточнить район или оставьте поле пустым.'
      );
    }
    throw new Error('Локация не найдена. Попробуйте другое название.');
  }

  return fetchAirQualityForLocation(toLocationPayload(location));
}

export async function fetchAirQualityByCoordinates(lat, lon) {
  const reverseParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    count: '1',
    language: 'ru',
    format: 'json',
  });

  const reverseData = await fetchJson(`${REVERSE_GEOCODING_URL}?${reverseParams.toString()}`);
  const nearest = reverseData?.results?.[0];

  const location = toLocationPayload(
    nearest
      ? {
          ...nearest,
          latitude: lat,
          longitude: lon,
        }
      : {
          latitude: lat,
          longitude: lon,
        }
  );

  return fetchAirQualityForLocation(location);
}

export async function fetchDistrictOptions(query) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const results = await fetchLocationCandidates(trimmedQuery);
  const uniqueDistricts = new Set();

  results.forEach((result) => {
    const candidates = [result.admin3, result.admin2];

    candidates.forEach((candidate) => {
      if (!candidate) {
        return;
      }

      if (normalizeText(candidate) === normalizeText(result.name)) {
        return;
      }

      uniqueDistricts.add(candidate);
    });
  });

  if (isAlmatyQuery(trimmedQuery)) {
    ALMATY_DISTRICTS.forEach((district) => uniqueDistricts.add(district));
  }

  return Array.from(uniqueDistricts).sort((a, b) => a.localeCompare(b, 'ru'));
}

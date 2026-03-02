const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const FULL_POLLUTANTS =
  'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide';
const RANKING_POLLUTANTS = 'us_aqi,pm2_5';

const KAZAKHSTAN_CITIES = [
  { name: 'Алматы', latitude: 43.238949, longitude: 76.889709, timezone: 'Asia/Almaty' },
  { name: 'Астана', latitude: 51.169392, longitude: 71.449074, timezone: 'Asia/Almaty' },
  { name: 'Шымкент', latitude: 42.3417, longitude: 69.5901, timezone: 'Asia/Almaty' },
  { name: 'Караганда', latitude: 49.806, longitude: 73.085, timezone: 'Asia/Almaty' },
  { name: 'Павлодар', latitude: 52.287, longitude: 76.967, timezone: 'Asia/Almaty' },
  { name: 'Усть-Каменогорск', latitude: 49.9483, longitude: 82.6275, timezone: 'Asia/Almaty' },
  { name: 'Актобе', latitude: 50.2839, longitude: 57.167, timezone: 'Asia/Aqtobe' },
  { name: 'Атырау', latitude: 47.112, longitude: 51.923, timezone: 'Asia/Atyrau' },
  { name: 'Актау', latitude: 43.652, longitude: 51.157, timezone: 'Asia/Aqtau' },
];

function getTodayInTimezone(timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getCurrentHourInTimezone(timezone) {
  return Number.parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
    10
  );
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

async function fetchAirHourlyByLocation({
  latitude,
  longitude,
  timezone,
  pollutants = FULL_POLLUTANTS,
}) {
  const today = getTodayInTimezone(timezone);
  const airParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    start_date: today,
    end_date: today,
    hourly: pollutants,
  });

  const airQualityData = await fetchJson(`${AIR_QUALITY_URL}?${airParams.toString()}`);
  return airQualityData?.hourly;
}

export async function fetchAirQualityByQuery(query) {
  const geocodingParams = new URLSearchParams({
    name: query,
    count: '5',
    language: 'ru',
    format: 'json',
  });

  const locationData = await fetchJson(`${GEOCODING_URL}?${geocodingParams.toString()}`);
  const location = locationData?.results?.[0];

  if (!location) {
    throw new Error('Локация не найдена. Попробуйте другое название.');
  }

  const hourly = await fetchAirHourlyByLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    pollutants: FULL_POLLUTANTS,
  });

  if (!hourly?.time?.length) {
    throw new Error('По этой локации нет данных о качестве воздуха.');
  }

  const mappedHourly = mapHourlyData(hourly);

  return {
    location: {
      name: location.name,
      country: location.country,
      admin1: location.admin1,
      timezone: location.timezone,
    },
    current: pickCurrentHourRecord(mappedHourly, location.timezone),
    hourly: mappedHourly,
  };
}

export async function fetchKazakhstanRanking() {
  const results = await Promise.all(
    KAZAKHSTAN_CITIES.map(async (city) => {
      const hourly = await fetchAirHourlyByLocation({
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
        pollutants: RANKING_POLLUTANTS,
      });

      if (!hourly?.time?.length) {
        return null;
      }

      const currentHour = getCurrentHourInTimezone(city.timezone);
      let fallbackIndex = 0;
      let exactIndex = -1;

      for (let index = 0; index < hourly.time.length; index += 1) {
        const hour = Number.parseInt(hourly.time[index].slice(11, 13), 10);
        if (hour <= currentHour) {
          fallbackIndex = index;
        }
        if (hour === currentHour) {
          exactIndex = index;
        }
      }

      const index = exactIndex >= 0 ? exactIndex : fallbackIndex;
      const usAqi = hourly.us_aqi?.[index];
      const pm25 = hourly.pm2_5?.[index];

      if (typeof usAqi !== 'number' || Number.isNaN(usAqi)) {
        return null;
      }

      return {
        city: city.name,
        usAqi,
        pm25: typeof pm25 === 'number' ? pm25 : null,
      };
    })
  );

  const ranking = results
    .filter(Boolean)
    .sort((left, right) => right.usAqi - left.usAqi)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  if (!ranking.length) {
    throw new Error('Не удалось получить рейтинг качества воздуха по Казахстану.');
  }

  return {
    updatedAt: new Date().toISOString(),
    ranking,
  };
}

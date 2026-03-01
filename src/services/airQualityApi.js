const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const POLLUTANTS = 'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide';

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

  const today = getTodayInTimezone(location.timezone);
  const airParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone,
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
      timezone: location.timezone,
    },
    current: pickCurrentHourRecord(mappedHourly, location.timezone),
    hourly: mappedHourly,
  };
}

export function getAqiStatus(aqiValue) {
  if (aqiValue <= 50) {
    return { label: 'Хорошо', tone: 'good' };
  }

  if (aqiValue <= 100) {
    return { label: 'Умеренно', tone: 'moderate' };
  }

  if (aqiValue <= 150) {
    return { label: 'Вредно для чувствительных групп', tone: 'sensitive' };
  }

  if (aqiValue <= 200) {
    return { label: 'Вредно', tone: 'bad' };
  }

  if (aqiValue <= 300) {
    return { label: 'Очень вредно', tone: 'very-bad' };
  }

  return { label: 'Опасно', tone: 'hazardous' };
}

export function formatHour(timeValue) {
  const hour = timeValue.slice(11, 13);
  return `${hour}:00`;
}

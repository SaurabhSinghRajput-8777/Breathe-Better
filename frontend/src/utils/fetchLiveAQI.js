export async function fetchLiveAQI(city) {
  const res = await fetch(`/live?city=${city}`);
  return res.json();
}

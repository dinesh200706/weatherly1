
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const statusEl = document.getElementById("status");

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Cloudy", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Foggy", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm", "⛈️"],
  99: ["Thunderstorm", "⛈️"]
};

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service unavailable. Try again.");
  }

  return response.json();
}

async function loadWeather(city) {
  statusEl.textContent = "Searching for " + city + "...";

  try {
    const geoURL = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    geoURL.search = new URLSearchParams({
      name: city,
      count: "1",
      language: "en",
      format: "json"
    });

    const geoData = await getJSON(geoURL);

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling.");
    }

    const place = geoData.results[0];

    const weatherURL = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    weatherURL.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min"
      ].join(","),
      forecast_days: "6",
      timezone: "auto"
    });

    const data = await getJSON(weatherURL);
    const current = data.current;
    const daily = data.daily;

    const info = weatherCodes[current.weather_code] ||
      ["Unknown weather", "🌡️"];

    document.getElementById("location").textContent =
      [place.name, place.country].filter(Boolean).join(", ");

    document.getElementById("date").textContent =
      new Intl.DateTimeFormat("en", {
        weekday: "long",
        day: "numeric",
        month: "long"
      }).format(new Date());

    document.getElementById("icon").textContent = info[1];
    document.getElementById("temperature").textContent =
      Math.round(current.temperature_2m) + "°C";

    document.getElementById("condition").textContent = info[0];

    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
      current.wind_speed_10m + " km/h";

    document.getElementById("feels").textContent =
      Math.round(current.apparent_temperature) + "°C";

    const forecast = document.getElementById("forecast");

    forecast.innerHTML = daily.time.slice(1, 6).map((date, i) => {
      const index = i + 1;
      const weather = weatherCodes[daily.weather_code[index]] ||
        ["Unknown", "🌡️"];

      const [year, month, day] = date.split("-").map(Number);

      const dayName = new Intl.DateTimeFormat("en", {
        weekday: "short"
      }).format(new Date(year, month - 1, day));

      return `
        <article class="day-card">
          <p>${dayName}</p>
          <span class="day-icon">${weather[1]}</span>
          <p>${weather[0]}</p>
          <strong>${Math.round(daily.temperature_2m_max[index])}°</strong>
          <p>${Math.round(daily.temperature_2m_min[index])}° low</p>
        </article>
      `;
    }).join("");

    statusEl.textContent =
      "Weather updated successfully for " + place.name + ".";

  } catch (error) {
    statusEl.textContent = error.message ||
      "Unable to load weather. Please try again.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = input.value.trim();

  if (city) {
    loadWeather(city);
  }
});

loadWeather("Chennai");

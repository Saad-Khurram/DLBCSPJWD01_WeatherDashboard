// -----------------------------
//  Global state
// -----------------------------
let lastSearchedCity = null;

// fallback list – used until cities.json loads
let allCities = [
  "Berlin", "Bern", "Beijing", "Belfast", "Belgrade",
  "Dublin", "Lahore", "London", "Lisbon", "Los Angeles"
];

// -----------------------------
//  DOM elements
// -----------------------------
const cityInput     = document.getElementById("cityInput");
const searchBtn     = document.getElementById("searchBtn");
const resultEl      = document.getElementById("result");
const favBtn        = document.getElementById("favBtn");
const favList       = document.getElementById("favList");
const suggestionsEl = document.getElementById("suggestions");

// -----------------------------
//  Load full city list (optional but recommended)
// -----------------------------
fetch("cities.json")
  .then((res) => {
    if (!res.ok) throw new Error("cities.json not found");
    return res.json();
  })
  .then((data) => {
    // lutangar/cities.json structure: { name, country, lat, lng }
    allCities = Array.from(
      new Set(
        data.map((c) => c.name).filter(Boolean)
      )
    );
    console.log("Loaded cities from cities.json:", allCities.length);
  })
  .catch((err) => {
    console.warn("Using fallback city list. Reason:", err.message);
  });

// -----------------------------
//  Suggestions helpers
// -----------------------------
function clearSuggestions() {
  if (!suggestionsEl) return;
  suggestionsEl.innerHTML = "";
  suggestionsEl.classList.add("hidden");
}

function showSuggestions(matches) {
  if (!suggestionsEl) return;

  if (!matches.length) {
    clearSuggestions();
    return;
  }

  suggestionsEl.innerHTML = "";

  matches.slice(0, 10).forEach((city) => {
    const div = document.createElement("div");
    div.textContent = city;
    div.addEventListener("click", () => {
      cityInput.value = city;
      clearSuggestions();
      getWeather();
    });
    suggestionsEl.appendChild(div);
  });

  suggestionsEl.classList.remove("hidden");
}

// -----------------------------
//  Weather fetching
// -----------------------------
async function getWeather() {
  if (!cityInput || !resultEl) return;

  const city = cityInput.value.trim();
  if (!city) {
    resultEl.innerHTML = "<p>Please enter a city.</p>";
    showFavButton(false);
    return;
  }

  // Show loading state
  resultEl.className = "card";
  resultEl.innerHTML = `<div class="loading-spinner"></div>`;
  showFavButton(false);

  try {
    const res = await fetch(`/weather/${encodeURIComponent(city)}`);
    const data = await res.json();

    if (data.error) {
      resultEl.innerHTML = `<p>${data.error}</p>`;
      showFavButton(false);
      return;
    }

    lastSearchedCity = data.name;

    // Map weather condition to accent class for dynamic card theming
    const conditionMap = {
      Clear: "accent-clear",
      Clouds: "accent-clouds",
      Rain: "accent-rain",
      Drizzle: "accent-rain",
      Thunderstorm: "accent-storm",
      Snow: "accent-snow",
      Mist: "accent-mist",
      Fog: "accent-mist",
      Haze: "accent-mist",
    };
    const accentClass = conditionMap[data.weather[0].main] || "accent-clouds";

    // Remove previous accent classes and apply new one
    resultEl.className = `card ${accentClass} card-loaded`;

    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const country = data.sys?.country ? `, ${data.sys.country}` : "";
    const feelsLike = Math.round(data.main.feels_like);
    const tempMin = Math.round(data.main.temp_min);
    const tempMax = Math.round(data.main.temp_max);
    const description = data.weather[0].description;

    resultEl.innerHTML = `
      <div class="card-header">
        <div class="card-city">${data.name}${country}</div>
        <div class="card-condition">
          <img class="weather-icon" src="${iconUrl}" alt="${description}" />
          <span>${description}</span>
        </div>
      </div>
      <div class="card-temp-hero">
        ${Math.round(data.main.temp)}<span class="card-temp-unit">°C</span>
      </div>
      <div class="card-feels-like">Feels like ${feelsLike}°C</div>
      <div class="card-stats">
        <div class="stat">
          <span class="stat-label">Humidity</span>
          <span class="stat-value">💧 ${data.main.humidity}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">Wind</span>
          <span class="stat-value">💨 ${data.wind.speed} m/s</span>
        </div>
        <div class="stat">
          <span class="stat-label">Range</span>
          <span class="stat-value">↓${tempMin}° ↑${tempMax}°</span>
        </div>
      </div>
    `;
    showFavButton(true);
  } catch (e) {
    console.error("getWeather error:", e);
    resultEl.innerHTML = "<p>Something went wrong. Try again.</p>";
    showFavButton(false);
  }
}

function showFavButton(show) {
  if (!favBtn) return;
  favBtn.style.display = show ? "inline-block" : "none";
}

// -----------------------------
//  Favorites logic
// -----------------------------
async function addFavorite() {
  if (!lastSearchedCity) return;

  await fetch("/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city: lastSearchedCity }),
  });

  loadFavorites();
}

async function loadFavorites() {
  if (!favList) return;

  const res = await fetch("/favorites");
  const data = await res.json();

  favList.innerHTML = "";
  data.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="link" data-city="${item.city}">🔍 ${item.city}</button>
      <button class="remove" data-city="${item.city}">✖</button>
    `;
    favList.appendChild(li);
  });

  favList.querySelectorAll(".link").forEach((btn) => {
    btn.addEventListener("click", () => {
      cityInput.value = btn.dataset.city;
      getWeather();
    });
  });

  favList.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch(`/favorites/${encodeURIComponent(btn.dataset.city)}`, {
        method: "DELETE",
      });
      loadFavorites();
    });
  });
}

// -----------------------------
//  Event listeners
// -----------------------------
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    clearSuggestions();
    getWeather();
  });
}

if (cityInput) {
  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearSuggestions();
      getWeather();
    }
  });

  cityInput.addEventListener("input", () => {
    const value = cityInput.value.trim().toLowerCase();

    if (!value || value.length < 2 || !allCities.length) {
      clearSuggestions();
      return;
    }

    const matches = allCities.filter((city) =>
      city.toLowerCase().startsWith(value)
    );
    showSuggestions(matches);
  });

  cityInput.addEventListener("blur", () => {
    setTimeout(clearSuggestions, 150);
  });
}

if (favBtn) {
  favBtn.addEventListener("click", addFavorite);
}

// -----------------------------
//  Initial load
// -----------------------------
loadFavorites();

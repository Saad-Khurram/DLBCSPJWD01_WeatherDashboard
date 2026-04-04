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

  try {
    const res = await fetch(`/weather/${encodeURIComponent(city)}`);
    const data = await res.json();

    if (data.error) {
      resultEl.innerHTML = `<p>${data.error}</p>`;
      showFavButton(false);
      return;
    }

    lastSearchedCity = data.name;
    resultEl.innerHTML = `
      <h2>${data.name}</h2>
      <p>${data.weather[0].description}</p>
      <p>
        🌡️ ${Math.round(data.main.temp)}°C |
        💧 ${data.main.humidity}% |
        💨 ${data.wind.speed} m/s
      </p>
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

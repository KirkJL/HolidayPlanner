// =======================
// CONFIG
// =======================
const form = document.getElementById("tripForm");
const formMessage = document.getElementById("formMessage");

// RESULT ELEMENTS
const emptyState = document.getElementById("emptyState");
const tripCard = document.getElementById("tripCard");

const tripHero = document.getElementById("tripHero");
const tripTitle = document.getElementById("tripTitle");
const tripSubtitle = document.getElementById("tripSubtitle");

const tripRoute = document.getElementById("tripRoute");
const tripDates = document.getElementById("tripDates");
const tripNights = document.getElementById("tripNights");

const tripWeatherBadge = document.getElementById("tripWeatherBadge");

const snapshotGrid = document.getElementById("snapshotGrid");

const flightLink = document.getElementById("flightLink");
const hotelLink = document.getElementById("hotelLink");
const mapsLink = document.getElementById("mapsLink");

const itineraryDays = document.getElementById("itineraryDays");

const weatherTemp = document.getElementById("weatherTemp");
const weatherDesc = document.getElementById("weatherDesc");
const weatherMeta = document.getElementById("weatherMeta");

const packingNote = document.getElementById("packingNote");
const destinationBlurb = document.getElementById("destinationBlurb");
const highlightList = document.getElementById("highlightList");

// =======================
// HELPERS
// =======================
function randomDestination(vibe) {
  if (!vibe || vibe === "all") {
    return DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
  }

  const filtered = DESTINATIONS.filter(d => d.vibeTags.includes(vibe));

  if (filtered.length === 0) return DESTINATIONS[0];

  return filtered[Math.floor(Math.random() * filtered.length)];
}

function daysBetween(start, end) {
  return Math.max(
    1,
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
  );
}

// =======================
// FORM SUBMIT (FIXED)
// =======================
document.getElementById("generateBtn").addEventListener("click", async () => {

  formMessage.textContent = "Generating trip...";

  const from = document.getElementById("from").value || "LON";
  const depart = document.getElementById("departDate").value;
  const returnDate = document.getElementById("returnDate").value;
  const vibe = document.getElementById("vibe").value;
  const travellers = document.getElementById("travellers").value;

  if (!depart || !returnDate) {
    formMessage.textContent = "Please select dates.";
    return;
  }

  const nights = Math.max(
    1,
    Math.round((new Date(returnDate) - new Date(depart)) / (1000 * 60 * 60 * 24))
  );

  const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];

  // HEADER BG (your new feature)
  if (window.headerBg) {
    headerBg.style.backgroundImage = `url(${dest.image})`;
  }

  // WEATHER
  let weather = null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&current_weather=true`
    );
    const data = await res.json();
    weather = data.current_weather;
  } catch {}

  // LINKS
  flightLink.href = `https://www.skyscanner.net/transport/flights/${from}/${dest.airportCode}/${depart}/`;
  hotelLink.href = `https://www.booking.com/searchresults.html?ss=${dest.bookingQuery}`;
  mapsLink.href = `https://www.google.com/maps/search/${dest.mapQuery}`;

  // UI UPDATE
  tripHero.style.backgroundImage = `url(${dest.image})`;

  tripTitle.textContent = dest.name;
  tripSubtitle.textContent = dest.country;

  tripRoute.textContent = `${from} → ${dest.airportCode}`;
  tripDates.textContent = `${depart} → ${returnDate}`;
  tripNights.textContent = `${nights} nights`;

  // WEATHER UI
  if (weather) {
    tripWeatherBadge.textContent = `${weather.temperature}°C`;
    weatherTemp.textContent = `${weather.temperature}°C`;
    weatherDesc.textContent = "Current conditions";

    weatherMeta.innerHTML = `
      <div class="weather-meta-item"><span>Wind</span><strong>${weather.windspeed} km/h</strong></div>
      <div class="weather-meta-item"><span>Direction</span><strong>${weather.winddirection}°</strong></div>
    `;
  }

  // SNAPSHOT
  snapshotGrid.innerHTML = `
    <div class="snapshot-item"><span class="snapshot-label">Travellers</span><div class="snapshot-value">${travellers}</div></div>
    <div class="snapshot-item"><span class="snapshot-label">Timezone</span><div class="snapshot-value">${dest.timezone}</div></div>
    <div class="snapshot-item"><span class="snapshot-label">Currency</span><div class="snapshot-value">${dest.currency}</div></div>
    <div class="snapshot-item"><span class="snapshot-label">Style</span><div class="snapshot-value">${dest.styleTags.join(", ")}</div></div>
  `;

  // ITINERARY
  itineraryDays.innerHTML = "";
  for (let i = 1; i <= nights; i++) {
    const el = document.createElement("div");
    el.className = "day-card";
    el.innerHTML = `
      <div class="day-card-head">
        <h4>Day ${i}</h4>
        <span class="day-badge">${dest.styleTags[0]}</span>
      </div>
      <p class="day-copy">Explore ${dest.name}.</p>
    `;
    itineraryDays.appendChild(el);
  }

  destinationBlurb.textContent = dest.blurb;
  highlightList.innerHTML = dest.highlights.map(h => `<li>${h}</li>`).join("");

  packingNote.textContent =
    dest.climateTag === "cold"
      ? "Bring layers and waterproofs."
      : "Light clothes and sun protection.";

  emptyState.classList.add("is-hidden");
  tripCard.classList.remove("is-hidden");

  formMessage.textContent = "Trip ready.";
});

  // =======================
  // WEATHER (DIRECT)
  // =======================
  let weather = null;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&current_weather=true`
    );
    const data = await res.json();
    weather = data.current_weather;
  } catch {}

  // =======================
  // LINKS (FIXED)
  // =======================
  flightLink.href = `https://www.skyscanner.net/transport/flights/${from}/${dest.airportCode}/${depart}/`;
  hotelLink.href = `https://www.booking.com/searchresults.html?ss=${dest.bookingQuery}`;
  mapsLink.href = `https://www.google.com/maps/search/${dest.mapQuery}`;

  // =======================
  // HERO
  // =======================
  tripHero.style.backgroundImage = `url(${dest.image})`;

  tripTitle.textContent = dest.name;
  tripSubtitle.textContent = dest.country;

  tripRoute.textContent = `${from} → ${dest.airportCode}`;
  tripDates.textContent = `${depart} → ${returnDate}`;
  tripNights.textContent = `${nights} nights`;

  // =======================
  // WEATHER UI
  // =======================
  if (weather) {
    tripWeatherBadge.textContent = `${weather.temperature}°C`;
    weatherTemp.textContent = `${weather.temperature}°C`;
    weatherDesc.textContent = "Current conditions";

    weatherMeta.innerHTML = `
      <div class="weather-meta-item"><span>Wind</span><strong>${weather.windspeed} km/h</strong></div>
      <div class="weather-meta-item"><span>Direction</span><strong>${weather.winddirection}°</strong></div>
    `;
  } else {
    tripWeatherBadge.textContent = "Weather unavailable";
  }

  // =======================
  // SNAPSHOT
  // =======================
  snapshotGrid.innerHTML = `
    <div class="snapshot-item">
      <span class="snapshot-label">Travellers</span>
      <div class="snapshot-value">${travellers}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Timezone</span>
      <div class="snapshot-value">${dest.timezone}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Currency</span>
      <div class="snapshot-value">${dest.currency}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Style</span>
      <div class="snapshot-value">${dest.styleTags.join(", ")}</div>
    </div>
  `;

  // =======================
  // ITINERARY
  // =======================
  itineraryDays.innerHTML = "";

  for (let i = 1; i <= nights; i++) {
    const el = document.createElement("div");
    el.className = "day-card";

    el.innerHTML = `
      <div class="day-card-head">
        <h4>Day ${i}</h4>
        <span class="day-badge">${dest.styleTags[0]}</span>
      </div>
      <p class="day-copy">
        Explore ${dest.name}, focus on ${dest.vibeTags[0]} experiences.
      </p>
    `;

    itineraryDays.appendChild(el);
  }

  // =======================
  // SIDE CONTENT
  // =======================
  destinationBlurb.textContent = dest.blurb;

  highlightList.innerHTML = dest.highlights
    .map(h => `<li>${h}</li>`)
    .join("");

  packingNote.textContent =
    dest.climateTag === "cold"
      ? "Bring layers, waterproofs, and boots."
      : "Light clothes, sun protection, and breathable footwear.";

  // =======================
  // SHOW RESULT
  // =======================
  emptyState.classList.add("is-hidden");
  tripCard.classList.remove("is-hidden");

  formMessage.textContent = "Trip ready.";
});

// =======================
// EXPORT
// =======================
document.getElementById("exportPngBtn").onclick = async () => {
  const canvas = await html2canvas(document.getElementById("tripCard"));
  const link = document.createElement("a");
  link.download = "trip.png";
  link.href = canvas.toDataURL();
  link.click();
};

document.getElementById("exportPdfBtn").onclick = () => {
  window.print();
};

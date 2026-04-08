// =======================
// DOM
// =======================
const form = document.getElementById("tripForm");
const formMessage = document.getElementById("formMessage");

const emptyState = document.getElementById("emptyState");
const tripCard = document.getElementById("tripCard");

const tripHero = document.getElementById("tripHero");
const tripTitle = document.getElementById("tripTitle");
const tripSubtitle = document.getElementById("tripSubtitle");

const tripRoute = document.getElementById("tripRoute");
const tripDates = document.getElementById("tripDates");
const tripNights = document.getElementById("tripNights");

const tripVibeBadge = document.getElementById("tripVibeBadge");
const tripWeatherBadge = document.getElementById("tripWeatherBadge");

const snapshotGrid = document.getElementById("snapshotGrid");

const flightLink = document.getElementById("flightLink");
const hotelLink = document.getElementById("hotelLink");
const mapsLink = document.getElementById("mapsLink");

const itineraryIntro = document.getElementById("itineraryIntro");
const itineraryDays = document.getElementById("itineraryDays");

const weatherTemp = document.getElementById("weatherTemp");
const weatherDesc = document.getElementById("weatherDesc");
const weatherMeta = document.getElementById("weatherMeta");

const packingNote = document.getElementById("packingNote");
const destinationBlurb = document.getElementById("destinationBlurb");
const highlightList = document.getElementById("highlightList");

const exportPngBtn = document.getElementById("exportPngBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const rerollBtn = document.getElementById("rerollBtn");
const headerBg = document.getElementById("headerBg");

// =======================
// STATE
// =======================
let currentDestinationId = null;

// =======================
// INIT
// =======================
setDefaultDates();
bindEvents();

// =======================
// EVENTS
// =======================
function bindEvents() {
  if (form) {
    form.addEventListener("submit", handleGenerateSubmit);
  }

  if (rerollBtn) {
    rerollBtn.addEventListener("click", async () => {
      await generateTrip(true);
    });
  }

  if (exportPngBtn) {
    exportPngBtn.addEventListener("click", exportTripAsPng);
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener("click", exportTripAsPdf);
  }
}

async function handleGenerateSubmit(event) {
  event.preventDefault();
  await generateTrip(false);
}

// =======================
// GENERATION
// =======================
async function generateTrip(forceReroll) {
  try {
    setMessage("Generating trip...", false);

    const from = sanitizeAirportCode(document.getElementById("from")?.value || "LON");
    const depart = document.getElementById("departDate")?.value || "";
    const returnDate = document.getElementById("returnDate")?.value || "";
    const vibe = document.getElementById("vibe")?.value || "all";
    const style = document.getElementById("style")?.value || "balanced";
    const travellers = document.getElementById("travellers")?.value || "2";

    if (!from) {
      setMessage("Enter a departure airport or city code.", true);
      return;
    }

    if (!depart || !returnDate) {
      setMessage("Please select dates.", true);
      return;
    }

    const nights = daysBetween(depart, returnDate);

    if (nights < 1) {
      setMessage("Return date must be after departure date.", true);
      return;
    }

    const dest = randomDestination(vibe, forceReroll ? currentDestinationId : null);

    if (!dest) {
      setMessage("No destination found for that vibe.", true);
      return;
    }

    currentDestinationId = dest.id;

    updateHeaderBackground(dest.image);

    const weather = await fetchWeather(dest.lat, dest.lon);

    renderTrip({
      from,
      depart,
      returnDate,
      travellers,
      nights,
      style,
      vibe,
      dest,
      weather
    });

    setMessage("Trip ready.", false);
  } catch (error) {
    console.error("Trip generation failed:", error);
    setMessage("Something broke while generating the trip. Check console.", true);
  }
}

// =======================
// RENDER
// =======================
function renderTrip({ from, depart, returnDate, travellers, nights, style, vibe, dest, weather }) {
  emptyState?.classList.add("is-hidden");
  tripCard?.classList.remove("is-hidden");

  if (tripHero) {
    tripHero.style.backgroundImage = `
      linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.55)),
      url("${dest.image}")
    `;
  }

  if (tripTitle) tripTitle.textContent = dest.name;
  if (tripSubtitle) tripSubtitle.textContent = `${dest.country} · ${dest.airportName}`;
  if (tripRoute) tripRoute.textContent = `${from} → ${dest.airportCode}`;
  if (tripDates) tripDates.textContent = `${formatDisplayDate(depart)} — ${formatDisplayDate(returnDate)}`;
  if (tripNights) tripNights.textContent = `${nights} ${nights === 1 ? "night" : "nights"}`;

  if (tripVibeBadge) {
    tripVibeBadge.textContent = `${humaniseVibe(vibe, dest)} · ${humaniseStyle(style)}`;
  }

  renderWeather(weather);
  renderSnapshot(dest, travellers);
  renderLinks(from, depart, returnDate, travellers, dest);
  renderItinerary(dest, nights, style);
  renderSidePanels(dest, weather);

  if (itineraryIntro) {
    itineraryIntro.textContent = `Built for a ${humaniseStyle(style).toLowerCase()} trip over ${nights} ${nights === 1 ? "night" : "nights"}.`;
  }
}

function renderSnapshot(dest, travellers) {
  if (!snapshotGrid) return;

  snapshotGrid.innerHTML = `
    <div class="snapshot-item">
      <span class="snapshot-label">Travellers</span>
      <div class="snapshot-value">${escapeHtml(travellers)}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Timezone</span>
      <div class="snapshot-value">${escapeHtml(dest.timezone)}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Currency</span>
      <div class="snapshot-value">${escapeHtml(dest.currency)}</div>
    </div>
    <div class="snapshot-item">
      <span class="snapshot-label">Airport</span>
      <div class="snapshot-value">${escapeHtml(dest.airportCode)} · ${escapeHtml(dest.airportName)}</div>
    </div>
  `;
}

function renderLinks(from, depart, returnDate, travellers, dest) {
  if (flightLink) {
    flightLink.href = buildSkyscannerLink(from, dest.airportCode, depart, returnDate, travellers);
  }

  if (hotelLink) {
    hotelLink.href = buildBookingLink(dest.bookingQuery, depart, returnDate, travellers);
  }

  if (mapsLink) {
    mapsLink.href = buildMapsLink(dest.mapQuery);
  }
}

function renderWeather(weather) {
  if (!weather || !weather.current_weather) {
    if (tripWeatherBadge) tripWeatherBadge.textContent = "Weather unavailable";
    if (weatherTemp) weatherTemp.textContent = "—";
    if (weatherDesc) weatherDesc.textContent = "Couldn’t pull live conditions.";
    if (weatherMeta) {
      weatherMeta.innerHTML = `
        <div class="weather-meta-item"><span>Wind</span><strong>—</strong></div>
        <div class="weather-meta-item"><span>Direction</span><strong>—</strong></div>
      `;
    }
    return;
  }

  const current = weather.current_weather;

  if (tripWeatherBadge) tripWeatherBadge.textContent = `${current.temperature}°C`;
  if (weatherTemp) weatherTemp.textContent = `${current.temperature}°C`;
  if (weatherDesc) weatherDesc.textContent = "Current conditions";

  if (weatherMeta) {
    weatherMeta.innerHTML = `
      <div class="weather-meta-item"><span>Wind</span><strong>${current.windspeed} km/h</strong></div>
      <div class="weather-meta-item"><span>Direction</span><strong>${current.winddirection}°</strong></div>
    `;
  }
}

function renderItinerary(dest, nights, style) {
  if (!itineraryDays) return;

  itineraryDays.innerHTML = "";

  const lines = buildItineraryLines(dest, style, nights);

  for (let i = 0; i < lines.length; i += 1) {
    const dayNumber = i + 1;
    const el = document.createElement("div");
    el.className = "day-card";
    el.innerHTML = `
      <div class="day-card-head">
        <h4>Day ${dayNumber}</h4>
        <span class="day-badge">${escapeHtml(lines[i].badge)}</span>
      </div>
      <p class="day-copy">${escapeHtml(lines[i].copy)}</p>
    `;
    itineraryDays.appendChild(el);
  }
}

function renderSidePanels(dest, weather) {
  if (destinationBlurb) {
    destinationBlurb.textContent = dest.blurb;
  }

  if (highlightList) {
    highlightList.innerHTML = dest.highlights
      .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
      .join("");
  }

  if (packingNote) {
    packingNote.textContent = buildPackingNote(dest, weather);
  }
}

// =======================
// DATA
// =======================
function randomDestination(vibe, excludeId = null) {
  const pool =
    !vibe || vibe === "all"
      ? DESTINATIONS
      : DESTINATIONS.filter((d) => Array.isArray(d.vibeTags) && d.vibeTags.includes(vibe));

  const filteredPool =
    excludeId && pool.length > 1
      ? pool.filter((d) => d.id !== excludeId)
      : pool;

  if (!filteredPool.length) return null;

  return filteredPool[Math.floor(Math.random() * filteredPool.length)];
}

async function fetchWeather(lat, lon) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current_weather: "true"
    }).toString();

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Weather fetch failed:", error);
    return null;
  }
}

// =======================
// LINKS
// =======================
function buildSkyscannerLink(from, to, departDate, returnDate, travellers) {
  const dep = formatDateForSkyscanner(departDate);
  const ret = formatDateForSkyscanner(returnDate);

  return `https://www.skyscanner.net/transport/flights/${encodeURIComponent(from.toLowerCase())}/${encodeURIComponent(to.toLowerCase())}/${dep}/${ret}/?adultsv2=${encodeURIComponent(String(travellers))}&cabinclass=economy&currency=GBP&locale=en-GB&market=UK`;
}

function buildBookingLink(destinationQuery, departDate, returnDate, travellers) {
  const url = new URL("https://www.booking.com/searchresults.html");
  url.search = new URLSearchParams({
    ss: destinationQuery,
    checkin: departDate,
    checkout: returnDate,
    group_adults: String(travellers),
    no_rooms: "1",
    group_children: "0"
  }).toString();

  return url.toString();
}

function buildMapsLink(mapQuery) {
  const url = new URL("https://www.google.com/maps/search/");
  url.search = new URLSearchParams({
    api: "1",
    query: mapQuery
  }).toString();

  return url.toString();
}

// =======================
// EXPORT
// =======================
async function exportTripAsPng() {
  if (!tripCard || tripCard.classList.contains("is-hidden")) {
    setMessage("Generate a trip first.", true);
    return;
  }

  try {
    setMessage("Rendering PNG...", false);

    const canvas = await html2canvas(tripCard, {
      backgroundColor: "#07111f",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY
    });

    const link = document.createElement("a");
    link.download = "trip-itinerary.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    setMessage("PNG exported.", false);
  } catch (error) {
    console.error("PNG export failed:", error);
    setMessage("PNG export failed. Check console.", true);
  }
}

function exportTripAsPdf() {
  if (!tripCard || tripCard.classList.contains("is-hidden")) {
    setMessage("Generate a trip first.", true);
    return;
  }

  window.print();
}

// =======================
// UI
// =======================
function updateHeaderBackground(imageUrl) {
  if (!headerBg) return;
  headerBg.style.backgroundImage = `url("${imageUrl}")`;
}

function setMessage(message, isError) {
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.classList.remove("status-good", "status-bad");
  formMessage.classList.add(isError ? "status-bad" : "status-good");
}

function setDefaultDates() {
  const today = new Date();
  const depart = addDays(today, 21);
  const ret = addDays(today, 25);

  const departDateInput = document.getElementById("departDate");
  const returnDateInput = document.getElementById("returnDate");

  if (departDateInput && !departDateInput.value) {
    departDateInput.value = toIsoDate(depart);
  }

  if (returnDateInput && !returnDateInput.value) {
    returnDateInput.value = toIsoDate(ret);
  }
}

// =======================
// CONTENT HELPERS
// =======================
function buildItineraryLines(dest, style, nights) {
  const days = Math.max(2, nights);
  const primaryStyle = Array.isArray(dest.styleTags) && dest.styleTags.length
    ? dest.styleTags[0]
    : "explore";

  const templates = {
    balanced: [
      `Arrive in ${dest.name}, check in, then keep the first evening light with a walk and food nearby.`,
      `Use your main day for ${dest.highlights[0] || "the top local sights"} and leave room for a slower evening.`,
      `Split the next day between ${dest.highlights[1] || "the surrounding area"} and a more relaxed local wander.`,
      `Keep one flex block for ${dest.highlights[2] || "a final highlight"} or just go where the day takes you.`,
      `Wrap up with a calm final morning and a clean airport run.`
    ],
    relaxed: [
      `Arrival day is for settling in, nearby food, and not trying to speedrun ${dest.name}.`,
      `Pick one main highlight: ${dest.highlights[0] || "a scenic local spot"}, then leave the rest of the day open.`,
      `Slow morning, easy exploring, and a proper pause somewhere with a view.`,
      `Use this day for ${dest.highlights[1] || "a softer second highlight"} without overloading the plan.`,
      `Final day: breakfast, last photos, then head out.`
    ],
    adventure: [
      `Arrival day is for logistics, scouting, and saving energy for the bigger day.`,
      `Main push: ${dest.highlights[0] || "your biggest outdoor or active plan"} while you've got the legs for it.`,
      `Follow with ${dest.highlights[1] || "a second high-payoff activity"} or a wider explore.`,
      `Recovery / flex block for ${dest.highlights[2] || "one more big moment"} if energy is still there.`,
      `Leave cleanly without booking anything stupid before the airport.`
    ],
    citybreak: [
      `Land, check in, then walk the closest district and get your bearings properly.`,
      `Give the main day to ${dest.highlights[0] || "the headline city sights"}.`,
      `Use the next day for atmosphere, food, and a slower neighbourhood-level explore.`,
      `Fit in ${dest.highlights[1] || "one extra area or viewpoint"} before the final wind-down.`,
      `Last day: short loop, coffee, out.`
    ],
    photography: [
      `Arrival day is just for light scouting and finding the best angles around ${dest.name}.`,
      `Use the main day for ${dest.highlights[0] || "your highest-value photo location"} in the best light.`,
      `Back up with a second pass around ${dest.highlights[1] || "another key area"} for detail shots.`,
      `Keep this day for weather pivots, retries, or ${dest.highlights[2] || "your backup location"}.`,
      `Final day: quick final shots, then backup everything before you leave.`
    ]
  };

  const selected = templates[style] || templates.balanced;
  const output = [];

  for (let i = 0; i < days; i += 1) {
    output.push({
      badge: i === 0 ? "Arrival" : i === days - 1 ? "Departure" : capitalise(primaryStyle),
      copy: selected[Math.min(i, selected.length - 1)]
    });
  }

  return output;
}

function buildPackingNote(dest, weather) {
  if (!weather || !weather.current_weather) {
    return dest.climateTag === "cold"
      ? "Bring layers, waterproofs, and decent shoes."
      : "Pack light clothing, sun protection, and something comfortable for walking.";
  }

  const temp = weather.current_weather.temperature;
  const wind = weather.current_weather.windspeed;

  if (temp <= 8) {
    return wind >= 25
      ? "Cold and windy. Bring a proper jacket, layers, and weatherproof shoes."
      : "Cold trip. Pack layers, a decent coat, and shoes that can handle longer walks.";
  }

  if (temp <= 18) {
    return "Mild conditions. Layers win here — light jacket, comfortable shoes, and one warmer option for evenings.";
  }

  return "Warm weather. Go lighter, bring sun protection, and keep one extra layer for evenings or flights.";
}

// =======================
// GENERAL HELPERS
// =======================
function daysBetween(start, end) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / 86400000));
}

function sanitizeAirportCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
}

function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDateForSkyscanner(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year.slice(2)}${month}${day}`;
}

function humaniseStyle(style) {
  const styles = {
    balanced: "Balanced",
    relaxed: "Relaxed",
    adventure: "Adventure",
    citybreak: "City break",
    photography: "Photography"
  };

  return styles[style] || "Balanced";
}

function humaniseVibe(vibe, dest) {
  if (!vibe || vibe === "all") {
    return Array.isArray(dest.vibeTags) && dest.vibeTags.length
      ? capitalise(dest.vibeTags[0])
      : "Wallpaper pick";
  }

  return capitalise(vibe);
}

function capitalise(value) {
  const str = String(value || "");
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

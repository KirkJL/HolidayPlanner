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
const generateBtn = document.getElementById("generateBtn");

const headerBg = document.getElementById("headerBg");

// =======================
// STATE
// =======================
let currentDestinationId = null;
let isGenerating = false;

// =======================
// INIT
// =======================
setDefaultDates();
bindEvents();

// =======================
// EVENTS
// =======================
function bindEvents() {
  // HARD FIX: prevent form reload forever
  if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
  }

  generateBtn?.addEventListener("click", () => generateTrip(false));
  rerollBtn?.addEventListener("click", () => generateTrip(true));

  exportPngBtn?.addEventListener("click", exportTripAsPng);
  exportPdfBtn?.addEventListener("click", exportTripAsPdf);
}

// =======================
// GENERATION
// =======================
async function generateTrip(forceReroll) {
  if (isGenerating) return;

  try {
    isGenerating = true;
    setLoadingState(true);
    setMessage("Rolling destinations…", false);

    const from = sanitizeAirportCode(document.getElementById("from")?.value);
    const depart = document.getElementById("departDate")?.value;
    const returnDate = document.getElementById("returnDate")?.value;
    const vibe = document.getElementById("vibe")?.value || "all";
    const style = document.getElementById("style")?.value || "balanced";
    const travellers = document.getElementById("travellers")?.value || "2";

    if (!from || !depart || !returnDate) {
      setMessage("Missing required fields.", true);
      return;
    }

    const nights = daysBetween(depart, returnDate);
    if (nights < 1) {
      setMessage("Invalid date range.", true);
      return;
    }

    const dest = safePickDestination(vibe, forceReroll);

    if (!dest) {
      setMessage("No valid destination found.", true);
      return;
    }

    currentDestinationId = dest.id;

    await animateHeaderSwap(dest.image);

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

    setMessage("", false);

  } catch (e) {
    console.error(e);
    setMessage("Recovered from error. Try again.", true);
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// =======================
// SAFE DESTINATION PICK
// =======================
function safePickDestination(vibe, forceReroll) {
  const all = Array.isArray(window.DESTINATIONS) ? window.DESTINATIONS : [];

  const valid = all.filter(d =>
    d &&
    d.id &&
    d.name &&
    d.image &&
    d.airportCode &&
    d.lat &&
    d.lon
  );

  if (!valid.length) return null;

  let pool = (vibe === "all")
    ? valid
    : valid.filter(d => Array.isArray(d.vibeTags) && d.vibeTags.includes(vibe));

  if (!pool.length) pool = valid;

  if (forceReroll && currentDestinationId) {
    const rerollPool = pool.filter(d => d.id !== currentDestinationId);
    if (rerollPool.length) pool = rerollPool;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// =======================
// RENDER (SAFE)
// =======================
function renderTrip(data) {
  const { from, depart, returnDate, travellers, nights, style, vibe, dest, weather } = data;

  emptyState?.classList.add("is-hidden");
  tripCard?.classList.remove("is-hidden");

  // HERO
  if (tripHero && dest.image) {
    tripHero.style.backgroundImage = `
      linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.7)),
      url("${dest.image}")
    `;
  }

  // TEXT SAFE
  setText(tripTitle, dest.name);
  setText(tripSubtitle, `${dest.country || ""} · ${dest.airportName || ""}`);

  setText(tripRoute, `${from} → ${dest.airportCode}`);
  setText(tripDates, `${formatDisplayDate(depart)} — ${formatDisplayDate(returnDate)}`);
  setText(tripNights, `${nights} nights`);

  setText(tripVibeBadge, humaniseVibe(vibe, dest));
  setText(tripWeatherBadge, weather?.current_weather
    ? `${weather.current_weather.temperature}°C`
    : "Weather unavailable"
  );

  // LINKS SAFE
  flightLink && (flightLink.href = buildSkyscannerLink(from, dest.airportCode, depart, returnDate, travellers));
  hotelLink && (hotelLink.href = buildBookingLink(dest.bookingQuery || dest.name, depart, returnDate, travellers));
  mapsLink && (mapsLink.href = buildMapsLink(dest.mapQuery || dest.name));

  // SNAPSHOT SAFE
  snapshotGrid && (snapshotGrid.innerHTML = `
    <div>${travellers} travellers</div>
    <div>${dest.currency || "-"}</div>
    <div>${dest.timezone || "-"}</div>
  `);

  // ITINERARY SAFE
  if (itineraryDays) {
    itineraryDays.innerHTML = "";
    (dest.highlights || []).forEach((h, i) => {
      const el = document.createElement("div");
      el.textContent = `Day ${i + 1}: ${h}`;
      itineraryDays.appendChild(el);
    });
  }

  // SIDE SAFE
  setText(destinationBlurb, dest.blurb);
  if (highlightList && Array.isArray(dest.highlights)) {
    highlightList.innerHTML = dest.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join("");
  }
}

// =======================
// UI FEEL (CINEMATIC)
// =======================
async function animateHeaderSwap(image) {
  if (!headerBg || !image) return;

  headerBg.style.opacity = "0";

  await new Promise(r => setTimeout(r, 200));

  headerBg.style.backgroundImage = `url("${image}")`;
  headerBg.style.opacity = "0.35";
}

function setLoadingState(state) {
  document.body.classList.toggle("loading", state);
}

// =======================
// WEATHER
// =======================
async function fetchWeather(lat, lon) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    return await res.json();
  } catch {
    return null;
  }
}

// =======================
// HELPERS
// =======================
function setText(el, val) {
  if (el) el.textContent = val || "—";
}

function setMessage(msg, err) {
  if (!formMessage) return;
  formMessage.textContent = msg;
  formMessage.style.color = err ? "#fda4af" : "#9cb2cc";
}

function sanitizeAirportCode(v) {
  return String(v || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

function daysBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function formatDisplayDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function buildSkyscannerLink(from, to, d, r, t) {
  return `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${d}/${r}/`;
}

function buildBookingLink(q) {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}`;
}

function buildMapsLink(q) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function humaniseVibe(v, dest) {
  if (v === "all") return dest.vibeTags?.[0] || "Discover";
  return v;
}

function setDefaultDates() {
  const today = new Date();
  document.getElementById("departDate").value = toISO(addDays(today, 21));
  document.getElementById("returnDate").value = toISO(addDays(today, 25));
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function escapeHtml(v) {
  return String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

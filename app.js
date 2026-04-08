const form = document.getElementById("tripForm");
const generateBtn = document.getElementById("generateBtn");
const rerollBtn = document.getElementById("rerollBtn");

let currentDestinationId = null;

// PREVENT FORM SUBMIT BUG
form.addEventListener("submit", (e) => e.preventDefault());

generateBtn.addEventListener("click", () => generateTrip(false));
rerollBtn.addEventListener("click", () => generateTrip(true));

async function generateTrip(forceReroll) {
  try {
    setLoading(true);

    const from = sanitizeAirportCode(getVal("from"));
    const depart = getVal("departDate");
    const returnDate = getVal("returnDate");

    if (!from || !depart || !returnDate) {
      setMessage("Missing required fields", true);
      setLoading(false);
      return;
    }

    const dest = pickDestination(forceReroll);

    if (!dest) {
      setMessage("No destination found", true);
      setLoading(false);
      return;
    }

    currentDestinationId = dest.id;

    updateHeader(dest.image);

    const weather = await fetchWeatherSafe(dest);

    render(dest, from, depart, returnDate, weather);

    setMessage("");
    setLoading(false);

  } catch (e) {
    console.error(e);
    setMessage("Crash prevented. Check console.", true);
    setLoading(false);
  }
}

// SAFE DESTINATION PICK
function pickDestination(force) {
  const pool = window.DESTINATIONS || [];

  const valid = pool.filter(d =>
    d && d.id && d.name && d.image && d.airportCode
  );

  if (!valid.length) return null;

  const filtered = force
    ? valid.filter(d => d.id !== currentDestinationId)
    : valid;

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// SAFE WEATHER
async function fetchWeatherSafe(dest) {
  try {
    if (!dest.lat || !dest.lon) return null;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&current_weather=true`
    );

    return await res.json();
  } catch {
    return null;
  }
}

// RENDER SAFE
function render(dest, from, depart, returnDate, weather) {
  show("tripCard");
  hide("emptyState");

  const hero = document.getElementById("tripHero");

  hero.style.backgroundImage = `url("${safe(dest.image)}")`;

  setText("tripTitle", safe(dest.name));
  setText("tripSubtitle", `${safe(dest.country)} · ${safe(dest.airportName)}`);

  setLink("flightLink",
    `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${dest.airportCode.toLowerCase()}/${format(depart)}/${format(returnDate)}/`
  );

  setLink("hotelLink",
    `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest.bookingQuery)}`
  );

  setLink("mapsLink",
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.mapQuery)}`
  );

  renderItinerary(dest);
}

// SIMPLE ITINERARY SAFE
function renderItinerary(dest) {
  const container = document.getElementById("itineraryDays");
  container.innerHTML = "";

  (dest.highlights || []).forEach((h, i) => {
    const div = document.createElement("div");
    div.textContent = `Day ${i + 1}: ${h}`;
    container.appendChild(div);
  });
}

// =================
// HELPERS
// =================
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || "—";
}

function setLink(id, url) {
  const el = document.getElementById(id);
  if (el) el.href = url;
}

function getVal(id) {
  return document.getElementById(id)?.value || "";
}

function safe(v) {
  return v || "";
}

function sanitizeAirportCode(v) {
  return String(v).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

function format(d) {
  return d.replace(/-/g, "").slice(2);
}

function setMessage(msg, err) {
  const el = document.getElementById("formMessage");
  if (!el) return;
  el.textContent = msg;
  el.style.color = err ? "red" : "#9cb2cc";
}

function show(id) {
  document.getElementById(id)?.classList.remove("is-hidden");
}

function hide(id) {
  document.getElementById(id)?.classList.add("is-hidden");
}

function updateHeader(img) {
  const el = document.getElementById("headerBg");
  if (!el) return;
  el.style.backgroundImage = `url("${img}")`;
}

function setLoading(state) {
  document.body.classList.toggle("loading", state);
}

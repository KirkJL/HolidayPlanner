// =======================
// DOM SAFE INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  bindEvents();
  setDefaultDates();
  resetUI();
}

// =======================
// DOM
// =======================
const form = document.getElementById("tripForm");
const emptyState = document.getElementById("emptyState");
const tripCard = document.getElementById("tripCard");

const tripHero = document.getElementById("tripHero");
const tripTitle = document.getElementById("tripTitle");
const tripSubtitle = document.getElementById("tripSubtitle");

const tripRoute = document.getElementById("tripRoute");
const tripDates = document.getElementById("tripDates");
const tripNights = document.getElementById("tripNights");

const snapshotGrid = document.getElementById("snapshotGrid");

const flightLink = document.getElementById("flightLink");
const hotelLink = document.getElementById("hotelLink");
const mapsLink = document.getElementById("mapsLink");

const itineraryDays = document.getElementById("itineraryDays");

const destinationBlurb = document.getElementById("destinationBlurb");
const highlightList = document.getElementById("highlightList");

const generateBtn = document.getElementById("generateBtn");
const rerollBtn = document.getElementById("rerollBtn");

const exportPngBtn = document.getElementById("exportPngBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

const headerBg = document.getElementById("headerBg");

let currentDestinationId = null;
let isGenerating = false;

// =======================
// EVENTS
// =======================
function bindEvents() {
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    generateTrip(false);
  });

  generateBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    generateTrip(false);
  });

  rerollBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    generateTrip(true);
  });

  exportPngBtn?.addEventListener("click", exportPNG);
  exportPdfBtn?.addEventListener("click", () => window.print());
}

// =======================
// CORE GENERATION
// =======================
async function generateTrip(reroll = false) {
  if (isGenerating) return;

  isGenerating = true;

  try {
    const from = sanitize(document.getElementById("from").value);
    const depart = document.getElementById("departDate").value;
    const ret = document.getElementById("returnDate").value;

    if (!from || !depart || !ret) return;

    const dest = pickDestination(reroll);

    if (!dest) return;

    currentDestinationId = dest.id;

    await transitionHeader(dest.image);

    const nights = daysBetween(depart, ret);

    render(dest, from, depart, ret, nights);

  } catch (err) {
    console.error(err);
  } finally {
    isGenerating = false;
  }
}

// =======================
// DESTINATION
// =======================
function pickDestination(reroll) {
  const list = window.DESTINATIONS || [];

  let pool = list;

  if (reroll && currentDestinationId) {
    pool = list.filter(d => d.id !== currentDestinationId);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// =======================
// RENDER
// =======================
function render(dest, from, depart, ret, nights) {
  emptyState.classList.add("is-hidden");
  tripCard.classList.remove("is-hidden");

  tripHero.style.backgroundImage = `url(${dest.image})`;

  tripTitle.textContent = dest.name;
  tripSubtitle.textContent = `${dest.country} · ${dest.airportName}`;

  tripRoute.textContent = `${from} → ${dest.airportCode}`;
  tripDates.textContent = `${depart} — ${ret}`;
  tripNights.textContent = `${nights} nights`;

  snapshotGrid.innerHTML = `
    <div>${dest.currency}</div>
    <div>${dest.timezone}</div>
    <div>${nights} nights</div>
  `;

  flightLink.href = buildFlight(from, dest.airportCode, depart, ret);
  hotelLink.href = buildHotel(dest.name);
  mapsLink.href = buildMap(dest.name);

  itineraryDays.innerHTML = "";
  (dest.highlights || []).forEach((h, i) => {
    const el = document.createElement("div");
    el.textContent = `Day ${i+1}: ${h}`;
    itineraryDays.appendChild(el);
  });

  destinationBlurb.textContent = dest.blurb;

  highlightList.innerHTML = dest.highlights.map(h => `<li>${h}</li>`).join("");
}

// =======================
// UI FEEL
// =======================
async function transitionHeader(img) {
  headerBg.style.opacity = 0;
  await delay(200);
  headerBg.style.backgroundImage = `url(${img})`;
  headerBg.style.opacity = 0.4;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// =======================
// HELPERS
// =======================
function sanitize(v) {
  return (v || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function daysBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function buildFlight(f, t, d, r) {
  return `https://www.skyscanner.net/transport/flights/${f}/${t}/${d}/${r}/`;
}

function buildHotel(q) {
  return `https://www.booking.com/searchresults.html?ss=${q}`;
}

function buildMap(q) {
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
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

function resetUI() {
  tripCard.classList.add("is-hidden");
  emptyState.classList.remove("is-hidden");
}

// =======================
// EXPORT
// =======================
function exportPNG() {
  html2canvas(document.body).then(canvas => {
    const link = document.createElement("a");
    link.download = "trip.png";
    link.href = canvas.toDataURL();
    link.click();
  });
}

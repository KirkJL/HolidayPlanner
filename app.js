const WORKER_URL = "holidays.kirkjlemon.workers.dev";

const btn = document.getElementById("generate");
const result = document.getElementById("result");

btn.onclick = async () => {

  const from = document.getElementById("from").value || "LON";
  const dates = document.getElementById("dates").value || "Flexible";
  const budget = document.getElementById("budget").value;

  const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];

  // WEATHER FETCH
  let weatherText = "Unavailable";
  try {
    const res = await fetch(`${WORKER_URL}/weather?lat=${dest.lat}&lon=${dest.lon}`);
    const data = await res.json();

    weatherText = `${data.temperature}°C, wind ${data.windspeed} km/h`;
  } catch (err) {
    console.error("Weather failed", err);
  }

  // COST ENGINE
  const multiplier = {
    low: 0.8,
    mid: 1,
    high: 1.5
  }[budget];

  const nights = 4;

  const flightCost = Math.round(dest.baseFlight * multiplier);
  const hotelNight = Math.round(dest.baseHotel * multiplier);
  const hotelTotal = hotelNight * nights;
  const food = 50 * nights;

  const total = flightCost + hotelTotal + food;

  // SKYSCANNER LINK
  const flightLink = `https://www.skyscanner.net/transport/flights/${from}/${dest.airport}/`;

  result.innerHTML = `
    <div class="card" id="card">

      <img class="hero" src="${dest.image}" />

      <div class="content">

        <h2>${dest.name}, ${dest.country}</h2>
        <p>${dates}</p>

        <div class="section">🌤 Weather: ${weatherText}</div>

        <div class="section">
          ✈️ Flights: ~£${flightCost}<br>
          <a href="${flightLink}" target="_blank">Search Live Flights</a>
        </div>

        <div class="section">🏨 Hotel: £${hotelTotal} (${hotelNight}/night)</div>
        <div class="section">🍔 Food: £${food}</div>

        <div class="section"><strong>Total: £${total}</strong></div>

        <div class="section">
          📅 Itinerary:
          <ul>
            <li>Day 1 – Arrival & explore</li>
            <li>Day 2 – Main sights</li>
            <li>Day 3 – Activity / relax</li>
            <li>Day 4 – Free day</li>
            <li>Day 5 – Return</li>
          </ul>
        </div>

      </div>
    </div>
  `;
};

// PNG EXPORT
document.getElementById("exportPNG").onclick = async () => {
  const card = document.getElementById("card");
  if (!card) return alert("Generate a trip first");

  const canvas = await html2canvas(card);
  const link = document.createElement("a");

  link.download = "trip.png";
  link.href = canvas.toDataURL();
  link.click();
};

// PDF EXPORT
document.getElementById("exportPDF").onclick = async () => {
  const card = document.getElementById("card");
  if (!card) return alert("Generate a trip first");

  const canvas = await html2canvas(card);
  const img = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.addImage(img, "PNG", 10, 10, 180, 100);
  pdf.save("trip.pdf");
};

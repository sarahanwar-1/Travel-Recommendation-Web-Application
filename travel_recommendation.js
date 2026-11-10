// Fallback image used when a photo fails to load
const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#cfe0f5"/><stop offset="1" stop-color="#7fa9dd"/>
      </linearGradient></defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="600" cy="170" r="70" fill="#ffffff" fill-opacity=".55"/>
      <path d="M0 470 L220 300 L380 420 L520 330 L800 500 L800 600 L0 600 Z" fill="#ffffff" fill-opacity=".35"/>
    </svg>`
  );

// Time zones for showing the local time next to each recommendation
const TIME_ZONES = {
  "japan": "Asia/Tokyo",
  "italy": "Europe/Rome",
  "cambodia": "Asia/Phnom_Penh",
  "india": "Asia/Kolkata",
  "french polynesia": "Pacific/Tahiti",
  "australia": "Australia/Sydney"
};

const CATEGORY_ICONS = { beach: "ic-beach", temple: "ic-temple", city: "ic-city" };

const searchInput = document.getElementById("searchInput");
const resultsSection = document.getElementById("resultsSection");
const resultsContainer = document.getElementById("results");
const resultsTitle = document.getElementById("resultsTitle");

// Escape text before putting it in innerHTML
function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

// Fetch data from JSON (loaded once, then reused)
let cachedData = null;
async function loadData() {
  if (cachedData) return cachedData;
  try {
    const response = await fetch("travel_recommendation_api.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    cachedData = await response.json();
    return cachedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

function showMessage(text) {
  resultsContainer.innerHTML = `<p class="message">${escapeHTML(text)}</p>`;
}

function showSection(title) {
  resultsTitle.textContent = title;
  resultsSection.hidden = false;
}

// Local time for a country, e.g. "3:45 PM"
function localTime(country) {
  const zone = country && TIME_ZONES[country.toLowerCase()];
  if (!zone) return "";
  try {
    return new Date().toLocaleTimeString("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

// Works out the country from "Angkor Wat, Cambodia" style names
function countryFromName(name) {
  const parts = String(name).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "";
}

function renderCards(places) {
  resultsContainer.innerHTML = "";
  places.forEach((place, i) => {
    const country = place.country || countryFromName(place.name);
    const time = localTime(country);
    const icon = CATEGORY_ICONS[place.category] || "ic-pin";
    const label = place.category ? place.category.charAt(0).toUpperCase() + place.category.slice(1) : "Destination";

    const card = document.createElement("article");
    card.className = "result-card";
    card.style.animationDelay = `${i * 80}ms`;
    card.innerHTML = `
      <div class="thumb">
        <img src="${escapeHTML(place.imageUrl)}" alt="${escapeHTML(place.name)}" loading="lazy">
        <span class="badge"><svg class="ico" aria-hidden="true"><use href="#${icon}"/></svg>${escapeHTML(label)}</span>
      </div>
      <div class="body">
        <h3>${escapeHTML(place.name)}</h3>
        <p>${escapeHTML(place.description)}</p>
        ${time ? `<span class="local-time"><svg class="ico" aria-hidden="true"><use href="#ic-clock"/></svg>Local time: ${escapeHTML(time)}</span>` : ""}
        <button type="button" class="plan">Plan this trip <svg class="ico" aria-hidden="true"><use href="#ic-plane"/></svg></button>
      </div>
    `;
    card.querySelector("img").addEventListener("error", e => {
      e.target.src = FALLBACK_IMG;
    }, { once: true });
    card.querySelector(".plan").addEventListener("click", () => planTrip(place.name));
    resultsContainer.appendChild(card);
  });
}

// Fill the contact form with the chosen destination
function planTrip(placeName) {
  const message = document.getElementById("message");
  message.value = `Hi! I'd love to plan a trip to ${placeName}. Could you send me some options?`;
  document.getElementById("Contact").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => document.getElementById("name").focus({ preventScroll: true }), 700);
}

// Search function
async function search() {
  const input = searchInput.value.toLowerCase().trim();

  if (!input) {
    showSection("Search");
    showMessage("Please enter a search term.");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const data = await loadData();
  if (!data) {
    showSection("Search");
    showMessage("Sorry, we couldn't load destinations right now. Please try again.");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  let results = [];
  let title = "Recommendations";
  const tag = (list, category, country) => list.map(p => ({ ...p, category, country: country || p.country }));

  if (input === "beach" || input === "beaches") {
    results = tag(data.beaches, "beach");
    title = "Beach recommendations";
  } else if (input === "temple" || input === "temples") {
    results = tag(data.temples, "temple");
    title = "Temple recommendations";
  } else if (input === "country" || input === "countries") {
    results = data.countries.flatMap(c => tag(c.cities, "city", c.name));
    title = "City recommendations";
  } else {
    const country = data.countries.find(c => c.name.toLowerCase() === input);
    if (country) {
      results = tag(country.cities, "city", country.name);
      title = `Cities in ${country.name}`;
    } else {
      // Also match a single city, e.g. "kyoto"
      for (const c of data.countries) {
        const city = c.cities.find(ci => ci.name.toLowerCase() === input);
        if (city) {
          results = tag([city], "city", c.name);
          title = `${city.name}, ${c.name}`;
          break;
        }
      }
    }
  }

  showSection(title);

  if (results.length) {
    renderCards(results);
  } else {
    showMessage("No results found. Try 'beach', 'temple', or a country name (e.g. Japan, Italy).");
  }

  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Reset function
function clearResults() {
  searchInput.value = "";
  resultsContainer.innerHTML = "";
  resultsSection.hidden = true;
}

// Events
document.getElementById("searchBtn").addEventListener("click", search);
document.getElementById("resetBtn").addEventListener("click", clearResults);
document.getElementById("resultsClose").addEventListener("click", () => {
  clearResults();
  document.getElementById("Destinations").scrollIntoView({ behavior: "smooth", block: "start" });
});
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") search();
});

// Any button with data-query runs that search (hero chips, cards, footer links)
document.querySelectorAll("[data-query]").forEach(btn => {
  btn.addEventListener("click", () => {
    searchInput.value = btn.dataset.query;
    search();
  });
});

// Destination filters
const filters = document.querySelectorAll(".filter");
const destGrid = document.getElementById("destGrid");
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.filter;
    filters.forEach(b => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    destGrid.classList.toggle("is-filtered", value !== "all");
    destGrid.querySelectorAll(".dest-card").forEach((card, i) => {
      const show = value === "all" || card.dataset.cat === value;
      card.hidden = !show;
      card.classList.remove("is-entering");
      if (show) {
        void card.offsetWidth; // restart the animation
        card.style.animationDelay = `${i * 50}ms`;
        card.classList.add("is-entering");
      }
    });
  });
});

// Hide broken photos so the colour background behind them shows instead
document.querySelectorAll("main img").forEach(img => {
  const fail = () => img.classList.add("img-failed");
  if (img.complete && img.naturalWidth === 0) fail();
  else img.addEventListener("error", fail, { once: true });
});

// Navbar gets a solid background after scrolling
const header = document.getElementById("siteHeader");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const menuToggle = document.getElementById("menuToggle");
const setMenu = open => {
  header.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
menuToggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => setMenu(false)));

// Contact form (demo only: no server)
document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  document.getElementById("formNote").textContent = "Thanks! We'll be in touch soon.";
  e.target.reset();
});

// Newsletter form (demo only: no server)
document.getElementById("newsletterForm").addEventListener("submit", e => {
  e.preventDefault();
  document.getElementById("newsletterNote").textContent = "You're subscribed. Watch your inbox for deals!";
  e.target.reset();
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/* ------------------------------------------------------------------
   How it works: a plane flies New York → Rome → Kyoto on the map
   and lights up each step as it arrives.
   ------------------------------------------------------------------ */
(function journeyMap() {
  const map = document.getElementById("journeyMap");
  if (!map) return;

  const route = document.getElementById("routeProgress");
  const glow = document.getElementById("routeGlow");
  const leg1 = document.getElementById("routeLeg1");
  const plane = document.getElementById("mapPlane");
  const pins = [...map.querySelectorAll(".pin")];
  const steps = [...document.querySelectorAll("#steps .step")];
  const statusEl = document.getElementById("flightStatus");
  const fill = document.getElementById("flightFill");
  const miniPlane = document.getElementById("flightPlane");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LABELS = ["Find your place", "Get a tailored plan", "Pack your bags"];
  const total = route.getTotalLength();
  const stops = [0, leg1.getTotalLength(), total];

  [route, glow].forEach(p => { p.style.strokeDasharray = `${total} ${total}`; });

  // Crop the map around the route on small screens so it stays readable
  const narrow = window.matchMedia("(max-width: 640px)");
  const setViewBox = () => map.setAttribute("viewBox", narrow.matches ? "180 0 740 270" : "0 0 1000 384");
  setViewBox();
  narrow.addEventListener("change", setViewBox);

  function placePlane(dist) {
    const d = Math.max(0, Math.min(total, dist));
    const p = route.getPointAtLength(d);
    const a = route.getPointAtLength(Math.max(0, d - 1));
    const b = route.getPointAtLength(Math.min(total, d + 1));
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    plane.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    const offset = total - d;
    route.style.strokeDashoffset = offset;
    glow.style.strokeDashoffset = offset;
    const pct = (d / total) * 100;
    fill.style.width = pct + "%";
    miniPlane.style.left = pct + "%";
  }

  // current = step being worked on; done = steps already finished
  function setState(current, doneCount, text) {
    steps.forEach((s, i) => {
      s.classList.toggle("is-active", i === current);
      s.classList.toggle("is-done", i < doneCount);
    });
    pins.forEach((p, i) => {
      p.classList.toggle("is-reached", i < doneCount || i === current);
      p.classList.toggle("is-current", i === current);
    });
    statusEl.textContent = text;
  }

  if (reduceMotion) {
    placePlane(total);
    setState(-1, 3, "Trip planned · Ready to fly");
    return;
  }

  // Timeline of the loop (milliseconds)
  const phases = [
    { type: "hold", at: 0, ms: 1600 },
    { type: "fly", from: 0, to: 1, ms: 3200 },
    { type: "hold", at: 1, ms: 1600 },
    { type: "fly", from: 1, to: 2, ms: 3400 },
    { type: "hold", at: 2, ms: 2000 },
    { type: "done", ms: 1800 }
  ];
  const loopMs = phases.reduce((sum, p) => sum + p.ms, 0);
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function render(time) {
    let t = time % loopMs;
    for (const ph of phases) {
      if (t > ph.ms) { t -= ph.ms; continue; }
      const k = t / ph.ms;
      if (ph.type === "hold") {
        placePlane(stops[ph.at]);
        setState(ph.at, ph.at, `Step ${ph.at + 1} of 3 · ${LABELS[ph.at]}`);
      } else if (ph.type === "fly") {
        placePlane(stops[ph.from] + (stops[ph.to] - stops[ph.from]) * ease(k));
        setState(ph.from, ph.from, `Step ${ph.from + 1} of 3 · ${LABELS[ph.from]}`);
      } else {
        placePlane(total);
        setState(-1, 3, "All done · Enjoy Kyoto!");
      }
      return;
    }
  }

  // Run only while the section is on screen
  let running = false, elapsed = 0, last = 0, raf = 0;
  const tick = now => {
    elapsed += now - last;
    last = now;
    render(elapsed);
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  render(0);
  let inView = !("IntersectionObserver" in window);
  if (!inView) {
    new IntersectionObserver(entries => {
      inView = entries[entries.length - 1].isIntersecting;
      inView && !document.hidden ? start() : stop();
    }, { threshold: 0.2 }).observe(map);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (inView) start();
  });
})();
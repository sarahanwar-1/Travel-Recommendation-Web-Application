// Map of fallback Unsplash images
const imageMap = {
  "sydney": "https://images.unsplash.com/photo-1506976785307-8732e854ad71?auto=format&fit=crop&w=800&q=60",
  "melbourne": "https://images.unsplash.com/photo-1506976785307-7c06d79f2d8e?auto=format&fit=crop&w=800&q=60",
  "tokyo": "https://images.unsplash.com/photo-1505060899440-23f4d5f1a5a9?auto=format&fit=crop&w=800&q=60",
  "kyoto": "https://images.unsplash.com/photo-1524492449090-d3c9d3c4f55d?auto=format&fit=crop&w=800&q=60",
  "rio": "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=800&q=60",
  "sao-paulo": "https://images.unsplash.com/photo-1508599589920-2a1dbd1f14d8?auto=format&fit=crop&w=800&q=60",
  "angkor-wat": "https://images.unsplash.com/photo-1507250808337-938ff36d36c3?auto=format&fit=crop&w=800&q=60",
  "taj-mahal": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=60",
  "bora-bora": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60",
  "copacabana": "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=800&q=60"
};

// Fetch data from JSON
async function loadData() {
  try {
    const response = await fetch("travel_recommendation_api.json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Search function
async function search() {
  const data = await loadData();
  const input = document.querySelector("nav input").value.toLowerCase().trim();
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = ""; // Clear old results

  if (!input) {
    resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
    return;
  }

  let results = [];

  // Handle beaches
  if (input === "beach" || input === "beaches") {
    results = data.beaches;
  }
  // Handle temples
  else if (input === "temple" || input === "temples") {
    results = data.temples;
  }
  // Handle countries
  else {
    const country = data.countries.find(
      c => c.name.toLowerCase() === input
    );
    if (country) {
      results = country.cities;
    }
  }

  // Show results
  if (results.length >= 2) {
    results.forEach(place => {
      let imgUrl = place.imageUrl;

      // Replace placeholder with real Unsplash image
      if (imgUrl.startsWith("enter_your_image")) {
        const key = place.name.toLowerCase().split(",")[0].replace(/\s+/g, "-");
        imgUrl = imageMap[key] || "https://via.placeholder.com/250x160?text=No+Image";
      }

      const card = document.createElement("div");
      card.classList.add("result-card");
      card.innerHTML = `
        <h3>${place.name}</h3>
        <img src="${imgUrl}" alt="${place.name}" width="250">
        <p>${place.description}</p>
      `;
      resultsContainer.appendChild(card);
    });
  } else {
    resultsContainer.innerHTML =
      "<p>No results found. Try 'beach', 'temple', or a country name (e.g. Japan, Brazil).</p>";
  }
}

// Clear function (for Clear button)
function clearResults() {
  document.querySelector("nav input").value = "";
  document.getElementById("results").innerHTML = "";
}

// Attach event listeners
document.getElementById("searchBtn").addEventListener("click", search);
document.getElementById("resetBtn").addEventListener("click", clearResults);

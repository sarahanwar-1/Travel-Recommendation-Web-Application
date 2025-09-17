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
        const card = document.createElement("div");
        card.classList.add("result-card");
        card.innerHTML = `
          <h3>${place.name}</h3>
          <img src="${place.imageUrl}" alt="${place.name}" width="250">
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
  
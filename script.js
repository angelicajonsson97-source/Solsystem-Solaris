async function init() {
  try {
    // steg 1 - hämta nyckel till API:et
    const keyResp = await fetch('https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/key');
    const keyData = await keyResp.json();
    const solarisKey = keyData.key;

    console.log('Key:', solarisKey);

     // steg 2 - hämta data om himlakroppar
    const resp = await fetch('https://corsproxy.io/?https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/bodies?errorcode=true', {
      method: 'GET',
      headers: { 'x-zocom': solarisKey }
    });

    const bodiesData = await resp.json();
    console.log("API response:", bodiesData);

    const bodiesArray = Array.isArray(bodiesData) ? bodiesData : bodiesData.bodies;
    if (!Array.isArray(bodiesArray)) {
      throw new Error("API-svaret innehåller ingen bodies-array");
    }

    renderBodies(bodiesArray);

  } catch (err) {
    console.error("Fel i init:", err);

    // skapa felruta direkt i JS
    const container = document.getElementById("planetContainer") || document.body;

    // ta bort ev. tidigare felruta
    const oldError = document.getElementById("errorBox");
    if (oldError) oldError.remove();

    const errorBox = document.createElement("div");
    errorBox.id = "errorBox";
    errorBox.style.background = "rgba(255,0,0,0.1)";
    errorBox.style.color = "#ff5555";
    errorBox.style.padding = "2rem";
    errorBox.style.borderRadius = "8px";
    errorBox.style.textAlign = "center";
    errorBox.style.margin = "1rem auto";
    errorBox.style.maxWidth = "400px";
    errorBox.style.fontWeight = "bold";

    errorBox.innerHTML = `
      <p> Misslyckad hämtning av data.</p>
      <button id="retryBtn">Hämta igen</button>
    `;

    container.appendChild(errorBox);

    document.getElementById("retryBtn").addEventListener("click", () => {
      errorBox.remove();
      init(); // kör om init
    });
  }
}

function renderBodies(bodies) {
  const container = document.getElementById("planetContainer");
  if (!container) return;

  container.innerHTML = "";

  bodies.forEach(body => {
    if (!body?.name || !body?.type) return;

    const element = document.createElement("span");

    // Lägg till klasser baserat på typ och namn
    element.classList.add(
      body.type === "star" ? "sun" : "planet",
      body.name.toLowerCase()
    );

    // Tillgänglighet
    element.setAttribute("aria-label", body.name);

    // Klickhändelse
    element.addEventListener("click", () => showOverlay(body));

    container.appendChild(element);
  });
}

function showOverlay(body) {
  const overlay = document.getElementById("overlay");
  const content = overlay.querySelector("#overlayContent");

  content.innerHTML = ""; // Rensa

  // Titelblock
  const header = document.createElement("article");
  header.classList.add("overlay-header");

  // Namn
  const title = document.createElement("h2");
  title.id = "planetName";
  title.textContent = body.name;

  // Latinskt namn
  const latin = document.createElement("h4");
  latin.id = "planetLatin";
  latin.textContent = body.latinName || "";

  header.appendChild(title);
  header.appendChild(latin);
  content.appendChild(header);

  // Beskrivning
  const desc = document.createElement("p");
  desc.id = "planetDesc";
desc.textContent = body.desc || "Ingen beskrivning tillgänglig."; // Fallback om ingen beskrivning finns
  content.appendChild(desc);

  // Fakta-lista
  const infoList = document.createElement("ul");
  infoList.id = "planetInfo";

  const fields = {
    Omkrets: body.circumference,
    "Avstånd från solen": body.distance,
    "Rotation (dygn)": body.rotation,
    "År (orbitalperiod)": body.orbitalPeriod,
    "Dagtemp": body.temp?.day,
    "Natt-temp": body.temp?.night,
    Månar: body.moons?.join(", ")
  };

  for (const [label, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    const li = document.createElement("li");
    li.innerHTML = `<strong>${label}:</strong> ${value}`;
    infoList.appendChild(li);
  }

  content.appendChild(infoList);

  // Stäng-knapp
  const closeBtn = document.createElement("button");
  closeBtn.id = "closeOverlay";
  closeBtn.textContent = "Stäng";
  closeBtn.addEventListener("click", () => overlay.classList.remove("active"));
  content.appendChild(closeBtn);

  overlay.classList.add("active");

  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
}

init();
async function init() {
  try {
    // hämta nyckel till API:et
    const keyResp = await fetch('https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/key');
    const keyData = await keyResp.json();
    const solarisKey = keyData.key;

    // visa nyckeln i konsolen
    console.log('Key:', solarisKey);

     // hämta data om himlakroppar
    const resp = await fetch('https://corsproxy.io/?https://4a6l0o1px9.execute-api.eu-north-1.amazonaws.com/bodies?errorcode=true', {
      method: 'GET',
      headers: { 'x-zocom': solarisKey }
    });


  // Konvertera API-svaret till ett JavaScript-objekt
  // Logga hela svaret i konsolen för felsökning
    const bodiesData = await resp.json();
    console.log("API response:", bodiesData);

    // Kontrollera om svaret innehåller en bodies-array
    const bodiesArray = Array.isArray(bodiesData) ? bodiesData : bodiesData.bodies;
    if (!Array.isArray(bodiesArray)) {
      throw new Error("API innehåller ingen bodies-array");
    }

  // Rendera himlakropparna
    renderBodies(bodiesArray);

  // Error-hantering
  } catch (err) {
    console.error("Fel i init:", err);

    // skapa felruta direkt i JS
    const container = document.getElementById("planetContainer") || document.body;

    // ta bort ev. tidigare felruta
    const oldError = document.getElementById("errorBox");
    if (oldError) oldError.remove();

    // style felruta
    const errorBox = document.createElement("section");
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

    // Lägg till felruta
    container.appendChild(errorBox);

    // Lägg till klick-händelse för retry-knappen
    document.getElementById("retryBtn").addEventListener("click", () => {
      errorBox.remove();
      init(); // kör om init
    });
  }
}
// Rendera himlakroppar från data
function renderBodies(bodies) {
  const container = document.getElementById("planetContainer");
  if (!container) return;

  container.innerHTML = "";
// Skapa element för varje himlakropp
  bodies.forEach(body => {
    if (!body?.name || !body?.type) return;
// Skapa span-element
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
    // Lägg till element i containern
    container.appendChild(element);
  });
}
// Visa overlay med detaljerad info
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
  // Lägg till titlar i header
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
 
  // Fakta-lista
  const fields = {
    Omkrets: body.circumference,
    "Avstånd från solen": body.distance,
    "Rotation (dygn)": body.rotation,
    "År (orbitalperiod)": body.orbitalPeriod,
    "Dagtemp": body.temp?.day,
    "Natt-temp": body.temp?.night,
    Månar: body.moons?.join(", ")
  };
  
 // Fyll fakta-listan
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

  // Visa overlay
  overlay.classList.add("active");

  // Klick utanför innehåll stänger overlay
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
}

init();
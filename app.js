// ── DOM references ────────────────────────────────────────
const searchBtn       = document.getElementById('searchBtn');
const countryInput    = document.getElementById('countryInput');
const errorMsg        = document.getElementById('errorMsg');
const resultsSection  = document.getElementById('resultsSection');

const flagImg         = document.getElementById('flagImg');
const countryName     = document.getElementById('countryName');
const countryRegion   = document.getElementById('countryRegion');
const capital         = document.getElementById('capital');
const population      = document.getElementById('population');
const currencyName    = document.getElementById('currencyName');
const currencyCode    = document.getElementById('currencyCode');

const rateValue       = document.getElementById('rateValue');
const rateCode        = document.getElementById('rateCode');
const rateUnavailable = document.getElementById('rateUnavailable');
const usdAmount       = document.getElementById('usdAmount');
const convertedAmount = document.getElementById('convertedAmount');
const convertedCode   = document.getElementById('convertedCode');

// Store live rate globally so the converter can use it
let currentRate = null;
let currentCurrencyCode = '';

// ── Search button click ───────────────────────────────────
searchBtn.addEventListener('click', handleSearch);

// Also search when user presses Enter
countryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// Live converter: recalculate whenever the USD input changes
usdAmount.addEventListener('input', updateConverter);

// ── Main search handler ───────────────────────────────────
async function handleSearch() {
  const query = countryInput.value.trim();
  if (!query) return;

  clearUI();

  try {
    // STEP 3 — Fetch country data
    const countryData = await fetchCountry(query);

    // STEP 4 — Fetch live exchange rates
    const rates = await fetchRates();

    // Render everything to the page
    renderCountry(countryData, rates);

  } catch (err) {
    showError(err.message);
  }
}

// ── Step 3: Fetch country info ────────────────────────────
async function fetchCountry(name) {
  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Country "${name}" not found. Please check the spelling.`);
  }

  const data = await response.json();
  return data[0]; // API returns an array; we take the first match
}

// ── Step 4: Fetch exchange rates (USD base) ───────────────
async function fetchRates() {
  const url = 'https://api.exchangerate-api.com/v4/latest/USD';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not fetch exchange rates. Try again later.');
  }

  const data = await response.json();
  return data.rates; // e.g. { EUR: 0.92, JPY: 149.5, ... }
}

// ── Render data to the page ───────────────────────────────
function renderCountry(country, rates) {
  // -- Country details --
  flagImg.src        = country.flags.svg || country.flags.png;
  flagImg.alt        = country.flags.alt || `Flag of ${country.name.common}`;
  countryName.textContent   = country.name.common;
  countryRegion.textContent = country.region;
  capital.textContent       = country.capital?.[0] ?? 'N/A';
  population.textContent    = country.population.toLocaleString();

  // -- Currency details --
  // The API returns currencies as an object like:
  // { "JPY": { name: "Japanese yen", symbol: "¥" } }
  const currencyCodes = Object.keys(country.currencies || {});

  if (currencyCodes.length === 0) {
    currencyName.textContent = 'N/A';
    currencyCode.textContent = 'N/A';
    showRateUnavailable();
  } else {
    const code  = currencyCodes[0];
    const cInfo = country.currencies[code];

    currencyName.textContent = `${cInfo.name} (${cInfo.symbol ?? ''})`;
    currencyCode.textContent = code;

    // -- Live rate --
    currentCurrencyCode = code;
    currentRate = rates[code] ?? null;

    if (currentRate) {
      rateValue.textContent = currentRate.toFixed(4);
      rateCode.textContent  = code;
      rateUnavailable.classList.add('hidden');
      updateConverter();
    } else {
      showRateUnavailable();
    }
  }

  // Show the results section
  resultsSection.classList.remove('hidden');
}

// ── Converter logic ───────────────────────────────────────
function updateConverter() {
  const amount = parseFloat(usdAmount.value);
  convertedCode.textContent = currentCurrencyCode;

  if (!currentRate || isNaN(amount) || amount < 0) {
    convertedAmount.value = '';
    return;
  }

  const result = amount * currentRate;
  convertedAmount.value = result.toFixed(2);
}

// ── Helpers ───────────────────────────────────────────────
function showRateUnavailable() {
  rateValue.textContent = '—';
  rateCode.textContent  = '';
  rateUnavailable.classList.remove('hidden');
  convertedAmount.value = '';
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
}

function clearUI() {
  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';
  resultsSection.classList.add('hidden');
  currentRate = null;
  currentCurrencyCode = '';
}
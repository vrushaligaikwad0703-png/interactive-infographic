
const ctx = document.getElementById('chartCanvas').getContext('2d');

// ------- demo dataset structure: data[country][year] -> {labels:[], values:[]}
const demoData = {
  "Global": {
    2022: { labels:["Samsung","Apple","Xiaomi","Oppo","Vivo","Huawei","Realme","Motorola","Infinix","Tecno","OnePlus","Google","Sony","Nokia"], values:[22,19,13,9,8,7,4,3,3,3,2,2,2,2] },
    2023: { labels:["Samsung","Apple","Xiaomi","Oppo","Vivo","Huawei","Realme","Motorola","Infinix","Tecno","OnePlus","Google","Sony","Nokia"], values:[21,19,13,9,8,6,5,4,3,3,2,2,2,2] },
    2024: { labels:["Samsung","Apple","Xiaomi","Oppo","Vivo","Huawei","Realme","Motorola","Infinix","Tecno","OnePlus","Google","Sony","Nokia"], values:[21,18,12,9,8,6,5,4,3,3,3,3,2,2] },
    2025: { labels:["Samsung","Apple","Xiaomi","Oppo","Vivo","Realme","Motorola","Huawei","Nothing","Google Pixel","Infinix","OnePlus","Sony","Nokia"], values:[20,18,12,9,8,6,4,5,3,3,3,2,2,2] },
    2026: { labels:["Samsung","Apple","Xiaomi","Oppo","Vivo","Realme","Motorola","Huawei","Nothing","Google Pixel","Infinix","OnePlus","Sony","Nokia"], values:[19,18,12,10,8,6,5,5,3,3,3,2,2,2] }
  },
  "India": {
    2022: { labels:["Xiaomi","Realme","Samsung","Vivo","Oppo","Apple","Infinix","Motorola"], values:[26,16,15,12,9,10,6,6] },
    2023: { labels:["Xiaomi","Realme","Samsung","Vivo","Oppo","Apple","Infinix","Motorola"], values:[25,17,15,12,9,11,6,5] },
    2024: { labels:["Xiaomi","Realme","Samsung","Vivo","Oppo","Apple","Infinix","Motorola"], values:[24,18,15,12,9,12,5,5] },
    2025: { labels:["Xiaomi","Realme","Samsung","Vivo","Oppo","Apple","Infinix","Motorola"], values:[23,18,16,12,9,13,5,4] },
    2026: { labels:["Xiaomi","Realme","Samsung","Vivo","Oppo","Apple","Infinix","Motorola"], values:[22,19,16,12,9,14,5,3] }
  },
  "USA": {
    2022: { labels:["Apple","Samsung","OnePlus","Google","Motorola","Others"], values:[49,27,6,6,4,8] },
    2023: { labels:["Apple","Samsung","OnePlus","Google","Motorola","Others"], values:[50,26,6,6,4,8] },
    2024: { labels:["Apple","Samsung","OnePlus","Google","Motorola","Others"], values:[51,25,6,6,4,8] },
    2025: { labels:["Apple","Samsung","OnePlus","Google","Motorola","Others"], values:[51,25,6,6,4,8] },
    2026: { labels:["Apple","Samsung","Google","OnePlus","Motorola","Others"], values:[50,26,7,6,4,7] }
  },
  "China": {
    2022: { labels:["Huawei","Vivo","Oppo","Xiaomi","Apple","Others"], values:[28,18,15,15,9,15] },
    2023: { labels:["Huawei","Vivo","Oppo","Xiaomi","Apple","Others"], values:[27,19,15,15,9,15] },
    2024: { labels:["Huawei","Vivo","Oppo","Xiaomi","Apple","Others"], values:[26,19,15,15,10,15] },
    2025: { labels:["Huawei","Vivo","Oppo","Xiaomi","Apple","Others"], values:[26,19,15,15,10,15] },
    2026: { labels:["Xiaomi","Vivo","Oppo","Huawei","Apple","Others"], values:[27,19,15,13,9,17] }
  }
};

// app state (persist)
const state = {
  mode: localStorage.getItem('chartMode') || 'bar',     // 'bar' or 'pie'
  theme: localStorage.getItem('theme') || 'dark',      // 'dark' or 'light'
  country: localStorage.getItem('country') || 'Global',
  year: parseInt(localStorage.getItem('year')) || 2025
};

// attempt to fetch live data (demo endpoint) — if success, merge / override demoData
const apiURL = "https://example.com/api/marketshare"; // placeholder
let usingAPI = false;
fetch(apiURL, { method: 'GET' })
  .then(r => r.ok ? r.json() : Promise.reject('no-api'))
  .then(json => {
    // IMPORTANT: this code expects same shape as demoData
    // if the API returns usable data, override demoData (best-effort)
    // example: json = { Global: {2025: { labels: [], values: [] }}, ... }
    if (json && typeof json === 'object') {
      console.info('API data loaded — using API data where available');
      Object.assign(demoData, json);
      usingAPI = true;
      document.getElementById('sourceLabel').textContent = 'API (live)';
    }
  })
  .catch(() => {
    // no API — show toast briefly
    showToast('Live data not available — using demo data');
    document.getElementById('sourceLabel').textContent = 'Demo';
  });

// UI elements
const chartCanvas = document.getElementById('chartCanvas');
const barBtn = document.getElementById('barBtn');
const pieBtn = document.getElementById('pieBtn');
const countrySelect = document.getElementById('countrySelect');
const yearRange = document.getElementById('yearRange');
const yearLabel = document.getElementById('yearLabel');
const themeToggle = document.getElementById('themeToggle');
const modeLabel = document.getElementById('modeLabel');
const topBrand = document.getElementById('topBrand');
const topDetail = document.getElementById('topDetail');
const sourceLabel = document.getElementById('sourceLabel');
const toast = document.getElementById('toast');

// apply initial theme
applyTheme(state.theme);
countrySelect.value = state.country;
yearRange.value = state.year;
yearLabel.textContent = state.year;
modeLabel.textContent = capitalize(state.mode);

// faux 3D plugin for Chart.js (bar)
const faux3DPlugin = {
  id: 'faux3d',
  beforeDatasetsDraw(chart, args, options) {
    if (chart.config.type !== 'bar') return;
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    // draw offset darker shadows behind bars to simulate depth
    meta.data.forEach((barElem, i) => {
      const rect = barElem.getProps(['x','y','base','width','height']);
      // compute small offset
      const depth = Math.max(6, Math.min(18, Math.round(rect.width * 0.12)));
      ctx.fillStyle = shadeColor(dataset.backgroundColor[i] || dataset.backgroundColor, -30);
      ctx.beginPath();
      // draw slightly skewed rectangle offset down-right
      ctx.moveTo(rect.x - rect.width/2 + depth*0.3, rect.base + depth);
      ctx.lineTo(rect.x + rect.width/2 + depth*0.3, rect.base + depth);
      ctx.lineTo(rect.x + rect.width/2 - (rect.base - rect.y) + depth*0.3, rect.y + depth);
      ctx.lineTo(rect.x - rect.width/2 - (rect.base - rect.y) + depth*0.3, rect.y + depth);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }
};

// small helper to darken/lighten colors
function shadeColor(hex, percent) {
  // accepts "#RRGGBB" or "rgba(...)" fallback to hex default
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let c = hex.replace('#','');
  if (c.length===3) c = c.split('').map(ch=>ch+ch).join('');
  const num = parseInt(c,16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `rgb(${R},${G},${B})`;
}

// build color palette (ensure consistent per label)
function paletteForLabels(labels) {
  // generate bright pastel palette
  const base = ["#05E1FF","#7AF27A","#FFD166","#FF7A7A","#D07CFF","#52D2FF","#FF9F55","#A0A9FF","#FF67B5","#6EE7B7","#FFB86E","#8BF3FF","#C7B3FF","#FFDB7D"];
  // map by label index
  return labels.map((l,i)=> base[i % base.length]);
}

// current chart instance
let chart = null;

// render helper
function renderChart(mode=state.mode, country=state.country, year=state.year){
  const payload = (demoData[country] && demoData[country][year]) ? demoData[country][year] : { labels: [], values: [] };
  const labels = payload.labels.slice();
  const values = payload.values.slice();

  // create color list
  const bg = paletteForLabels(labels);

  // destroy previous
  if (chart) { chart.destroy(); chart = null; }

  const config = {
    type: mode,
    data: {
      labels,
      datasets: [{
        label: 'Market Share %',
        data: values,
        backgroundColor: bg,
        borderColor: bg.map(c => shadeColor(c,-20)),
        borderWidth: mode === 'pie' ? 1 : 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: mode === 'pie' },
        tooltip: {
          enabled: false, // we'll show our own light tooltip via onHover
        }
      },
      animation: {
        duration: 900,
        easing: 'easeOutQuart'
      },
      onHover(evt, elements) {
        // update tooltip-like summary and highlight
        if (!elements || elements.length === 0) {
          chartCanvas.style.cursor = 'default';
          updateSummary(null, labels, values);
          return;
        }
        chartCanvas.style.cursor = 'pointer';
        const idx = elements[0].index;
        updateSummary(idx, labels, values);
      }
    },
    plugins: mode === 'bar' ? [faux3DPlugin] : []
  };

  chart = new Chart(chartCanvas, config);

  // update small UI labels
  modeLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  document.getElementById('modeLabel').textContent = modeLabel.textContent;
  document.getElementById('sourceLabel').textContent = usingAPI ? 'API (live)' : 'Demo';

  // save preference
  localStorage.setItem('chartMode', mode);
}

// update summary card (top brand or hovered)
function updateSummary(index, labels, values){
  if (!labels || labels.length===0) {
    topBrand.textContent = '—';
    topDetail.textContent = 'No data';
    return;
  }
  if (index === null || typeof index === 'undefined') {
    // show top brand by value
    let maxIdx = 0;
    values.forEach((v,i)=>{ if(v>values[maxIdx]) maxIdx = i; });
    topBrand.textContent = `${labels[maxIdx]} — ${values[maxIdx]}%`;
    topDetail.textContent = `Top brand (${state.country}, ${state.year})`;
  } else {
    topBrand.textContent = `${labels[index]} — ${values[index]}%`;
    topDetail.textContent = `Clicked / hovered brand`;
  }
}

// UI wiring
barBtn.addEventListener('click', () => {
  state.mode = 'bar'; setActive('bar'); renderChart(state.mode, state.country, state.year);
});
pieBtn.addEventListener('click', () => {
  state.mode = 'pie'; setActive('pie'); renderChart(state.mode, state.country, state.year);
});

countrySelect.addEventListener('change', (e) => {
  state.country = e.target.value;
  localStorage.setItem('country', state.country);
  renderChart(state.mode, state.country, state.year);
});

yearRange.addEventListener('input', (e) => {
  state.year = parseInt(e.target.value);
  yearLabel.textContent = state.year;
});
yearRange.addEventListener('change', () => {
  localStorage.setItem('year', state.year);
  renderChart(state.mode, state.country, state.year);
});

themeToggle.addEventListener('click', () => {
  state.theme = (state.theme === 'dark') ? 'light' : 'dark';
  applyTheme(state.theme);
  localStorage.setItem('theme', state.theme);
});

// helper to set the active segment button
function setActive(kind){
  document.querySelectorAll('.seg').forEach(s => s.classList.remove('active'));
  if (kind === 'bar') document.getElementById('barBtn').classList.add('active');
  else document.getElementById('pieBtn').classList.add('active');
}

// apply theme class
function applyTheme(theme){
  if (theme === 'light') document.body.classList.add('light');
  else document.body.classList.remove('light');
}

// small utilities
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1) }
function showToast(msg, t=3200){
  toast.textContent = msg; toast.style.display = 'block'; toast.style.opacity = 1;
  setTimeout(()=> { toast.style.transition = 'opacity 600ms'; toast.style.opacity = 0; setTimeout(()=>toast.style.display='none',600); }, t);
}

// initial render
setActive(state.mode);
renderChart(state.mode, state.country, state.year);
updateSummary(null, demoData[state.country][state.year].labels, demoData[state.country][state.year].values);

// persist UI on unload
window.addEventListener('beforeunload', () => {
  localStorage.setItem('chartMode', state.mode);
  localStorage.setItem('theme', state.theme);
  localStorage.setItem('country', state.country);
  localStorage.setItem('year', state.year);
});

import { useState, useCallback, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { weatherEngine } from "./lib/weatherEngine.js";
import { pciDecayEngine } from "./lib/pciDecay.js";
import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch(err) {
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function AreaMapper({ onCalculate }) {
  const [points, setPoints] = useState([]);
  
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newPoints = [...points, [e.latlng.lat, e.latlng.lng]];
        setPoints(newPoints);
        if (newPoints.length >= 3) {
          const coords = [...newPoints, newPoints[0]];
          const polygon = turf.polygon([[...coords.map(p => [p[1], p[0]])]]);
          const areaSqMeters = turf.area(polygon);
          const areaSqFt = areaSqMeters * 10.7639;
          onCalculate(Math.round(areaSqFt));
        }
      }
    });
    return null;
  };

  return (
    <div style={{ height: 280, width: '100%', border: '1px solid #333', marginTop: 12, borderRadius: 6, overflow: 'hidden' }}>
      <MapContainer center={[37.5407, -77.4360]} zoom={17} style={{ height: 'calc(100% - 35px)', width: '100%' }}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" />
        <MapEvents />
        {points.length > 0 && <Polygon positions={points} color="#f59e0b" fillColor="#f59e0b" fillOpacity={0.4} />}
      </MapContainer>
      <div style={{ height: 35, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888' }}>
        {points.length < 3 ? "Click map to draw property boundary..." : <button onClick={() => setPoints([])} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>CLEAR MAP</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// THE WORDEN COMMAND SYSTEM — Every Ferrari, One Garage
// All logic extracted from: wordenstandard, codexbuildfreeofbase44, gemini-site
// Elevated to highest-level use. Jarvis at full capacity.
// ═══════════════════════════════════════════════════════════════════════════

// ── 50-STATE MASTER DATA (from states50.js) ─────────────────────────────────
const STATES=[{abbr:'AL',name:'Alabama',region:'Southeast',laborIndex:0.82,materialPremium:0.92,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'medium'},{abbr:'AK',name:'Alaska',region:'West',laborIndex:1.40,materialPremium:1.35,asphaltMonths:4,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'low'},{abbr:'AZ',name:'Arizona',region:'Southwest',laborIndex:0.92,materialPremium:0.96,asphaltMonths:10,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'AR',name:'Arkansas',region:'Southeast',laborIndex:0.80,materialPremium:0.91,asphaltMonths:8,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'medium'},{abbr:'CA',name:'California',region:'West',laborIndex:1.35,materialPremium:1.10,asphaltMonths:9,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'CO',name:'Colorado',region:'West',laborIndex:1.07,materialPremium:1.00,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'medium'},{abbr:'CT',name:'Connecticut',region:'Northeast',laborIndex:1.28,materialPremium:1.12,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'DE',name:'Delaware',region:'Northeast',laborIndex:1.03,materialPremium:1.02,asphaltMonths:8,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'FL',name:'Florida',region:'Southeast',laborIndex:0.90,materialPremium:0.95,asphaltMonths:11,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'high'},{abbr:'GA',name:'Georgia',region:'Southeast',laborIndex:0.87,materialPremium:0.93,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'high'},{abbr:'HI',name:'Hawaii',region:'West',laborIndex:1.45,materialPremium:1.40,asphaltMonths:12,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'ID',name:'Idaho',region:'West',laborIndex:0.88,materialPremium:0.97,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'IL',name:'Illinois',region:'Midwest',laborIndex:1.15,materialPremium:1.00,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'high'},{abbr:'IN',name:'Indiana',region:'Midwest',laborIndex:0.88,materialPremium:0.97,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:false,qsrDensity:'medium'},{abbr:'IA',name:'Iowa',region:'Midwest',laborIndex:0.86,materialPremium:0.97,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:false,qsrDensity:'medium'},{abbr:'KS',name:'Kansas',region:'Midwest',laborIndex:0.87,materialPremium:0.95,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:false,qsrDensity:'medium'},{abbr:'KY',name:'Kentucky',region:'Southeast',laborIndex:0.86,materialPremium:0.95,asphaltMonths:8,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'LA',name:'Louisiana',region:'Southeast',laborIndex:0.84,materialPremium:0.91,asphaltMonths:10,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'ME',name:'Maine',region:'Northeast',laborIndex:0.88,materialPremium:1.05,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'MD',name:'Maryland',region:'Northeast',laborIndex:1.12,materialPremium:1.02,asphaltMonths:8,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'MA',name:'Massachusetts',region:'Northeast',laborIndex:1.30,materialPremium:1.15,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'MI',name:'Michigan',region:'Midwest',laborIndex:0.95,materialPremium:0.97,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'MN',name:'Minnesota',region:'Midwest',laborIndex:1.08,materialPremium:0.97,asphaltMonths:5,hasPrevailingWage:true,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'medium'},{abbr:'MS',name:'Mississippi',region:'Southeast',laborIndex:0.78,materialPremium:0.90,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'medium'},{abbr:'MO',name:'Missouri',region:'Midwest',laborIndex:0.87,materialPremium:0.95,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:false,qsrDensity:'medium'},{abbr:'MT',name:'Montana',region:'West',laborIndex:0.85,materialPremium:0.97,asphaltMonths:5,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'NE',name:'Nebraska',region:'Midwest',laborIndex:0.86,materialPremium:0.95,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'medium'},{abbr:'NV',name:'Nevada',region:'West',laborIndex:0.93,materialPremium:0.98,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'NH',name:'New Hampshire',region:'Northeast',laborIndex:1.00,materialPremium:1.03,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'NJ',name:'New Jersey',region:'Northeast',laborIndex:1.25,materialPremium:1.12,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'NM',name:'New Mexico',region:'Southwest',laborIndex:0.83,materialPremium:0.95,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'NY',name:'New York',region:'Northeast',laborIndex:1.38,materialPremium:1.18,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'high'},{abbr:'NC',name:'North Carolina',region:'Southeast',laborIndex:0.88,materialPremium:0.93,asphaltMonths:8,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'high'},{abbr:'ND',name:'North Dakota',region:'Midwest',laborIndex:0.88,materialPremium:0.97,asphaltMonths:5,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'OH',name:'Ohio',region:'Midwest',laborIndex:0.95,materialPremium:0.97,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'high'},{abbr:'OK',name:'Oklahoma',region:'South',laborIndex:0.83,materialPremium:0.91,asphaltMonths:8,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'medium'},{abbr:'OR',name:'Oregon',region:'West',laborIndex:1.10,materialPremium:1.06,asphaltMonths:8,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'PA',name:'Pennsylvania',region:'Northeast',laborIndex:1.05,materialPremium:1.01,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'high'},{abbr:'RI',name:'Rhode Island',region:'Northeast',laborIndex:1.03,materialPremium:1.06,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'SC',name:'South Carolina',region:'Southeast',laborIndex:0.85,materialPremium:0.92,asphaltMonths:9,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'SD',name:'South Dakota',region:'Midwest',laborIndex:0.83,materialPremium:0.95,asphaltMonths:5,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'TN',name:'Tennessee',region:'Southeast',laborIndex:0.85,materialPremium:0.93,asphaltMonths:8,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'TX',name:'Texas',region:'South',laborIndex:0.92,materialPremium:0.93,asphaltMonths:10,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:false,qsrDensity:'high'},{abbr:'UT',name:'Utah',region:'West',laborIndex:0.92,materialPremium:0.96,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'VT',name:'Vermont',region:'Northeast',laborIndex:0.90,materialPremium:1.05,asphaltMonths:6,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'VA',name:'Virginia',region:'Southeast',laborIndex:0.97,materialPremium:0.95,asphaltMonths:8,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'},{abbr:'WA',name:'Washington',region:'West',laborIndex:1.22,materialPremium:1.08,asphaltMonths:7,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'medium'},{abbr:'WV',name:'West Virginia',region:'Southeast',laborIndex:0.82,materialPremium:0.93,asphaltMonths:7,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'low'},{abbr:'WI',name:'Wisconsin',region:'Midwest',laborIndex:0.93,materialPremium:0.97,asphaltMonths:6,hasPrevailingWage:false,hasStateLicensing:false,hasStateOsha:true,qsrDensity:'medium'},{abbr:'WY',name:'Wyoming',region:'West',laborIndex:0.88,materialPremium:0.97,asphaltMonths:5,hasPrevailingWage:false,hasStateLicensing:true,hasStateOsha:false,qsrDensity:'low'},{abbr:'DC',name:'Washington DC',region:'Northeast',laborIndex:1.35,materialPremium:1.05,asphaltMonths:8,hasPrevailingWage:true,hasStateLicensing:true,hasStateOsha:true,qsrDensity:'high'}];
const STATE_MAP=Object.fromEntries(STATES.map(s=>[s.abbr,s]));
const getMultiplier=(code)=>{const s=STATE_MAP[code];if(!s)return 1;return(s.laborIndex*0.65)+(s.materialPremium*0.35)};

// ── PRICING ENGINE (18 services from codex pricing.py + ws pricing.js) ──────
const RATES={
  paving:{residential:{low:3.5,high:8},commercial:{low:2.5,high:6}},
  sealcoating:{residential:{low:0.15,high:0.35},commercial:{low:0.12,high:0.30}},
  crackfill:{residential:{low:0.40,high:1.00},commercial:{low:0.35,high:0.90}},
  patching:{residential:{low:1.50,high:4.00},commercial:{low:1.50,high:4.00}},
  overlay:{residential:{low:2.00,high:4.50},commercial:{low:2.00,high:4.50}},
  pothole:{residential:{low:2.00,high:5.00},commercial:{low:2.00,high:5.00}},
  striping:{residential:{low:0.10,high:0.25},commercial:{low:0.10,high:0.25}},
  parking_lot:{residential:{low:3,high:7},commercial:{low:3,high:7}},
  driveway:{residential:{low:3.5,high:7.5},commercial:{low:3,high:6.5}},
  maintenance:{residential:{low:0.20,high:0.40},commercial:{low:0.18,high:0.40}},
  concrete:{residential:{low:6,high:14},commercial:{low:7,high:16}},
  cobblestone_pavers:{residential:{low:15,high:55},commercial:{low:18,high:60}},
  stone_masonry:{residential:{low:30,high:85},commercial:{low:35,high:100}},
  general_contracting:{residential:{low:85,high:250},commercial:{low:75,high:200}},
  new_construction:{residential:{low:120,high:320},commercial:{low:110,high:280}},
  civil_site_work:{residential:{low:4,high:12},commercial:{low:5,high:18}},
  reconstruction:{residential:{low:5,high:10},commercial:{low:5,high:10}},
  drone_survey:{residential:{low:0.003,high:0.012},commercial:{low:0.0025,high:0.009}},
};
const SVC_LABELS={paving:'Asphalt Paving',sealcoating:'Sealcoating',crackfill:'Crack Filling',patching:'Patching',overlay:'Overlay (No Mill)',pothole:'Pothole Repair',striping:'Line Striping',parking_lot:'Parking Lot',driveway:'Driveway',maintenance:'Maintenance Plan',concrete:'Concrete',cobblestone_pavers:'Cobblestone/Pavers',stone_masonry:'Stone Masonry',general_contracting:'General Contracting',new_construction:'New Construction',civil_site_work:'Civil Site Work',reconstruction:'Full Reconstruction',drone_survey:'Drone Survey'};
const fmt$=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const r50=n=>Math.round(n/50)*50;
function estimatePrice(svc,prop,sqft,st){
  const rates=RATES[svc]?.[prop]||RATES[svc]?.residential;if(!rates||sqft<=0)return null;
  const m=st?getMultiplier(st):1;
  return{low:Math.max(r50(rates.low*sqft*m),300),high:Math.max(r50(rates.high*sqft*m),600)};
}

// ── WORDEN STANDARD TONNAGE MATH (proprietary) ─────────────────────────────
function wordenTonnage(sqft,depthInches,isIndustrial=false){
  const density=isIndustrial?148:145;
  const tons=(sqft/9*depthInches*density)/24000;
  const mauldinSurcharge=tons*0.08;
  return{tons:Math.round(tons*100)/100,mauldinSurcharge:Math.round(mauldinSurcharge*100)/100,density};
}

// ── FUSION ENGINE (from signals.ts — 4 models) ─────────────────────────────
const sigmoid=x=>{if(x>30)return 1;if(x<-30)return 0;return 1/(1+Math.exp(-x))};
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const mean=xs=>{if(!xs.length)return 0;return xs.reduce((a,b)=>a+b,0)/xs.length};
const stddev=xs=>{if(xs.length<2)return 0;const m=mean(xs);return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))};

const FUSION_MODELS={
  boom_probability_v1:{id:'boom_probability_v1',label:'Boom Probability',tau:90,signals:[
    {id:'permits',weight:0.22,leadDays:90},{id:'sam_spending',weight:0.18,leadDays:180},
    {id:'yield_curve',weight:0.15,leadDays:365},{id:'jolts_openings',weight:0.12,leadDays:60},
    {id:'private_res',weight:0.12,leadDays:90},{id:'diesel',weight:0.08,leadDays:30,invert:true},
    {id:'housing_value',weight:0.08,leadDays:90},{id:'population',weight:0.05,leadDays:365}]},
  trade_demand_v1:{id:'trade_demand_v1',label:'Trade Demand',tau:60,signals:[
    {id:'permits',weight:0.30,leadDays:60},{id:'jolts_hires',weight:0.25,leadDays:45},
    {id:'sam_spending',weight:0.20,leadDays:90},{id:'private_res',weight:0.15,leadDays:60},
    {id:'diesel',weight:0.10,leadDays:30,invert:true}]},
  margin_erosion_v1:{id:'margin_erosion_v1',label:'Margin Erosion',tau:60,signals:[
    {id:'diesel',weight:0.30,leadDays:30},{id:'asphalt_ppi',weight:0.25,leadDays:30},
    {id:'wages',weight:0.20,leadDays:90},{id:'crude_wti',weight:0.15,leadDays:30},
    {id:'lumber_ppi',weight:0.10,leadDays:60}]},
  capital_cycle_v1:{id:'capital_cycle_v1',label:'Capital Cycle',tau:180,signals:[
    {id:'yield_curve',weight:0.30,leadDays:365},{id:'sam_spending',weight:0.25,leadDays:270},
    {id:'private_nonres',weight:0.20,leadDays:180},{id:'total_construction',weight:0.15,leadDays:180},
    {id:'population',weight:0.10,leadDays:365}]},
};

function runFusion(model,zInputs,horizon=90){
  let xSum=0;const comps=[];
  for(const sig of model.signals){
    const z=zInputs[sig.id]??0;
    const dh=horizon-sig.leadDays;
    const wAdj=sig.weight*Math.exp(-(dh*dh)/(2*model.tau*model.tau));
    const signed=sig.invert?-z:z;
    const contrib=wAdj*signed;
    comps.push({signal:sig.id,z:signed,contrib,weightAdj:wAdj});
    xSum+=contrib;
  }
  return{score:Math.round(sigmoid(xSum)*10000)/100,components:comps};
}

function scoreBand(score){
  if(score>=80)return{label:'STRONG BOOM',color:'#22c55e',tone:'aggressive'};
  if(score>=65)return{label:'EXPANSION',color:'#86efac',tone:'constructive'};
  if(score>=50)return{label:'STEADY',color:'#fbbf24',tone:'neutral'};
  if(score>=35)return{label:'SOFTENING',color:'#fb923c',tone:'cautious'};
  if(score>=20)return{label:'CONTRACTION',color:'#ef4444',tone:'defensive'};
  return{label:'RECESSION RISK',color:'#991b1b',tone:'preserve capital'};
}

// ── PCI DECAY ENGINE (from math_ai_service.py) ──────────────────────────────
const PCI_THRESHOLDS={sealcoat:70,crackfill:55,overlay:40,reconstruct:25};
function pciDecay(startPCI,years,trafficFactor=1,climateHarsh=1,withMaint=false){
  const data=[];let pci=startPCI;
  for(let y=0;y<=years;y++){
    data.push({year:y,pci:Math.round(pci)});
    if(withMaint&&pci<PCI_THRESHOLDS.sealcoat&&pci>=PCI_THRESHOLDS.crackfill)pci=Math.min(pci+12,85);
    else if(withMaint&&pci<PCI_THRESHOLDS.crackfill&&pci>=PCI_THRESHOLDS.overlay)pci=Math.min(pci+8,70);
    const rate=0.06*trafficFactor*climateHarsh*(1+0.02*(100-pci));
    pci=Math.max(0,pci-pci*rate);
  }
  return data;
}

// ── JARVIS SYSTEM PROMPT (from jarvis.py — full capacity) ───────────────────
const JARVIS_SYSTEM=`You are JARVIS, the operational AI for Mr. George — owner of J. Worden & Sons Asphalt Paving (Virginia Class A Contractor, A+ BBB since 1994) and founder of JWordenAI.

CORE CAPABILITIES:
1. BID INTELLIGENCE — Calculate tonnage (residential density 145 lbs/sq yd/in, industrial 148), pricing across 18 service categories, 50-state regional multipliers, Worden Standard 35% net margin floor, $300 mobilization minimum
2. LEGAL ADVISORY — 51-jurisdiction compliance (prevailing wage, state licensing, state OSHA, SWPPP acres, mechanics lien, prompt payment laws). Advisory only, not legal advice.
3. FUSION INTELLIGENCE — 4 signal models: Boom Probability (8 signals), Trade Demand (5), Margin Erosion (5), Capital Cycle (5). Score 0-100 via logistic sigmoid.
4. PCI/PAVEMENT SCIENCE — ASTM D6433 decay curves, Virginia climate coefficients, 96% Marshall Density standard, coal tar vs polymer-modified sealcoat matrix
5. PROPOSALS — Professional project proposals for any of 18 service types
6. OPERATIONS — Dispatch, crew management, pipeline tracking, lead scoring
7. PERSONAL ASSISTANT — Reservations, research, planning for Mr. George

WORDEN STANDARD MATH:
- Tonnage: T = (sqft/9 × depth_inches × density) / 24,000
- Mauldin 690 Fund surcharge: $0.08/ton
- Binder index applied per project
- 35% net margin floor
- 20,000 sq ft threshold → Industrial Volume mode + personal review

STYLE: Calm, precise, Stark-style "At your service, Sir" register. Brief by default (1-3 sentences) unless depth requested. End operational answers with: Situation → Recommendation → Next Action.

NAP: J. Worden & Sons Asphalt Paving, 1601 Ware Bottom Spring Rd, Suite 214, Chester, VA 23836, (804) 446-1296`;

// ── STYLES ──────────────────────────────────────────────────────────────────
const COLORS={bg:'#0f0f0f',surface:'#1a1a1a',surface2:'#242424',border:'#333',amber:'#f59e0b',amberDim:'#92610a',green:'#22c55e',red:'#ef4444',blue:'#3b82f6',white:'#f5f5f5',gray:'#888',dimText:'#666'};

const sty={
  app:{background:COLORS.bg,color:COLORS.white,fontFamily:'"JetBrains Mono",ui-monospace,monospace',minHeight:'100vh'},
  header:{background:'linear-gradient(135deg,#1a1a1a 0%,#242424 100%)',borderBottom:`1px solid ${COLORS.amber}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:16,position:'sticky',top:0,zIndex:100},
  logo:{fontSize:18,fontWeight:800,color:COLORS.amber,letterSpacing:2},
  subtitle:{fontSize:10,color:COLORS.gray,letterSpacing:3,textTransform:'uppercase'},
  tabs:{display:'flex',gap:2,overflowX:'auto',padding:'0 20px',background:COLORS.surface,borderBottom:`1px solid ${COLORS.border}`},
  tab:(a)=>({padding:'10px 16px',fontSize:11,fontWeight:a?700:400,color:a?COLORS.amber:COLORS.gray,background:a?COLORS.surface2:'transparent',borderBottom:a?`2px solid ${COLORS.amber}`:'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',letterSpacing:1}),
  panel:{padding:20,maxWidth:1100,margin:'0 auto'},
  card:{background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:20,marginBottom:16},
  label:{fontSize:11,color:COLORS.gray,textTransform:'uppercase',letterSpacing:1,marginBottom:4,display:'block'},
  input:{background:COLORS.surface2,border:`1px solid ${COLORS.border}`,color:COLORS.white,padding:'10px 14px',borderRadius:6,fontSize:14,width:'100%',boxSizing:'border-box',fontFamily:'inherit'},
  select:{background:COLORS.surface2,border:`1px solid ${COLORS.border}`,color:COLORS.white,padding:'10px 14px',borderRadius:6,fontSize:14,width:'100%',fontFamily:'inherit'},
  btn:(c=COLORS.amber)=>({background:c,color:c===COLORS.amber?'#000':COLORS.white,border:'none',padding:'10px 20px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:1}),
  btnOutline:{background:'transparent',border:`1px solid ${COLORS.amber}`,color:COLORS.amber,padding:'8px 16px',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12},
  grid4:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12},
  bigNum:(c=COLORS.amber)=>({fontSize:36,fontWeight:800,color:c,lineHeight:1}),
  tag:(c)=>({display:'inline-block',padding:'4px 10px',borderRadius:4,fontSize:11,fontWeight:700,background:c+'22',color:c,letterSpacing:1}),
  chatBubble:(isUser)=>({background:isUser?COLORS.amber+'22':COLORS.surface2,border:`1px solid ${isUser?COLORS.amber+'44':COLORS.border}`,borderRadius:12,padding:'12px 16px',marginBottom:8,maxWidth:'85%',alignSelf:isUser?'flex-end':'flex-start',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}),
};

// ── JARVIS STATION ──────────────────────────────────────────────────────────
function JarvisStation(){
  const[msgs,setMsgs]=useState([{role:'assistant',content:'At your service, Sir. I have full access to pricing intelligence across 18 service categories, 50-state compliance data, Worden Standard tonnage math, fusion signal models, and PCI decay science. What do you need?'}]);
  const[input,setInput]=useState('');
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[msgs]);

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg=input.trim();setInput('');
    setMsgs(p=>[...p,{role:'user',content:userMsg}]);setLoading(true);
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:JARVIS_SYSTEM,
          messages:[...msgs.map(m=>({role:m.role,content:m.content})),{role:'user',content:userMsg}]})});
      const data=await resp.json();
      const text=data.content?.map(b=>b.text||'').join('\n')||'Systems temporarily offline, Sir.';
      setMsgs(p=>[...p,{role:'assistant',content:text}]);
    }catch(e){setMsgs(p=>[...p,{role:'assistant',content:`Connection issue: ${e.message}. Running in local-logic mode.`}]);}
    setLoading(false);
  };

  return(<div>
    <div style={{...sty.card,height:460,display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:4,padding:'8px 0'}}>
        {msgs.map((m,i)=><div key={i} style={sty.chatBubble(m.role==='user')}>
          <div style={{fontSize:10,color:COLORS.gray,marginBottom:4}}>{m.role==='user'?'MR. GEORGE':'JARVIS'}</div>
          {m.content}
        </div>)}
        {loading&&<div style={{...sty.chatBubble(false),opacity:0.6}}>Processing, Sir...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:'flex',gap:8,paddingTop:12,borderTop:`1px solid ${COLORS.border}`}}>
        <input style={{...sty.input,flex:1}} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Command Jarvis..."/>
        <button style={sty.btn()} onClick={send} disabled={loading}>SEND</button>
      </div>
    </div>
  </div>);
}

// ── BID COMMAND STATION ─────────────────────────────────────────────────────
function BidStation(){
  const[f,setF]=useState({name:'',address:'',sqft:'',depth:'2',service:'paving',prop:'commercial',state:'VA',industrial:false});
  const[result,setResult]=useState(null);
  const[bids,setBids]=useStickyState([], 'worden-bids');
  const[showMap, setShowMap]=useState(false);
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));

  const calculate=()=>{
    const sqft=parseFloat(f.sqft)||0;if(!sqft)return;
    const depth=parseFloat(f.depth)||2;
    const price=estimatePrice(f.service,f.prop,sqft,f.state);
    const tonnage=wordenTonnage(sqft,depth,f.industrial);
    const margin35low=Math.round(price.low*1.35);
    const margin35high=Math.round(price.high*1.35);
    const st=STATE_MAP[f.state];
    setResult({price,tonnage,margin35low,margin35high,state:st,sqft,depth});
  };

  const saveBid=()=>{
    if(!result)return;
    setBids(p=>[{id:Date.now(),name:f.name||'Unnamed',address:f.address,service:SVC_LABELS[f.service],sqft:f.sqft,low:result.margin35low,high:result.margin35high,tons:result.tonnage.tons,date:new Date().toLocaleDateString(),status:'draft'},...p]);
  };

  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:16}}>NEW BID</div>
      <div style={sty.grid2}>
        <div><label style={sty.label}>Job Name</label><input style={sty.input} value={f.name} onChange={e=>upd('name',e.target.value)} placeholder="Food Lion #2118"/></div>
        <div><label style={sty.label}>Address</label><input style={sty.input} value={f.address} onChange={e=>upd('address',e.target.value)} placeholder="123 Main St"/></div>
      </div>
      <div style={{...sty.grid4,marginTop:12}}>
        <div><label style={sty.label}>Service</label><select style={sty.select} value={f.service} onChange={e=>upd('service',e.target.value)}>
          {Object.entries(SVC_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={sty.label}>Property Type</label><select style={sty.select} value={f.prop} onChange={e=>upd('prop',e.target.value)}>
          <option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
        <div><label style={sty.label}>Sq Ft <span style={{color:COLORS.amber, cursor:'pointer', float:'right'}} onClick={()=>setShowMap(!showMap)}>🗺️ MAP</span></label><input style={sty.input} type="number" value={f.sqft} onChange={e=>upd('sqft',e.target.value)} placeholder="5000"/></div>
        <div><label style={sty.label}>Depth (in)</label><input style={sty.input} type="number" value={f.depth} onChange={e=>upd('depth',e.target.value)} step="0.5"/></div>
      </div>
      {showMap && <AreaMapper onCalculate={(val) => upd('sqft', val)} />}
      <div style={{...sty.grid3,marginTop:12}}>
        <div><label style={sty.label}>State</label><select style={sty.select} value={f.state} onChange={e=>upd('state',e.target.value)}>
          {STATES.map(s=><option key={s.abbr} value={s.abbr}>{s.name} ({s.abbr})</option>)}</select></div>
        <div style={{display:'flex',alignItems:'end',gap:8}}>
          <label style={{fontSize:12,color:COLORS.gray,display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={f.industrial} onChange={e=>upd('industrial',e.target.checked)}/>Industrial (148 density)</label></div>
        <div style={{display:'flex',alignItems:'end'}}><button style={sty.btn()} onClick={calculate}>CALCULATE</button></div>
      </div>
    </div>

    {result&&<div style={sty.card}>
      <div style={{...sty.grid4,marginBottom:16}}>
        <div><div style={sty.label}>Cost Range</div><div style={{...sty.bigNum(),fontSize:20}}>{fmt$(result.price.low)} – {fmt$(result.price.high)}</div></div>
        <div><div style={sty.label}>Worden 35% Floor</div><div style={{...sty.bigNum(COLORS.green),fontSize:20}}>{fmt$(result.margin35low)} – {fmt$(result.margin35high)}</div></div>
        <div><div style={sty.label}>Tonnage</div><div style={{...sty.bigNum(COLORS.blue),fontSize:20}}>{result.tonnage.tons} T</div>
          <div style={{fontSize:10,color:COLORS.gray}}>Mauldin: {fmt$(result.tonnage.mauldinSurcharge)}</div></div>
        <div><div style={sty.label}>State Multiplier</div><div style={{...sty.bigNum(COLORS.white),fontSize:20}}>{getMultiplier(f.state).toFixed(3)}x</div></div>
      </div>
      {result.state&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {result.state.hasPrevailingWage&&<span style={sty.tag(COLORS.red)}>PREVAILING WAGE</span>}
        {result.state.hasStateLicensing&&<span style={sty.tag(COLORS.blue)}>STATE LICENSING REQ</span>}
        {result.state.hasStateOsha&&<span style={sty.tag(COLORS.amber)}>STATE OSHA</span>}
        <span style={sty.tag(COLORS.green)}>{result.state.asphaltMonths} MO SEASON</span>
        {result.sqft>=20000&&<span style={sty.tag(COLORS.red)}>INDUSTRIAL VOLUME — PERSONAL REVIEW</span>}
      </div>}
      <div style={{marginTop:12,display:'flex',gap:8}}>
        <button style={sty.btn()} onClick={saveBid}>SAVE TO PIPELINE</button>
        <button style={sty.btn(COLORS.blue)} onClick={()=>{navigator.clipboard.writeText(`${f.name||'Job'}: ${SVC_LABELS[f.service]} | ${f.sqft} sqft | ${fmt$(result.margin35low)}-${fmt$(result.margin35high)} | ${result.tonnage.tons}T | ${f.state}`)}}>COPY</button>
      </div>
    </div>}

    {bids.length>0&&<div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:12}}>PIPELINE ({bids.length})</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:`1px solid ${COLORS.border}`}}>
          {['Job','Service','Sq Ft','Range','Tons','Date','Status'].map(h=><th key={h} style={{padding:'8px',textAlign:'left',color:COLORS.gray,fontWeight:400}}>{h}</th>)}</tr></thead>
        <tbody>{bids.map(b=><tr key={b.id} style={{borderBottom:`1px solid ${COLORS.border}22`}}>
          <td style={{padding:8,fontWeight:600}}>{b.name}</td><td style={{padding:8}}>{b.service}</td>
          <td style={{padding:8}}>{Number(b.sqft).toLocaleString()}</td>
          <td style={{padding:8,color:COLORS.green}}>{fmt$(b.low)}–{fmt$(b.high)}</td>
          <td style={{padding:8}}>{b.tons}T</td><td style={{padding:8,color:COLORS.gray}}>{b.date}</td>
          <td style={{padding:8}}><span style={sty.tag(COLORS.amber)}>DRAFT</span></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </div>);
}

// ── PRICING EXPLORER ────────────────────────────────────────────────────────
function PricingStation(){
  const[svc,setSvc]=useState('paving');const[prop,setProp]=useState('residential');
  const[sqft,setSqft]=useState('2000');const[state,setState]=useState('VA');
  const p=estimatePrice(svc,prop,parseFloat(sqft)||0,state);
  const st=STATE_MAP[state];
  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:16}}>50-STATE PRICING ENGINE — 18 SERVICES</div>
      <div style={sty.grid4}>
        <div><label style={sty.label}>Service</label><select style={sty.select} value={svc} onChange={e=>setSvc(e.target.value)}>
          {Object.entries(SVC_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={sty.label}>Type</label><select style={sty.select} value={prop} onChange={e=>setProp(e.target.value)}>
          <option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
        <div><label style={sty.label}>Sq Ft</label><input style={sty.input} type="number" value={sqft} onChange={e=>setSqft(e.target.value)}/></div>
        <div><label style={sty.label}>State</label><select style={sty.select} value={state} onChange={e=>setState(e.target.value)}>
          {STATES.map(s=><option key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</option>)}</select></div>
      </div>
    </div>
    {p&&<div style={sty.card}>
      <div style={sty.grid3}>
        <div><div style={sty.label}>Low Estimate</div><div style={sty.bigNum()}>{fmt$(p.low)}</div></div>
        <div><div style={sty.label}>High Estimate</div><div style={sty.bigNum(COLORS.green)}>{fmt$(p.high)}</div></div>
        <div><div style={sty.label}>Multiplier ({state})</div><div style={sty.bigNum(COLORS.blue)}>{getMultiplier(state).toFixed(3)}x</div></div>
      </div>
      {st&&<div style={{marginTop:16,padding:12,background:COLORS.surface2,borderRadius:6,fontSize:12,color:COLORS.gray}}>
        <strong style={{color:COLORS.white}}>{st.name}</strong> — Region: {st.region} | Labor Index: {st.laborIndex} | Material Premium: {st.materialPremium} | 
        Season: {st.asphaltMonths} months | Prevailing Wage: {st.hasPrevailingWage?'YES':'No'} | State License: {st.hasStateLicensing?'YES':'No'} | 
        OSHA: {st.hasStateOsha?'YES':'No'} | QSR Density: {st.qsrDensity}
      </div>}
    </div>}
    <div style={sty.card}>
      <div style={{fontSize:12,fontWeight:700,color:COLORS.amber,marginBottom:12}}>ALL SERVICES — {state} ({parseFloat(sqft)||0} sqft)</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {Object.entries(SVC_LABELS).map(([k,v])=>{
          const e=estimatePrice(k,prop,parseFloat(sqft)||0,state);
          return e?<div key={k} style={{background:COLORS.surface2,padding:10,borderRadius:6,fontSize:11}}>
            <div style={{color:COLORS.gray,marginBottom:4}}>{v}</div>
            <div style={{color:COLORS.green,fontWeight:700}}>{fmt$(e.low)} – {fmt$(e.high)}</div>
          </div>:null;
        })}
      </div>
    </div>
  </div>);
}

// ── FUSION ENGINE STATION ───────────────────────────────────────────────────
function FusionStation(){
  const[horizon,setHorizon]=useState(90);
  const[zInputs,setZInputs]=useState({permits:0.8,sam_spending:0.5,yield_curve:-0.3,jolts_openings:0.6,private_res:0.4,diesel:-0.2,housing_value:0.3,population:0.2,jolts_hires:0.7,asphalt_ppi:0.4,wages:0.3,crude_wti:-0.1,lumber_ppi:0.2,private_nonres:0.5,total_construction:0.6});
  const upZ=(k,v)=>setZInputs(p=>({...p,[k]:parseFloat(v)||0}));
  const results=Object.values(FUSION_MODELS).map(m=>({...m,...runFusion(m,zInputs,horizon),band:scoreBand(runFusion(m,zInputs,horizon).score)}));

  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:4}}>FUSION SIGNAL ENGINE</div>
      <div style={{fontSize:11,color:COLORS.gray,marginBottom:16}}>Adjust z-scores (-3 to +3) for each economic signal. Horizon: forecast window in days.</div>
      <div style={{marginBottom:12}}><label style={sty.label}>Horizon (days)</label>
        <input style={{...sty.input,width:120}} type="number" value={horizon} onChange={e=>setHorizon(parseInt(e.target.value)||90)}/></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
        {Object.entries(zInputs).map(([k,v])=><div key={k}>
          <label style={{...sty.label,fontSize:9}}>{k.replace(/_/g,' ').toUpperCase()}</label>
          <input style={{...sty.input,fontSize:12,padding:6}} type="number" step="0.1" min="-3" max="3" value={v} onChange={e=>upZ(k,e.target.value)}/>
        </div>)}
      </div>
    </div>
    <div style={sty.grid2}>
      {results.map(r=><div key={r.id} style={{...sty.card,borderLeft:`4px solid ${r.band.color}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><div style={{fontSize:13,fontWeight:700}}>{r.label}</div><span style={sty.tag(r.band.color)}>{r.band.label}</span></div>
          <div style={sty.bigNum(r.band.color)}>{r.score}</div>
        </div>
        <div style={{fontSize:10,color:COLORS.gray}}>Posture: {r.band.tone} | Tau: {r.tau}d | Signals: {r.signals.length}</div>
        <div style={{marginTop:8}}>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={r.components} layout="vertical"><XAxis type="number" hide/><YAxis type="category" dataKey="signal" width={80} tick={{fontSize:9,fill:COLORS.gray}}/>
              <Bar dataKey="contrib">{r.components.map((c,i)=><Cell key={i} fill={c.contrib>=0?COLORS.green:COLORS.red}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}
    </div>
  </div>);
}

// ── PCI DECAY SIMULATOR ─────────────────────────────────────────────────────
function DecayStation(){
  const[startPCI,setStart]=useState(95);const[years,setYears]=useState(20);
  const[traffic,setTraffic]=useState(1);const[climate,setClimate]=useState(1);
  const noMaint=pciDecay(startPCI,years,traffic,climate,false);
  const withMaint=pciDecay(startPCI,years,traffic,climate,true);
  const combined=noMaint.map((d,i)=>({year:d.year,noMaint:d.pci,withMaint:withMaint[i].pci}));
  const savings=()=>{
    const noM=noMaint.find(d=>d.pci<PCI_THRESHOLDS.reconstruct);
    const wM=withMaint.find(d=>d.pci<PCI_THRESHOLDS.reconstruct);
    const noYr=noM?noM.year:years;const wYr=wM?wM.year:years;
    return{noMaintenanceLife:noYr,withMaintenanceLife:wYr,extraYears:wYr-noYr};
  };
  const s=savings();
  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:16}}>PAVEMENT DECAY SIMULATOR — 20-YEAR PCI CURVES</div>
      <div style={sty.grid4}>
        <div><label style={sty.label}>Starting PCI</label><input style={sty.input} type="number" value={startPCI} onChange={e=>setStart(parseInt(e.target.value)||95)} min="0" max="100"/></div>
        <div><label style={sty.label}>Years</label><input style={sty.input} type="number" value={years} onChange={e=>setYears(parseInt(e.target.value)||20)}/></div>
        <div><label style={sty.label}>Traffic Factor</label><select style={sty.select} value={traffic} onChange={e=>setTraffic(parseFloat(e.target.value))}>
          <option value="0.7">Low (residential)</option><option value="1">Medium (collector)</option><option value="1.5">High (arterial)</option><option value="2">Very High (commercial)</option></select></div>
        <div><label style={sty.label}>Climate Severity</label><select style={sty.select} value={climate} onChange={e=>setClimate(parseFloat(e.target.value))}>
          <option value="0.8">Mild (Southeast)</option><option value="1">Moderate (Mid-Atlantic)</option><option value="1.3">Harsh (Northeast)</option><option value="1.5">Severe (Northern)</option></select></div>
      </div>
    </div>
    <div style={sty.card}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={combined}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
          <XAxis dataKey="year" stroke={COLORS.gray} label={{value:'Year',position:'bottom',fill:COLORS.gray}}/>
          <YAxis domain={[0,100]} stroke={COLORS.gray} label={{value:'PCI',angle:-90,position:'left',fill:COLORS.gray}}/>
          <Tooltip contentStyle={{background:COLORS.surface,border:`1px solid ${COLORS.border}`,color:COLORS.white}}/>
          <Legend/>
          {/* Threshold lines */}
          <Line type="monotone" dataKey={()=>PCI_THRESHOLDS.sealcoat} name="Sealcoat Trigger" stroke={COLORS.amber} strokeDasharray="5 5" dot={false}/>
          <Line type="monotone" dataKey={()=>PCI_THRESHOLDS.crackfill} name="Crack Fill Trigger" stroke="#fb923c" strokeDasharray="5 5" dot={false}/>
          <Line type="monotone" dataKey={()=>PCI_THRESHOLDS.overlay} name="Overlay Trigger" stroke={COLORS.red} strokeDasharray="5 5" dot={false}/>
          <Line type="monotone" dataKey="noMaint" name="No Maintenance" stroke={COLORS.red} strokeWidth={3} dot={false}/>
          <Line type="monotone" dataKey="withMaint" name="With Maintenance" stroke={COLORS.green} strokeWidth={3} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div style={sty.grid3}>
      <div style={sty.card}>
        <div style={sty.label}>Without Maintenance</div>
        <div style={sty.bigNum(COLORS.red)}>{s.noMaintenanceLife} yrs</div>
        <div style={{fontSize:11,color:COLORS.gray}}>Until reconstruction needed</div>
      </div>
      <div style={sty.card}>
        <div style={sty.label}>With Maintenance</div>
        <div style={sty.bigNum(COLORS.green)}>{s.withMaintenanceLife} yrs</div>
        <div style={{fontSize:11,color:COLORS.gray}}>Until reconstruction needed</div>
      </div>
      <div style={sty.card}>
        <div style={sty.label}>Life Extension</div>
        <div style={sty.bigNum(COLORS.amber)}>+{s.extraYears} yrs</div>
        <div style={{fontSize:11,color:COLORS.gray}}>Maintenance ROI advantage</div>
      </div>
    </div>
  </div>);
}

// ── LEGAL ADVISORY STATION ──────────────────────────────────────────────────
function LegalStation(){
  const[state,setState]=useState('VA');
  const st=STATE_MAP[state];
  if(!st)return null;
  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:16}}>51-JURISDICTION COMPLIANCE ADVISOR</div>
      <div style={{marginBottom:16}}><label style={sty.label}>Select State</label>
        <select style={{...sty.select,maxWidth:300}} value={state} onChange={e=>setState(e.target.value)}>
          {STATES.map(s=><option key={s.abbr} value={s.abbr}>{s.name} ({s.abbr})</option>)}</select></div>
    </div>
    <div style={sty.card}>
      <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{st.name} ({st.abbr})</div>
      <div style={sty.grid3}>
        <div style={{...sty.card,borderLeft:`4px solid ${st.hasPrevailingWage?COLORS.red:COLORS.green}`}}>
          <div style={sty.label}>Prevailing Wage</div>
          <div style={{fontSize:20,fontWeight:700,color:st.hasPrevailingWage?COLORS.red:COLORS.green}}>{st.hasPrevailingWage?'REQUIRED':'Not Required'}</div>
          {st.hasPrevailingWage&&<div style={{fontSize:11,color:COLORS.gray,marginTop:8}}>Must pay prevailing wage rates on public works projects. Check state DOL for current rates.</div>}
        </div>
        <div style={{...sty.card,borderLeft:`4px solid ${st.hasStateLicensing?COLORS.amber:COLORS.green}`}}>
          <div style={sty.label}>State Contractor Licensing</div>
          <div style={{fontSize:20,fontWeight:700,color:st.hasStateLicensing?COLORS.amber:COLORS.green}}>{st.hasStateLicensing?'REQUIRED':'Not Required'}</div>
          {st.hasStateLicensing&&<div style={{fontSize:11,color:COLORS.gray,marginTop:8}}>State-level contractor license required. Verify reciprocity if out-of-state.</div>}
        </div>
        <div style={{...sty.card,borderLeft:`4px solid ${st.hasStateOsha?COLORS.blue:COLORS.gray}`}}>
          <div style={sty.label}>State OSHA Plan</div>
          <div style={{fontSize:20,fontWeight:700,color:st.hasStateOsha?COLORS.blue:COLORS.gray}}>{st.hasStateOsha?'STATE PLAN':'Federal OSHA'}</div>
          <div style={{fontSize:11,color:COLORS.gray,marginTop:8}}>{st.hasStateOsha?'State administers its own OSHA program — may have stricter requirements.':'Falls under federal OSHA jurisdiction.'}</div>
        </div>
      </div>
      <div style={{...sty.grid4,marginTop:12}}>
        <div style={sty.card}><div style={sty.label}>Region</div><div style={{fontSize:16,fontWeight:700}}>{st.region}</div></div>
        <div style={sty.card}><div style={sty.label}>Labor Index</div><div style={{fontSize:16,fontWeight:700,color:st.laborIndex>1?COLORS.red:COLORS.green}}>{st.laborIndex}</div></div>
        <div style={sty.card}><div style={sty.label}>Material Premium</div><div style={{fontSize:16,fontWeight:700,color:st.materialPremium>1?COLORS.red:COLORS.green}}>{st.materialPremium}</div></div>
        <div style={sty.card}><div style={sty.label}>Paving Season</div><div style={{fontSize:16,fontWeight:700,color:COLORS.amber}}>{st.asphaltMonths} months</div></div>
      </div>
      <div style={{padding:12,background:COLORS.surface2,borderRadius:6,fontSize:11,color:COLORS.gray,marginTop:12}}>
        <strong style={{color:COLORS.amber}}>ADVISORY NOTICE:</strong> This is operations guidance, not legal advice. Confirm jurisdiction-specific statutes, permit terms, and bonding requirements before committing to work in {st.name}. 
        Price multiplier for {st.abbr}: {getMultiplier(st.abbr).toFixed(3)}x national baseline.
      </div>
    </div>
  </div>);
}

// ── PROPOSAL GENERATOR ──────────────────────────────────────────────────────
function ProposalStation(){
  const[f,setF]=useState({client:'',address:'',service:'paving',prop:'commercial',sqft:'',state:'VA',notes:''});
  const[proposal,setProposal]=useState('');const[loading,setLoading]=useState(false);
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const generate=async()=>{
    setLoading(true);
    const price=estimatePrice(f.service,f.prop,parseFloat(f.sqft)||0,f.state);
    
    try {
      const resp = await fetch('/api/bidder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: f.client,
          address: f.address,
          service: SVC_LABELS[f.service],
          sqft: f.sqft,
          region: f.state,
          soilType: 'Standard'
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      
      const metricsText = `\n\n--- ENGINEERING METRICS ---\nAsphalt Required: ${data.metrics.asphaltTons.toFixed(2)} Tons\nStone Base Required: ${data.metrics.stoneTons.toFixed(2)} Tons\nEstimated Material Cost: $${data.metrics.totalProjectedCost.toFixed(2)}`;
      setProposal(data.estimate + metricsText);
    } catch(e) {
      setProposal(`Error: ${e.message}`);
    }
    setLoading(false);
  };
  return(<div>
    <div style={sty.card}>
      <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:16}}>AI PROPOSAL GENERATOR</div>
      <div style={sty.grid2}>
        <div><label style={sty.label}>Client Name</label><input style={sty.input} value={f.client} onChange={e=>upd('client',e.target.value)}/></div>
        <div><label style={sty.label}>Address</label><input style={sty.input} value={f.address} onChange={e=>upd('address',e.target.value)}/></div>
      </div>
      <div style={{...sty.grid4,marginTop:12}}>
        <div><label style={sty.label}>Service</label><select style={sty.select} value={f.service} onChange={e=>upd('service',e.target.value)}>
          {Object.entries(SVC_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={sty.label}>Type</label><select style={sty.select} value={f.prop} onChange={e=>upd('prop',e.target.value)}>
          <option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>
        <div><label style={sty.label}>Sq Ft</label><input style={sty.input} type="number" value={f.sqft} onChange={e=>upd('sqft',e.target.value)}/></div>
        <div><label style={sty.label}>State</label><select style={sty.select} value={f.state} onChange={e=>upd('state',e.target.value)}>
          {STATES.map(s=><option key={s.abbr} value={s.abbr}>{s.abbr}</option>)}</select></div>
      </div>
      <div style={{marginTop:12}}><label style={sty.label}>Notes</label><textarea style={{...sty.input,height:60,resize:'vertical'}} value={f.notes} onChange={e=>upd('notes',e.target.value)}/></div>
      <div style={{marginTop:12}}><button style={sty.btn()} onClick={generate} disabled={loading}>{loading?'GENERATING...':'GENERATE PROPOSAL'}</button></div>
    </div>
    {proposal&&<div style={sty.card}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:COLORS.green}}>PROPOSAL READY</div>
        <button style={sty.btnOutline} onClick={()=>navigator.clipboard.writeText(proposal)}>COPY</button>
      </div>
      <div style={{whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.7,color:'#ddd'}}>{proposal}</div>
    </div>}
  </div>);
}

// ── DISPATCH STATION ────────────────────────────────────────────────────────
function DispatchStation(){
  const[trucks,setTrucks]=useStickyState([{id:1,name:'Truck 1 — F-350',capacity:5,status:'available',lat:37.38,lng:-77.45}], 'worden-trucks');
  const[crews,setCrews]=useStickyState([{id:1,name:'Crew Alpha',lead:'Mike',size:4,status:'ready'}], 'worden-crews');
  const[jobs,setJobs]=useStickyState([{id:1,name:'Food Lion #2118',address:'Chester VA',sqft:3000,status:'pending',priority:'high'}], 'worden-dispatch-jobs');
  return(<div>
    <div style={sty.grid3}>
      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:COLORS.amber,marginBottom:12}}>TRUCKS ({trucks.length})</div>
        {trucks.map(t=><div key={t.id} style={{padding:8,background:COLORS.surface2,borderRadius:6,marginBottom:6}}>
          <div style={{fontWeight:600,fontSize:13}}>{t.name}</div>
          <div style={{fontSize:11,color:COLORS.gray}}>Cap: {t.capacity}T | <span style={{color:COLORS.green}}>{t.status}</span></div>
        </div>)}
        <button style={{...sty.btnOutline,marginTop:8,width:'100%'}} onClick={()=>setTrucks(p=>[...p,{id:Date.now(),name:`Truck ${p.length+1}`,capacity:5,status:'available',lat:37.38,lng:-77.45}])}>+ Add Truck</button>
      </div>
      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:COLORS.blue,marginBottom:12}}>CREWS ({crews.length})</div>
        {crews.map(c=><div key={c.id} style={{padding:8,background:COLORS.surface2,borderRadius:6,marginBottom:6}}>
          <div style={{fontWeight:600,fontSize:13}}>{c.name}</div>
          <div style={{fontSize:11,color:COLORS.gray}}>Lead: {c.lead} | Size: {c.size} | <span style={{color:COLORS.green}}>{c.status}</span></div>
        </div>)}
        <button style={{...sty.btnOutline,marginTop:8,width:'100%'}} onClick={()=>setCrews(p=>[...p,{id:Date.now(),name:`Crew ${String.fromCharCode(65+p.length)}`,lead:'TBD',size:3,status:'ready'}])}>+ Add Crew</button>
      </div>
      <div style={sty.card}>
        <div style={{fontSize:14,fontWeight:700,color:COLORS.green,marginBottom:12}}>ACTIVE JOBS ({jobs.length})</div>
        {jobs.map(j=><div key={j.id} style={{padding:8,background:COLORS.surface2,borderRadius:6,marginBottom:6}}>
          <div style={{fontWeight:600,fontSize:13}}>{j.name}</div>
          <div style={{fontSize:11,color:COLORS.gray}}>{j.address} | {j.sqft} sqft</div>
          <div style={{marginTop:4}}><span style={sty.tag(j.priority==='high'?COLORS.red:COLORS.amber)}>{j.priority}</span></div>
        </div>)}
      </div>
    </div>
  </div>);
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
// ── COMMERCIAL REAL ESTATE HUB ──────────────────────────────────────────────
function RealEstateStation() {
  const [alerts, setAlerts] = useState([]);
  const [f, setF] = useState({ months: 36, sqft: 50000, region: 'VA' });
  const [report, setReport] = useState(null);

  useEffect(() => {
    weatherEngine.fetchWeatherAlerts().then(setAlerts);
  }, []);

  useEffect(() => {
    setReport(pciDecayEngine.generateHealthReport(f.months, f.sqft, f.region));
  }, [f.months, f.sqft, f.region]);

  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.amber, marginBottom: 16 }}>WEATHER INTELLIGENCE (OPEN-METEO)</div>
          {alerts.length === 0 ? (
            <div style={{ color: COLORS.green, fontSize: 13, fontWeight: 700 }}>LOADING OR ALL HUBS CLEAR...</div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} style={{ padding: 12, background: COLORS.red + '22', borderLeft: `4px solid ${COLORS.red}`, marginBottom: 8, fontSize: 13, color: '#ffcccc' }}>
                {a}
              </div>
            ))
          )}
        </div>

        <div style={sty.card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.blue, marginBottom: 16 }}>ASSET AGE DECAY (PCI)</div>
          <div style={sty.grid3}>
            <div><label style={sty.label}>Age (Months)</label><input style={sty.input} type="number" value={f.months} onChange={e => upd('months', parseInt(e.target.value) || 0)} /></div>
            <div><label style={sty.label}>Square Feet</label><input style={sty.input} type="number" value={f.sqft} onChange={e => upd('sqft', parseInt(e.target.value) || 0)} /></div>
            <div><label style={sty.label}>Region/State</label><input style={sty.input} value={f.region} onChange={e => upd('region', e.target.value)} /></div>
          </div>
        </div>
      </div>

      {report && (
        <div style={sty.card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, marginBottom: 16 }}>JWORDENAI™ ASSET HEALTH REPORT</div>
          <div style={sty.grid4}>
            <div><div style={sty.label}>Current PCI Score</div><div style={sty.bigNum(report.pciScore < 50 ? COLORS.red : COLORS.green)}>{report.pciScore}</div></div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={sty.label}>Required Action</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, marginTop: 4 }}>{report.action}</div>
              <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{report.maintenanceAlert}</div>
            </div>
            <div><div style={sty.label}>Est. Repair Value</div><div style={sty.bigNum(COLORS.amber)}>${report.estimatedRepairValue.toLocaleString()}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATIONS=[
  {id:'jarvis',label:'JARVIS',icon:'🤖'},
  {id:'bid',label:'BID COMMAND',icon:'📋'},
  {id:'pricing',label:'PRICING',icon:'💰'},
  {id:'fusion',label:'FUSION ENGINE',icon:'📊'},
  {id:'decay',label:'PCI DECAY',icon:'📉'},
  {id:'legal',label:'LEGAL ADVISOR',icon:'⚖️'},
  {id:'proposal',label:'PROPOSALS',icon:'📄'},
  {id:'dispatch',label:'DISPATCH',icon:'🚛'},
  {id:'realestate',label:'REAL ESTATE HUB',icon:'🏢'},
];

export default function WordenCommandSystem(){
  const[tab,setTab]=useState('jarvis');
  return(<div style={sty.app}>
    <div style={sty.header}>
      <div>
        <div style={sty.logo}>WORDEN COMMAND SYSTEM</div>
        <div style={sty.subtitle}>Every Ferrari — One Garage</div>
      </div>
      <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
        <span style={sty.tag(COLORS.green)}>ALL SYSTEMS ONLINE</span>
        <span style={{fontSize:11,color:COLORS.gray}}>PIN: 1296</span>
      </div>
    </div>
    <div style={sty.tabs}>
      {STATIONS.map(s=><div key={s.id} style={sty.tab(tab===s.id)} onClick={()=>setTab(s.id)}>{s.icon} {s.label}</div>)}
    </div>
    <div style={sty.panel}>
      {tab==='jarvis'&&<JarvisStation/>}
      {tab==='bid'&&<BidStation/>}
      {tab==='pricing'&&<PricingStation/>}
      {tab==='fusion'&&<FusionStation/>}
      {tab==='decay'&&<DecayStation/>}
      {tab==='legal'&&<LegalStation/>}
      {tab==='proposal'&&<ProposalStation/>}
      {tab==='dispatch'&&<DispatchStation/>}
      {tab==='realestate'&&<RealEstateStation/>}
    </div>
  </div>);
}

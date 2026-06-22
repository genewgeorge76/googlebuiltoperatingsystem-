// Regional Material Database
// Returns the local baseline materials and the high-end premium upgrades for any given state.

const PREMIUM_UPGRADES = [
  { id: 'u1', name: 'Imported Italian Travertine', category: 'Masonry', pricePerSqft: 28.50, isPremium: true, img: '🏛️' },
  { id: 'u2', name: 'Polymer-Modified Performance Asphalt', category: 'Paving', pricePerSqft: 4.80, isPremium: true, img: '🛣️' },
  { id: 'u3', name: 'Architectural Bronze LED Uplighting', category: 'Lighting', pricePerItem: 350.00, isPremium: true, img: '💡' },
  { id: 'u4', name: 'Custom Fire Feature & Retaining Wall', category: 'Hardscape', pricePerItem: 8500.00, isPremium: true, img: '🔥' },
  { id: 'u5', name: 'High-Gloss Metallic Epoxy Flooring', category: 'Interior', pricePerSqft: 12.00, isPremium: true, img: '✨' },
];

export function getRegionalMaterials(stateAbbr) {
  let localBaselines = [];

  switch (stateAbbr) {
    case 'VA':
    case 'NC':
    case 'SC':
    case 'MD':
      localBaselines = [
        { id: 'lb1', name: 'Virginia Bluestone Pavers', category: 'Masonry', pricePerSqft: 14.50, isPremium: false, img: '🪨' },
        { id: 'lb2', name: 'James River Washed Rock', category: 'Landscaping', pricePerSqft: 3.20, isPremium: false, img: '🌊' },
        { id: 'lb3', name: 'Standard VDOT Asphalt (SM-9.5A)', category: 'Paving', pricePerSqft: 2.10, isPremium: false, img: '🛣️' },
      ];
      break;
    
    case 'IL':
    case 'MI':
    case 'OH':
    case 'PA':
      localBaselines = [
        { id: 'lb1', name: 'Lannon Stone (Frost-Resistant)', category: 'Masonry', pricePerSqft: 16.00, isPremium: false, img: '🧱' },
        { id: 'lb2', name: 'Limestone Gravel Base', category: 'Landscaping', pricePerSqft: 2.80, isPremium: false, img: '⛏️' },
        { id: 'lb3', name: 'Heavy-Duty Winter Asphalt Mix', category: 'Paving', pricePerSqft: 2.60, isPremium: false, img: '🛣️' },
      ];
      break;

    case 'FL':
    case 'GA':
    case 'AL':
      localBaselines = [
        { id: 'lb1', name: 'Coral Stone Pavers', category: 'Masonry', pricePerSqft: 15.20, isPremium: false, img: '🪸' },
        { id: 'lb2', name: 'Crushed Coquina Shells', category: 'Landscaping', pricePerSqft: 4.10, isPremium: false, img: '🐚' },
        { id: 'lb3', name: 'High-Temp UV Resistant Asphalt', category: 'Paving', pricePerSqft: 2.30, isPremium: false, img: '🛣️' },
      ];
      break;
      
    case 'TX':
    case 'AZ':
    case 'NM':
      localBaselines = [
        { id: 'lb1', name: 'Texas Cream Limestone', category: 'Masonry', pricePerSqft: 12.50, isPremium: false, img: '🧱' },
        { id: 'lb2', name: 'Desert River Rock', category: 'Landscaping', pricePerSqft: 3.00, isPremium: false, img: '🌵' },
        { id: 'lb3', name: 'Standard Commercial Asphalt', category: 'Paving', pricePerSqft: 2.05, isPremium: false, img: '🛣️' },
      ];
      break;

    default:
      localBaselines = [
        { id: 'lb1', name: 'Locally Sourced Concrete Pavers', category: 'Masonry', pricePerSqft: 9.50, isPremium: false, img: '🧱' },
        { id: 'lb2', name: 'Standard River Rock', category: 'Landscaping', pricePerSqft: 2.50, isPremium: false, img: '🪨' },
        { id: 'lb3', name: 'Standard Commercial Asphalt', category: 'Paving', pricePerSqft: 2.15, isPremium: false, img: '🛣️' },
      ];
      break;
  }

  return {
    local: localBaselines,
    premium: PREMIUM_UPGRADES
  };
}

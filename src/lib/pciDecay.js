// Pavement Condition Index (PCI) Decay & Asset Valuation Engine

export const MAINTENANCE_SCHEDULE = {
  year1: { label: '1-Year Inspection', action: 'Crack sealing + joint inspection', multiplier: 0.05 },
  year3: { label: '3-Year Sealcoat Window', action: 'Neyra double-coat sealcoat application', multiplier: 0.18 },
  year5: { label: '5-Year Resurface', action: 'Mill 1.5" + SM-9.5A overlay evaluation', multiplier: 0.65 },
  year12: { label: '12-Year Reconstruction', action: 'Full remove & replace — VDOT base + surface', multiplier: 1.20 }
};

export const pciDecayEngine = {
  /**
   * Calculates current PCI (0-100) and generates an Asset Health Report.
   * @param {number} monthsSincePour - Age of the asphalt
   * @param {number} sqft - Square footage of the property
   * @param {string} region - State/Region for climate stress factor
   */
  generateHealthReport(monthsSincePour, sqft, region) {
    // Base PCI is 100 for a brand new pour.
    let currentPCI = 100;
    
    // Climate Stress Factor (Frost Heave & High UV accelerate decay)
    let climateStress = 1.0;
    if (['IL', 'MI', 'WI', 'MN', 'NY', 'PA'].includes(region)) climateStress = 1.3; // Frost Heave
    if (['FL', 'TX', 'AZ', 'NV'].includes(region)) climateStress = 1.15; // Extreme UV Oxidation
    
    // Exponential decay curve: PCI drops slowly at first, then rapidly if unmaintained.
    const ageInYears = monthsSincePour / 12;
    const decayAmount = Math.pow(ageInYears, 1.5) * 2.5 * climateStress;
    currentPCI = Math.max(0, 100 - decayAmount);
    
    let alert = "OPTIMAL: No action required.";
    let recommendedAction = "None";
    let estCost = 0;
    
    if (ageInYears >= 12 || currentPCI < 40) {
      alert = "CRITICAL: ASSET FAILURE. Full reconstruction required to restore NNN lease value.";
      recommendedAction = MAINTENANCE_SCHEDULE.year12.action;
      estCost = sqft * 3.50; // $3.50/sqft full replace
    } else if (ageInYears >= 5 || currentPCI < 70) {
      alert = "WARNING: STRUCTURAL DECAY. Mill & Overlay required to prevent base failure.";
      recommendedAction = MAINTENANCE_SCHEDULE.year5.action;
      estCost = sqft * 1.85; // $1.85/sqft overlay
    } else if (ageInYears >= 3 || currentPCI < 85) {
      alert = "ATTENTION: OXIDATION DETECTED. Sealcoat required to protect binder.";
      recommendedAction = MAINTENANCE_SCHEDULE.year3.action;
      estCost = sqft * 0.25; // $0.25/sqft sealcoat
    } else if (ageInYears >= 1) {
      alert = "MAINTENANCE: Routine 1-Year Check.";
      recommendedAction = MAINTENANCE_SCHEDULE.year1.action;
      estCost = sqft * 0.05; // $0.05/sqft crack fill budget
    }

    return {
      pciScore: currentPCI.toFixed(1),
      maintenanceAlert: alert,
      action: recommendedAction,
      estimatedRepairValue: estCost,
      logic: "JWORDENAI™ Predictive Pavement Health Algorithm"
    };
  }
};

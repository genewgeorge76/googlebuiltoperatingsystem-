// J. Worden Weather Engine using Open-Meteo API (No API Key Required)

const HUB_COORDINATES = {
  '23836': { lat: 37.3569, lon: -77.4416, name: 'Chester, VA' },
  '23221': { lat: 37.5582, lon: -77.4831, name: 'Richmond, VA' },
  '29902': { lat: 32.4316, lon: -80.6698, name: 'Beaufort, SC' },
  '31401': { lat: 32.0835, lon: -81.0998, name: 'Savannah, GA' }
};

export const weatherEngine = {
  hubs: ['23836', '23221', '29902', '31401'],

  async fetchWeatherAlerts() {
    const alerts = [];
    
    for (const zip of this.hubs) {
      const coords = HUB_COORDINATES[zip];
      if (!coords) continue;
      
      try {
        // Fetch Daily Forecast (Precipitation & Max UV)
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=precipitation_sum,uv_index_max&timezone=auto`);
        if (!res.ok) continue;
        
        const data = await res.json();
        
        // Check Today's Forecast (Index 0)
        const precipMm = data.daily.precipitation_sum[0];
        const uvIndex = data.daily.uv_index_max[0];
        
        if (precipMm > 10.0) { // Approx 0.4 inches
          alerts.push(`JWORDENAI: Weather-pivoting leads in ${coords.name} (ZIP ${zip}) due to heavy rain (${precipMm.toFixed(1)} mm). Sealcoating Requeued.`);
        } else if (precipMm > 2.5) { // Approx 0.1 inches
          alerts.push(`JWORDENAI: Light rain warning in ${coords.name}. Monitor paving subgrade.`);
        }
        
        if (uvIndex > 8.0) {
          alerts.push(`JWORDENAI: High-UV Exposure Alert (Index ${uvIndex.toFixed(1)}) in ${coords.name}. Asphalt Oxidation Accelerated.`);
        }
      } catch (err) {
        console.error(`Error fetching weather for ${zip}:`, err);
      }
    }
    
    return alerts;
  }
};

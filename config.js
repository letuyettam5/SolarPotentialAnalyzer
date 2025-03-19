const CONFIG = {
    // API Keys (replace with your actual keys)
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE',
    
    // Financial calculation constants
    COST_PER_PANEL: 300,       // Average cost per panel ($)
    PANEL_WATTAGE: 400,        // Average wattage per panel (W)
    HOURS_PER_YEAR: 1561,      // Approximate annual sunshine hours
    ENERGY_COST_PER_KWH: 0.13, // Average electricity cost per kWh ($)
    EFFICIENCY: 0.20,          // 20% panel efficiency
    
    // API Endpoints
    GEOCODE_API_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
    SOLAR_API_URL: 'https://solar.googleapis.com/v1/buildingInsights:findClosest'
};

// In a production environment, this should be loaded from a secure backend
// or environment variables, not exposed in client-side JavaScript

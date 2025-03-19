// app.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('csvFile');
    const batchSizeInput = document.getElementById('batchSize');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('status');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsBody = document.getElementById('resultsBody');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    
    // Global variables
    let processedData = [];
    
    // Event listeners
    analyzeBtn.addEventListener('click', startAnalysis);
    downloadCsvBtn.addEventListener('click', downloadCsv);
    
    async function startAnalysis() {
        // Validate inputs
        if (!fileInput.files.length) {
            alert('Please select a CSV file');
            return;
        }
        
        try {
            // Parse the CSV file
            const parsedData = await parseCSV(fileInput.files[0]);
            
            // Check if the file has the required columns
            if (!parsedData.meta.fields.includes('SITEADDRES')) {
                alert('The CSV file must include a "SITEADDRES" column');
                return;
            }
            
            if (!parsedData.meta.fields.includes('ZONINGCODE')) {
                alert('The CSV file must include a "ZONINGCODE" column');
                return;
            }
            
            // Filter residential properties only
            const residentialData = parsedData.data.filter(item => {
                const zoning = item.ZONINGCODE || '';
                return zoning.includes('Single Family Residential') || 
                       zoning.includes('Multi-Family Residential');
            });
            
            if (residentialData.length === 0) {
                alert('No residential properties found in the CSV file');
                return;
            }
            
            // Show progress container
            progressContainer.style.display = 'block';
            analyzeBtn.disabled = true;
            
            // Clear existing results
            processedData = [];
            resultsBody.innerHTML = '';
            
            // Process data in batches
            const batchSize = parseInt(batchSizeInput.value) || 5;
            await processBatches(residentialData, batchSize);
            
            // Show results
            resultsContainer.style.display = 'block';
            statusText.textContent = `Analysis complete! Processed ${processedData.length} residential properties.`;
            
        } catch (error) {
            statusText.textContent = `Error: ${error.message}`;
            console.error('Analysis error:', error);
            analyzeBtn.disabled = false;
        }
    }
    
    function parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: resolve,
                error: reject
            });
        });
    }
    
    async function processBatches(data, batchSize) {
        const totalItems = data.length;
        let processedItems = 0;
        
        for (let i = 0; i < totalItems; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            await Promise.all(batch.map(item => processItem(item)));
            
            processedItems += batch.length;
            const progress = (processedItems / totalItems) * 100;
            
            // Update progress UI
            progressBar.style.width = `${progress}%`;
            statusText.textContent = `Processing: ${processedItems} of ${totalItems} properties`;
            
            // Short delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        analyzeBtn.disabled = false;
    }
    
    async function processItem(item) {
        try {
            // Get address
            const address = item.SITEADDRES;
            if (!address) {
                console.warn('Skipping item with no address:', item);
                return;
            }
            
            // Geocode address
            const geocodeResult = await geocodeAddress(address);
            
            if (!geocodeResult) {
                console.warn('Could not geocode address:', address);
                return;
            }
            
            // Get solar potential
            const solarData = await getSolarPotential(
                geocodeResult.lat, 
                geocodeResult.lng
            );
            
            if (!solarData) {
                console.warn('Could not get solar data for:', address);
                return;
            }
            
            // Calculate financial metrics
            const financialData = calculateFinancials(solarData.maxArrayPanelsCount);
            
            // Create processed item with only the data we want to keep
            const resultItem = {
                Address: item.SITEADDRES || '',
                ZoningCode: item.ZONINGCODE || '',
                Latitude: geocodeResult.lat,
                Longitude: geocodeResult.lng,
                MaxSolarPanels: solarData.maxArrayPanelsCount,
                MaxSolarAreaM2: solarData.maxArrayAreaMeters2,
                SunshineHoursPerYear: solarData.maxSunshineHoursPerYear,
                InstallationCost: financialData.installation_cost,
                AnnualEnergyProductionKWh: financialData.annual_energy_production_kwh,
                AnnualSavings: financialData.annual_savings,
                PaybackPeriodYears: financialData.payback_period_years
            };
            
            // Add to processed data
            processedData.push(resultItem);
            
            // Create a combined object for table display (includes original data for reference)
            const displayItem = {
                ...item,
                Latitude: geocodeResult.lat,
                Longitude: geocodeResult.lng,
                solar_max_panels: solarData.maxArrayPanelsCount,
                solar_max_area_m2: solarData.maxArrayAreaMeters2,
                solar_max_sunshine_hours: solarData.maxSunshineHoursPerYear,
                ...financialData
            };
            
            // Add to table
            addResultToTable(displayItem);
            
        } catch (error) {
            console.error('Error processing item:', error, item);
        }
    }
    
    async function geocodeAddress(address) {
        try {
            const apiKey = CONFIG.GOOGLE_API_KEY;
            const url = `${CONFIG.GEOCODE_API_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'OK' || !data.results || !data.results[0]) {
                console.warn('Geocoding error:', data.status, address);
                return null;
            }
            
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
            
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }
    
    async function getSolarPotential(lat, lng) {
        try {
            const apiKey = CONFIG.GOOGLE_API_KEY;
            const url = `${CONFIG.SOLAR_API_URL}?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                console.warn('Solar API error:', data.error?.message || response.statusText);
                return null;
            }
            
            return {
                maxArrayPanelsCount: data.solarPotential?.maxArrayPanelsCount || 0,
                maxArrayAreaMeters2: data.solarPotential?.maxArrayAreaMeters2 || 0,
                maxSunshineHoursPerYear: data.solarPotential?.maxSunshineHoursPerYear || 0
            };
            
        } catch (error) {
            console.error('Solar API error:', error);
            return null;
        }
    }
    
    function calculateFinancials(maxPanels) {
        const installationCost = maxPanels * CONFIG.COST_PER_PANEL;
        const annualEnergyProduction = (maxPanels * CONFIG.PANEL_WATTAGE * CONFIG.HOURS_PER_YEAR * CONFIG.EFFICIENCY) / 1000;
        const annualSavings = annualEnergyProduction * CONFIG.ENERGY_COST_PER_KWH;
        const paybackPeriod = installationCost / annualSavings;
        
        return {
            installation_cost: installationCost,
            annual_energy_production_kwh: annualEnergyProduction,
            annual_savings: annualSavings,
            payback_period_years: paybackPeriod
        };
    }
    
    function addResultToTable(item) {
        const row = document.createElement('tr');
        
        // Create row cells with formatted values
        row.innerHTML = `
            <td>${item.SITEADDRES || ''}</td>
            <td>${item.Latitude?.toFixed(6) || ''}</td>
            <td>${item.Longitude?.toFixed(6) || ''}</td>
            <td>${item.solar_max_panels || '0'}</td>
            <td>${item.solar_max_area_m2?.toFixed(2) || '0'}</td>
            <td>${item.solar_max_sunshine_hours?.toFixed(0) || '0'}</td>
            <td>${formatCurrency(item.installation_cost)}</td>
            <td>${item.annual_energy_production_kwh?.toFixed(2) || '0'}</td>
            <td>${formatCurrency(item.annual_savings)}</td>
            <td>${item.payback_period_years?.toFixed(1) || 'N/A'}</td>
        `;
        
        resultsBody.appendChild(row);
    }
    
    function formatCurrency(value) {
        if (value == null) return '$0.00';
        return '$' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function downloadCsv() {
        if (!processedData.length) {
            alert('No data to download');
            return;
        }
        
        const csv = Papa.unparse(processedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'solar_potential_results.csv');
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

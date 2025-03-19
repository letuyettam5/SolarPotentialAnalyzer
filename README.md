# Solar Potential Analyzer

A web-based application for analyzing the solar potential of public residential properties using Google's Geocoding and Solar APIs.

## Features

- **CSV File Import**: Upload property data with addresses
- **Residential Property Filter**: Automatically filters for properties with "Single Family Residential" or "Multi-Family Residential" in the ZONINGCODE column
- **Batch Processing**: Processes properties in configurable batches to manage API rate limits
- **Financial Analysis**: Calculates key financial metrics based on solar potential
- **Interactive Results Table**: View all processed data in a sortable table
- **CSV Export**: Download clean, processed data in CSV format

## Requirements

- A modern web browser
- Google API key with permissions for:
  - Geocoding API
  - Solar API
- Data in CSV format, which could be downloaded from:
  https://gisdata.fultoncountyga.gov/datasets/9b2893425343481b97fee2047ebd86f3/explore
  or 
  https://dpcd-coaplangis.opendata.arcgis.com/datasets/coaplangis::publicly-owned-property/explore

## Installation

1. Clone or download this repository
2. Edit the `config.js` file and replace `'YOUR_GOOGLE_API_KEY_HERE'` with your actual Google API key
3. Open `index.html` in your web browser, or host the files on a web server

## CSV File Format

The application expects a CSV file with at least the following columns:
- `SITEADDRES` - The property address to be geocoded
- `ZONINGCODE` - Property zoning designation (filters for residential properties)

## Financial Calculations

The application uses the following constants for financial calculations:
- Cost per solar panel: $300
- Panel wattage: 400 W
- Average sunshine hours per year: 1,561 hours
- Energy cost per kWh: $0.13
- Panel efficiency: 20%

These values can be adjusted in the `config.js` file.

## Security Note

In a production environment, you should:
- Never expose API keys in client-side JavaScript

## Acknowledgments

- Google Solar API
- Google Geocoding API
- PapaParse for CSV parsing

## Credits
This project uses financial metric calculation from https://github.com/shrutimarx/Solar-Data-Analysis/tree/main  
All credit goes to the original authors for their work.


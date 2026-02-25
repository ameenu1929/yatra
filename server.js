// India Travel Planner AI - Backend Server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for API responses (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Indian tourist destinations database
const destinations = [
    { id: 1, name: "Manali", state: "Himachal Pradesh", type: ["hill", "adventure", "romantic", "nature"], rating: 4.6, lat: 32.2432, lng: 77.1892, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", description: "Scenic hill station with snow-capped mountains", baseCost: 3500 },
    { id: 2, name: "Shimla", state: "Himachal Pradesh", type: ["hill", "romantic", "nature"], rating: 4.4, lat: 31.1048, lng: 77.1734, image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800", description: "Queen of Hills with colonial charm", baseCost: 3000 },
    { id: 3, name: "Ooty", state: "Tamil Nadu", type: ["hill", "romantic", "nature"], rating: 4.5, lat: 11.4102, lng: 76.6950, image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=800", description: "Nilgiri hills with tea gardens", baseCost: 2800 },
    { id: 4, name: "Munnar", state: "Kerala", type: ["hill", "nature", "romantic"], rating: 4.7, lat: 10.0889, lng: 77.0595, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", description: "Tea plantations and misty mountains", baseCost: 3200 },
    { id: 5, name: "Darjeeling", state: "West Bengal", type: ["hill", "nature", "cultural"], rating: 4.5, lat: 27.0410, lng: 88.2663, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", description: "Tea capital with Himalayan views", baseCost: 3000 },
    { id: 6, name: "Rishikesh", state: "Uttarakhand", type: ["adventure", "nature", "cultural"], rating: 4.6, lat: 30.0869, lng: 78.2676, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", description: "Yoga capital and adventure sports hub", baseCost: 2500 },
    { id: 7, name: "Leh-Ladakh", state: "Ladakh", type: ["adventure", "nature", "hill"], rating: 4.8, lat: 34.1526, lng: 77.5771, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", description: "High altitude desert with stunning landscapes", baseCost: 5500 },
    { id: 8, name: "Goa", state: "Goa", type: ["beach", "adventure", "romantic"], rating: 4.5, lat: 15.2993, lng: 74.1240, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800", description: "Beaches, nightlife and water sports", baseCost: 3500 },
    { id: 9, name: "Andaman Islands", state: "Andaman and Nicobar", type: ["beach", "adventure", "romantic", "nature"], rating: 4.7, lat: 11.7401, lng: 92.6586, image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", description: "Pristine beaches and coral reefs", baseCost: 6000 },
    { id: 10, name: "Varkala", state: "Kerala", type: ["beach", "nature", "romantic"], rating: 4.4, lat: 8.7379, lng: 76.7163, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", description: "Cliff beaches and natural springs", baseCost: 2500 },
    { id: 11, name: "Gokarna", state: "Karnataka", type: ["beach", "nature", "cultural"], rating: 4.3, lat: 14.5479, lng: 74.3188, image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", description: "Peaceful beaches and temples", baseCost: 2200 },
    { id: 12, name: "Jaipur", state: "Rajasthan", type: ["cultural", "romantic"], rating: 4.6, lat: 26.9124, lng: 75.7873, image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800", description: "Pink City with royal palaces", baseCost: 2800 },
    { id: 13, name: "Udaipur", state: "Rajasthan", type: ["cultural", "romantic"], rating: 4.7, lat: 24.5854, lng: 73.7125, image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", description: "City of Lakes with royal heritage", baseCost: 3200 },
    { id: 14, name: "Varanasi", state: "Uttar Pradesh", type: ["cultural"], rating: 4.5, lat: 25.3176, lng: 82.9739, image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800", description: "Ancient spiritual city on Ganges", baseCost: 2000 },
    { id: 15, name: "Agra", state: "Uttar Pradesh", type: ["cultural", "romantic"], rating: 4.6, lat: 27.1767, lng: 78.0081, image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800", description: "Home to the Taj Mahal", baseCost: 2500 },
    { id: 16, name: "Hampi", state: "Karnataka", type: ["cultural", "adventure", "nature"], rating: 4.5, lat: 15.3350, lng: 76.4600, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", description: "Ancient ruins and boulder landscapes", baseCost: 2200 },
    { id: 17, name: "Coorg", state: "Karnataka", type: ["nature", "hill", "romantic"], rating: 4.5, lat: 12.3375, lng: 75.8069, image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=800", description: "Coffee plantations and waterfalls", baseCost: 2800 },
    { id: 18, name: "Wayanad", state: "Kerala", type: ["nature", "hill", "adventure"], rating: 4.4, lat: 11.6854, lng: 76.1320, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", description: "Wildlife and spice plantations", baseCost: 2600 },
    { id: 19, name: "Jim Corbett", state: "Uttarakhand", type: ["nature", "adventure"], rating: 4.5, lat: 29.5308, lng: 78.7760, image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800", description: "Tiger reserve and wildlife sanctuary", baseCost: 3500 },
    { id: 20, name: "Rann of Kutch", state: "Gujarat", type: ["nature", "cultural", "adventure"], rating: 4.6, lat: 23.7337, lng: 69.8597, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", description: "White salt desert and cultural festival", baseCost: 3000 },
    { id: 21, name: "Alleppey", state: "Kerala", type: ["nature", "romantic", "beach"], rating: 4.6, lat: 9.4981, lng: 76.3388, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", description: "Backwaters and houseboat cruises", baseCost: 3200 },
    { id: 22, name: "Mysore", state: "Karnataka", type: ["cultural", "romantic"], rating: 4.5, lat: 12.2958, lng: 76.6394, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", description: "Royal palaces and silk sarees", baseCost: 2400 },
    { id: 23, name: "Khajuraho", state: "Madhya Pradesh", type: ["cultural"], rating: 4.4, lat: 24.8318, lng: 79.9199, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", description: "Ancient temples with intricate carvings", baseCost: 2300 },
    { id: 24, name: "Spiti Valley", state: "Himachal Pradesh", type: ["adventure", "nature", "hill"], rating: 4.7, lat: 32.2466, lng: 78.0326, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", description: "Cold desert mountain valley", baseCost: 4500 },
    { id: 25, name: "Pondicherry", state: "Puducherry", type: ["beach", "cultural", "romantic"], rating: 4.4, lat: 11.9416, lng: 79.8083, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", description: "French colonial charm and beaches", baseCost: 2600 }
];

// API Routes

// Get all destinations
app.get('/api/destinations', (req, res) => {
    res.json({ success: true, data: destinations });
});

// Search destinations based on preferences
app.post('/api/search', async (req, res) => {
    try {
        const { budget, days, members, startCity, travelType, preferences } = req.body;

        // Validate input
        if (!budget || !days || !members || !startCity || !preferences || preferences.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Filter destinations by preferences
        let filtered = destinations.filter(dest => 
            dest.type.some(t => preferences.includes(t))
        );

        // Calculate budget per person per day
        const budgetPerPersonPerDay = budget / (members * days);

        // Score and filter by budget
        filtered = filtered.map(dest => {
            const estimatedDailyCost = calculateEstimatedCost(dest, travelType);
            const budgetScore = calculateBudgetScore(budgetPerPersonPerDay, estimatedDailyCost);
            
            return {
                ...dest,
                budgetScore,
                estimatedDailyCost
            };
        }).filter(dest => dest.budgetScore > 0);

        // Get starting city coordinates
        const startCoords = await getCityCoordinates(startCity);
        
        // Calculate distances
        if (startCoords) {
            filtered = filtered.map(dest => ({
                ...dest,
                distance: calculateDistance(startCoords.lat, startCoords.lng, dest.lat, dest.lng)
            }));
        }

        // Get weather data for all destinations
        await Promise.all(filtered.map(dest => addWeatherData(dest)));

        // Sort by rating and limit results
        filtered.sort((a, b) => b.rating - a.rating);
        filtered = filtered.slice(0, 10);

        res.json({ 
            success: true, 
            data: filtered,
            startCity: startCoords ? { ...startCoords, name: startCity } : null
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get destination details
app.get('/api/destination/:id', async (req, res) => {
    try {
        const destination = destinations.find(d => d.id === parseInt(req.params.id));
        
        if (!destination) {
            return res.status(404).json({ success: false, error: 'Destination not found' });
        }

        // Add weather data
        await addWeatherData(destination);

        // Generate hotels and restaurants
        const hotels = generateHotels(destination);
        const restaurants = generateRestaurants(destination);

        res.json({
            success: true,
            data: {
                ...destination,
                hotels,
                restaurants
            }
        });

    } catch (error) {
        console.error('Destination details error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get weather for a location
app.get('/api/weather/:lat/:lng', async (req, res) => {
    try {
        const { lat, lng } = req.params;
        const cacheKey = `weather_${lat}_${lng}`;
        
        // Check cache
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=Asia/Kolkata`
        );

        const weather = {
            temp: Math.round(response.data.current_weather.temperature),
            condition: getWeatherCondition(response.data.current_weather.weathercode),
            windSpeed: response.data.current_weather.windspeed
        };

        cache.set(cacheKey, weather);
        res.json({ success: true, data: weather });

    } catch (error) {
        console.error('Weather error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
    }
});

// Get city coordinates
app.get('/api/geocode/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const cacheKey = `geocode_${city}`;
        
        // Check cache
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        const coords = await getCityCoordinates(city);
        
        if (!coords) {
            return res.status(404).json({ success: false, error: 'City not found' });
        }

        cache.set(cacheKey, coords);
        res.json({ success: true, data: coords });

    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ success: false, error: 'Failed to geocode city' });
    }
});

// Calculate transport options
app.post('/api/transport', (req, res) => {
    try {
        const { distance, members } = req.body;
        
        if (!distance) {
            return res.status(400).json({ success: false, error: 'Distance is required' });
        }

        const options = calculateTransportOptions(distance, members || 1);
        res.json({ success: true, data: options });

    } catch (error) {
        console.error('Transport calculation error:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate transport options' });
    }
});

// Helper Functions

function calculateEstimatedCost(destination, travelType) {
    let cost = destination.baseCost;
    
    // Adjust for travel type
    if (travelType === 'family') cost *= 1.2;
    if (travelType === 'solo') cost *= 0.8;
    
    return cost;
}

function calculateBudgetScore(budgetPerDay, estimatedCost) {
    const ratio = budgetPerDay / estimatedCost;
    
    if (ratio < 0.5) return 0;
    if (ratio > 2) return 1;
    return ratio / 2;
}

async function getCityCoordinates(cityName) {
    try {
        const response = await axios.get(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );
        
        if (response.data.results && response.data.results.length > 0) {
            return {
                lat: response.data.results[0].latitude,
                lng: response.data.results[0].longitude
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
}

async function addWeatherData(destination) {
    try {
        const cacheKey = `weather_${destination.lat}_${destination.lng}`;
        const cached = cache.get(cacheKey);
        
        if (cached) {
            destination.weather = cached;
            return;
        }

        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${destination.lat}&longitude=${destination.lng}&current_weather=true&timezone=Asia/Kolkata`
        );
        
        if (response.data.current_weather) {
            destination.weather = {
                temp: Math.round(response.data.current_weather.temperature),
                condition: getWeatherCondition(response.data.current_weather.weathercode),
                windSpeed: response.data.current_weather.windspeed
            };
            cache.set(cacheKey, destination.weather);
        }
    } catch (error) {
        console.error('Weather fetch error:', error);
        destination.weather = { temp: 'N/A', condition: 'Unknown', windSpeed: 0 };
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: '☀️ Clear', 1: '🌤️ Mainly Clear', 2: '⛅ Partly Cloudy', 3: '☁️ Cloudy',
        45: '🌫️ Foggy', 48: '🌫️ Foggy', 51: '🌦️ Light Drizzle',
        61: '🌧️ Light Rain', 63: '🌧️ Moderate Rain', 65: '🌧️ Heavy Rain',
        71: '🌨️ Light Snow', 73: '🌨️ Moderate Snow', 75: '🌨️ Heavy Snow',
        95: '⛈️ Thunderstorm'
    };
    return conditions[code] || '🌤️ Fair';
}

function calculateTransportOptions(distance, members) {
    const options = [];
    
    if (distance > 300) {
        options.push({
            mode: 'Flight',
            icon: '✈️',
            duration: `${Math.ceil(distance / 600)} - ${Math.ceil(distance / 500)} hours`,
            costPerPerson: Math.round(distance * 3 + 2000),
            totalCost: Math.round((distance * 3 + 2000) * members)
        });
    }
    
    options.push({
        mode: 'Train',
        icon: '🚂',
        duration: `${Math.ceil(distance / 60)} - ${Math.ceil(distance / 50)} hours`,
        costPerPerson: Math.round(distance * 0.5 + 500),
        totalCost: Math.round((distance * 0.5 + 500) * members)
    });
    
    options.push({
        mode: 'Bus',
        icon: '🚌',
        duration: `${Math.ceil(distance / 50)} - ${Math.ceil(distance / 40)} hours`,
        costPerPerson: Math.round(distance * 1.2 + 200),
        totalCost: Math.round((distance * 1.2 + 200) * members)
    });
    
    if (distance < 1000) {
        options.push({
            mode: 'Car/Bike',
            icon: '🚗',
            duration: `${Math.ceil(distance / 60)} - ${Math.ceil(distance / 50)} hours`,
            costPerPerson: Math.round(distance * 8 / members),
            totalCost: Math.round(distance * 8)
        });
    }
    
    return options;
}

function generateHotels(destination) {
    return [
        {
            name: `${destination.name} Grand Hotel`,
            rating: 4.5,
            type: 'Luxury',
            price: Math.round(destination.baseCost * 0.6),
            amenities: ['Pool', 'Spa', 'Restaurant', 'WiFi']
        },
        {
            name: `Comfort Inn ${destination.name}`,
            rating: 4.2,
            type: 'Mid-Range',
            price: Math.round(destination.baseCost * 0.4),
            amenities: ['Restaurant', 'WiFi', 'Parking']
        },
        {
            name: `Budget Stay ${destination.name}`,
            rating: 3.8,
            type: 'Budget',
            price: Math.round(destination.baseCost * 0.2),
            amenities: ['WiFi', 'Basic Breakfast']
        }
    ];
}

function generateRestaurants(destination) {
    const cuisines = ['North Indian', 'South Indian', 'Multi-Cuisine', 'Local Specialties', 'Continental'];
    
    return [
        {
            name: 'The Royal Dine',
            rating: 4.4,
            cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
            priceRange: '800-1200',
            specialty: 'Fine Dining'
        },
        {
            name: 'Spice Garden',
            rating: 4.2,
            cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
            priceRange: '500-800',
            specialty: 'Traditional Cuisine'
        },
        {
            name: 'Local Flavors',
            rating: 4.0,
            cuisine: 'Local Specialties',
            priceRange: '300-500',
            specialty: 'Street Food & Local Dishes'
        }
    ];
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 India Travel Planner AI Server running on http://localhost:${PORT}`);
    console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
});

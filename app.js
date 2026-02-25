// India Travel Planner AI - Frontend Application
// Connected to Backend API

const API_BASE_URL = 'http://localhost:3000/api';

// State variables
let userPreferences = {};
let filteredDestinations = [];
let selectedDestination = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeSliders();
    initializeTravelTypeButtons();
    initializeForm();
});

// Initialize sliders with live updates
function initializeSliders() {
    const budget = document.getElementById('budget');
    const days = document.getElementById('days');
    const members = document.getElementById('members');
    
    budget.addEventListener('input', (e) => {
        document.getElementById('budgetValue').textContent = `₹${parseInt(e.target.value).toLocaleString('en-IN')}`;
    });
    
    days.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('daysValue').textContent = `${value} ${value == 1 ? 'day' : 'days'}`;
    });
    
    members.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('membersValue').textContent = `${value} ${value == 1 ? 'person' : 'people'}`;
    });
}

// Initialize travel type buttons
function initializeTravelTypeButtons() {
    const buttons = document.querySelectorAll('.option-btn');
    const hiddenInput = document.getElementById('travelType');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hiddenInput.value = btn.dataset.value;
        });
    });
}

// Initialize form submission
function initializeForm() {
    const form = document.getElementById('travelForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        userPreferences = {
            budget: parseInt(document.getElementById('budget').value),
            days: parseInt(document.getElementById('days').value),
            members: parseInt(document.getElementById('members').value),
            startCity: document.getElementById('startCity').value.trim(),
            travelType: document.getElementById('travelType').value,
            preferences: Array.from(document.querySelectorAll('input[name="preferences"]:checked')).map(cb => cb.value)
        };
        
        if (!userPreferences.travelType) {
            showNotification('Please select a travel type (Solo, Friends, or Family)', 'error');
            return;
        }
        
        if (userPreferences.preferences.length === 0) {
            showNotification('Please select at least one preference', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '🔍 Finding perfect destinations...';
        submitBtn.disabled = true;
        
        try {
            await findDestinations();
        } catch (error) {
            showNotification('Failed to find destinations. Please try again.', 'error');
            console.error('Search error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Back buttons
    document.getElementById('backBtn').addEventListener('click', () => {
        showSection('inputSection');
    });
    
    document.getElementById('backToListBtn').addEventListener('click', () => {
        showSection('resultsSection');
    });
}

// Find matching destinations using backend API
async function findDestinations() {
    try {
        const response = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userPreferences)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Search failed');
        }
        
        filteredDestinations = result.data;
        displayDestinations();
        
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Display destinations list
function displayDestinations() {
    const container = document.getElementById('destinationsList');
    
    if (filteredDestinations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 1.5em; color: #666; margin-bottom: 20px;">😔 No destinations found</p>
                <p style="color: #999;">Try adjusting your preferences or budget!</p>
            </div>
        `;
        showSection('resultsSection');
        return;
    }
    
    container.innerHTML = filteredDestinations.map((dest, index) => `
        <div class="destination-card" onclick="showDestinationDetails(${index})">
            <img src="${dest.image}" alt="${dest.name}" class="destination-image" 
                 onerror="this.src='https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'">
            <div class="destination-content">
                <div class="destination-header">
                    <h2 class="destination-name">${dest.name}</h2>
                    <div class="destination-rating">⭐ ${dest.rating}</div>
                </div>
                <p style="color: #666; margin-bottom: 10px;">${dest.description}</p>
                <p style="color: #999; font-size: 0.9em;">📍 ${dest.state}</p>
                ${dest.weather ? `
                    <div class="weather-badge">
                        ${dest.weather.condition} • ${dest.weather.temp}°C
                    </div>
                ` : ''}
                <div class="destination-info">
                    ${dest.distance ? `<div class="info-item">🚗 ${dest.distance} km away</div>` : ''}
                    <div class="info-item">💰 ${getBudgetCategory(dest.budgetScore)}</div>
                    <div class="info-item">⏱️ ${userPreferences.days} days</div>
                    <div class="info-item">💵 ~₹${Math.round(dest.estimatedDailyCost)}/day</div>
                </div>
            </div>
        </div>
    `).join('');
    
    showSection('resultsSection');
}

// Get budget category label
function getBudgetCategory(score) {
    if (score > 0.8) return 'Budget Friendly';
    if (score > 0.5) return 'Moderate';
    return 'Premium';
}

// Show destination details
async function showDestinationDetails(index) {
    selectedDestination = filteredDestinations[index];
    const container = document.getElementById('destinationDetails');
    
    // Show loading
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><p style="font-size: 1.2em;">Loading details...</p></div>';
    showSection('detailsSection');
    
    try {
        // Fetch detailed information from backend
        const response = await fetch(`${API_BASE_URL}/destination/${selectedDestination.id}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Failed to load destination details');
        }
        
        const destination = result.data;
        
        // Calculate transport options
        const transportResponse = await fetch(`${API_BASE_URL}/transport`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                distance: selectedDestination.distance || 500,
                members: userPreferences.members
            })
        });
        const transportResult = await transportResponse.json();
        const transportOptions = transportResult.success ? transportResult.data : [];
        
        // Render details
        container.innerHTML = `
            <div class="detail-section">
                <img src="${destination.image}" alt="${destination.name}" 
                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 15px; margin-bottom: 20px;" 
                     onerror="this.src='https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'">
                
                <h1 style="font-size: 2.5em; color: #667eea; margin-bottom: 10px;">${destination.name}</h1>
                <p style="font-size: 1.2em; color: #666; margin-bottom: 20px;">${destination.description}</p>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div class="weather-badge" style="font-size: 1.1em;">
                        ${destination.weather ? `${destination.weather.condition} • ${destination.weather.temp}°C` : 'Weather data unavailable'}
                    </div>
                    <div class="weather-badge" style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333;">
                        ⭐ ${destination.rating} Rating
                    </div>
                    ${selectedDestination.distance ? `
                        <div class="weather-badge" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                            📍 ${selectedDestination.distance} km from ${userPreferences.startCity}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${transportOptions.length > 0 ? `
                <div class="detail-section">
                    <h2>🚗 Transport Options</h2>
                    <p style="color: #666; margin-bottom: 15px;">For ${userPreferences.members} ${userPreferences.members === 1 ? 'person' : 'people'}</p>
                    ${transportOptions.map(option => `
                        <div class="transport-option">
                            <div>
                                <strong>${option.icon} ${option.mode}</strong>
                                <p style="color: #666; margin: 5px 0 0 0;">${option.duration}</p>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #667eea; font-size: 1.2em;">₹${option.totalCost.toLocaleString('en-IN')}</strong>
                                <p style="color: #999; margin: 5px 0 0 0;">₹${option.costPerPerson.toLocaleString('en-IN')} per person</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h2>🏨 Recommended Hotels</h2>
                ${destination.hotels.map(hotel => `
                    <div class="hotel-card">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div>
                                <strong style="font-size: 1.1em;">${hotel.name}</strong>
                                <p style="color: #666; margin: 5px 0;">⭐ ${hotel.rating} • ${hotel.type}</p>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #667eea; font-size: 1.2em;">₹${hotel.price.toLocaleString('en-IN')}</strong>
                                <p style="color: #999; margin: 5px 0 0 0;">per night</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${hotel.amenities.map(amenity => `
                                <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 15px; font-size: 0.85em;">
                                    ${amenity}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="detail-section">
                <h2>🍽️ Popular Restaurants</h2>
                ${destination.restaurants.map(restaurant => `
                    <div class="restaurant-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="font-size: 1.1em;">${restaurant.name}</strong>
                                <p style="color: #666; margin: 5px 0;">⭐ ${restaurant.rating} • ${restaurant.cuisine}</p>
                                <p style="color: #999; font-size: 0.9em; margin: 5px 0 0 0;">${restaurant.specialty}</p>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #667eea;">₹${restaurant.priceRange}</strong>
                                <p style="color: #999; margin: 5px 0 0 0;">for two</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="detail-section">
                <h2>🗺️ Location Map</h2>
                <div id="map"></div>
                <a href="https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}" 
                   target="_blank" 
                   class="submit-btn" 
                   style="display: inline-block; text-align: center; text-decoration: none; margin-top: 15px;">
                    📍 Open in Google Maps
                </a>
            </div>
            
            <div class="detail-section" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">
                <h2 style="color: white;">💰 Estimated Trip Cost</h2>
                <div style="font-size: 1.1em; line-height: 1.8;">
                    <p>🏨 Accommodation: ₹${(destination.hotels[1].price * userPreferences.days).toLocaleString('en-IN')}</p>
                    <p>🍽️ Food: ₹${(600 * userPreferences.days * userPreferences.members).toLocaleString('en-IN')}</p>
                    <p>🚗 Transport: ₹${transportOptions[0] ? transportOptions[0].totalCost.toLocaleString('en-IN') : 'N/A'}</p>
                    <p>🎯 Activities: ₹${(500 * userPreferences.days * userPreferences.members).toLocaleString('en-IN')}</p>
                    <hr style="margin: 15px 0; border: 1px solid rgba(255,255,255,0.3);">
                    <p style="font-size: 1.3em;"><strong>Total Estimate: ₹${calculateTotalCost(destination, transportOptions).toLocaleString('en-IN')}</strong></p>
                </div>
            </div>
        `;
        
        // Initialize map
        initializeMap(destination);
        
    } catch (error) {
        console.error('Error loading details:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 1.2em; color: #e74c3c;">Failed to load destination details</p>
                <button onclick="showSection('resultsSection')" class="submit-btn" style="width: auto; margin-top: 20px;">
                    ← Back to Results
                </button>
            </div>
        `;
    }
}

// Calculate total trip cost
function calculateTotalCost(destination, transportOptions) {
    const accommodation = destination.hotels[1].price * userPreferences.days;
    const food = 600 * userPreferences.days * userPreferences.members;
    const transport = transportOptions[0] ? transportOptions[0].totalCost : 0;
    const activities = 500 * userPreferences.days * userPreferences.members;
    
    return accommodation + food + transport + activities;
}

// Initialize Google Maps
function initializeMap(destination) {
    const mapContainer = document.getElementById('map');
    
    mapContainer.innerHTML = `
        <iframe
            width="100%"
            height="400"
            style="border:0; border-radius: 15px;"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(destination.name)},${encodeURIComponent(destination.state)}&zoom=12">
        </iframe>
    `;
}

// Show specific section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo(0, 0);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? '#e74c3c' : '#667eea'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

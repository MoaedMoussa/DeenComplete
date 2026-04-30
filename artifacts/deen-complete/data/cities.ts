export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export const CITIES: City[] = [
  // Middle East
  { name: "Makkah", country: "Saudi Arabia", lat: 21.3891, lng: 39.8579, timezone: "Asia/Riyadh" },
  { name: "Madinah", country: "Saudi Arabia", lat: 24.4684, lng: 39.6142, timezone: "Asia/Riyadh" },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, timezone: "Asia/Riyadh" },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.5433, lng: 39.1728, timezone: "Asia/Riyadh" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai" },
  { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773, timezone: "Asia/Dubai" },
  { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774, timezone: "Asia/Kuwait" },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531, timezone: "Asia/Qatar" },
  { name: "Muscat", country: "Oman", lat: 23.5880, lng: 58.3829, timezone: "Asia/Muscat" },
  { name: "Manama", country: "Bahrain", lat: 26.2235, lng: 50.5876, timezone: "Asia/Bahrain" },
  { name: "Amman", country: "Jordan", lat: 31.9522, lng: 35.9331, timezone: "Asia/Amman" },
  { name: "Beirut", country: "Lebanon", lat: 33.8938, lng: 35.5018, timezone: "Asia/Beirut" },
  { name: "Damascus", country: "Syria", lat: 33.5138, lng: 36.2765, timezone: "Asia/Damascus" },
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661, timezone: "Asia/Baghdad" },
  { name: "Basra", country: "Iraq", lat: 30.5085, lng: 47.7804, timezone: "Asia/Baghdad" },
  { name: "Jerusalem", country: "Palestine", lat: 31.7683, lng: 35.2137, timezone: "Asia/Jerusalem" },
  { name: "Gaza", country: "Palestine", lat: 31.5017, lng: 34.4668, timezone: "Asia/Gaza" },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890, timezone: "Asia/Tehran" },
  { name: "Isfahan", country: "Iran", lat: 32.6546, lng: 51.6679, timezone: "Asia/Tehran" },
  { name: "Sanaa", country: "Yemen", lat: 15.3694, lng: 44.1910, timezone: "Asia/Aden" },
  { name: "Aden", country: "Yemen", lat: 12.7797, lng: 45.0095, timezone: "Asia/Aden" },

  // North Africa
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
  { name: "Alexandria", country: "Egypt", lat: 31.2001, lng: 29.9187, timezone: "Africa/Cairo" },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, timezone: "Africa/Casablanca" },
  { name: "Rabat", country: "Morocco", lat: 34.0209, lng: -6.8416, timezone: "Africa/Casablanca" },
  { name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815, timezone: "Africa/Tunis" },
  { name: "Algiers", country: "Algeria", lat: 36.7372, lng: 3.0865, timezone: "Africa/Algiers" },
  { name: "Tripoli", country: "Libya", lat: 32.8872, lng: 13.1913, timezone: "Africa/Tripoli" },
  { name: "Khartoum", country: "Sudan", lat: 15.5518, lng: 32.5324, timezone: "Africa/Khartoum" },

  // South & Southeast Asia
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011, timezone: "Asia/Karachi" },
  { name: "Lahore", country: "Pakistan", lat: 31.5204, lng: 74.3587, timezone: "Asia/Karachi" },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479, timezone: "Asia/Karachi" },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125, timezone: "Asia/Dhaka" },
  { name: "Chittagong", country: "Bangladesh", lat: 22.3569, lng: 91.7832, timezone: "Asia/Dhaka" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, timezone: "Asia/Kolkata" },
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867, timezone: "Asia/Kolkata" },
  { name: "Lucknow", country: "India", lat: 26.8467, lng: 80.9462, timezone: "Asia/Kolkata" },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, timezone: "Asia/Jakarta" },
  { name: "Surabaya", country: "Indonesia", lat: -7.2575, lng: 112.7521, timezone: "Asia/Jakarta" },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869, timezone: "Asia/Kuala_Lumpur" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore" },
  { name: "Colombo", country: "Sri Lanka", lat: 6.9271, lng: 79.8612, timezone: "Asia/Colombo" },
  { name: "Kabul", country: "Afghanistan", lat: 34.5553, lng: 69.2075, timezone: "Asia/Kabul" },
  { name: "Tashkent", country: "Uzbekistan", lat: 41.2995, lng: 69.2401, timezone: "Asia/Tashkent" },
  { name: "Bishkek", country: "Kyrgyzstan", lat: 42.8746, lng: 74.5698, timezone: "Asia/Bishkek" },
  { name: "Baku", country: "Azerbaijan", lat: 40.4093, lng: 49.8671, timezone: "Asia/Baku" },
  { name: "Almaty", country: "Kazakhstan", lat: 43.2220, lng: 76.8512, timezone: "Asia/Almaty" },

  // Sub-Saharan Africa
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, timezone: "Africa/Lagos" },
  { name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, timezone: "Africa/Lagos" },
  { name: "Dakar", country: "Senegal", lat: 14.7167, lng: -17.4677, timezone: "Africa/Dakar" },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7428, timezone: "Africa/Addis_Ababa" },
  { name: "Kampala", country: "Uganda", lat: 0.3476, lng: 32.5825, timezone: "Africa/Kampala" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, timezone: "Africa/Nairobi" },

  // Europe
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul" },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597, timezone: "Europe/Istanbul" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
  { name: "Birmingham", country: "UK", lat: 52.4862, lng: -1.8904, timezone: "Europe/London" },
  { name: "Manchester", country: "UK", lat: 53.4808, lng: -2.2426, timezone: "Europe/London" },
  { name: "Bradford", country: "UK", lat: 53.7960, lng: -1.7594, timezone: "Europe/London" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  { name: "Marseille", country: "France", lat: 43.2965, lng: 5.3698, timezone: "Europe/Paris" },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, timezone: "Europe/Berlin" },
  { name: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821, timezone: "Europe/Berlin" },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam" },
  { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517, timezone: "Europe/Brussels" },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, timezone: "Europe/Stockholm" },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, timezone: "Europe/Copenhagen" },
  { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, timezone: "Europe/Oslo" },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, timezone: "Europe/Moscow" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome" },
  { name: "Milan", country: "Italy", lat: 45.4654, lng: 9.1859, timezone: "Europe/Rome" },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid" },
  { name: "Sarajevo", country: "Bosnia", lat: 43.8563, lng: 18.4131, timezone: "Europe/Sarajevo" },

  // North America
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060, timezone: "America/New_York" },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, timezone: "America/Chicago" },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles" },
  { name: "Houston", country: "USA", lat: 29.7604, lng: -95.3698, timezone: "America/Chicago" },
  { name: "Dallas", country: "USA", lat: 32.7767, lng: -96.7970, timezone: "America/Chicago" },
  { name: "Washington DC", country: "USA", lat: 38.9072, lng: -77.0369, timezone: "America/New_York" },
  { name: "Detroit", country: "USA", lat: 42.3314, lng: -83.0458, timezone: "America/Detroit" },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
  { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673, timezone: "America/Toronto" },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver" },

  // Oceania
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney" },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, timezone: "Australia/Melbourne" },
  { name: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251, timezone: "Australia/Brisbane" },
  { name: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645, timezone: "Pacific/Auckland" },
];

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return CITIES;
  return CITIES.filter(
    c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
}

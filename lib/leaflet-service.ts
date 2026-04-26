export interface DeliveryCost {
  cost: number;
  distance: number; // in km
  duration: string; // formatted duration
  durationMinutes: number; // in minutes
  breakdown: {
    baseCost: number;
    distanceCost: number;
    volumeSurcharge: number;
    vehicleType: 'motor' | 'car';
    surcharge?: number;
  };
  locationType: 'standard' | 'camping' | 'outdoor' | 'remote' | 'emergency';
  specialNotes?: string;
}

export interface DeliveryInstructions {
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  specialInstructions?: string;
  deliveryTime?: 'flexible' | 'morning' | 'afternoon' | 'evening';
  accessibilityNotes?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Base location: Cihanjuang (Bandung)
const BASE_LOCATION = {
  lat: -6.826438,
  lng: 107.574937
};

// Static distance table from Cihanjuang basecamp to Bandung Raya districts (in km)
// These are accurate real-world distances based on actual road routes
const STATIC_DISTANCES: Record<string, number> = {
  // Cihanjuang area (basecamp)
  'cihanjuang': 0.0,
  'parongpong': 3.2,
  'cisarua': 5.8,
  'ngamprah': 4.5,
  
  // Cimahi area
  'cimahi': 4.5,
  'cimahi selatan': 5.2,
  'cimahi tengah': 4.8,
  'cimahi utara': 4.2,
  
  // Bandung Kota districts
  'cicendo': 8.5,
  'coblong': 9.2,
  'cidadap': 10.5,
  'sukasari': 8.8,
  'regol': 9.5,
  'andir': 8.2,
  'kih': 8.7,
  'babakan ciparay': 7.8,
  'tegallega': 9.0,
  'margacinta': 10.2,
  'buahbatu': 12.5,
  'arcamanik': 13.8,
  'ujungberung': 14.2,
  
  // Bandung Barat districts
  'padalarang': 7.5,
  'lembang': 8.8,
  'cileunyi': 15.5,
  'cicalengka': 22.3,
  'margaasih': 6.8,
  'katapang': 12.8,
  'soreang': 13.5,
  
  // Bandung city center (fallback)
  'bandung': 9.0,
  'bandung kota': 9.0,
  'bandung raya': 10.0,
  
  // Other nearby areas
  'sumedang': 28.5,
  'garut': 35.2,
  'tasikmalaya': 52.8,
  'cianjur': 42.5,
};

// Delivery configuration
const DELIVERY_CONFIG = {
  // Motor pricing (default)
  baseCost: 10000, // Rp 10.000 (reduced for under 7km)
  costPerKm: 4000, // Rp 4.000 per km (above 7km)
  flatRadius: 7, // 7 km flat rate (no per-km cost under 7km)
  maxDistance: 35, // 35 km (Bandung Raya area + buffer)
  maxCost: 100000, // Rp 100.000 max
  
  // Car pricing (for large packages)
  carBaseCost: 50000, // Rp 50.000
  carCostPerKm: 6000, // Rp 6.000 per km
  
  // Volume surcharge
  volumeSurchargeThreshold: 20, // Weight score threshold
  volumeSurchargeAmount: 10000, // Rp 10.000 for overload
  carThreshold: 50, // Weight score threshold for car
};

// Geofencing configuration - Bandung Raya area
const GEOFENCING_CONFIG = {
  enabled: true,
  maxRadiusKm: 35, // 35km radius from Cihanjuang (matching delivery max distance)
  allowedCities: [
    'bandung', 'kota bandung', 'kabupaten bandung', 'kbb', 
    'cimahi', 'cihanjuang', 'lembang', 'padalarang',
    'sumedang', 'garut', 'tasikmalaya', 'cianjur'
  ],
  allowedDistricts: [
    'cicendo', 'coblong', 'cidadap', 'sukasari', 'regol',
    'andir', 'kih', 'babakan ciparay', 'tegallega',
    'margacinta', 'buahbatu', 'arcamanik', 'ujungberung'
  ]
};

// Special location configurations
const SPECIAL_LOCATIONS = [
  {
    type: 'camping' as const,
    name: 'Camping Area',
    surcharge: 25, // +25%
    icon: '🏕️',
    maxDistanceMultiplier: 1.5
  },
  {
    type: 'outdoor' as const,
    name: 'Outdoor Event',
    surcharge: 20, // +20%
    icon: '🎪',
    maxDistanceMultiplier: 1.3
  },
  {
    type: 'remote' as const,
    name: 'Remote Area',
    surcharge: 35, // +35%
    icon: '🏔️',
    maxDistanceMultiplier: 1.5
  },
  {
    type: 'emergency' as const,
    name: 'Emergency Delivery',
    surcharge: 50, // +50%
    icon: '🚨',
    maxDistanceMultiplier: 2.0
  }
];

// Keywords for detecting special locations
const LOCATION_KEYWORDS = {
  camping: ['camping', 'tend', 'alam terbuka', 'gunung', 'hutan', 'pantai', 'curug', 'waterfall'],
  outdoor: ['event', 'festival', 'gathering', 'acara', 'konser', 'pameran'],
  remote: ['terpencil', 'jauh', 'pedalaman', 'desa', 'pegunungan', 'terpencil'],
  emergency: ['darurat', 'emergency', 'urgent', 'cepat', 'mendesak', 'segera']
};

export class LeafletService {
  private baseLocation = BASE_LOCATION;

  // Calculate distance using Google Maps Distance Matrix API (more accurate)
  async calculateDistance(
    destinationLat: number,
    destinationLng: number
  ): Promise<{ distance: number; duration: number }> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found, falling back to OSRM');
        return this.calculateOSRMDistance(destinationLat, destinationLng);
      }

      const origin = `${this.baseLocation.lat},${this.baseLocation.lng}`;
      const destination = `${destinationLat},${destinationLng}`;
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&units=metric&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
        throw new Error('Google Maps Distance Matrix failed');
      }

      const element = data.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }

      const distanceMeters = element.distance.value;
      const durationSeconds = element.duration.value;

      return {
        distance: distanceMeters / 1000, // Convert to km
        duration: durationSeconds / 60 // Convert to minutes
      };
    } catch (error) {
      console.error('Google Maps API error:', error);
      // Fallback to OSRM
      return this.calculateOSRMDistance(destinationLat, destinationLng);
    }
  }

  // Fallback: OSRM distance calculation
  private async calculateOSRMDistance(
    destinationLat: number,
    destinationLng: number
  ): Promise<{ distance: number; duration: number }> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${this.baseLocation.lng},${this.baseLocation.lat};${destinationLng},${destinationLat}?overview=false`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('OSRM routing failed');
      }

      const route = data.routes[0];
      const distanceMeters = route.distance;
      const durationSeconds = route.duration;

      // Apply correction factor to match Google Maps accuracy (~1.15x)
      const correctedDistance = distanceMeters * 1.15;

      return {
        distance: correctedDistance / 1000, // Convert to km
        duration: durationSeconds / 60 // Convert to minutes
      };
    } catch (error) {
      console.error('OSRM API error:', error);
      // Final fallback to Haversine formula
      return this.calculateHaversineDistance(destinationLat, destinationLng);
    }
  }

  // Fallback: Haversine formula for straight-line distance
  private calculateHaversineDistance(
    destinationLat: number,
    destinationLng: number
  ): { distance: number; duration: number } {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destinationLat - this.baseLocation.lat);
    const dLng = this.toRad(destinationLng - this.baseLocation.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.baseLocation.lat)) * Math.cos(this.toRad(destinationLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Estimate duration (assuming 30 km/h average speed in urban areas)
    const duration = (distance / 30) * 60; // minutes
    
    return { distance, duration };
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get static distance from table (most accurate for known locations)
  private getStaticDistance(address: string): number | null {
    const lowerAddress = address.toLowerCase();
    
    // Check for district/kecamatan name in address
    for (const [location, distance] of Object.entries(STATIC_DISTANCES)) {
      if (lowerAddress.includes(location)) {
        console.log(`Using static distance for ${location}: ${distance}km`);
        return distance;
      }
    }
    
    return null;
  }

  // Detect special location type from address and instructions
  detectSpecialLocation(
    address: string,
    instructions?: DeliveryInstructions
  ): { type: 'standard' | 'camping' | 'outdoor' | 'remote' | 'emergency'; notes?: string } {
    const combinedText = `${address} ${instructions?.specialInstructions || ''} ${instructions?.accessibilityNotes || ''}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(LOCATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          const specialLocation = SPECIAL_LOCATIONS.find(loc => loc.type === type);
          return {
            type: specialLocation?.type || 'standard',
            notes: specialLocation?.name
          };
        }
      }
    }
    
    return { type: 'standard' };
  }

  // Validate GPS coordinates
  validateGPSCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Check if address is within delivery zone (geofencing)
  isWithinDeliveryZone(address: string, distance: number): { allowed: boolean; reason?: string } {
    if (!GEOFENCING_CONFIG.enabled) {
      return { allowed: true };
    }

    // Check distance limit
    if (distance > GEOFENCING_CONFIG.maxRadiusKm) {
      return {
        allowed: false,
        reason: `Lokasi di luar jangkauan pengantaran (${distance.toFixed(1)}km). Maksimal ${GEOFENCING_CONFIG.maxRadiusKm}km dari Basecamp Cihanjuang.`
      };
    }

    // Check if address contains allowed city names
    const lowerAddress = address.toLowerCase();
    const hasAllowedCity = GEOFENCING_CONFIG.allowedCities.some(city => 
      lowerAddress.includes(city)
    );

    if (!hasAllowedCity) {
      return {
        allowed: false,
        reason: `Lokasi tidak dalam area layanan. Saat ini kami hanya melayani area Bandung Raya (Bandung, Cimahi, KBB, Lembang, Padalarang).`
      };
    }

    return { allowed: true };
  }

  // Parse GPS coordinates from string
  parseGPSCoordinates(coordString: string): { lat: number; lng: number } | null {
    const regex = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = coordString.match(regex);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (this.validateGPSCoordinates(lat, lng)) {
        return { lat, lng };
      }
    }
    
    return null;
  }

  // Format cost to Indonesian Rupiah
  formatCost(cost: number): string {
    return `Rp${cost.toLocaleString('id-ID')}`;
  }

  // Format duration to human-readable string
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} menit`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
    }
  }

  // Calculate delivery cost
  async calculateDeliveryCost(
    address: string, 
    instructions?: DeliveryInstructions,
    weightScore: number = 0
  ): Promise<DeliveryCost> {
    try {
      // Detect special location
      const { type: locationType, notes } = this.detectSpecialLocation(address, instructions);
      const specialLocation = SPECIAL_LOCATIONS.find(loc => loc.type === locationType);
      
      // Try static distance table first (most accurate for known locations)
      const staticDistance = this.getStaticDistance(address);
      let distance: number;
      let duration: number;
      
      if (staticDistance !== null) {
        // Use static distance from table
        distance = staticDistance;
        duration = (distance / 30) * 60; // Estimate duration (30 km/h average)
        console.log(`Using static distance: ${distance}km`);
      } else {
        // Get destination coordinates for dynamic calculation
        let destinationLat: number;
        let destinationLng: number;
        
        if (instructions?.gpsCoordinates?.latitude && instructions?.gpsCoordinates?.longitude) {
          destinationLat = instructions.gpsCoordinates.latitude;
          destinationLng = instructions.gpsCoordinates.longitude;
        } else {
          // Geocode address using Nominatim (OpenStreetMap)
          const coords = await this.geocodeAddress(address);
          destinationLat = coords.lat;
          destinationLng = coords.lng;
        }
        
        // Calculate distance using OSRM
        const result = await this.calculateDistance(destinationLat, destinationLng);
        distance = result.distance;
        duration = result.duration;
      }
      
      // Check geofencing - is address within delivery zone?
      const zoneCheck = this.isWithinDeliveryZone(address, distance);
      if (!zoneCheck.allowed) {
        throw new Error(zoneCheck.reason || 'Lokasi di luar area layanan');
      }
      
      // Calculate max distance based on location type
      const maxDistance = specialLocation 
        ? DELIVERY_CONFIG.maxDistance * specialLocation.maxDistanceMultiplier
        : DELIVERY_CONFIG.maxDistance;
      
      // Check if location is within service area (double check with max distance)
      if (distance > maxDistance) {
        throw new Error(`Lokasi di luar jangkauan pengantaran (${maxDistance} km untuk ${specialLocation?.name || 'lokasi standar'})`);
      }
      
      // Determine vehicle type based on weight score
      const vehicleType: 'motor' | 'car' = weightScore > DELIVERY_CONFIG.carThreshold ? 'car' : 'motor';
      
      // Calculate base cost and distance cost based on vehicle type
      let baseCost = vehicleType === 'car' ? DELIVERY_CONFIG.carBaseCost : DELIVERY_CONFIG.baseCost;
      let distanceCost: number;
      
      if (distance <= DELIVERY_CONFIG.flatRadius) {
        // Flat rate for first 5km
        distanceCost = 0;
      } else {
        // Additional cost per km above 5km
        const extraDistance = distance - DELIVERY_CONFIG.flatRadius;
        const costPerKm = vehicleType === 'car' ? DELIVERY_CONFIG.carCostPerKm : DELIVERY_CONFIG.costPerKm;
        distanceCost = extraDistance * costPerKm;
      }
      
      // Calculate volume surcharge
      let volumeSurcharge = 0;
      if (vehicleType === 'motor' && weightScore >= DELIVERY_CONFIG.volumeSurchargeThreshold) {
        volumeSurcharge = DELIVERY_CONFIG.volumeSurchargeAmount;
      }
      
      // Apply special location surcharge (if any)
      let specialSurcharge = 0;
      if (specialLocation) {
        const totalBeforeSurcharge = baseCost + distanceCost + volumeSurcharge;
        specialSurcharge = Math.round(totalBeforeSurcharge * (specialLocation.surcharge / 100));
      }
      
      // Calculate total cost
      let totalCost = baseCost + distanceCost + volumeSurcharge + specialSurcharge;
      
      // Apply max cost limit
      if (specialLocation?.type === 'emergency') {
        totalCost = Math.min(totalCost, DELIVERY_CONFIG.maxCost * 2);
      } else {
        totalCost = Math.min(totalCost, DELIVERY_CONFIG.maxCost);
      }
      
      return {
        cost: totalCost,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        duration: this.formatDuration(duration),
        durationMinutes: Math.round(duration),
        breakdown: {
          baseCost,
          distanceCost: Math.round(distanceCost),
          volumeSurcharge,
          vehicleType
        },
        locationType,
        specialNotes: notes
      };
    } catch (error) {
      console.error('Delivery cost calculation error:', error);
      throw error;
    }
  }

  // Geocode address using Nominatim (OpenStreetMap) with fallback
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    // First, try to use approximate coordinates for known districts (faster and more reliable)
    const approximateCoords = this.getApproximateCoordinates(address);
    const lowerAddress = address.toLowerCase();
    
    // Check if address contains known district names
    const knownDistricts = ['cicendo', 'coblong', 'cidadap', 'sukasari', 'regol', 'andir', 'kih', 
      'babakan ciparay', 'tegallega', 'margacinta', 'buahbatu', 'arcamanik', 'ujungberung',
      'padalarang', 'cimahi', 'cihanjuang', 'lembang', 'cileunyi', 'cicalengka', 'margaasih',
      'katapang', 'soreang', 'ngamprah', 'parongpong', 'cisarua', 'bandung', 'bandung raya'];
    
    const hasKnownDistrict = knownDistricts.some(district => lowerAddress.includes(district));
    
    if (hasKnownDistrict) {
      console.log('Using approximate coordinates for known district');
      return approximateCoords;
    }
    
    // If not a known district, try external geocoding APIs
    try {
      // Try Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=id`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'HabemaOutdoor/1.0' // Required by Nominatim
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      // Fallback: Try BigDataCloud (free, no API key needed)
      const bigDataCloudUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=id&key=${encodeURIComponent(address)}`;
      
      try {
        const fallbackResponse = await fetch(bigDataCloudUrl);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.latitude && fallbackData.longitude) {
          return {
            lat: fallbackData.latitude,
            lng: fallbackData.longitude
          };
        }
      } catch (fallbackError) {
        console.error('BigDataCloud fallback failed:', fallbackError);
      }
      
      // If all geocoding fails, use approximate coordinates
      return approximateCoords;
      
    } catch (error) {
      console.error('Geocoding error:', error);
      // Final fallback: return approximate coordinates
      return approximateCoords;
    }
  }

  // Get approximate coordinates based on address keywords (Indonesia-specific)
  private getApproximateCoordinates(address: string): { lat: number; lng: number } {
    const lowerAddress = address.toLowerCase();
    
    // Bandung Raya districts/kecamatan coordinates (more specific than city center)
    const districtCoordinates: Record<string, { lat: number; lng: number }> = {
      // Bandung Kota districts
      'cicendo': { lat: -6.8967, lng: 107.5808 },
      'coblong': { lat: -6.8994, lng: 107.6089 },
      'cidadap': { lat: -6.8681, lng: 107.6156 },
      'sukasari': { lat: -6.9039, lng: 107.6106 },
      'regol': { lat: -6.9239, lng: 107.5936 },
      'andir': { lat: -6.9289, lng: 107.5983 },
      'kih': { lat: -6.9156, lng: 107.6056 },
      'babakan ciparay': { lat: -6.9356, lng: 107.5861 },
      'tegallega': { lat: -6.9217, lng: 107.6036 },
      'margacinta': { lat: -6.9456, lng: 107.6317 },
      'buahbatu': { lat: -6.9672, lng: 107.6372 },
      'arcamanik': { lat: -6.9428, lng: 107.6569 },
      'ujungberung': { lat: -6.9189, lng: 107.6792 },
      
      // Bandung Barat districts
      'padalarang': { lat: -6.8489, lng: 107.5189 },
      'cimahi': { lat: -6.8737, lng: 107.5608 },
      'cihanjuang': { lat: -6.8264, lng: 107.5749 }, // Base location
      'lembang': { lat: -6.8219, lng: 107.6162 },
      'cileunyi': { lat: -6.9239, lng: 107.7242 },
      'cicalengka': { lat: -7.0689, lng: 107.7736 },
      'margaasih': { lat: -6.9317, lng: 107.5456 },
      'katapang': { lat: -7.0328, lng: 107.5881 },
      'soreang': { lat: -7.0239, lng: 107.5419 },
      'ngamprah': { lat: -6.8689, lng: 107.5036 },
      'parongpong': { lat: -6.7956, lng: 107.5439 },
      'cisarua': { lat: -6.7339, lng: 107.5256 },
      
      // Major cities (fallback)
      'bandung': { lat: -6.9175, lng: 107.6191 },
      'bandung raya': { lat: -6.7339, lng: 107.6162 }, // Bandung Barat district
      'jakarta': { lat: -6.2088, lng: 106.8456 },
      'surabaya': { lat: -7.2575, lng: 112.7521 },
      'yogyakarta': { lat: -7.7956, lng: 110.3695 },
      'semarang': { lat: -6.9667, lng: 110.4167 },
      'medan': { lat: 3.5952, lng: 98.6722 },
      'denpasar': { lat: -8.6705, lng: 115.2126 },
      'makassar': { lat: -5.1477, lng: 119.4328 },
      'bogor': { lat: -6.5944, lng: 106.7892 },
      'depok': { lat: -6.4025, lng: 106.8194 },
      'tangerang': { lat: -6.1783, lng: 106.6319 },
      'bekasi': { lat: -6.2349, lng: 106.9750 },
      'cianjur': { lat: -6.7326, lng: 107.0426 },
    };
    
    // Check for district name first (more specific)
    for (const [district, coords] of Object.entries(districtCoordinates)) {
      if (lowerAddress.includes(district)) {
        console.log(`Using coordinates for district: ${district}`);
        return coords;
      }
    }
    
    // Default to Cihanjuang (base location) if no location found
    console.log('Using default coordinates (Cihanjuang basecamp)');
    return { lat: -6.8264, lng: 107.5749 };
  }
}

// Export singleton instance
export const leafletService = new LeafletService();

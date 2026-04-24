// Google Maps Distance Matrix Service
// Untuk menghitung jarak dan biaya pengantaran

export interface DistanceResult {
  distance: {
    text: string; // "12.5 km"
    value: number; // 12500 (meters)
  };
  duration: {
    text: string; // "18 mins"
    value: number; // 1080 (seconds)
  };
  status: string; // "OK", "ZERO_RESULTS", etc.
}

export interface DeliveryCost {
  distance: number; // in km
  duration: string; // formatted duration
  cost: number; // delivery cost in Rupiah
  breakdown: {
    baseCost: number;
    distanceCost: number;
    totalCost: number;
  };
  locationType?: 'standard' | 'camping' | 'outdoor' | 'remote' | 'emergency';
  specialNotes?: string;
}

export interface SpecialLocation {
  type: 'camping' | 'outdoor' | 'remote' | 'emergency';
  name: string;
  description: string;
  surcharge: number; // Additional cost percentage
  requirements: string[];
  icon: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface DeliveryInstructions {
  specialLocation?: SpecialLocation;
  emergencyContact?: EmergencyContact;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  specialInstructions?: string;
  deliveryTime?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  accessibilityNotes?: string;
}

// Konfigurasi biaya pengantaran
const DELIVERY_CONFIG = {
  baseCost: 15000, // Biaya dasar Rp 15.000
  costPerKm: 2000, // Rp 2.000 per km
  maxDistance: 50, // Maksimal 50 km
  minCost: 15000, // Biaya minimum
  maxCost: 100000, // Biaya maksimal
};

// Konfigurasi lokasi khusus
const SPECIAL_LOCATIONS: SpecialLocation[] = [
  {
    type: 'camping',
    name: 'Camping Area',
    description: 'Area camping, tenda, atau alam terbuka',
    surcharge: 25, // 25% tambahan biaya
    requirements: [
      'Akses kendaraan 4x4 mungkin diperlukan',
      'Koordinat GPS wajib disediakan',
      'Informasi cuaca dan medan',
      'Kontak darurat lokal'
    ],
    icon: '🏕️'
  },
  {
    type: 'outdoor',
    name: 'Outdoor Event',
    description: 'Acara outdoor, festival, atau gathering',
    surcharge: 20, // 20% tambahan biaya
    requirements: [
      'Izin lokasi event',
      'Jam akses khusus',
      'Titik meeting point yang jelas',
      'Kontak panitia acara'
    ],
    icon: '🎪'
  },
  {
    type: 'remote',
    name: 'Remote Area',
    description: 'Area terpencil atau sulit dijangkau',
    surcharge: 35, // 35% tambahan biaya
    requirements: [
      'Koordinat GPS akurat',
      'Kondisi jalan dan akses',
      'Kontak lokal yang bisa dihubungi',
      'Waktu tambahan untuk perjalanan'
    ],
    icon: '🏔️'
  },
  {
    type: 'emergency',
    name: 'Emergency Delivery',
    description: 'Pengantaran darurat atau mendesak',
    surcharge: 50, // 50% tambahan biaya
    requirements: [
      'Alasan darurat jelas',
      'Kontak darurat 24 jam',
      'Prioritas pengantaran',
      'Biaya tambahan untuk kecepatan'
    ],
    icon: '🚨'
  }
];

// Keywords untuk mendeteksi lokasi khusus
const LOCATION_KEYWORDS = {
  camping: ['camping', 'tend', 'alam terbuka', 'gunung', 'hutan', 'pantai', 'kemah'],
  outdoor: ['event', 'festival', 'gathering', 'outdoor', 'acara', 'konser', 'lomba'],
  remote: ['terpencil', 'jauh', 'pedalaman', 'desa', 'pegunungan', 'pulau'],
  emergency: ['darurat', 'emergency', 'urgent', 'cepat', 'segera', 'mendesak']
};

// Lokasi base rental (bisa diubah sesuai lokasi bisnis)
const BASE_LOCATION = {
  address: "Jakarta, Indonesia",
  // Koordinat Jakarta (bisa disesuaikan dengan lokasi rental yang sebenarnya)
  lat: -6.826438,
  lng: 107.574937
};

class GoogleMapsService {
  private apiKey: string;
  private isLoaded: boolean = false;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not found in environment variables');
    }
  }

  // Load Google Maps API script
  loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve();
        return;
      }

      if (!this.apiKey) {
        reject(new Error('Google Maps API key is required'));
        return;
      }

      // Check if script already exists
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=initGoogleMaps`;

      // Global callback function
      (window as any).initGoogleMaps = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    await this.loadGoogleMapsScript();

    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // Calculate distance between two addresses
  async calculateDistance(
    origin: string,
    destination: string
  ): Promise<DistanceResult> {
    await this.loadGoogleMapsScript();

    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result && result.rows && result.rows[0]) {
            const element = result.rows[0].elements[0];
            if (element.status === 'OK') {
              resolve({
                distance: element.distance!,
                duration: element.duration!,
                status: element.status
              });
            } else {
              reject(new Error(`Distance calculation failed: ${element.status}`));
            }
          } else {
            reject(new Error(`Distance Matrix failed: ${status}`));
          }
        }
      );
    });
  }

  // Calculate delivery cost based on distance
  async calculateDeliveryCost(
    destinationAddress: string,
    instructions?: DeliveryInstructions,
    originAddress?: string
  ): Promise<DeliveryCost> {
    try {
      const origin = originAddress || BASE_LOCATION.address;
      
      // Detect special location
      const specialLocation = this.detectSpecialLocation(destinationAddress, instructions);
      
      // Use GPS coordinates if provided
      let destination = destinationAddress;
      if (instructions?.gpsCoordinates) {
        const { latitude, longitude } = instructions.gpsCoordinates;
        if (this.validateGPSCoordinates(latitude, longitude)) {
          destination = `${latitude},${longitude}`;
        }
      }

      const distanceResult = await this.calculateDistance(origin, destination);

      if (distanceResult.status !== 'OK') {
        throw new Error('Unable to calculate distance');
      }

      const distanceKm = distanceResult.distance.value / 1000; // Convert meters to km

      // Extended service area for special locations
      const maxDistance = specialLocation 
        ? DELIVERY_CONFIG.maxDistance * 1.5  // 50% extra for special locations
        : DELIVERY_CONFIG.maxDistance;

      if (distanceKm > maxDistance) {
        throw new Error(`Delivery not available for distances over ${maxDistance}km${specialLocation ? ' (extended for special location)' : ''}`);
      }

      // Calculate base cost
      const distanceCost = Math.round(distanceKm * DELIVERY_CONFIG.costPerKm);
      let totalCost = Math.max(
        DELIVERY_CONFIG.minCost,
        Math.min(
          DELIVERY_CONFIG.baseCost + distanceCost,
          DELIVERY_CONFIG.maxCost
        )
      );

      // Apply special location surcharge
      let specialNotes = '';
      if (specialLocation) {
        const surchargeAmount = Math.round(totalCost * (specialLocation.surcharge / 100));
        totalCost += surchargeAmount;
        specialNotes = `${specialLocation.name} - ${specialLocation.description}`;
      }

      // Emergency delivery surcharge
      if (specialLocation?.type === 'emergency') {
        totalCost = Math.min(totalCost * 1.5, DELIVERY_CONFIG.maxCost * 2); // Max 2x normal cost
      }

      return {
        distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal place
        duration: distanceResult.duration.text,
        cost: totalCost,
        locationType: specialLocation?.type || 'standard',
        specialNotes,
        breakdown: {
          baseCost: DELIVERY_CONFIG.baseCost,
          distanceCost: distanceCost,
          totalCost: totalCost
        }
      };

    } catch (error) {
      console.error('Error calculating delivery cost:', error);
      throw error;
    }
  }

  // Detect special location type from address
  detectSpecialLocation(address: string, instructions?: DeliveryInstructions): SpecialLocation | null {
    const lowerAddress = address.toLowerCase();
    const lowerInstructions = instructions?.specialInstructions?.toLowerCase() || '';
    
    // Check keywords in address and instructions
    for (const [type, keywords] of Object.entries(LOCATION_KEYWORDS)) {
      const hasKeyword = keywords.some(keyword => 
        lowerAddress.includes(keyword) || lowerInstructions.includes(keyword)
      );
      
      if (hasKeyword) {
        return SPECIAL_LOCATIONS.find(loc => loc.type === type) || null;
      }
    }
    
    return null;
  }

  // Validate GPS coordinates
  validateGPSCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Parse GPS coordinates from string
  parseGPSCoordinates(coordString: string): { lat: number; lng: number } | null {
    // Support formats: "-6.826438,107.574937" or " -6.826438, 107.574937"
    const regex = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = coordString.trim().match(regex);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (this.validateGPSCoordinates(lat, lng)) {
        return { lat, lng };
      }
    }
    
    return null;
  }

  // Validate address format
  validateAddress(address: string): boolean {
    // For special locations, allow shorter addresses
    const hasSpecialKeywords = Object.values(LOCATION_KEYWORDS).flat()
      .some(keyword => address.toLowerCase().includes(keyword));
    
    if (hasSpecialKeywords) {
      return address.length >= 5; // Minimum length for special locations
    }
    
    // Standard address validation
    const minLength = 10;
    const hasStreetNumber = /\d+/.test(address);
    const hasStreetName = /[a-zA-Z]/.test(address);

    return address.length >= minLength && hasStreetNumber && hasStreetName;
  }

  // Format cost to Indonesian Rupiah
  formatCost(cost: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cost);
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
}

export default googleMapsService;

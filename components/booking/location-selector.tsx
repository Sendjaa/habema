"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { indonesiaRegionsService, LocationData, Province, Regency, District, Village } from "@/lib/indonesia-regions";
import { leafletService } from "@/lib/leaflet-service";

interface LocationSelectorProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const BASE_CAMP = {
  lat: -6.826438,
  lng: 107.574937,
  name: "Basecamp Cihanjuang"
};

export function LocationSelector({ onLocationChange, initialLocation }: LocationSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(initialLocation?.province || null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(initialLocation?.regency || null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(initialLocation?.district || null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(initialLocation?.village || null);
  
  const [distance, setDistance] = useState<number | null>(initialLocation?.distance || null);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(initialLocation?.deliveryCost || null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadRegencies(selectedProvince.id);
    } else {
      setRegencies([]);
      setSelectedRegency(null);
      setSelectedDistrict(null);
      setSelectedVillage(null);
    }
  }, [selectedProvince]);

  // Load districts when regency changes
  useEffect(() => {
    if (selectedRegency) {
      loadDistricts(selectedRegency.id);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setSelectedVillage(null);
    }
  }, [selectedRegency]);

  // Load villages when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadVillages(selectedDistrict.id);
      calculateDeliveryCost();
    } else {
      setVillages([]);
      setSelectedVillage(null);
      setDistance(null);
      setDeliveryCost(null);
    }
  }, [selectedDistrict]);

  // Notify parent of location changes
  useEffect(() => {
    const fullAddress = indonesiaRegionsService.formatFullAddress({
      province: selectedProvince,
      regency: selectedRegency,
      district: selectedDistrict,
      village: selectedVillage,
      fullAddress: ''
    });
    
    const locationData: LocationData = {
      province: selectedProvince,
      regency: selectedRegency,
      district: selectedDistrict,
      village: selectedVillage,
      fullAddress,
      distance: distance || undefined,
      deliveryCost: deliveryCost || undefined
    };
    onLocationChange(locationData);
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, distance, deliveryCost]);

  const loadProvinces = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await indonesiaRegionsService.getProvinces();
      setProvinces(data);
      
      // Auto-select Jawa Barat
      const jabar = data.find(p => p.id === '32');
      if (jabar) {
        setSelectedProvince(jabar);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRegencies = async (provinceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await indonesiaRegionsService.getRegencies(provinceId);
      setRegencies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (regencyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await indonesiaRegionsService.getDistricts(regencyId);
      setDistricts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVillages = async (districtId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await indonesiaRegionsService.getVillages(districtId);
      setVillages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeliveryCost = async () => {
    if (!selectedDistrict || !selectedRegency) return;
    
    setCalculatingDelivery(true);
    setError(null);
    
    try {
      // Build address for geocoding
      const address = `${selectedDistrict.name}, ${selectedRegency.name}, ${selectedProvince?.name}`;
      
      // Calculate delivery cost using leaflet service
      const cost = await leafletService.calculateDeliveryCost(address);
      
      setDistance(cost.distance);
      setDeliveryCost(cost.cost);
    } catch (err: any) {
      setError(err.message);
      setDistance(null);
      setDeliveryCost(null);
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const formatCost = (cost: number) => {
    return `Rp${cost.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-4">
      {/* Province Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Provinsi</label>
        <Select
          value={selectedProvince?.id || ""}
          onValueChange={(value) => {
            const province = provinces.find(p => p.id === value);
            setSelectedProvince(province || null);
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih provinsi" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Regency Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Kabupaten/Kota</label>
        <Select
          value={selectedRegency?.id || ""}
          onValueChange={(value) => {
            const regency = regencies.find(r => r.id === value);
            setSelectedRegency(regency || null);
          }}
          disabled={!selectedProvince || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kabupaten/kota" />
          </SelectTrigger>
          <SelectContent>
            {regencies.length === 0 && selectedProvince ? (
              <div className="px-2 py-1 text-sm text-slate-500">
                Hanya melayani area Bandung Raya
              </div>
            ) : (
              regencies.map((regency) => (
                <SelectItem key={regency.id} value={regency.id}>
                  {regency.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedProvince && regencies.length === 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Hanya melayani area Bandung Raya (Kota Bandung, KBB, Kab. Bandung, Cimahi)
          </p>
        )}
      </div>

      {/* District Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Kecamatan</label>
        <Select
          value={selectedDistrict?.id || ""}
          onValueChange={(value) => {
            const district = districts.find(d => d.id === value);
            setSelectedDistrict(district || null);
          }}
          disabled={!selectedRegency || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Village Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Desa/Kelurahan</label>
        <Select
          value={selectedVillage?.id || ""}
          onValueChange={(value) => {
            const village = villages.find(v => v.id === value);
            setSelectedVillage(village || null);
          }}
          disabled={!selectedDistrict || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih desa/kelurahan" />
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Cost Info */}
      {selectedDistrict && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {calculatingDelivery ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghitung biaya pengantaran...</span>
                </div>
              ) : error ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error.includes('di luar jangkauan') ? 'Lokasi di Luar Area Layanan' : 'Gagal menghitung biaya'}
                  </p>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              ) : distance && deliveryCost ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Lokasi dalam area layanan</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-emerald-600 opacity-75">Jarak</p>
                      <p className="font-semibold text-emerald-800">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-emerald-600 opacity-75">Biaya Pengantaran</p>
                      <p className="font-semibold text-emerald-800">{formatCost(deliveryCost)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      )}

      {/* Full Address Preview */}
      {selectedVillage && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600 mb-1">Alamat Lengkap:</p>
          <p className="text-sm font-medium text-slate-800">
            {indonesiaRegionsService.formatFullAddress({
              province: selectedProvince,
              regency: selectedRegency,
              district: selectedDistrict,
              village: selectedVillage,
              fullAddress: ''
            })}
          </p>
        </div>
      )}
    </div>
  );
}

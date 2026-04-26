"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, AlertCircle, CheckCircle, ChevronRight, Info } from "lucide-react";
import { indonesiaRegionsService, LocationData, Regency, District, Village } from "@/lib/indonesia-regions";
import { leafletService } from "@/lib/leaflet-service";
import { useCartStore } from "@/lib/store";

interface LocationPickerProps {
  onLocationChange?: (location: LocationData) => void;
  onDeliveryCostChange?: (deliveryData: any) => void;
}

const BASE_CAMP = {
  lat: -6.826438,
  lng: 107.574937,
  name: "Basecamp Cihanjuang"
};

type TabType = 'kota' | 'kecamatan' | 'desa';

export function LocationPicker({ onLocationChange, onDeliveryCostChange }: LocationPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('kota');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [villageInput, setVillageInput] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [deliveryBreakdown, setDeliveryBreakdown] = useState<any>(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  
  const setLocation = useCartStore((state) => state.setLocation);

  // Load regencies on mount (Bandung Raya only)
  useEffect(() => {
    loadRegencies();
  }, []);

  // Load districts when regency is selected
  useEffect(() => {
    if (selectedRegency) {
      loadDistricts(selectedRegency.id);
      setActiveTab('kecamatan');
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setSelectedVillage(null);
    }
  }, [selectedRegency]);

  // Load villages when district is selected and switch to desa tab
  useEffect(() => {
    if (selectedDistrict) {
      loadVillages(selectedDistrict.id);
      setActiveTab('desa');
    } else {
      setVillages([]);
      setSelectedVillage(null);
    }
  }, [selectedDistrict]);

  // Calculate delivery cost when district is selected (village is optional)
  useEffect(() => {
    if (selectedDistrict && selectedRegency) {
      calculateDeliveryCost();
    }
  }, [selectedDistrict, selectedVillage, villageInput]);

  // Update Zustand store and notify parent
  useEffect(() => {
    const villageName = selectedVillage ? selectedVillage.name : villageInput;
    const fullAddress = indonesiaRegionsService.formatFullAddress({
      province: { id: '32', name: 'Jawa Barat' },
      regency: selectedRegency,
      district: selectedDistrict,
      village: villageName ? { id: '', district_id: '', name: villageName } : null,
      fullAddress: streetAddress
    });
    
    const locationData: LocationData = {
      province: { id: '32', name: 'Jawa Barat' },
      regency: selectedRegency,
      district: selectedDistrict,
      village: villageName ? { id: '', district_id: '', name: villageName } : null,
      fullAddress: `${fullAddress}${streetAddress ? ', ' + streetAddress : ''}`,
      distance: distance || undefined,
      deliveryCost: deliveryCost || undefined
    };
    
    setLocation(locationData);
    onLocationChange?.(locationData);
    onDeliveryCostChange?.({
      cost: deliveryCost,
      distance: distance,
      breakdown: deliveryBreakdown
    });
  }, [selectedRegency, selectedDistrict, selectedVillage, villageInput, streetAddress, distance, deliveryCost, deliveryBreakdown]);

  const loadRegencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await indonesiaRegionsService.getRegencies('32');
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
      // Build more precise address including village if available
      const villageName = selectedVillage ? selectedVillage.name : villageInput;
      const address = villageName 
        ? `${villageName}, ${selectedDistrict.name}, ${selectedRegency.name}, Jawa Barat`
        : `${selectedDistrict.name}, ${selectedRegency.name}, Jawa Barat`;
      
      const totalWeightScore = useCartStore.getState().getTotalWeightScore();
      const cost = await leafletService.calculateDeliveryCost(address, undefined, totalWeightScore);
      
      setDistance(cost.distance);
      setDeliveryCost(cost.cost);
      setDeliveryBreakdown(cost.breakdown);
    } catch (err: any) {
      setError(err.message);
      setDistance(null);
      setDeliveryCost(null);
      setDeliveryBreakdown(null);
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const formatCost = (cost: number) => {
    return `Rp${cost.toLocaleString('id-ID')}`;
  };

  const handleRegencySelect = (regency: Regency) => {
    setSelectedRegency(regency);
    setSearchQuery('');
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setSearchQuery('');
  };

  const handleVillageSelect = (village: Village) => {
    setSelectedVillage(village);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (activeTab === 'desa') {
      setActiveTab('kecamatan');
      setSelectedVillage(null);
    } else if (activeTab === 'kecamatan') {
      setActiveTab('kota');
      setSelectedDistrict(null);
    }
  };

  const filteredRegencies = regencies.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredVillages = villages.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'kota': return filteredRegencies;
      case 'kecamatan': return filteredDistricts;
      case 'desa': return filteredVillages;
      default: return [];
    }
  };

  const renderSelectedItem = () => {
    if (selectedRegency && activeTab === 'kecamatan') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{selectedRegency.name}</span>
          </div>
        </div>
      );
    }
    if (selectedDistrict) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{selectedDistrict.name}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('kota')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'kota'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kota
        </button>
        <button
          onClick={() => setActiveTab('kecamatan')}
          disabled={!selectedRegency}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'kecamatan'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          } ${!selectedRegency ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Kecamatan
        </button>
        <button
          onClick={() => setActiveTab('desa')}
          disabled={!selectedDistrict}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'desa'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          } ${!selectedDistrict ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Desa
        </button>
      </div>

      {/* Selected Item Display */}
      {renderSelectedItem()}

      {/* Search Input */}
      {activeTab !== 'desa' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Cari ${activeTab === 'kota' ? 'kota' : 'kecamatan'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="ml-2 text-sm text-slate-600">Memuat data...</span>
        </div>
      )}

      {/* Location Selector */}
      {!loading && activeTab === 'kota' && (
        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
          {filteredRegencies.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {searchQuery ? 'Tidak ada kota yang cocok' : 'Data tidak tersedia'}
            </div>
          ) : (
            filteredRegencies.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRegencySelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
              >
                <span className="text-sm text-slate-700">{item.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'kecamatan' && (
        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
          {filteredDistricts.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {searchQuery ? 'Tidak ada kecamatan yang cocok' : 'Pilih kota terlebih dahulu'}
            </div>
          ) : (
            filteredDistricts.map((item) => (
              <button
                key={item.id}
                onClick={() => handleDistrictSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between group"
              >
                <span className="text-sm text-slate-700">{item.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            ))
          )}
        </div>
      )}
      {/* Village/Desa Input - Only in Desa tab */}
      {activeTab === 'desa' && selectedDistrict && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Desa/Kelurahan *
          </label>
          <input
            type="text"
            value={villageInput}
            onChange={(e) => setVillageInput(e.target.value)}
            placeholder="Masukkan nama desa/kelurahan"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Street Address Input - Only in Desa tab */}
      {activeTab === 'desa' && selectedDistrict && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Alamat Jalan (No. Rumah, RT/RW) *
          </label>
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Jl. Nama Jalan No. 123, RT/RW"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Delivery Cost Info - Only in Desa tab */}
      {activeTab === 'desa' && selectedDistrict && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {calculatingDelivery ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghitung biaya pengantaran...</span>
                </div>
              ) : error ? (
                error.includes('di luar jangkauan') || error.includes('area layanan') ? null : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Gagal menghitung biaya
                    </p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div> 
                )
              ) : distance && deliveryCost && deliveryBreakdown ? (
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
                  <div className="bg-white/50 rounded-lg p-2 mt-2">
                    <p className="text-xs text-slate-600 mb-1">Rincian Biaya:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Biaya Dasar ({deliveryBreakdown.vehicleType === 'car' ? 'Mobil' : 'Motor'})</span>
                        <span className="font-medium text-slate-800">{formatCost(deliveryBreakdown.baseCost)}</span>
                      </div>
                      {deliveryBreakdown.distanceCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Biaya Jarak ({distance > 5 ? `${(distance - 5).toFixed(1)} km × Rp${deliveryBreakdown.vehicleType === 'car' ? '6.000' : '4.000'}/km` : '0-5 km flat'})</span>
                          <span className="font-medium text-slate-800">{formatCost(deliveryBreakdown.distanceCost)}</span>
                        </div>
                      )}
                      {deliveryBreakdown.volumeSurcharge > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-600">Biaya Volume (Beban Berat)</span>
                          <span className="font-medium text-amber-700">{formatCost(deliveryBreakdown.volumeSurcharge)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {deliveryBreakdown.vehicleType === 'car' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span className="font-medium">Paket Besar - Menggunakan Mobil</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Full Address Preview - Only in Desa tab */}
      {activeTab === 'desa' && selectedDistrict && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600 mb-1">Alamat Lengkap:</p>
          <p className="text-sm font-medium text-slate-800">
            {streetAddress ? streetAddress + ', ' : ''}
            {villageInput ? villageInput + ', ' : ''}
            {selectedDistrict?.name + ', '}
            {selectedRegency?.name + ', '}
            Jawa Barat
          </p>
        </div>
      )}
    </div>
  );
}

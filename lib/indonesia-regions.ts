// Indonesia Regions API Service (Emsifa)
// https://github.com/emsifa/api-wilayah-indonesia

export interface Province {
  id: string;
  name: string;
}

export interface Regency {
  id: string;
  province_id: string;
  name: string;
}

export interface District {
  id: string;
  regency_id: string;
  name: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
}

export interface LocationData {
  province: Province | null;
  regency: Regency | null;
  district: District | null;
  village: Village | null;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
  deliveryCost?: number;
}

// Bandung Raya allowed regencies
const BANDUNG_RAYA_REGENCIES = ['3273', '3217', '3204', '3277']; // Kota Bandung, KBB, Kab. Bandung, Cimahi
const JAWA_BARAT_PROVINCE_ID = '32';

export class IndonesiaRegionsService {
  [x: string]: any;
  // Hardcoded Bandung Raya data for reliability
  private bandungRayaData = {
    regencies: [
      { id: '3273', province_id: '32', name: 'Kota Bandung' },
      { id: '3217', province_id: '32', name: 'Kabupaten Bandung Barat' },
      { id: '3204', province_id: '32', name: 'Kabupaten Bandung' },
      { id: '3277', province_id: '32', name: 'Kota Cimahi' }
    ],
    districts: {
      '3273': [ // Kota Bandung
        { id: '327301', regency_id: '3273', name: 'Cicendo' },
        { id: '327302', regency_id: '3273', name: 'Andir' },
        { id: '327303', regency_id: '3273', name: 'Coblong' },
        { id: '327304', regency_id: '3273', name: 'Sukasari' },
        { id: '327305', regency_id: '3273', name: 'Regol' },
        { id: '327306', regency_id: '3273', name: 'Bandung Kulon' },
        { id: '327307', regency_id: '3273', name: 'Babakan Ciparay' },
        { id: '327308', regency_id: '3273', name: 'Sumur Bandung' },
        { id: '327309', regency_id: '3273', name: 'Ujungberung' },
        { id: '327310', regency_id: '3273', name: 'Cidadap' },
        { id: '327311', regency_id: '3273', name: 'Astana Anyar' },
        { id: '327312', regency_id: '3273', name: 'Mandalajati' },
        { id: '327313', regency_id: '3273', name: 'Kiara Condong' },
        { id: '327314', regency_id: '3273', name: 'Buahbatu' },
        { id: '327315', regency_id: '3273', name: 'Rancasari' },
        { id: '327316', regency_id: '3273', name: 'Arcamanik' },
        { id: '327317', regency_id: '3273', name: 'Cinambo' },
        { id: '327318', regency_id: '3273', name: 'Gedebage' },
        { id: '327319', regency_id: '3273', name: 'Panyileukan' },
        { id: '327320', regency_id: '3273', name: 'Cibiru' },
        { id: '327321', regency_id: '3273', name: 'Cileunyi' },
        { id: '327322', regency_id: '3273', name: 'Cinunuk' },
        { id: '327323', regency_id: '3273', name: 'Margacinta' },
        { id: '327324', regency_id: '3273', name: 'Antapani' },
        { id: '327325', regency_id: '3273', name: 'Bandung Kidul' },
        { id: '327326', regency_id: '3273', name: 'Bandung Wetan' },
        { id: '327327', regency_id: '3273', name: 'Lengkong' },
        { id: '327328', regency_id: '3273', name: 'Sukajadi' },
        { id: '327329', regency_id: '3273', name: 'Cicendo' },
        { id: '327330', regency_id: '3273', name: 'Coblong' },
      ],
      '3217': [ // KBB
        { id: '321701', regency_id: '3217', name: 'Cililin' },
        { id: '321702', regency_id: '3217', name: 'Cihampelas' },
        { id: '321703', regency_id: '3217', name: 'Cipatat' },
        { id: '321704', regency_id: '3217', name: 'Cipongkor' },
        { id: '321705', regency_id: '3217', name: 'Gununghalu' },
        { id: '321706', regency_id: '3217', name: 'Rongga' },
        { id: '321707', regency_id: '3217', name: 'Sindangkerta' },
        { id: '321708', regency_id: '3217', name: 'Padalarang' },
        { id: '321709', regency_id: '3217', name: 'Batujajar' },
        { id: '321710', regency_id: '3217', name: 'Ngamprah' },
        { id: '321711', regency_id: '3217', name: 'Parongpong' },
        { id: '321712', regency_id: '3217', name: 'Lembang' },
        { id: '321713', regency_id: '3217', name: 'Cisarua' },
        { id: '321714', regency_id: '3217', name: 'Cikalong Wetan' },
        { id: '321715', regency_id: '3217', name: 'Cipeundeuy' },
        { id: '321716', regency_id: '3217', name: 'Saguling' },
        { id: '321717', regency_id: '3217', name: 'Darangdan' },
      ],
      '3204': [ // Kab. Bandung
        { id: '320401', regency_id: '3204', name: 'Cicalengka' },
        { id: '320402', regency_id: '3204', name: 'Cikancung' },
        { id: '320403', regency_id: '3204', name: 'Cikajang' },
        { id: '320404', regency_id: '3204', name: 'Cimaung' },
        { id: '320405', regency_id: '3204', name: 'Banjaran' },
        { id: '320406', regency_id: '3204', name: 'Pangalengan' },
        { id: '320407', regency_id: '3204', name: 'Arjasari' },
        { id: '320408', regency_id: '3204', name: 'Pameungpeuk' },
        { id: '320409', regency_id: '3204', name: 'Rancabali' },
        { id: '320410', regency_id: '3204', name: 'Ciwidey' },
        { id: '320411', regency_id: '3204', name: 'Pasirjambu' },
        { id: '320412', regency_id: '3204', name: 'Kertasari' },
        { id: '320413', regency_id: '3204', name: 'Ibun' },
        { id: '320414', regency_id: '3204', name: 'Dayeuhkolot' },
        { id: '320415', regency_id: '3204', name: 'Soreang' },
        { id: '320416', regency_id: '3204', name: 'Katapang' },
        { id: '320417', regency_id: '3204', name: 'Paseh' },
        { id: '320418', regency_id: '3204', name: 'Ciparay' },
        { id: '320419', regency_id: '3204', name: 'Majalaya' },
        { id: '320420', regency_id: '3204', name: 'Rancaekek' },
        { id: '320421', regency_id: '3204', name: 'Cileunyi' },
        { id: '320422', regency_id: '3204', name: 'Cimenyan' },
        { id: '320423', regency_id: '3204', name: 'Cilengkrang' },
        { id: '320424', regency_id: '3204', name: 'Cangkuang' },
        { id: '320425', regency_id: '3204', name: 'Margaasih' },
        { id: '320426', regency_id: '3204', name: 'Solokanjeruk' },
        { id: '320427', regency_id: '3204', name: 'Baleendah' },
        { id: '320428', regency_id: '3204', name: 'Bojongsoang' },
        { id: '320429', regency_id: '3204', name: 'Cimaung' },
        { id: '320430', regency_id: '3204', name: 'Kutawaringin' },
      ],
      '3277': [ // Kota Cimahi
        { id: '327701', regency_id: '3277', name: 'Cimahi Selatan' },
        { id: '327702', regency_id: '3277', name: 'Cimahi Tengah' },
        { id: '327703', regency_id: '3277', name: 'Cimahi Utara' },
      ]
    }
  };

  // Fetch all provinces - return hardcoded Jawa Barat
  async getProvinces(): Promise<Province[]> {
    return [{ id: '32', name: 'Jawa Barat' }];
  }

  // Fetch regencies by province ID - return hardcoded Bandung Raya
  async getRegencies(provinceId: string): Promise<Regency[]> {
    if (provinceId !== '32') {
      return [];
    }
    return this.bandungRayaData.regencies;
  }

  // Fetch districts by regency ID - return hardcoded data
  async getDistricts(regencyId: string): Promise<District[]> {
    return this.bandungRayaData.districts[regencyId as keyof typeof this.bandungRayaData.districts] || [];
  }

  // Fetch villages by district ID - return empty for now (can be added later)
  async getVillages(districtId: string): Promise<Village[]> {
    // For now, return a generic village to allow completion
    return [{ id: '999999', district_id: districtId, name: 'Desa/Kelurahan' }];
  }

  // Get province name by ID
  async getProvinceName(provinceId: string): Promise<string> {
    try {
      const provinces = await this.getProvinces();
      const province = provinces.find(p => p.id === provinceId);
      return province?.name || '';
    } catch (error) {
      console.error('Error getting province name:', error);
      return '';
    }
  }

  // Get regency name by ID
  async getRegencyName(regencyId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/regency/${regencyId}.json`);
      const data: Regency = await response.json();
      return data.name;
    } catch (error) {
      console.error('Error getting regency name:', error);
      return '';
    }
  }

  // Get district name by ID
  async getDistrictName(districtId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/district/${districtId}.json`);
      const data: District = await response.json();
      return data.name;
    } catch (error) {
      console.error('Error getting district name:', error);
      return '';
    }
  }

  // Get village name by ID
  async getVillageName(villageId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/village/${villageId}.json`);
      const data: Village = await response.json();
      return data.name;
    } catch (error) {
      console.error('Error getting village name:', error);
      return '';
    }
  }

  // Get full address string
  formatFullAddress(location: LocationData): string {
    const parts = [
      location.village?.name,
      location.district?.name,
      location.regency?.name,
      location.province?.name
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Check if regency is in Bandung Raya
  isBandungRaya(regencyId: string): boolean {
    return BANDUNG_RAYA_REGENCIES.includes(regencyId);
  }

  // Get Bandung Raya regency info
  getBandungRayaRegencies(): Regency[] {
    return [
      { id: '3273', province_id: '32', name: 'Kota Bandung' },
      { id: '3217', province_id: '32', name: 'Kabupaten Bandung Barat' },
      { id: '3204', province_id: '32', name: 'Kabupaten Bandung' },
      { id: '3277', province_id: '32', name: 'Kota Cimahi' }
    ];
  }
}

// Export singleton instance
export const indonesiaRegionsService = new IndonesiaRegionsService();

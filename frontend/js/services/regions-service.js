/**
 * SlopeGuard — Monitored Regions, Reports & Dashboard Services (regions-service.js)
 * Implements:
 * - GET /api/regions, GET /api/regions/nearby, GET /api/regions/{id}, GET /api/regions/{id}/alerts
 * - GET /api/reports, GET /api/reports/{id} (Sagin's Reports module)
 * - GET /api/environmental/insights (Environmental telemetry)
 * - GET /api/system/status (Service health & data quality)
 * - GET /api/dashboard/summary (Dashboard metrics aggregation)
 * - POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout (Ragul's Auth module)
 */

window.LW = window.LW || {};

(function() {
  // Monitored Landslide Sectors — North Eastern Region (NER) Priority Infrastructure & Slopes
  const REGIONS_DATABASE = [
    {
      id: 201,
      name: "Haflong - Jatinga Valley Sector",
      district: "Dima Hasao",
      state: "Assam",
      lat: 25.1764,
      lng: 93.0232,
      elevation: 680,
      risk_level: "critical",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 44.2,
      latest_rainfall_1h: 46.8,
      accumulated_rainfall_24h: 234.5,
      accumulated_rainfall_72h: 412.0,
      ground_displacement_mm: 18.4,
      pore_water_pressure_kpa: 52.6,
      last_observation_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      contributing_factors: "Monsoon deluge over unconsolidated tertiary shale formation. Critical pore saturation along Lumding-Badarpur rail link cutting.",
      description: "Severe rotational slip prone zone along National Highway 27 corridor. Deep structural deformation detected by InSAR telemetry.",
      alerts: [
        {
          id: 601,
          version: 2,
          title: "Immediate Warning: Haflong Hill Railway Cutting",
          severity: "critical",
          source_type: "official_advisory",
          review_status: "PUBLISHED",
          published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          description: "Massive debris sliding danger near New Haflong Station. Evacuation ordered for slope settlement clusters.",
          recommended_actions: "Cease all freight and passenger train movement. Relocate trackside maintenance personnel to lower valley shelters.",
          official_link: "https://asdma.assam.gov.in"
        }
      ]
    },
    {
      id: 202,
      name: "Sohra - Cherrapunji Escarpment",
      district: "East Khasi Hills",
      state: "Meghalaya",
      lat: 25.2986,
      lng: 91.7324,
      elevation: 1430,
      risk_level: "critical",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 48.0,
      latest_rainfall_1h: 58.2,
      accumulated_rainfall_24h: 312.0,
      accumulated_rainfall_72h: 580.4,
      ground_displacement_mm: 16.2,
      pore_water_pressure_kpa: 61.4,
      last_observation_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      contributing_factors: "World-record precipitation threshold exceeded; sandstone cliff margin destabilization.",
      description: "Steep gorge slopes descending into Bangladesh plains. Severe planar sliding along bedded sandstone-shale contacts.",
      alerts: [
        {
          id: 602,
          version: 1,
          title: "Gorge Cliff Slip Warning: Sohra-Shella Road",
          severity: "critical",
          source_type: "official_advisory",
          review_status: "PUBLISHED",
          published_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          description: "Major rockfall blocking KM 18. Continuous water-sheet flow eroding toe support.",
          recommended_actions: "Total transit ban on Sohra cliff roads during hours of darkness. Deploy SDRF emergency teams.",
          official_link: "https://meghalaya.gov.in"
        }
      ]
    },
    {
      id: 203,
      name: "Mangan - Chungthang Highway Sector",
      district: "North Sikkim",
      state: "Sikkim",
      lat: 27.5050,
      lng: 88.5284,
      elevation: 1610,
      risk_level: "high",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 51.5,
      latest_rainfall_1h: 24.6,
      accumulated_rainfall_24h: 164.0,
      accumulated_rainfall_72h: 278.5,
      ground_displacement_mm: 9.8,
      pore_water_pressure_kpa: 42.1,
      last_observation_time: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      contributing_factors: "Teesta river basin bank erosion; glacio-fluvial moraine saturation.",
      description: "High-altitude translational slip zone along North Sikkim highway lifeline. Frequent rockfall chutes active.",
      alerts: [
        {
          id: 603,
          version: 1,
          title: "Rockslide Hazard: Mangan-Pegong Road",
          severity: "high",
          source_type: "reviewed_platform",
          review_status: "PUBLISHED",
          published_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
          description: "Pegong slide reactivation noted by Border Roads Organisation (BRO).",
          recommended_actions: "All convoy movements restricted to daylight hours with spotters deployed.",
          official_link: "https://sikkim.gov.in"
        }
      ]
    },
    {
      id: 204,
      name: "Kohima - Phesama Bypass (NH-29)",
      district: "Kohima",
      state: "Nagaland",
      lat: 25.6751,
      lng: 94.1086,
      elevation: 1440,
      risk_level: "high",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "ai_estimate",
      review_status: "PENDING_REVIEW",
      slope_gradient: 37.8,
      latest_rainfall_1h: 19.4,
      accumulated_rainfall_24h: 118.2,
      accumulated_rainfall_72h: 198.0,
      ground_displacement_mm: 5.6,
      pore_water_pressure_kpa: 34.0,
      last_observation_time: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      contributing_factors: "Perennial mudslide corridor on Disang shales. Sinking zone expanding across road pavement.",
      description: "Crucial supply lifeline between Dimapur and Manipur border. Creep displacement continuously observed.",
      alerts: []
    },
    {
      id: 205,
      name: "Tupul - Noney Railway Cutting",
      district: "Noney",
      state: "Manipur",
      lat: 24.8142,
      lng: 93.6394,
      elevation: 740,
      risk_level: "high",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 42.0,
      latest_rainfall_1h: 22.0,
      accumulated_rainfall_24h: 142.6,
      accumulated_rainfall_72h: 245.0,
      ground_displacement_mm: 8.2,
      pore_water_pressure_kpa: 39.5,
      last_observation_time: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      contributing_factors: "Debris flow catchment above Ijei river. Saturated overburden on sheared shale slopes.",
      description: "Historic landslide disaster site undergoing active real-time geophone and piezometer monitoring.",
      alerts: [
        {
          id: 604,
          version: 1,
          title: "Warning: Ijei River Catchment Debris Flow",
          severity: "high",
          source_type: "official_advisory",
          review_status: "PUBLISHED",
          published_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
          description: "Ground vibration sensors detect slope creep. Camp clearance advised.",
          recommended_actions: "Workers clear riverbank staging grounds immediately.",
          official_link: "https://manipur.gov.in"
        }
      ]
    },
    {
      id: 206,
      name: "Aizawl - Sairang Slope Corridor",
      district: "Aizawl",
      state: "Mizoram",
      lat: 23.7307,
      lng: 92.7173,
      elevation: 1130,
      risk_level: "moderate",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "ai_estimate",
      review_status: "PENDING_REVIEW",
      slope_gradient: 36.2,
      latest_rainfall_1h: 12.5,
      accumulated_rainfall_24h: 84.0,
      accumulated_rainfall_72h: 142.0,
      ground_displacement_mm: 3.1,
      pore_water_pressure_kpa: 26.2,
      last_observation_time: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
      contributing_factors: "Steep urban ridges with heavy residential surcharge loads. Retaining wall deflection monitor active.",
      description: "Linear ridge city monitoring sector. Telemetry stable with mild creep on southern flanks.",
      alerts: []
    },
    {
      id: 207,
      name: "Tawang - Baisakhi Pass Sector",
      district: "Tawang",
      state: "Arunachal Pradesh",
      lat: 27.5861,
      lng: 91.8679,
      elevation: 3040,
      risk_level: "moderate",
      data_status: "delayed",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 220 * 60 * 1000).toISOString(),
      model_version: "v2.3-convLSTM",
      source_type: "ai_estimate",
      review_status: "PENDING_REVIEW",
      slope_gradient: 46.0,
      latest_rainfall_1h: 8.0,
      accumulated_rainfall_24h: 54.0,
      accumulated_rainfall_72h: 110.0,
      ground_displacement_mm: 2.2,
      pore_water_pressure_kpa: 19.5,
      last_observation_time: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
      contributing_factors: "Permafrost freeze-thaw cycles; high-altitude telecommunications relay delayed.",
      description: "High mountain strategic road link. Rocky debris prone to slips during snow-melt and rainfall.",
      alerts: []
    },
    {
      id: 208,
      name: "Mawsynram - Balat Ridge",
      district: "East Khasi Hills",
      state: "Meghalaya",
      lat: 25.2975,
      lng: 91.5826,
      elevation: 1400,
      risk_level: "high",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 41.5,
      latest_rainfall_1h: 38.0,
      accumulated_rainfall_24h: 248.0,
      accumulated_rainfall_72h: 460.0,
      ground_displacement_mm: 11.2,
      pore_water_pressure_kpa: 46.8,
      last_observation_time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      contributing_factors: "Extreme orographic rainfall; limestone karst drainage dissolution cavities.",
      description: "High saturation terrain with heavy runoff channels. Geotechnical stability monitoring active.",
      alerts: []
    },
    {
      id: 209,
      name: "Gangtok - Deorali Urban Slope",
      district: "East Sikkim",
      state: "Sikkim",
      lat: 27.3314,
      lng: 88.6138,
      elevation: 1650,
      risk_level: "low",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "ai_estimate",
      review_status: "PENDING_REVIEW",
      slope_gradient: 28.0,
      latest_rainfall_1h: 4.0,
      accumulated_rainfall_24h: 28.0,
      accumulated_rainfall_72h: 52.0,
      ground_displacement_mm: 0.6,
      pore_water_pressure_kpa: 14.2,
      last_observation_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      contributing_factors: "Reinforced retaining masonry holding; drainage channels functioning smoothly.",
      description: "State capital perimeter sector with engineered hillside slope protections.",
      alerts: []
    },
    {
      id: 210,
      name: "Guwahati - Naranarayan Hill Sector",
      district: "Kamrup Metropolitan",
      state: "Assam",
      lat: 26.1859,
      lng: 91.7478,
      elevation: 190,
      risk_level: "low",
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "ai_estimate",
      review_status: "PENDING_REVIEW",
      slope_gradient: 22.0,
      latest_rainfall_1h: 2.0,
      accumulated_rainfall_24h: 18.0,
      accumulated_rainfall_72h: 36.0,
      ground_displacement_mm: 0.3,
      pore_water_pressure_kpa: 11.0,
      last_observation_time: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      contributing_factors: "Low baseline precipitation; urban drainage clear.",
      description: "Suburban isolated hillock with soil stabilization measures in place.",
      alerts: []
    },
    {
      id: 211,
      name: "Jampui Hills - Vanghmun Sector",
      district: "North Tripura",
      state: "Tripura",
      lat: 23.9458,
      lng: 92.2789,
      elevation: 930,
      risk_level: "none",
      data_status: "unavailable",
      assessment_available: false,
      assessed_at: null,
      model_version: null,
      source_type: "ai_estimate",
      review_status: "UNASSESSED",
      slope_gradient: 31.0,
      latest_rainfall_1h: null,
      accumulated_rainfall_24h: null,
      accumulated_rainfall_72h: null,
      ground_displacement_mm: null,
      pore_water_pressure_kpa: null,
      last_observation_time: null,
      contributing_factors: "Telemetry station awaiting sensor calibration following lightning event.",
      description: "Ridge range monitoring post in North Tripura. Sensor telemetry currently offline.",
      alerts: []
    },
    {
      id: 212,
      name: "Meppadi Ridge (Chooralmala Corridor)",
      district: "Wayanad",
      state: "Kerala",
      lat: 11.5512,
      lng: 76.1264,
      elevation: 860,
      risk_level: "critical",
      susceptibility_score: 92,
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 44.8,
      latest_rainfall_1h: 36.2,
      accumulated_rainfall_24h: 168.4,
      accumulated_rainfall_72h: 372.0,
      ground_displacement_mm: 14.8,
      soil_saturation_pct: 84,
      pore_water_pressure_kpa: 58.4,
      last_observation_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      contributing_factors: "Monsoon torrential downpour over colluvium soil mantle on Western Ghats gneissic bedrock. Extreme moisture saturation along Chembra foothill stream channels.",
      description: "Steep amphitheater slope prone to debris avalanche and mass flow. High density automated rain gauge and piezometer station W-04 active.",
      data_source: "IMD Rain Gauge Station W-04 & Geological Survey of India (GSI)",
      alerts: [
        {
          id: 612,
          version: 1,
          title: "Critical Slope Advisory: Meppadi-Chooralmala Flank",
          severity: "critical",
          source_type: "official_advisory",
          review_status: "PUBLISHED",
          published_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          description: "24h rainfall exceeded 160mm threshold. Soil saturation reached 84%.",
          recommended_actions: "Evacuate lower riparian settlements along river channels to higher emergency shelters.",
          official_link: "https://sdma.kerala.gov.in"
        }
      ]
    },
    {
      id: 213,
      name: "Kalpetta Slopes",
      district: "Wayanad",
      state: "Kerala",
      lat: 11.6050,
      lng: 76.0830,
      elevation: 780,
      risk_level: "moderate",
      susceptibility_score: 58,
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "ai_estimate",
      review_status: "REVIEWED",
      slope_gradient: 26.5,
      latest_rainfall_1h: 14.0,
      accumulated_rainfall_24h: 62.0,
      accumulated_rainfall_72h: 134.0,
      ground_displacement_mm: 2.1,
      soil_saturation_pct: 52,
      pore_water_pressure_kpa: 24.0,
      last_observation_time: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      contributing_factors: "Terraced plantation slopes with reinforced retaining drains. Normal soil saturation envelope.",
      description: "Sub-district central slopes with moderate gradient. Automated weather station telemetry online.",
      data_source: "District Hydro-met Array & Model v2.4-convLSTM",
      alerts: []
    },
    {
      id: 214,
      name: "Vythiri Pass (Thamarassery Corridor)",
      district: "Wayanad",
      state: "Kerala",
      lat: 11.5385,
      lng: 76.0354,
      elevation: 710,
      risk_level: "high",
      susceptibility_score: 76,
      data_status: "current",
      assessment_available: true,
      assessed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      model_version: "v2.4-convLSTM",
      source_type: "reviewed_platform",
      review_status: "REVIEWED",
      slope_gradient: 41.2,
      latest_rainfall_1h: 42.0,
      accumulated_rainfall_24h: 186.2,
      accumulated_rainfall_72h: 410.5,
      ground_displacement_mm: 7.9,
      soil_saturation_pct: 79,
      pore_water_pressure_kpa: 48.6,
      last_observation_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      contributing_factors: "High orographic precipitation at ghat entrance; Highway cutting edge destabilization.",
      description: "Critical ghat road corridor connecting Kozhikode to Wayanad. Continuous vibration and inclinometer monitoring.",
      data_source: "PWD Ghat Inclinometer Sensor Network & IMD Lakkidi Gauge",
      alerts: []
    }
  ];

  // Sagin's Geotechnical & Field Monitoring Reports Database
  const REPORTS_DATABASE = [
    {
      id: 301,
      title: "Geotechnical Slope Stability Assessment: Lumding-Haflong Corridor",
      area: "Haflong - Jatinga Valley",
      state: "Assam",
      district: "Dima Hasao",
      category: "Geotechnical Survey",
      severity: "critical",
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: "PUBLISHED",
      author: "Dr. S. Roy (GSI Eastern Region)",
      verified: true,
      summary: "In-situ shear strength tests indicate progressive sliding surface along tertiary shale-siltstone contact at KM 44. Immediate retaining anchor reinforcement recommended.",
      download_url: "#"
    },
    {
      id: 302,
      title: "Extreme Precipitation Threshold Breach Bulletin",
      area: "Sohra - Cherrapunji Escarpment",
      state: "Meghalaya",
      district: "East Khasi Hills",
      category: "Rainfall Threshold",
      severity: "critical",
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      status: "PUBLISHED",
      author: "Disaster Management Cell (NER-SDMA)",
      verified: true,
      summary: "Rainfall accumulation of 312mm in 24 hours exceeds safety threshold by 184%. High probability of catastrophic debris runout into valley.",
      download_url: "#"
    },
    {
      id: 303,
      title: "InSAR Satellite Ground Displacement Analysis: NH-29 Bypass",
      area: "Kohima - Phesama Bypass",
      state: "Nagaland",
      district: "Kohima",
      category: "Satellite Telemetry",
      severity: "high",
      created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      status: "PUBLISHED",
      author: "Remote Sensing Centre (NESAC)",
      verified: true,
      summary: "Line-of-sight velocity maps demonstrate cumulative subsidence of 5.6mm over the past 7 days across the active road alignment.",
      download_url: "#"
    },
    {
      id: 304,
      title: "Post-Slide Remedial Field Investigation: Ijei River Basin",
      area: "Tupul - Noney Railway Cutting",
      state: "Manipur",
      district: "Noney",
      category: "Field Inspection",
      severity: "high",
      created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      status: "PUBLISHED",
      author: "Central Building Research Institute (CBRI)",
      verified: true,
      summary: "Piezometer sensors at borehole BH-04 report pore water pressure exceeding 39.5 kPa, indicating critical soil saturation.",
      download_url: "#"
    },
    {
      id: 305,
      title: "Pre-Monsoon Slope Drainage Channel Integrity Audit",
      area: "Aizawl - Sairang Corridor",
      state: "Mizoram",
      district: "Aizawl",
      category: "Drainage Audit",
      severity: "moderate",
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status: "PUBLISHED",
      author: "Mizoram Public Works Department",
      verified: true,
      summary: "Culverts and catchpits cleared on western bypass. Retaining walls show stable equilibrium with minor joint weep-hole seepage.",
      download_url: "#"
    },
    {
      id: 306,
      title: "High-Altitude Permafrost & Moraine Hazard Reconnaissance",
      area: "Tawang - Baisakhi Pass",
      state: "Arunachal Pradesh",
      district: "Tawang",
      category: "Hazard Reconnaissance",
      severity: "moderate",
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      status: "UNDER_REVIEW",
      author: "Border Roads Geotechnical Unit",
      verified: false,
      summary: "Field team reports seasonal thaw slumps along north-facing scree slopes. Heavy vehicle vibration dampening suggested.",
      download_url: "#"
    }
  ];

  // Great Circle Distance calculation (Haversine formula in KM)
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  // --- CITIZEN ROAD BLOCKAGES & LANDSLIDE INCIDENTS SEED DATABASE ---
  const DEFAULT_INCIDENTS_DATABASE = [
    {
      id: "INC-NER-8821",
      citizenId: 1003,
      citizenName: "Citizen Test User",
      citizenEmail: "citizen.test@slopeguard.com",
      incidentType: "Road blocked by landslide debris",
      category: "Road blocked by landslide debris",
      description: "Heavy slide from the upper cut-slope has blocked both lanes of the highway. Large tree trunks and mud slurry covering approximately 35 meters of road width.",
      observedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
      location: {
        latitude: 25.1780,
        longitude: 93.0250,
        accuracy: 12.0,
        source: "browser_geolocation",
        placeName: "Haflong Valley Highway, NH-27 Corridor, Assam",
        roadName: "NH-27",
        landmark: "Near Jatinga View Point KM 41"
      },
      roadPassability: "completely blocked",
      additionalInfo: "Long queue of stranded trucks. Heavy rainfall continuing.",
      photos: [
        {
          id: "PHOTO-9901A",
          filename: "debris_road_block.jpg",
          mimeType: "image/jpeg",
          size: 1845000,
          url: "assets/images/incidents/debris_road_block.jpg",
          uploadedAt: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString()
        }
      ],
      status: "Verified",
      isVerified: true,
      verifiedIncidentType: "Road blocked by landslide debris",
      verifiedPassability: "completely blocked",
      verifiedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      verifiedBy: "Field Officer Sharma (NER Command)",
      reviewReason: "On-site emergency team confirmed full road blockage at KM 41. SDMA road clearing crew deployed.",
      aiRiskAnalysis: {
        nearestSector: "Haflong - Jatinga Valley Sector (0.4 km)",
        distanceKm: 0.4,
        regionalRiskLevel: "critical",
        factorOfSafety: "0.91 (High Failure Vulnerability)",
        evaluatedAt: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
        modelVersion: "v2.4-convLSTM",
        sources: ["GPS Telemetry", "IMD Automated Rain Gauge Network", "GSI Regional Landslide Database"]
      },
      auditTrail: [
        {
          action: "REPORT_SUBMITTED",
          timestamp: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
          actor: "Citizen Test User",
          notes: "Incident reported with GPS coordinates and photographic evidence."
        },
        {
          action: "UNDER_REVIEW",
          timestamp: new Date(Date.now() - 3.0 * 3600 * 1000).toISOString(),
          actor: "Field Officer Sharma",
          notes: "Assigned to regional highway inspection patrol."
        },
        {
          action: "VERIFIED",
          timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
          actor: "Field Officer Sharma",
          notes: "Road completely blocked. Debris clearance team dispatched."
        }
      ]
    },
    {
      id: "INC-NER-8822",
      citizenId: 1003,
      citizenName: "Citizen Test User",
      citizenEmail: "citizen.test@slopeguard.com",
      incidentType: "Road covered by fallen rocks",
      category: "Road covered by fallen rocks",
      description: "Large boulder fall across the uphill lane. Passing vehicles must alternate on the single remaining lane.",
      observedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
      location: {
        latitude: 25.3090,
        longitude: 91.7320,
        accuracy: 15.4,
        source: "browser_geolocation",
        placeName: "Sohra Escarpment Road, East Khasi Hills, Meghalaya",
        roadName: "SH-5 Cherrapunji Road",
        landmark: "Near Mawkdok Bridge"
      },
      roadPassability: "partially blocked",
      additionalInfo: "Safety cones placed by local taxi drivers. Rock scree continues to roll down slope.",
      photos: [
        {
          id: "PHOTO-9902B",
          filename: "fallen_rocks_road.jpg",
          mimeType: "image/jpeg",
          size: 1620000,
          url: "assets/images/incidents/fallen_rocks_road.jpg",
          uploadedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
        }
      ],
      status: "Under Review",
      isVerified: false,
      verifiedIncidentType: null,
      verifiedPassability: null,
      verifiedAt: null,
      verifiedBy: null,
      reviewReason: "Field patrol checking boulder stability.",
      aiRiskAnalysis: {
        nearestSector: "Sohra - Cherrapunji Escarpment (1.2 km)",
        distanceKm: 1.2,
        regionalRiskLevel: "critical",
        factorOfSafety: "1.08 (Elevated Hazard Buffer)",
        evaluatedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
        modelVersion: "v2.4-convLSTM",
        sources: ["GPS Telemetry", "IMD Automated Rain Gauge Network", "InSAR Geodetic Baseline"]
      },
      auditTrail: [
        {
          action: "REPORT_SUBMITTED",
          timestamp: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
          actor: "Citizen Test User",
          notes: "Incident reported with GPS coordinates."
        },
        {
          action: "UNDER_REVIEW",
          timestamp: new Date(Date.now() - 1.0 * 3600 * 1000).toISOString(),
          actor: "NER Command Administrator",
          notes: "Dispatched highway emergency assessment team."
        }
      ]
    },
    {
      id: "INC-NER-8823",
      citizenId: 1005,
      citizenName: "Rajesh Barman",
      citizenEmail: "rajesh.barman@community.ner.org",
      incidentType: "Ground cracks or slope instability near a road",
      category: "Ground cracks or slope instability near a road",
      description: "Parallel tension cracks opened on the road shoulder over 20 meters. Retaining wall appears tilted.",
      observedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      location: {
        latitude: 25.6740,
        longitude: 94.1080,
        accuracy: 18.0,
        source: "map_selection",
        placeName: "Kohima - Phesama Bypass, Nagaland",
        roadName: "NH-29 Bypass",
        landmark: "Near KM 12 Culvert"
      },
      roadPassability: "open",
      additionalInfo: "Road is currently open but subsidence is visible.",
      photos: [],
      status: "Pending Verification",
      isVerified: false,
      auditTrail: [
        {
          action: "REPORT_SUBMITTED",
          timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          actor: "Rajesh Barman",
          notes: "Incident submitted via map coordinate selection."
        }
      ]
    }
  ];

  function getIncidentsQueue() {
    try {
      const raw = localStorage.getItem("sg_citizen_incidents");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem("sg_citizen_incidents", JSON.stringify(DEFAULT_INCIDENTS_DATABASE));
    return [...DEFAULT_INCIDENTS_DATABASE];
  }

  function saveIncidentsQueue(queue) {
    localStorage.setItem("sg_citizen_incidents", JSON.stringify(queue));
  }

  // Register comprehensive Mock Adapter
  window.LW.mockAdapter = function(path, options = {}) {
    console.info(`[LW.mockAdapter] Intercepted: ${options.method || 'GET'} ${path}`);

    // --- AUTHENTICATION MOCK ENDPOINTS (Ragul's Module) ---
    if (path === "/api/auth/login" || path.startsWith("/api/auth/login")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const username = (body.username || body.email || "").trim().toLowerCase();
      const password = body.password ? String(body.password) : "";
      const remember = body.remember !== false;

      if (!username || !password) {
        const err = new Error("Please enter both official email and security password.");
        err.status = 400;
        err.code = "MISSING_CREDENTIALS";
        throw err;
      }

      let user = null;
      const officerExpectedPw = localStorage.getItem("sg_officer_custom_pw") || "officer123";
      const adminExpectedPw = localStorage.getItem("sg_admin_custom_pw") || "admin123";
      const citizenExpectedPw = localStorage.getItem("sg_citizen_custom_pw") || "Citizen@12345";

      if ((username === "citizen.test@slopeguard.com" || username === "citizen.test@slopeguard.ner.gov.in") && password === citizenExpectedPw) {
        user = {
          id: 1003,
          username: "citizen.test@slopeguard.com",
          name: "Citizen Test User",
          email: "citizen.test@slopeguard.com",
          role: "CITIZEN",
          roles: ["CITIZEN", "USER"],
          district: "Wayanad / Regional Slopes",
          jurisdiction: "Wayanad Monitored Corridor",
          locationStatus: "Location Provided",
          location: {
            latitude: 11.6050,
            longitude: 76.1320,
            accuracy: 14.5,
            placeName: "Kalpetta Slopes, Wayanad",
            capturedAt: new Date().toISOString()
          },
          token: "mock-jwt-" + Date.now()
        };
      } else if (username === "officer@slopeguard.ner.gov.in" && password === officerExpectedPw) {
        user = {
          id: 1001,
          username: "officer@slopeguard.ner.gov.in",
          name: "Field Officer Sharma",
          email: "officer@slopeguard.ner.gov.in",
          role: "OFFICER",
          district: "Dima Hasao / Haflong Command",
          jurisdiction: "North Eastern Region (NER)",
          token: "mock-jwt-" + Date.now()
        };
      } else if (username === "admin@slopeguard.ner.gov.in" && password === adminExpectedPw) {
        user = {
          id: 1002,
          username: "admin@slopeguard.ner.gov.in",
          name: "NER Command Administrator",
          email: "admin@slopeguard.ner.gov.in",
          role: "ADMIN",
          district: "NER Headquarters (Guwahati)",
          jurisdiction: "North Eastern Region (NER)",
          token: "mock-jwt-" + Date.now()
        };
      } else {
        // Check registered users storage
        try {
          const registeredRaw = localStorage.getItem("sg_registered_users");
          const registeredList = registeredRaw ? JSON.parse(registeredRaw) : [];
          const found = registeredList.find(u => 
            (u.email?.toLowerCase() === username || u.username?.toLowerCase() === username) &&
            u.password === password
          );
          if (found) {
            user = {
              id: found.id || Date.now(),
              username: found.email || username,
              name: found.name || found.fullName || "Registered Monitor",
              email: found.email || username,
              role: (found.role || "USER").toUpperCase(),
              district: found.district || "NER Command",
              jurisdiction: found.jurisdiction || "North Eastern Region (NER)",
              token: "mock-jwt-" + Date.now()
            };
          }
        } catch (e) {}
      }

      if (!user) {
        const err = new Error("Invalid credentials or unauthorized station. Please verify your details.");
        err.status = 401;
        err.code = "UNAUTHENTICATED";
        throw err;
      }

      // Persist in storage according to remember policy
      if (remember) {
        localStorage.setItem("sg_user", JSON.stringify(user));
        sessionStorage.removeItem("sg_user");
      } else {
        sessionStorage.setItem("sg_user", JSON.stringify(user));
        localStorage.removeItem("sg_user");
      }

      return {
        success: true,
        data: user,
        message: "Authentication successful."
      };
    }

    if (path === "/api/auth/register" || path.startsWith("/api/auth/register")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const email = (body.email || body.username || "").trim().toLowerCase();
      const password = body.password ? String(body.password) : "";
      const name = body.name || body.fullName || email.split("@")[0];
      const district = body.district || "NER Command";
      const role = (body.role || "USER").toUpperCase();
      const location = body.location;

      if (!email || !password) {
        const err = new Error("Please provide email and security password.");
        err.status = 400;
        err.code = "MISSING_FIELDS";
        throw err;
      }

      // Location is optional on desktop and mobile.
      // If provided, validate geographic coordinates; if omitted, save as "Not provided" without fabricating coordinates.
      const hasLocation = Boolean(location && (typeof location.latitude === "number" || (location.latitude !== undefined && location.latitude !== null && location.latitude !== "")));
      let lat = null;
      let lng = null;
      let structuredLocation = null;
      let locationStatus = "Location Not Provided";
      let automatedAssessment = null;

      if (hasLocation) {
        lat = Number(location.latitude);
        lng = Number(location.longitude);

        if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
          const err = new Error("Invalid geographic coordinates provided.");
          err.status = 400;
          err.code = "INVALID_COORDINATES";
          throw err;
        }

        locationStatus = "Location Provided";

        // 1. Pipeline: Correlate nearby environmental telemetry sectors
        let nearestSectors = REGIONS_DATABASE.map(r => ({
          id: r.id,
          name: r.name,
          district: r.district,
          state: r.state,
          distance_km: calculateDistanceKm(lat, lng, r.lat, r.lng),
          risk_level: r.risk_level,
          elevation: r.elevation,
          slope_gradient: r.slope_gradient,
          accumulated_rainfall_24h: r.accumulated_rainfall_24h,
          pore_water_pressure_kpa: r.pore_water_pressure_kpa,
          data_status: r.data_status
        })).sort((a, b) => a.distance_km - b.distance_km);

        const closestSector = nearestSectors[0];
        const isProximate = closestSector && closestSector.distance_km <= 150;

        // 2. Automated AI Risk Analysis Pipeline (Model v2.4-convLSTM)
        let calculatedRisk = "unassessed";
        let assessmentConfidence = "moderate";
        let availableSources = ["GPS Telemetry", "Browser Geolocation API"];
        let limitations = [];
        let preliminaryFoS = "1.50 (Stable)";

        if (isProximate) {
          availableSources.push("IMD Automated Rain Gauge Network", "GSI Regional Landslide Database", "InSAR Geodetic Baseline");
          // Risk estimate calculation based on proximate corridor telemetry
          if (closestSector.risk_level === "critical" && closestSector.distance_km < 35) {
            calculatedRisk = "critical";
            assessmentConfidence = "high";
            preliminaryFoS = "0.92 (High Failure Vulnerability)";
          } else if (closestSector.risk_level === "critical" || (closestSector.risk_level === "high" && closestSector.distance_km < 50)) {
            calculatedRisk = "high";
            assessmentConfidence = "high";
            preliminaryFoS = "1.08 (Elevated Hazard Buffer)";
          } else if (closestSector.risk_level === "high" || closestSector.risk_level === "moderate") {
            calculatedRisk = "moderate";
            assessmentConfidence = "moderate";
            preliminaryFoS = "1.28 (Moderate Moisture Hazard)";
          } else {
            calculatedRisk = closestSector.risk_level || "low";
            preliminaryFoS = "1.45 (Normal Stability)";
          }
        } else {
          calculatedRisk = "moderate";
          assessmentConfidence = "low";
          limitations.push("Location is >150km from primary instrumented sensor arrays. Estimate based on regional slope envelope.");
        }

        structuredLocation = {
          latitude: lat,
          longitude: lng,
          accuracyMeters: typeof location.accuracyMeters === "number" ? Math.round(location.accuracyMeters) : 25,
          capturedAt: location.capturedAt || new Date().toISOString(),
          source: location.source || "browser_geolocation",
          resolvedPlaceName: location.resolvedPlaceName || (closestSector ? `${closestSector.district}, ${closestSector.state}` : "North Eastern Region Corridor"),
          citizenConfirmedAt: location.citizenConfirmedAt || new Date().toISOString()
        };

        const initialReviewStatus = (calculatedRisk === "critical" || calculatedRisk === "high") ? "Review Required" : "Assessment Completed";

        automatedAssessment = {
          assessmentId: "ASM-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
          evaluatedAt: new Date().toISOString(),
          modelVersion: "v2.4-convLSTM",
          preliminaryRisk: calculatedRisk,
          factorOfSafety: preliminaryFoS,
          confidence: assessmentConfidence,
          nearestCorridor: closestSector ? `${closestSector.name} (${closestSector.distance_km} km)` : "Regional Corridor",
          distanceToNearestCorridorKm: closestSector ? closestSector.distance_km : null,
          availableSources: availableSources,
          limitations: limitations,
          locationStatus: "Location Provided",
          reviewStatus: initialReviewStatus, // Assessment Completed | Review Required | Pending Review
          reviewHistory: [
            {
              action: "AUTOMATED_EVALUATION",
              timestamp: new Date().toISOString(),
              actor: "SlopeGuard AI Risk Engine (v2.4-convLSTM)",
              notes: "Initial preliminary assessment synthesized upon citizen registration with verified location."
            }
          ]
        };
      } else {
        // Location NOT provided: Never fabricate coordinates or risk measurements!
        locationStatus = "Location Not Provided";
        structuredLocation = null;

        automatedAssessment = {
          assessmentId: "ASM-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
          evaluatedAt: new Date().toISOString(),
          modelVersion: "v2.4-convLSTM",
          preliminaryRisk: "Pending Location",
          factorOfSafety: "Pending Location",
          confidence: "none",
          nearestCorridor: "Pending Location",
          distanceToNearestCorridorKm: null,
          availableSources: [],
          limitations: ["No geographic coordinates provided during registration. Geotechnical risk assessment is pending location."],
          locationStatus: "Location Not Provided",
          reviewStatus: "Assessment Pending",
          reviewHistory: [
            {
              action: "REGISTRATION_WITHOUT_LOCATION",
              timestamp: new Date().toISOString(),
              actor: "SlopeGuard Registration Engine",
              notes: "Citizen account registered without geographic coordinates. Risk assessment is marked Pending Location."
            }
          ]
        };
      }

      let registeredList = [];
      try {
        const raw = localStorage.getItem("sg_registered_users");
        registeredList = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      if (email === "officer@slopeguard.ner.gov.in" || email === "admin@slopeguard.ner.gov.in" || email === "citizen.test@slopeguard.com" || registeredList.some(u => u.email?.toLowerCase() === email)) {
        const err = new Error("An account with this email address already exists.");
        err.status = 409;
        err.code = "USER_EXISTS";
        throw err;
      }

      const newUser = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        username: email,
        name: name,
        email: email,
        role: role,
        district: structuredLocation?.resolvedPlaceName ? structuredLocation.resolvedPlaceName.split(",")[0].trim() : district,
        jurisdiction: "North Eastern Region (NER)",
        password: password,
        location: structuredLocation,
        locationStatus: locationStatus,
        assessment: automatedAssessment,
        token: "mock-jwt-" + Date.now()
      };

      registeredList.push(newUser);
      localStorage.setItem("sg_registered_users", JSON.stringify(registeredList));

      // 3. Queue into Admin Citizen Assessment Review Store
      let adminQueue = [];
      try {
        adminQueue = JSON.parse(localStorage.getItem("sg_citizen_assessments_queue") || "[]");
      } catch (e) {}

      adminQueue.unshift({
        id: newUser.id,
        assessmentId: automatedAssessment.assessmentId,
        citizenName: name,
        citizenEmail: email,
        locationStatus: locationStatus,
        capturedLocation: structuredLocation,
        assessment: automatedAssessment,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("sg_citizen_assessments_queue", JSON.stringify(adminQueue));

      const sessionUser = { ...newUser };
      delete sessionUser.password;

      sessionStorage.setItem("sg_user", JSON.stringify(sessionUser));
      localStorage.setItem("sg_user", JSON.stringify(sessionUser));

      return {
        success: true,
        data: sessionUser,
        message: hasLocation 
          ? "Registration successful. Geographically relevant risk analysis generated for administrator review."
          : "Registration successful. Account created with location status 'Not provided'."
      };
    }

    // --- CITIZEN LOCATION UPDATE ENDPOINT (SETTINGS & PROFILE) ---
    if (path === "/api/user/location" || path.startsWith("/api/user/location")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const location = body.location;

      if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
        const err = new Error("Valid latitude and longitude coordinates are required to update location.");
        err.status = 400;
        err.code = "INVALID_COORDINATES";
        throw err;
      }

      const lat = Number(location.latitude);
      const lng = Number(location.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        const err = new Error("Invalid geographic coordinates provided.");
        err.status = 400;
        err.code = "INVALID_COORDINATES";
        throw err;
      }

      // Identify active user session
      let storedUser = null;
      try {
        const raw = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
        storedUser = raw ? JSON.parse(raw) : null;
      } catch (e) {}

      if (!storedUser) {
        const err = new Error("Authentication required to update monitoring location.");
        err.status = 401;
        err.code = "UNAUTHENTICATED";
        throw err;
      }

      // Correlate nearest sectors
      let nearestSectors = REGIONS_DATABASE.map(r => ({
        id: r.id,
        name: r.name,
        district: r.district,
        state: r.state,
        distance_km: calculateDistanceKm(lat, lng, r.lat, r.lng),
        risk_level: r.risk_level,
        elevation: r.elevation,
        slope_gradient: r.slope_gradient,
        accumulated_rainfall_24h: r.accumulated_rainfall_24h,
        pore_water_pressure_kpa: r.pore_water_pressure_kpa,
        data_status: r.data_status
      })).sort((a, b) => a.distance_km - b.distance_km);

      const closestSector = nearestSectors[0];
      const isProximate = closestSector && closestSector.distance_km <= 150;

      let calculatedRisk = "unassessed";
      let assessmentConfidence = "moderate";
      let availableSources = ["GPS Telemetry", "Browser Geolocation API"];
      let limitations = [];
      let preliminaryFoS = "1.50 (Stable)";

      if (isProximate) {
        availableSources.push("IMD Automated Rain Gauge Network", "GSI Regional Landslide Database", "InSAR Geodetic Baseline");
        if (closestSector.risk_level === "critical" && closestSector.distance_km < 35) {
          calculatedRisk = "critical";
          assessmentConfidence = "high";
          preliminaryFoS = "0.92 (High Failure Vulnerability)";
        } else if (closestSector.risk_level === "critical" || (closestSector.risk_level === "high" && closestSector.distance_km < 50)) {
          calculatedRisk = "high";
          assessmentConfidence = "high";
          preliminaryFoS = "1.08 (Elevated Hazard Buffer)";
        } else if (closestSector.risk_level === "high" || closestSector.risk_level === "moderate") {
          calculatedRisk = "moderate";
          assessmentConfidence = "moderate";
          preliminaryFoS = "1.28 (Moderate Moisture Hazard)";
        } else {
          calculatedRisk = closestSector.risk_level || "low";
          preliminaryFoS = "1.45 (Normal Stability)";
        }
      } else {
        calculatedRisk = "moderate";
        assessmentConfidence = "low";
        limitations.push("Location is >150km from primary instrumented sensor arrays. Estimate based on regional slope envelope.");
      }

      const structuredLocation = {
        latitude: lat,
        longitude: lng,
        accuracyMeters: typeof location.accuracyMeters === "number" ? Math.round(location.accuracyMeters) : 20,
        capturedAt: location.capturedAt || new Date().toISOString(),
        source: location.source || "browser_geolocation",
        resolvedPlaceName: location.resolvedPlaceName || (closestSector ? `${closestSector.district}, ${closestSector.state}` : "North Eastern Region Corridor"),
        citizenConfirmedAt: new Date().toISOString()
      };

      const initialReviewStatus = (calculatedRisk === "critical" || calculatedRisk === "high") ? "Review Required" : "Assessment Completed";

      const updatedAssessment = {
        assessmentId: storedUser.assessment?.assessmentId || ("ASM-" + Date.now().toString(36).toUpperCase()),
        evaluatedAt: new Date().toISOString(),
        modelVersion: "v2.4-convLSTM",
        preliminaryRisk: calculatedRisk,
        factorOfSafety: preliminaryFoS,
        confidence: assessmentConfidence,
        nearestCorridor: closestSector ? `${closestSector.name} (${closestSector.distance_km} km)` : "Regional Corridor",
        distanceToNearestCorridorKm: closestSector ? closestSector.distance_km : null,
        availableSources: availableSources,
        limitations: limitations,
        locationStatus: "Location Provided",
        reviewStatus: initialReviewStatus,
        reviewHistory: (storedUser.assessment?.reviewHistory || []).concat([
          {
            action: "LOCATION_UPDATED_BY_CITIZEN",
            timestamp: new Date().toISOString(),
            actor: storedUser.name || "Citizen Monitor",
            notes: `Citizen updated monitoring location to ${structuredLocation.resolvedPlaceName}. Risk re-evaluated.`
          }
        ])
      };

      // Update user in session & persistent store
      storedUser.location = structuredLocation;
      storedUser.locationStatus = "Location Provided";
      storedUser.assessment = updatedAssessment;
      if (structuredLocation.resolvedPlaceName) {
        storedUser.district = structuredLocation.resolvedPlaceName.split(",")[0].trim();
      }

      sessionStorage.setItem("sg_user", JSON.stringify(storedUser));
      localStorage.setItem("sg_user", JSON.stringify(storedUser));

      try {
        let registeredList = JSON.parse(localStorage.getItem("sg_registered_users") || "[]");
        const idx = registeredList.findIndex(u => (u.email || "").toLowerCase() === (storedUser.email || "").toLowerCase());
        if (idx !== -1) {
          registeredList[idx].location = structuredLocation;
          registeredList[idx].locationStatus = "Location Provided";
          registeredList[idx].assessment = updatedAssessment;
          registeredList[idx].district = storedUser.district;
          localStorage.setItem("sg_registered_users", JSON.stringify(registeredList));
        }
      } catch (e) {}

      // Update in admin queue
      try {
        let adminQueue = JSON.parse(localStorage.getItem("sg_citizen_assessments_queue") || "[]");
        const qIdx = adminQueue.findIndex(item => item.citizenEmail?.toLowerCase() === storedUser.email?.toLowerCase());
        if (qIdx !== -1) {
          adminQueue[qIdx].capturedLocation = structuredLocation;
          adminQueue[qIdx].locationStatus = "Location Provided";
          adminQueue[qIdx].assessment = updatedAssessment;
        } else {
          adminQueue.unshift({
            id: storedUser.id,
            assessmentId: updatedAssessment.assessmentId,
            citizenName: storedUser.name,
            citizenEmail: storedUser.email,
            locationStatus: "Location Provided",
            capturedLocation: structuredLocation,
            assessment: updatedAssessment,
            createdAt: new Date().toISOString()
          });
        }
        localStorage.setItem("sg_citizen_assessments_queue", JSON.stringify(adminQueue));
      } catch (e) {}

      return {
        success: true,
        data: {
          user: storedUser,
          location: structuredLocation,
          assessment: updatedAssessment
        },
        message: "Monitoring location updated successfully. Geotechnical risk assessment synthesized."
      };
    }

    if (path === "/api/auth/me") {
      const stored = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
      if (stored) {
        return { success: true, data: JSON.parse(stored), message: "Current user profile." };
      }
      const err = new Error("No active session.");
      err.status = 401;
      throw err;
    }

    if (path === "/api/auth/logout") {
      sessionStorage.removeItem("sg_user");
      localStorage.removeItem("sg_user");
      return { success: true, data: null, message: "Logged out successfully." };
    }

    // --- WEB PUSH NOTIFICATION SUBSCRIPTION ENDPOINTS ---
    if (path === "/api/push/subscribe" || path.startsWith("/api/push/subscribe")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const subscription = body.subscription;
      if (!subscription) {
        const err = new Error("Subscription payload is required.");
        err.status = 400;
        throw err;
      }

      let subs = [];
      try {
        subs = JSON.parse(localStorage.getItem("sg_push_subscriptions") || "[]");
      } catch (e) {}

      const endpoint = subscription.endpoint || "";
      if (endpoint && !subs.some(s => s.endpoint === endpoint)) {
        subs.push({
          endpoint,
          keys: subscription.keys || {},
          subscribedAt: new Date().toISOString(),
          userAgent: body.device || navigator.userAgent
        });
        localStorage.setItem("sg_push_subscriptions", JSON.stringify(subs));
      }

      return {
        success: true,
        data: { subscribed: true, totalSubscribers: subs.length },
        message: "Device registered for early hazard warnings."
      };
    }

    if (path === "/api/push/unsubscribe" || path.startsWith("/api/push/unsubscribe")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const endpoint = body.endpoint || "";

      let subs = [];
      try {
        subs = JSON.parse(localStorage.getItem("sg_push_subscriptions") || "[]");
      } catch (e) {}

      subs = subs.filter(s => s.endpoint !== endpoint);
      localStorage.setItem("sg_push_subscriptions", JSON.stringify(subs));

      return {
        success: true,
        data: { unsubscribed: true },
        message: "Push subscription revoked."
      };
    }

    if (path === "/api/auth/forgot-password" || path.startsWith("/api/auth/forgot-password")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const email = (body.email || "").trim().toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const err = new Error("Please enter a valid official email address.");
        err.status = 400;
        err.code = "INVALID_EMAIL";
        throw err;
      }

      // In-memory / localStorage rate limiting (max 3 requests per 5 minutes per IP/client)
      const now = Date.now();
      let rateLimitData = {};
      try {
        rateLimitData = JSON.parse(localStorage.getItem("sg_pw_reset_rate_limit") || "{}");
      } catch (e) {}
      const clientHistory = (rateLimitData[email] || []).filter(ts => now - ts < 5 * 60 * 1000);
      if (clientHistory.length >= 3) {
        const err = new Error("Too many password reset requests. Please wait 5 minutes before trying again.");
        err.status = 429;
        err.code = "RATE_LIMITED";
        throw err;
      }
      clientHistory.push(now);
      rateLimitData[email] = clientHistory;
      localStorage.setItem("sg_pw_reset_rate_limit", JSON.stringify(rateLimitData));

      // Check whether account exists (officer, admin, or registered list)
      let registeredList = [];
      try {
        registeredList = JSON.parse(localStorage.getItem("sg_registered_users") || "[]");
      } catch (e) {}

      const isKnown = email === "officer@slopeguard.ner.gov.in" ||
                      email === "admin@slopeguard.ner.gov.in" ||
                      email === "citizen.test@slopeguard.com" ||
                      registeredList.some(u => (u.email || "").toLowerCase() === email);

      let devResetUrl = null;
      let devToken = null;

      if (isKnown) {
        // Generate secure 32-byte hex token
        const array = new Uint8Array(24);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          crypto.getRandomValues(array);
        } else {
          for (let i = 0; i < 24; i++) array[i] = Math.floor(Math.random() * 256);
        }
        devToken = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");

        // Store active token in sg_password_resets with 15-minute expiration
        let tokens = [];
        try {
          tokens = JSON.parse(localStorage.getItem("sg_password_resets") || "[]");
        } catch (e) {}

        // Invalidate previous tokens for this email
        tokens = tokens.filter(t => (t.email || "").toLowerCase() !== email && t.expiresAt > now);
        tokens.push({
          token: devToken,
          email: email,
          expiresAt: now + (15 * 60 * 1000), // 15 mins
          createdAt: now,
          used: false
        });
        localStorage.setItem("sg_password_resets", JSON.stringify(tokens));

        devResetUrl = `reset-password.html?token=${devToken}`;
        console.info(`[SlopeGuard Security] Password reset token generated for ${email}. Dev reset URL: ${devResetUrl}`);
      }

      // Security requirement: generic response that never exposes whether an account exists
      return {
        success: true,
        data: {
          message: "If an account matches the submitted email address, password-reset instructions will be sent to that address.",
          devResetUrl: devResetUrl, // Provided in development/client mock mode to enable testing the reset flow
          devToken: devToken
        },
        message: "If an account matches the submitted email address, password-reset instructions will be sent to that address."
      };
    }

    if (path === "/api/auth/verify-reset-token" || path.startsWith("/api/auth/verify-reset-token")) {
      const url = new URL(`http://localhost${path}`);
      const token = url.searchParams.get("token") || (options.body ? JSON.parse(options.body).token : "");

      if (!token) {
        const err = new Error("Reset token is required.");
        err.status = 400;
        err.code = "MISSING_TOKEN";
        throw err;
      }

      const now = Date.now();
      let tokens = [];
      try {
        tokens = JSON.parse(localStorage.getItem("sg_password_resets") || "[]");
      } catch (e) {}

      const match = tokens.find(t => t.token === token);
      if (!match) {
        const err = new Error("Invalid or unrecognized password reset token.");
        err.status = 400;
        err.code = "INVALID_TOKEN";
        throw err;
      }

      if (match.used) {
        const err = new Error("This password reset link has already been used. Please request a new one.");
        err.status = 400;
        err.code = "TOKEN_ALREADY_USED";
        throw err;
      }

      if (now > match.expiresAt) {
        const err = new Error("This password reset link has expired. Reset links are valid for 15 minutes.");
        err.status = 400;
        err.code = "TOKEN_EXPIRED";
        throw err;
      }

      return {
        success: true,
        data: {
          email: match.email,
          expiresAt: match.expiresAt
        },
        message: "Reset token is valid."
      };
    }

    if (path === "/api/auth/reset-password" || path.startsWith("/api/auth/reset-password")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const token = (body.token || "").trim();
      const password = body.password ? String(body.password) : "";
      const confirmPassword = body.confirmPassword ? String(body.confirmPassword) : "";

      if (!token) {
        const err = new Error("Reset token is required.");
        err.status = 400;
        err.code = "MISSING_TOKEN";
        throw err;
      }

      if (!password || password.length < 8) {
        const err = new Error("New password must be at least 8 characters long.");
        err.status = 400;
        err.code = "WEAK_PASSWORD";
        throw err;
      }

      if (password !== confirmPassword) {
        const err = new Error("Passwords do not match.");
        err.status = 400;
        err.code = "PASSWORD_MISMATCH";
        throw err;
      }

      const now = Date.now();
      let tokens = [];
      try {
        tokens = JSON.parse(localStorage.getItem("sg_password_resets") || "[]");
      } catch (e) {}

      const matchIndex = tokens.findIndex(t => t.token === token);
      if (matchIndex === -1) {
        const err = new Error("Invalid or unrecognized password reset token.");
        err.status = 400;
        err.code = "INVALID_TOKEN";
        throw err;
      }

      const match = tokens[matchIndex];
      if (match.used) {
        const err = new Error("This reset token has already been used. Please request a new reset link.");
        err.status = 400;
        err.code = "TOKEN_ALREADY_USED";
        throw err;
      }

      if (now > match.expiresAt) {
        const err = new Error("This reset token has expired. Please request a new reset link.");
        err.status = 400;
        err.code = "TOKEN_EXPIRED";
        throw err;
      }

      // Mark token as used (single use)
      tokens[matchIndex].used = true;
      localStorage.setItem("sg_password_resets", JSON.stringify(tokens));

      const targetEmail = (match.email || "").toLowerCase();

      // Update password in demo store or registered users
      if (targetEmail === "officer@slopeguard.ner.gov.in") {
        localStorage.setItem("sg_officer_custom_pw", password);
      } else if (targetEmail === "admin@slopeguard.ner.gov.in") {
        localStorage.setItem("sg_admin_custom_pw", password);
      } else if (targetEmail === "citizen.test@slopeguard.com") {
        localStorage.setItem("sg_citizen_custom_pw", password);
      }

      try {
        let registeredList = JSON.parse(localStorage.getItem("sg_registered_users") || "[]");
        const userIdx = registeredList.findIndex(u => (u.email || "").toLowerCase() === targetEmail);
        if (userIdx !== -1) {
          registeredList[userIdx].password = password;
          localStorage.setItem("sg_registered_users", JSON.stringify(registeredList));
        }
      } catch (e) {}

      return {
        success: true,
        data: { email: targetEmail },
        message: "Your password has been successfully reset. You may now sign in with your new password."
      };
    }

    // --- REGIONS ENDPOINTS ---
    if (path.startsWith("/api/regions") && !path.includes("/nearby") && !path.match(/\/api\/regions\/\d+/)) {
      const url = new URL(`http://localhost${path}`);
      const query = (url.searchParams.get("query") || "").toLowerCase();
      const risk = (url.searchParams.get("risk") || "all").toLowerCase();
      const dataStatus = (url.searchParams.get("data_status") || "all").toLowerCase();

      let filtered = REGIONS_DATABASE.filter(r => {
        if (query) {
          const match = r.name.toLowerCase().includes(query) ||
                        r.district.toLowerCase().includes(query) ||
                        r.state.toLowerCase().includes(query);
          if (!match) return false;
        }
        if (risk !== "all" && r.risk_level !== risk) return false;
        if (dataStatus !== "all" && r.data_status !== dataStatus) return false;
        return true;
      });

      return {
        success: true,
        data: filtered,
        total: filtered.length,
        message: "Monitored slope sectors retrieved (NER Telemetry)."
      };
    }

    if (path.startsWith("/api/regions/nearby")) {
      const url = new URL(`http://localhost${path}`);
      const lat = parseFloat(url.searchParams.get("lat"));
      const lng = parseFloat(url.searchParams.get("lng"));

      if (isNaN(lat) || isNaN(lng)) {
        return { success: false, code: "VALIDATION_ERROR", message: "Valid coordinates required." };
      }

      const listWithDistance = REGIONS_DATABASE.map(r => ({
        ...r,
        distance_km: calculateDistanceKm(lat, lng, r.lat, r.lng)
      })).sort((a, b) => a.distance_km - b.distance_km);

      return {
        success: true,
        data: listWithDistance.slice(0, 5),
        message: "Nearby monitored sectors retrieved."
      };
    }

    const regionIdMatch = path.match(/\/api\/regions\/(\d+)$/);
    if (regionIdMatch) {
      const id = parseInt(regionIdMatch[1], 10);
      const region = REGIONS_DATABASE.find(r => r.id === id);
      if (region) return { success: true, data: region, message: "Region details retrieved." };
      return { success: false, code: "NOT_FOUND", message: "Region not found." };
    }

    const regionAlertsMatch = path.match(/\/api\/regions\/(\d+)\/alerts$/);
    if (regionAlertsMatch) {
      const id = parseInt(regionAlertsMatch[1], 10);
      const region = REGIONS_DATABASE.find(r => r.id === id);
      return { success: true, data: region?.alerts || [], message: "Region alerts retrieved." };
    }

    // --- REPORTS ENDPOINTS (Sagin's Module) ---
    if (path.startsWith("/api/reports") && !path.match(/\/api\/reports\/\d+/)) {
      const url = new URL(`http://localhost${path}`);
      const query = (url.searchParams.get("query") || "").toLowerCase();
      const severity = (url.searchParams.get("severity") || "all").toLowerCase();

      let filtered = REPORTS_DATABASE.filter(r => {
        if (query) {
          const match = r.title.toLowerCase().includes(query) ||
                        r.area.toLowerCase().includes(query) ||
                        r.district.toLowerCase().includes(query) ||
                        r.category.toLowerCase().includes(query);
          if (!match) return false;
        }
        if (severity !== "all" && r.severity !== severity) return false;
        return true;
      });

      return {
        success: true,
        data: filtered,
        total: filtered.length,
        message: "Monitoring reports retrieved."
      };
    }

    const reportIdMatch = path.match(/\/api\/reports\/(\d+)$/);
    if (reportIdMatch) {
      const id = parseInt(reportIdMatch[1], 10);
      const report = REPORTS_DATABASE.find(r => r.id === id);
      if (report) return { success: true, data: report, message: "Report details retrieved." };
      return { success: false, code: "NOT_FOUND", message: "Report not found." };
    }

      // --- NOTIFICATIONS FEED ---
    if (path.startsWith("/api/notifications")) {
      const allAlerts = REGIONS_DATABASE.flatMap(r =>
        (r.alerts || []).map(a => ({
          ...a,
          region_id: r.id,
          region_name: r.name,
          district: r.district,
          state: r.state
        }))
      );
      let citizenNotifs = [];
      try {
        citizenNotifs = JSON.parse(localStorage.getItem("sg_citizen_notifications") || "[]");
      } catch (e) {}

      const combined = [...citizenNotifs, ...allAlerts];

      return {
        success: true,
        data: combined,
        unread_count: combined.filter(n => !n.is_read).length,
        message: "Notifications feed retrieved."
      };
    }

    // --- ENVIRONMENTAL INSIGHTS ENDPOINT ---
    if (path.startsWith("/api/environmental/insights")) {
      return {
        success: true,
        data: {
          region: "North Eastern Region (NER)",
          last_poll_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          active_pluviometers: 10,
          offline_pluviometers: 1,
          highest_precipitation_station: {
            name: "Sohra - Cherrapunji Escarpment",
            latest_rainfall_1h: 58.2,
            accumulated_rainfall_24h: 312.0
          },
          highest_pore_pressure_station: {
            name: "Sohra Escarpment",
            pore_pressure: "61.4 kPa",
            displacement: "16.2 mm"
          },
          radar_status: "OPERATIONAL (IMD Doppler Shillong Peak & Mohanbari)",
          insar_satellite_pass: "Sentinel-1 Ascending Track 121 (Acquired 18 h ago)",
          monsoon_status: "ACTIVE SOUTHWEST MONSOON TROUGH (Heavy precipitation warning in Meghalaya, Assam & Sikkim)"
        },
        message: "Environmental telemetry insights retrieved."
      };
    }

    // --- SYSTEM STATUS & HEALTH CHECK ENDPOINT ---
    if (path.startsWith("/api/system/status") || path.startsWith("/actuator/health")) {
      return {
        success: true,
        data: {
          overall_status: "HEALTHY",
          checked_at: new Date().toISOString(),
          services: [
            {
              name: "Spring Boot Core API",
              status: "OPERATIONAL",
              latency_ms: 38,
              version: "v3.2.0-RELEASE"
            },
            {
              name: "Geographic GIS Tile Service",
              status: "OPERATIONAL",
              provider: "OpenStreetMap & GSI WMS",
              latency_ms: 54
            },
            {
              name: "Environmental Telemetry Engine",
              status: "OPERATIONAL",
              source: "IMD Telemetry / Piezometer Array",
              last_poll_minutes_ago: 8
            },
            {
              name: "Landslide Risk AI Model (ConvLSTM)",
              status: "ACTIVE",
              version: "v2.4-convLSTM",
              last_inference_run: "12 min ago"
            }
          ],
          safety_notice: "System operational status indicates telemetry availability only. It does not certify unmonitored geographic zones as safe."
        },
        message: "System health check complete."
      };
    }

    // --- DASHBOARD SUMMARY ENDPOINT ---
    if (path.startsWith("/api/dashboard/summary")) {
      const totalLocations = REGIONS_DATABASE.length;
      const criticalCount = REGIONS_DATABASE.filter(r => r.risk_level === "critical").length;
      const highCount = REGIONS_DATABASE.filter(r => r.risk_level === "high").length;
      const moderateCount = REGIONS_DATABASE.filter(r => r.risk_level === "moderate").length;
      const lowCount = REGIONS_DATABASE.filter(r => r.risk_level === "low").length;
      const unassessedCount = REGIONS_DATABASE.filter(r => !r.risk_level || r.risk_level === "none").length;
      const currentTelemetry = REGIONS_DATABASE.filter(r => r.data_status === "current").length;

      return {
        success: true,
        data: {
          metrics: {
            monitored_locations: totalLocations,
            high_risk_locations: criticalCount + highCount,
            critical_risk_locations: criticalCount,
            environmental_freshness: `${currentTelemetry}/${totalLocations} Stations Live`,
            recent_reports_count: REPORTS_DATABASE.length
          },
          risk_distribution: {
            critical: criticalCount,
            high: highCount,
            moderate: moderateCount,
            low: lowCount,
            unassessed: unassessedCount,
            total: totalLocations
          },
          last_update: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        message: "Dashboard summary aggregation retrieved."
      };
    }

    // --- ADMIN CITIZEN ASSESSMENTS REVIEW ENDPOINTS ---
    if (path.startsWith("/api/admin/citizen-assessments") && !path.includes("/review")) {
      const url = new URL(`http://localhost${path}`);
      const statusFilter = (url.searchParams.get("status") || "all").toLowerCase();

      let queue = [];
      try {
        queue = JSON.parse(localStorage.getItem("sg_citizen_assessments_queue") || "[]");
      } catch (e) {}

      // Seed initial sample assessments if empty
      if (queue.length === 0) {
        queue = [
          {
            id: 1711200001,
            assessmentId: "ASM-HQ82A1",
            citizenName: "Bipul Kalita",
            citizenEmail: "bipul.kalita@citizen.ner.gov.in",
            capturedLocation: {
              latitude: 25.1812,
              longitude: 93.0315,
              accuracyMeters: 14,
              capturedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              source: "browser_geolocation",
              resolvedPlaceName: "Lower Haflong Settlement, Dima Hasao, Assam",
              citizenConfirmedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString()
            },
            assessment: {
              assessmentId: "ASM-HQ82A1",
              evaluatedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
              modelVersion: "v2.4-convLSTM",
              preliminaryRisk: "critical",
              factorOfSafety: "0.91 (High Failure Vulnerability)",
              confidence: "high",
              nearestCorridor: "Haflong - Jatinga Valley Sector (1.8 km)",
              distanceToNearestCorridorKm: 1.8,
              availableSources: ["GPS Telemetry", "IMD Automated Rain Gauge Network", "GSI Regional Landslide Database", "InSAR Geodetic Baseline"],
              limitations: [],
              reviewStatus: "Pending Review",
              reviewHistory: [
                {
                  action: "AUTOMATED_EVALUATION",
                  timestamp: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
                  actor: "SlopeGuard AI Risk Engine (v2.4-convLSTM)",
                  notes: "Immediate proximity to NH-27 slip zone triggering critical saturation warning."
                }
              ]
            },
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          {
            id: 1711200002,
            assessmentId: "ASM-MK91B4",
            citizenName: "Mary Lyngdoh",
            citizenEmail: "mary.lyngdoh@community.meghalaya.org",
            capturedLocation: {
              latitude: 25.3045,
              longitude: 91.7289,
              accuracyMeters: 18,
              capturedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
              source: "browser_geolocation",
              resolvedPlaceName: "Nongthymmai Ridge, East Khasi Hills, Meghalaya",
              citizenConfirmedAt: new Date(Date.now() - 109 * 60 * 1000).toISOString()
            },
            assessment: {
              assessmentId: "ASM-MK91B4",
              evaluatedAt: new Date(Date.now() - 109 * 60 * 1000).toISOString(),
              modelVersion: "v2.4-convLSTM",
              preliminaryRisk: "high",
              factorOfSafety: "1.12 (Elevated Hazard Buffer)",
              confidence: "high",
              nearestCorridor: "Sohra - Cherrapunji Escarpment (2.4 km)",
              distanceToNearestCorridorKm: 2.4,
              availableSources: ["GPS Telemetry", "IMD Automated Rain Gauge Network", "InSAR Geodetic Baseline"],
              limitations: ["Pore-pressure sensor ARG-02 transmission intermittent"],
              reviewStatus: "Under Review",
              reviewHistory: [
                {
                  action: "AUTOMATED_EVALUATION",
                  timestamp: new Date(Date.now() - 109 * 60 * 1000).toISOString(),
                  actor: "SlopeGuard AI Risk Engine (v2.4-convLSTM)",
                  notes: "Preliminary high risk computed due to 312mm/24h continuous rainfall."
                },
                {
                  action: "STAFF_INSPECTION_OPENED",
                  timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
                  actor: "Field Officer Sharma",
                  notes: "Review started to compare drone orthomosaic."
                }
              ]
            },
            createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem("sg_citizen_assessments_queue", JSON.stringify(queue));
      }

      let filtered = queue;
      if (statusFilter !== "all") {
        filtered = queue.filter(item => (item.assessment?.reviewStatus || "").toLowerCase() === statusFilter);
      }

      return {
        success: true,
        data: filtered,
        total: filtered.length,
        message: "Citizen assessment queue retrieved for administrator review."
      };
    }

    const reviewActionMatch = path.match(/\/api\/admin\/citizen-assessments\/([^/]+)\/review$/);
    if (reviewActionMatch) {
      const assessmentId = reviewActionMatch[1];
      const body = options.body ? JSON.parse(options.body) : {};
      const newStatus = body.status; // Confirmed | Corrected | Flagged for Investigation | Under Review
      const reviewNotes = body.notes || "";
      const correctedRisk = body.correctedRisk; // optional risk override
      const reviewerName = body.reviewer || "Staff Geotechnical Officer";

      if (!newStatus) {
        const err = new Error("Review status is required.");
        err.status = 400;
        throw err;
      }

      let queue = [];
      try {
        queue = JSON.parse(localStorage.getItem("sg_citizen_assessments_queue") || "[]");
      } catch (e) {}

      const idx = queue.findIndex(item => item.assessmentId === assessmentId || String(item.id) === assessmentId);
      if (idx === -1) {
        const err = new Error("Assessment not found.");
        err.status = 404;
        throw err;
      }

      const item = queue[idx];
      item.assessment.reviewStatus = newStatus;
      if (correctedRisk) {
        item.assessment.originalRisk = item.assessment.originalRisk || item.assessment.preliminaryRisk;
        item.assessment.correctedRisk = correctedRisk;
      }

      item.assessment.reviewHistory = item.assessment.reviewHistory || [];
      item.assessment.reviewHistory.push({
        action: `REVIEW_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
        timestamp: new Date().toISOString(),
        actor: reviewerName,
        notes: reviewNotes,
        correction: correctedRisk ? `Adjusted risk to ${correctedRisk.toUpperCase()}` : null
      });

      queue[idx] = item;
      localStorage.setItem("sg_citizen_assessments_queue", JSON.stringify(queue));

      return {
        success: true,
        data: item,
        message: `Assessment ${assessmentId} successfully updated to status '${newStatus}'.`
      };
    }

    // --- CITIZEN ROAD BLOCKAGE & LANDSLIDE INCIDENT REPORTING ENDPOINTS ---

    // 1. POST /api/incidents - Submit new incident report
    if (path === "/api/incidents" || (path.startsWith("/api/incidents") && options.method === "POST" && !path.includes("/review") && !path.includes("/upload"))) {
      let currentUser = null;
      try {
        const rawUser = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
        currentUser = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {}

      if (!currentUser) {
        const err = new Error("Authentication required. Please sign in to submit an incident report.");
        err.status = 401;
        err.code = "UNAUTHENTICATED";
        throw err;
      }

      const body = options.body ? JSON.parse(options.body) : {};
      const incidentType = (body.incidentType || body.category || "").trim();
      const description = (body.description || "").trim();
      const observedAt = body.observedAt;
      const location = body.location || {};
      const roadPassability = (body.roadPassability || "unknown").toLowerCase();
      const additionalInfo = (body.additionalInfo || "").trim();
      const photos = Array.isArray(body.photos) ? body.photos : [];

      if (!incidentType) {
        const err = new Error("Incident type is required. Please select a category.");
        err.status = 400;
        err.code = "MISSING_FIELDS";
        throw err;
      }
      if (!description || description.length < 5) {
        const err = new Error("Please provide a descriptive observation (minimum 5 characters).");
        err.status = 400;
        err.code = "MISSING_FIELDS";
        throw err;
      }
      if (!observedAt) {
        const err = new Error("Observation date and time is required.");
        err.status = 400;
        err.code = "MISSING_FIELDS";
        throw err;
      }

      const lat = Number(location.latitude);
      const lng = Number(location.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        const err = new Error("Valid geographic coordinates within range are required.");
        err.status = 400;
        err.code = "INVALID_COORDINATES";
        throw err;
      }

      let queue = getIncidentsQueue();

      // Anti-duplicate protection: check recent submissions from same user with near-identical coordinates (<10m)
      const now = Date.now();
      const isDuplicate = queue.some(inc => {
        if (inc.citizenId !== currentUser.id && inc.citizenEmail !== currentUser.email) return false;
        const timeDiffMs = Math.abs(now - new Date(inc.submittedAt).getTime());
        if (timeDiffMs > 120000) return false; // Within 2 minutes
        const dKm = calculateDistanceKm(lat, lng, inc.location?.latitude || 0, inc.location?.longitude || 0);
        return dKm < 0.05 && inc.incidentType === incidentType;
      });

      if (isDuplicate) {
        const err = new Error("Duplicate submission detected: A report for this incident was already recorded recently.");
        err.status = 409;
        err.code = "DUPLICATE_SUBMISSION";
        throw err;
      }

      // Correlate with nearest telemetry sector for AI Risk Analysis
      let nearestSectors = REGIONS_DATABASE.map(r => ({
        id: r.id,
        name: r.name,
        district: r.district,
        state: r.state,
        distance_km: calculateDistanceKm(lat, lng, r.lat, r.lng),
        risk_level: r.risk_level,
        slope_gradient: r.slope_gradient,
        accumulated_rainfall_24h: r.accumulated_rainfall_24h
      })).sort((a, b) => a.distance_km - b.distance_km);

      const closest = nearestSectors[0];
      const isProximate = closest && closest.distance_km <= 100;

      let preliminaryRisk = "moderate";
      let factorOfSafety = "1.25 (Monitored Slope Buffer)";
      if (isProximate) {
        if (closest.risk_level === "critical" && closest.distance_km < 25) {
          preliminaryRisk = "critical";
          factorOfSafety = "0.91 (High Failure Vulnerability)";
        } else if (closest.risk_level === "critical" || (closest.risk_level === "high" && closest.distance_km < 40)) {
          preliminaryRisk = "high";
          factorOfSafety = "1.10 (Elevated Hazard Buffer)";
        }
      }

      const refId = "INC-NER-" + Math.floor(1000 + Math.random() * 9000);
      const submissionTimestamp = new Date().toISOString();

      const newIncident = {
        id: refId,
        citizenId: currentUser.id,
        citizenName: currentUser.name || currentUser.fullName || "Citizen Monitor",
        citizenEmail: currentUser.email,
        incidentType: incidentType,
        category: incidentType,
        description: description,
        observedAt: new Date(observedAt).toISOString(),
        submittedAt: submissionTimestamp,
        location: {
          latitude: lat,
          longitude: lng,
          accuracy: Number(location.accuracy || 15),
          source: location.source || "browser_geolocation",
          placeName: location.placeName || (closest ? `${closest.name} (${closest.distance_km} km)` : "North Eastern Region Corridor"),
          roadName: location.roadName || "",
          landmark: location.landmark || ""
        },
        roadPassability: roadPassability,
        additionalInfo: additionalInfo,
        photos: photos,
        status: "Pending Verification",
        isVerified: false,
        verifiedIncidentType: null,
        verifiedPassability: null,
        verifiedAt: null,
        verifiedBy: null,
        reviewReason: null,
        aiRiskAnalysis: {
          nearestSector: closest ? `${closest.name} (${closest.distance_km} km)` : "Regional NER Envelope",
          distanceKm: closest ? closest.distance_km : null,
          regionalRiskLevel: closest ? closest.risk_level : "moderate",
          preliminaryRisk: preliminaryRisk,
          factorOfSafety: factorOfSafety,
          evaluatedAt: submissionTimestamp,
          modelVersion: "v2.4-convLSTM",
          sources: ["GPS Telemetry", "Citizen Mobile Telemetry", "IMD Rain Gauge Network", "GSI Landslide Hazard Map"],
          disclaimer: "Citizen observation recorded separately from geotechnical sensor model. Review required before validation."
        },
        auditTrail: [
          {
            action: "REPORT_SUBMITTED",
            timestamp: submissionTimestamp,
            actor: currentUser.name || currentUser.email,
            notes: `Citizen submitted observation with ${photos.length} photo evidence file(s).`
          }
        ]
      };

      queue.unshift(newIncident);
      saveIncidentsQueue(queue);

      // Create in-app notification for citizen
      const notifItem = {
        id: "NOTIF-INC-" + Date.now(),
        version: 1,
        title: `Report Submitted: ${refId}`,
        severity: preliminaryRisk === "critical" ? "critical" : (preliminaryRisk === "high" ? "high" : "moderate"),
        published_at: submissionTimestamp,
        description: `Your road blockage/landslide observation (${incidentType}) has been logged. Reference: ${refId}. Geotechnical staff will inspect.`,
        recommended_actions: "If you are in immediate danger, move away from the slope and contact NDRF (1078).",
        incident_id: refId,
        is_read: false
      };

      try {
        let notifs = JSON.parse(localStorage.getItem("sg_citizen_notifications") || "[]");
        notifs.unshift(notifItem);
        localStorage.setItem("sg_citizen_notifications", JSON.stringify(notifs));
        if (window.LW.notifications?.upsertAlert) {
          window.LW.notifications.upsertAlert(notifItem);
        }
      } catch (e) {}

      return {
        success: true,
        data: newIncident,
        message: `Incident report ${refId} submitted successfully.`
      };
    }

    // 2. GET /api/citizen/incidents - Citizen's own incident reports
    if (path.startsWith("/api/citizen/incidents")) {
      let currentUser = null;
      try {
        const rawUser = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
        currentUser = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {}

      if (!currentUser) {
        const err = new Error("Authentication required.");
        err.status = 401;
        err.code = "UNAUTHENTICATED";
        throw err;
      }

      const queue = getIncidentsQueue();
      const citizenReports = queue.filter(inc => 
        inc.citizenId === currentUser.id ||
        (inc.citizenEmail && currentUser.email && inc.citizenEmail.toLowerCase() === currentUser.email.toLowerCase())
      );

      return {
        success: true,
        data: citizenReports,
        total: citizenReports.length,
        message: "Citizen incidents retrieved."
      };
    }

    // 3. GET /api/incidents/map-markers - Layer-ready payload for Risk Map
    if (path.startsWith("/api/incidents/map-markers")) {
      const queue = getIncidentsQueue();

      const reportedIncidents = queue.filter(i => !i.isVerified && i.status !== "Rejected");
      const verifiedLandslides = queue.filter(i => i.isVerified && (
        i.incidentType?.toLowerCase().includes("landslide") ||
        i.incidentType?.toLowerCase().includes("movement") ||
        i.incidentType?.toLowerCase().includes("crack")
      ));
      const verifiedBlockages = queue.filter(i => i.isVerified && (
        i.roadPassability === "completely blocked" ||
        i.roadPassability === "partially blocked" ||
        i.verifiedPassability === "completely blocked" ||
        i.verifiedPassability === "partially blocked"
      ));

      return {
        success: true,
        data: {
          reportedIncidents,
          verifiedLandslides,
          verifiedBlockages,
          verifiedRoadBlockages: verifiedBlockages,
          total: queue.length
        },
        message: "Incident map layers retrieved."
      };
    }

    // 4. POST /api/admin/incidents/:id/review - Admin review adjudication
    const adminIncidentReviewMatch = path.match(/\/api\/admin\/incidents\/([^/]+)\/review$/);
    if (adminIncidentReviewMatch) {
      let currentUser = null;
      try {
        const rawUser = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
        currentUser = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {}

      const userRole = (currentUser?.role || "").toUpperCase();
      if (userRole !== "ADMIN" && userRole !== "OFFICER") {
        const err = new Error("Forbidden: Only authorized geotechnical administrators or field officers may adjudicate incident reports.");
        err.status = 403;
        err.code = "FORBIDDEN";
        throw err;
      }

      const incidentId = adminIncidentReviewMatch[1];
      const body = options.body ? JSON.parse(options.body) : {};
      const action = (body.action || "UPDATE_STATUS").toUpperCase();
      const status = body.status; // 'Under Review', 'Verified', 'Rejected', 'Resolved', 'Additional Info Requested', 'Reopened'
      const reviewReason = body.reviewReason || body.notes || "";
      const verifiedIncidentType = body.verifiedIncidentType || null;
      const verifiedPassability = body.verifiedPassability || null;
      const reviewerName = currentUser?.name || "Geotechnical Adjudicator";

      let queue = getIncidentsQueue();
      const idx = queue.findIndex(i => i.id === incidentId);
      if (idx === -1) {
        const err = new Error(`Incident report '${incidentId}' not found.`);
        err.status = 404;
        err.code = "NOT_FOUND";
        throw err;
      }

      const target = queue[idx];
      const nowIso = new Date().toISOString();

      if (status) {
        target.status = status;
        if (status === "Verified") {
          target.isVerified = true;
          target.verifiedAt = nowIso;
          target.verifiedBy = reviewerName;
          target.verifiedIncidentType = verifiedIncidentType || target.incidentType;
          target.verifiedPassability = verifiedPassability || target.roadPassability;
        } else if (status === "Rejected") {
          target.isVerified = false;
        } else if (status === "Resolved") {
          target.isVerified = true;
          target.resolvedAt = nowIso;
          target.resolvedBy = reviewerName;
        }
      }

      target.reviewReason = reviewReason;
      target.auditTrail = target.auditTrail || [];
      target.auditTrail.push({
        action: action,
        timestamp: nowIso,
        actor: reviewerName,
        reason: reviewReason,
        statusResult: target.status,
        notes: reviewReason
      });

      queue[idx] = target;
      saveIncidentsQueue(queue);

      // Trigger notification for citizen
      let notifTitle = `Incident Report ${incidentId} Updated`;
      let notifDesc = `Status has changed to '${target.status}'. Reason: ${reviewReason || 'Geotechnical assessment complete.'}`;
      let notifSev = target.status === "Verified" ? "high" : "moderate";

      if (target.status === "Verified") {
        notifTitle = `Verified Road/Slope Incident: ${incidentId}`;
        notifDesc = `Geotechnical staff confirmed report. Road status: ${target.verifiedPassability || target.roadPassability}.`;
      } else if (target.status === "Resolved") {
        notifTitle = `Incident Resolved: ${incidentId}`;
        notifDesc = `Road blockage has been cleared and slope declared stable.`;
        notifSev = "low";
      } else if (target.status === "Additional Info Requested") {
        notifTitle = `Information Requested on Report ${incidentId}`;
        notifDesc = `Reviewer note: ${reviewReason}`;
        notifSev = "moderate";
      }

      const updateNotif = {
        id: "NOTIF-INC-UPD-" + Date.now(),
        version: 1,
        title: notifTitle,
        severity: notifSev,
        published_at: nowIso,
        description: notifDesc,
        incident_id: incidentId,
        is_read: false
      };

      try {
        let notifs = JSON.parse(localStorage.getItem("sg_citizen_notifications") || "[]");
        notifs.unshift(updateNotif);
        localStorage.setItem("sg_citizen_notifications", JSON.stringify(notifs));
        if (window.LW.notifications?.upsertAlert) {
          window.LW.notifications.upsertAlert(updateNotif);
        }
      } catch (e) {}

      return {
        success: true,
        data: target,
        message: `Incident ${incidentId} review successfully recorded as '${target.status}'.`
      };
    }

    // 5. GET /api/incidents/:id - Incident report details
    const incidentIdMatch = path.match(/\/api\/incidents\/([^/]+)$/);
    if (incidentIdMatch && !path.includes("/map-markers")) {
      const id = incidentIdMatch[1];
      const queue = getIncidentsQueue();
      const found = queue.find(i => i.id === id);
      if (!found) {
        return { success: false, code: "NOT_FOUND", message: `Incident report '${id}' not found.` };
      }
      return { success: true, data: found, message: "Incident details retrieved." };
    }

    // 6. GET /api/incidents - List and filter incidents
    if (path === "/api/incidents" || (path.startsWith("/api/incidents") && (!options.method || options.method === "GET"))) {
      const url = new URL(`http://localhost${path}`);
      const statusFilter = (url.searchParams.get("status") || "all").toLowerCase();
      const categoryFilter = (url.searchParams.get("category") || "all").toLowerCase();
      const passabilityFilter = (url.searchParams.get("passability") || "all").toLowerCase();
      const verifiedOnly = url.searchParams.get("verifiedOnly") === "true";
      const q = (url.searchParams.get("q") || "").toLowerCase();

      let queue = getIncidentsQueue();

      let filtered = queue.filter(item => {
        if (verifiedOnly && !item.isVerified) return false;
        if (statusFilter !== "all" && item.status?.toLowerCase() !== statusFilter) return false;
        if (categoryFilter !== "all" && item.incidentType?.toLowerCase() !== categoryFilter && item.category?.toLowerCase() !== categoryFilter) return false;
        if (passabilityFilter !== "all" && item.roadPassability?.toLowerCase() !== passabilityFilter && item.verifiedPassability?.toLowerCase() !== passabilityFilter) return false;
        if (q) {
          const matchTitle = item.incidentType?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchRoad = item.location?.roadName?.toLowerCase().includes(q);
          const matchPlace = item.location?.placeName?.toLowerCase().includes(q);
          const matchId = item.id?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchRoad && !matchPlace && !matchId) return false;
        }
        return true;
      });

      return {
        success: true,
        data: filtered,
        total: filtered.length,
        message: "Incidents list retrieved."
      };
    }

    // 7. POST /api/incidents/upload - File upload validation
    if (path === "/api/incidents/upload" || path.startsWith("/api/incidents/upload")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const filename = body.filename || `evidence_${Date.now()}.jpg`;
      const mimeType = body.mimeType || "image/jpeg";
      const size = body.size || 102400;

      if (size > 10 * 1024 * 1024) {
        const err = new Error("Uploaded photo exceeds maximum allowed limit of 10 MB.");
        err.status = 400;
        err.code = "FILE_TOO_LARGE";
        throw err;
      }

      const photoId = "PHOTO-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      return {
        success: true,
        data: {
          id: photoId,
          filename: photoId + "_" + filename.replace(/[^a-zA-Z0-9._-]/g, "_"),
          mimeType,
          size,
          url: body.dataUrl || "assets/images/incidents/debris_road_block.jpg",
          uploadedAt: new Date().toISOString()
        },
        message: "Photo upload confirmed."
      };
    }

    return null;
  };

  // Export Services
  // Export Services
  window.LW.regionsService = {
    async getAll(filters = {}) {
      try {
        const response = await window.LW.api.get("/api/risks", filters);
        const list = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (Array.isArray(response.value) ? response.value : []));
        if (list && list.length > 0) {
          return list.map(item => ({
            id: item.id,
            name: item.locationName || item.name || "Monitored Sector",
            district: item.district || item.state || "North Eastern Region",
            state: item.state || "Northeast India",
            lat: Number(item.latitude),
            lng: Number(item.longitude),
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            elevation: item.elevation || 1200,
            risk_level: (item.riskCategory || item.risk_level || "low").toLowerCase().replace("very_high", "critical"),
            data_status: item.sampleData ? "current" : "current",
            assessment_available: true,
            assessed_at: item.observationTimestamp || new Date().toISOString(),
            slope_gradient: item.slopeDegrees || 34.5,
            accumulated_rainfall_24h: item.rainfallValue || 0,
            model_version: "DEMO_NOT_VALIDATED",
            source_type: item.dataSource || "SlopeGuard Northeast Hill Tracts Station",
            description: `Monitored landslide slope corridor in ${item.state}. Real-time Copernicus DEM and Open-Meteo precipitation tracking active.`
          }));
        }
      } catch (err) {
        console.warn("[regionsService] Live /api/risks unavailable, using fallback:", err);
      }
      return REGIONS_DATABASE;
    },
    async getById(id) {
      try {
        const response = await window.LW.api.get(`/api/risks/${id}`);
        const item = response.data || response;
        if (item && item.id) {
          return {
            id: item.id,
            name: item.locationName || item.name || "Monitored Sector",
            district: item.district || item.state || "North Eastern Region",
            state: item.state || "Northeast India",
            lat: Number(item.latitude),
            lng: Number(item.longitude),
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            elevation: item.elevation || 1200,
            risk_level: (item.riskCategory || item.risk_level || "low").toLowerCase().replace("very_high", "critical"),
            data_status: "current",
            assessment_available: true,
            assessed_at: item.observationTimestamp || new Date().toISOString(),
            slope_gradient: item.slopeDegrees || 34.5,
            accumulated_rainfall_24h: item.rainfallValue || 0,
            model_version: "DEMO_NOT_VALIDATED",
            source_type: item.dataSource || "SlopeGuard Northeast Hill Tracts Station"
          };
        }
      } catch (e) {}
      return REGIONS_DATABASE.find(r => r.id === parseInt(id, 10)) || null;
    },
    async getNearby(lat, lng) {
      const all = await this.getAll();
      function getDist(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      return all
        .map(r => ({ ...r, distance_km: Math.round(getDist(lat, lng, r.lat, r.lng) * 10) / 10 }))
        .sort((a, b) => a.distance_km - b.distance_km);
    },
    async getAlerts(regionId) {
      try {
        const response = await window.LW.api.get("/api/alerts");
        const list = Array.isArray(response) ? response : (Array.isArray(response.content) ? response.content : (Array.isArray(response.data) ? response.data : []));
        return list;
      } catch (e) {
        return [];
      }
    },
    async getIncidents(filters = {}) {
      if (window.LW.incidentsService) {
        return await window.LW.incidentsService.getAllIncidents(filters);
      }
      const response = await window.LW.api.get("/api/reports", filters);
      return Array.isArray(response) ? response : (response.data || []);
    },
    async getIncidentById(id) {
      if (window.LW.incidentsService) {
        return await window.LW.incidentsService.getIncidentById(id);
      }
      const response = await window.LW.api.get(`/api/reports/${id}`);
      return response.data || response;
    },
    async getIncidentMapMarkers() {
      const incidents = await this.getIncidents();
      return {
        reportedIncidents: incidents.filter(i => !i.isVerified),
        verifiedLandslides: incidents.filter(i => i.isVerified && !i.roadPassability?.includes("blocked")),
        verifiedBlockages: incidents.filter(i => i.isVerified && i.roadPassability?.includes("blocked"))
      };
    }
  };

  window.LW.reportsService = {
    async getAll(filters = {}) {
      try {
        const response = await window.LW.api.get("/api/reports", filters);
        const list = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);
        if (list && list.length > 0) {
          return list.map(item => ({
            id: item.id,
            title: item.incidentCategory ? `${item.incidentCategory.replace(/_/g, ' ')} Incident #${item.id}` : `Hazard Observation #${item.id}`,
            area: item.locationDescription || "NER Corridor",
            district: "NER District",
            state: "Northeast India",
            category: item.incidentCategory || "HAZARD",
            severity: (item.status === "VERIFIED" ? "critical" : (item.status === "UNDER_REVIEW" ? "high" : "moderate")),
            created_at: item.reportedTimestamp || new Date().toISOString(),
            summary: item.description || "Citizen field hazard report."
          }));
        }
      } catch (e) {
        console.warn("[reportsService] Failed to load live reports:", e);
      }
      return typeof REPORTS_DATABASE !== "undefined" ? REPORTS_DATABASE : [];
    },
    async getById(id) {
      try {
        const response = await window.LW.api.get(`/api/reports/${id}`);
        const item = response.data || response;
        if (item) {
          return {
            id: item.id,
            title: item.incidentCategory ? `${item.incidentCategory.replace(/_/g, ' ')} Incident #${item.id}` : `Hazard Observation #${item.id}`,
            area: item.locationDescription || "NER Corridor",
            district: "NER District",
            state: "Northeast India",
            category: item.incidentCategory || "HAZARD",
            severity: (item.status === "VERIFIED" ? "critical" : (item.status === "UNDER_REVIEW" ? "high" : "moderate")),
            created_at: item.reportedTimestamp || new Date().toISOString(),
            summary: item.description || "Citizen field hazard report."
          };
        }
      } catch (e) {}
      return null;
    }
  };

  window.LW.environmentalService = {
    async getInsights() {
      try {
        const [statusRes, rainfallRes] = await Promise.all([
          window.LW.api.get("/api/environmental/status").catch(() => null),
          window.LW.api.get("/api/environmental/rainfall", { latitude: 25.5788, longitude: 91.8933 }).catch(() => null)
        ]);
        const status = statusRes?.data || statusRes || {};
        const rainfall = rainfallRes?.data || rainfallRes || {};

        return {
          highest_precipitation_station: {
            name: "Shillong Ridge (Live Telemetry)",
            accumulated_rainfall_24h: rainfall.precipitationMm24h != null ? rainfall.precipitationMm24h : 142.0
          },
          highest_pore_pressure_station: {
            pore_pressure: "52.6 kPa",
            displacement: "18.4 mm"
          },
          radar_status: status.openMeteoOperational ? "OPERATIONAL" : "SIMULATED",
          insar_satellite_pass: "Copernicus DEM GLO-30 + Sentinel InSAR",
          monsoon_status: "Active monitoring over Northeast Hill Tracts"
        };
      } catch (e) {
        return null;
      }
    }
  };

  window.LW.systemStatusService = {
    async getStatus() {
      try {
        const [healthRes, modelRes, envRes] = await Promise.all([
          window.LW.api.get("/api/health").catch(() => null),
          window.LW.api.get("/api/risks/model-status").catch(() => null),
          window.LW.api.get("/api/environmental/status").catch(() => null)
        ]);

        const health = healthRes?.data || healthRes || {};
        const model = modelRes?.data || modelRes || {};
        const env = envRes?.data || envRes || {};

        return {
          status: "operational",
          services: [
            {
              name: "Spring Boot 3 Persistence Engine",
              version: "MySQL 8.0 & Hibernate JPA",
              status: health.status === "UP" ? "ONLINE" : "OFFLINE"
            },
            {
              name: "Python AI Microservice",
              version: `${model.model_version || '0.1.0'} (${model.model_status || 'DEMO_NOT_VALIDATED'})`,
              status: model.service_status === "ready" ? "READY" : "CONNECTING"
            },
            {
              name: "Copernicus DEM GLO-30",
              version: "ESA / Airbus GLO-30 Elevation & Slope",
              status: env.copernicusDemOperational !== false ? "OPERATIONAL" : "DEGRADED"
            },
            {
              name: "Open-Meteo Precipitation Telemetry",
              version: "Atmospheric Rainfall Satellite Feeds",
              status: env.openMeteoOperational !== false ? "OPERATIONAL" : "DEGRADED"
            }
          ]
        };
      } catch (e) {
        return null;
      }
    }
  };

  window.LW.dashboardService = {
    async getSummary() {
      try {
        const [overviewRes, risksSummaryRes, modelRes] = await Promise.all([
          window.LW.api.get("/api/public/overview").catch(() => null),
          window.LW.api.get("/api/risks/summary").catch(() => null),
          window.LW.api.get("/api/risks/model-status").catch(() => null)
        ]);

        const overview = overviewRes?.data || overviewRes || {};
        const risks = risksSummaryRes?.data || risksSummaryRes || {};
        const model = modelRes?.data || modelRes || {};

        const totalLocs = overview.monitored_regions || risks.totalMonitoredLocations || 6;
        const elevatedCount = overview.elevated_risk_regions || (risks.categoryCounts?.HIGH || 0) + (risks.categoryCounts?.VERY_HIGH || 0);

        return {
          metrics: {
            monitored_locations: totalLocs,
            elevated_risk: elevatedCount,
            active_alerts: 1,
            data_freshness_status: overview.data_status || "OPERATIONAL"
          },
          risk_distribution: {
            critical: risks.categoryCounts?.VERY_HIGH || 1,
            high: risks.categoryCounts?.HIGH || 2,
            moderate: risks.categoryCounts?.MODERATE || 2,
            low: risks.categoryCounts?.LOW || 1
          },
          model_status: model.model_status || "DEMO_NOT_VALIDATED",
          output_type: model.output_type || "UNCALIBRATED_HAZARD_SCORE",
          calibration_status: model.calibration_status || "CALIBRATION_DEFERRED",
          threshold_review_status: model.threshold_review_status || "PENDING_EXPERT_REVIEW",
          model_disclaimer: model.disclaimer || "EXPERIMENTAL PROTOTYPE: Not for official emergency warning use.",
          last_update: overview.last_updated || new Date().toISOString()
        };
      } catch (e) {
        return null;
      }
    }
  };

  window.LW.authService = {
    async login(username, password, remember = true) {
      if (window.LW.auth && window.LW.auth.login) {
        return await window.LW.auth.login(username, password, remember);
      }
      const response = await window.LW.api.post("/api/auth/login", { username, email: username, password, remember });
      return response.data || null;
    },
    async register(name, email, password, district, location = null) {
      if (typeof name === "object" && name !== null) {
        const opts = name;
        if (window.LW.auth && window.LW.auth.register) {
          return await window.LW.auth.register(opts);
        }
        const response = await window.LW.api.post("/api/auth/register", opts);
        return response.data || null;
      }
      if (window.LW.auth && window.LW.auth.register) {
        return await window.LW.auth.register({ fullName: name, email, password, district, location });
      }
      const response = await window.LW.api.post("/api/auth/register", { name, email, password, district, location });
      return response.data || null;
    },
    async logout() {
      if (window.LW.auth && window.LW.auth.logout) {
        return await window.LW.auth.logout();
      }
      await window.LW.api.post("/api/auth/logout").catch(() => {});
      sessionStorage.removeItem("sg_user");
      localStorage.removeItem("sg_user");
    },
    getCurrentUser() {
      if (window.LW.auth && window.LW.auth.getUser) {
        return window.LW.auth.getUser();
      }
      try {
        const stored = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    },
    async forgotPassword(email) {
      if (window.LW.auth && window.LW.auth.forgotPassword) {
        return await window.LW.auth.forgotPassword(email);
      }
      const response = await window.LW.api.post("/api/auth/forgot-password", { email });
      return response.data || response;
    },
    async verifyResetToken(token) {
      if (window.LW.auth && window.LW.auth.verifyResetToken) {
        return await window.LW.auth.verifyResetToken(token);
      }
      const response = await window.LW.api.get(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      return response.data || response;
    },
    async resetPassword(token, password, confirmPassword) {
      if (window.LW.auth && window.LW.auth.resetPassword) {
        return await window.LW.auth.resetPassword(token, password, confirmPassword);
      }
      const response = await window.LW.api.post("/api/auth/reset-password", { token, password, confirmPassword });
      return response.data || response;
    },
    async updateLocation(location) {
      if (window.LW.auth && window.LW.auth.updateLocation) {
        return await window.LW.auth.updateLocation(location);
      }
      const response = await window.LW.api.post("/api/user/location", { location });
      return response.data || response;
    }
  };
})();

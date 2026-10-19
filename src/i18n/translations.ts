export type Language = "en" | "hi" | "mr";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  tabWayfinding: string;
  tabWitness: string;
  tabOperations: string;
  hazardAlert: string;
  heatIndex: string;
  currentTemp: string;
  humidity: string;
  monitoredZones: string;
  selectZone: string;
  filterAll: string;
  filterWater: string;
  filterShade: string;
  filterCooling: string;
  filterFirstAid: string;
  statusOperational: string;
  statusRestoring: string;
  statusInoperable: string;
  actionReport: string;
  actionAttest: string;
  actionInspect: string;
  witnessScore: string;
  hours: string;
  aiProposalTitle: string;
  aiProposalDisclaimer: string;
  submitReport: string;
  submitAttestation: string;
  cancel: string;
  privacyNotice: string;
  operationsTitle: string;
  heatCoverage: string;
  activeOutages: string;
  verifiedAsrs: string;
  exportAuditBundle: string;
  noFacilitiesFound: string;
  searchPlaceholder: string;
  liveEvidenceProof: string;
  freshness: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    appName: "HeatProof",
    tagline: "Verifiable Proof-of-Adaptation Network for Extreme-Heat Relief",
    tabWayfinding: "Relief Wayfinding",
    tabWitness: "Witness & Attest",
    tabOperations: "Operations & Policy",
    hazardAlert: "Extreme Heat Emergency Active",
    heatIndex: "Heat Index",
    currentTemp: "Ambient Temp",
    humidity: "Relative Humidity",
    monitoredZones: "Monitored Municipal Zones",
    selectZone: "Select Zone",
    filterAll: "All Resources",
    filterWater: "Drinking Water",
    filterShade: "Shaded Rest",
    filterCooling: "Cooling Center",
    filterFirstAid: "First Aid / ORS",
    statusOperational: "Operational",
    statusRestoring: "Restoring",
    statusInoperable: "Inoperable",
    actionReport: "Report Update",
    actionAttest: "Corroborate Attestation",
    actionInspect: "Inspect Cryptographic Proof",
    witnessScore: "Witness Trust Score",
    hours: "Hours",
    aiProposalTitle: "Evidence Rules Assistant Proposal",
    aiProposalDisclaimer: "AI Proposes; Humans Decide. Verify observations before submitting.",
    submitReport: "Submit Sanitized Observation",
    submitAttestation: "Record Attestation on Ledger",
    cancel: "Cancel",
    privacyNotice: "Automatic Client Privacy Filter: EXIF stripped, coordinates coarsened, zero PII logged on-chain.",
    operationsTitle: "Civic Operations & Climate Policy Command",
    heatCoverage: "Heat Zone Coverage",
    activeOutages: "Active Priority Outages",
    verifiedAsrs: "Verified Adaptation Receipts (ASR)",
    exportAuditBundle: "Export Complete Audit Bundle (JSON)",
    noFacilitiesFound: "No relief facilities match the selected filter criteria.",
    searchPlaceholder: "Search facilities, streets, or transit hubs...",
    liveEvidenceProof: "Cryptographic Proof Digest",
    freshness: "Data Freshness",
  },
  hi: {
    appName: "हीटप्रूफ (HeatProof)",
    tagline: "भीषण गर्मी राहत बुनियादी ढांचे के लिए सत्यापन योग्य अनुकूलन नेटवर्क",
    tabWayfinding: "राहत केंद्र खोजें",
    tabWitness: "साक्ष्य और सत्यापन",
    tabOperations: "प्रशासन एवं निगरानी",
    hazardAlert: "भीषण गर्मी चेतावनी सक्रिय",
    heatIndex: "हीट इंडेक्स",
    currentTemp: "तापमान",
    humidity: "आर्द्रता",
    monitoredZones: "निगरानी क्षेत्र",
    selectZone: "क्षेत्र चुनें",
    filterAll: "सभी संसाधन",
    filterWater: "शीतल पेयजल",
    filterShade: "छायादार विश्राम",
    filterCooling: "कूलिंग सेंटर",
    filterFirstAid: "प्राथमिक उपचार / ओआरएस",
    statusOperational: "चालू / उपलब्ध",
    statusRestoring: "पुनर्बहाली प्रगति पर",
    statusInoperable: "बंद / बाधित",
    actionReport: "स्थिति रिपोर्ट करें",
    actionAttest: "गवाह पुष्टि करें",
    actionInspect: "ब्लॉकचेन सबूत देखें",
    witnessScore: "सत्यापन स्कोर",
    hours: "समय",
    aiProposalTitle: "एआई साक्ष्य सहायक सुझाव",
    aiProposalDisclaimer: "एआई सुझाव देता है; निर्णय इंसान लेते हैं। सबमिट करने से पहले जांच करें।",
    submitReport: "सुरक्षित रिपोर्ट दर्ज करें",
    submitAttestation: "सत्यापन लेजर पर दर्ज करें",
    cancel: "रद्द करें",
    privacyNotice: "क्लाइंट प्राइवेसी सुरक्षा: फोटो से व्यक्तिगत डेटा और स्थान सुरक्षित रखा जाता है।",
    operationsTitle: "नगर निगम आपदा एवं नीति कमांड सेंटर",
    heatCoverage: "गर्मी क्षेत्र कवरेज",
    activeOutages: "सक्रिय आउटेज कतार",
    verifiedAsrs: "सत्यापित सेवा रसीदें (ASR)",
    exportAuditBundle: "संपूर्ण ऑडिट बंडल डाउनलोड करें",
    noFacilitiesFound: "चुने गए फिल्टर के अनुसार कोई सुविधा नहीं मिली।",
    searchPlaceholder: "सुविधा या क्षेत्र खोजें...",
    liveEvidenceProof: "क्रिप्टोग्राफिक प्रमाण",
    freshness: "डेटा ताजगी",
  },
  mr: {
    appName: "हीटप्रूफ (HeatProof)",
    tagline: "तीव्र उष्णता निवारण सुविधेसाठी सत्यापित अनुकूलन नेटवर्क",
    tabWayfinding: "उष्णता निवारण केंद्र शोधा",
    tabWitness: "पुरावा व साक्ष",
    tabOperations: "प्रशासकीय नियंत्रण",
    hazardAlert: "तीव्र उष्णतेची लाट सक्रिय",
    heatIndex: "उष्णता निर्देशांक (Heat Index)",
    currentTemp: "तापमान",
    humidity: "हवेतील आर्द्रता",
    monitoredZones: "निरीक्षण क्षेत्र",
    selectZone: "विभाग निवडा",
    filterAll: "सर्व सुविधा",
    filterWater: "पिण्याचे पाणी",
    filterShade: "सावली व विश्रांती",
    filterCooling: "कुलिंग सेंटर",
    filterFirstAid: "प्रथमोपचार / ओआरएस",
    statusOperational: "सुरू / उपलब्ध",
    statusRestoring: "दुरुस्ती चालू",
    statusInoperable: "बंद / नादुरुस्त",
    actionReport: "सद्यस्थिती नोंदवा",
    actionAttest: "साक्ष पडताळणी करा",
    actionInspect: "क्रिप्टोग्राफिक पुरावा तपासा",
    witnessScore: "विश्वासार्हता गुण",
    hours: "वेळ",
    aiProposalTitle: "एआय साहाय्यक पडताळणी",
    aiProposalDisclaimer: "एआय केवळ सूचना देतो; निर्णय मानवाचा असतो. माहिती तपासून नोंदवा.",
    submitReport: "गोपनीय साक्ष नोंदवा",
    submitAttestation: "लेजरवर साक्ष नोंदवा",
    cancel: "रद्द करा",
    privacyNotice: "गोपनीयता संरक्षण: फोटोतील वैयक्तिक माहिती व अचूक लोकेशन सुरक्षित ठेवले जाते.",
    operationsTitle: "महानगरपालिका उष्णता व्यवस्थापन कक्ष",
    heatCoverage: "उष्णता क्षेत्र संरक्षण",
    activeOutages: "सक्रिय दुरुस्ती यादी",
    verifiedAsrs: "सत्यापित सेवा पावत्या (ASR)",
    exportAuditBundle: "संपूर्ण ऑडिट बंडल डाउनलोड करा",
    noFacilitiesFound: "निवडलेल्या निकषानुसार कोणतीही सुविधा आढळली नाही.",
    searchPlaceholder: "सुविधा किंवा ठिकाण शोधा...",
    liveEvidenceProof: "क्रिप्टोग्राफिक पुरावा",
    freshness: "माहिती ताजेपणा",
  },
};

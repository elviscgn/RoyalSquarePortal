import type { Locale } from '../types'

export interface TranslationDictionary {
  // Navigation
  home: string
  requests: string
  documents: string
  finances: string
  tasks: string
  onboarding: string
  simpleModeOn: string
  simpleModeOff: string

  // Headers & Welcome
  welcomeBack: string
  wealthHorizon: string
  financesIntroDesc: string
  needsAttention: string
  activeCases: string
  allInOnePlace: string

  // Financial Position
  currentPosition: string
  netWorth: string
  netWorthDesc: string
  assets: string
  liabilities: string
  investments: string
  retirement: string
  protection: string
  goalsTitle: string
  addGoal: string
  sharedGoalsPrivate: string
  voiceRecalibrate: string

  // Auth / Login
  signIn: string
  privateClient: string
  adviserWorkspace: string
  signInSubtitleClient: string
  signInSubtitleAdviser: string
  password: string
  oneTimePin: string
  authMethod: string
  emailOrMobile: string
  adviserEmail: string
  rememberDevice: string
  enterClientPortal: string
  enterAdviserWorkspace: string
  signInAndOnboard: string
  newToRoyalSquare: string
  beginOnboarding: string

  // Common Actions & Badges
  uploadDoc: string
  exportPdf: string
  signAndSave: string
  statutorySigningSuite: string
  viewDocument: string
  verifiedFica: string
  popiaEncrypted: string
  faisFsp: string
  languageSwitched: string

  // Tasks & Workflow
  tasksTitle: string
  tasksDesc: string
  thingsToComplete: string
  activeReminders: string
  markComplete: string
  showMyTasks: string

  // Requests
  myRequests: string
  all: string
  needsMe: string
  inProgress: string
  completed: string
  openSigningSuite: string
}

export const LANGUAGE_METADATA: Record<Locale, { label: string; code: string; fullName: string; nativeName: string }> = {
  'en-ZA': { label: 'EN', code: 'en-ZA', fullName: 'English (South Africa)', nativeName: 'English' },
  'zu-ZA': { label: 'ZU', code: 'zu-ZA', fullName: 'isiZulu (Zulu)', nativeName: 'isiZulu' },
  'st-ZA': { label: 'ST', code: 'st-ZA', fullName: 'Sesotho (Sotho)', nativeName: 'Sesotho' },
  'af-ZA': { label: 'AF', code: 'af-ZA', fullName: 'Afrikaans', nativeName: 'Afrikaans' },
  'xh-ZA': { label: 'XH', code: 'xh-ZA', fullName: 'isiXhosa (Xhosa)', nativeName: 'isiXhosa' },
}

export const TRANSLATIONS: Record<Locale, TranslationDictionary> = {
  'en-ZA': {
    home: 'Home',
    requests: 'Requests',
    documents: 'Documents',
    finances: 'Finances',
    tasks: 'Tasks',
    onboarding: 'Onboarding',
    simpleModeOn: 'Simple Mode: ON',
    simpleModeOff: 'Simple Mode',

    welcomeBack: 'Welcome back to your wealth portal',
    wealthHorizon: 'Your money, with a clear horizon.',
    financesIntroDesc: 'A simple view of where you are now and what you are working towards with Qiniso.',
    needsAttention: 'Needs your attention',
    activeCases: 'Active Service Cases',
    allInOnePlace: 'Everything Royal Square needs, in one place.',

    currentPosition: 'Current financial position',
    netWorth: 'Net worth',
    netWorthDesc: 'Assets less liabilities, based on your latest adviser-loaded position.',
    assets: 'Assets',
    liabilities: 'Liabilities',
    investments: 'Investments',
    retirement: 'Retirement',
    protection: 'Protection / insurance',
    goalsTitle: 'Individual and shared goals',
    addGoal: 'Add a goal',
    sharedGoalsPrivate: 'Shared goals stay private. Other people see only the progress needed for the shared goal, never your wider financial position.',
    voiceRecalibrate: 'Voice Recalibrate',

    signIn: 'Sign in to your private portal',
    privateClient: 'Private Client',
    adviserWorkspace: 'Adviser Workspace',
    signInSubtitleClient: 'Access your assets, active service requests, and statutory documents.',
    signInSubtitleAdviser: 'Authorized adviser terminal for Qiniso Ntuli (FSP 29370).',
    password: 'Password',
    oneTimePin: 'One-Time PIN',
    authMethod: 'Authentication Mode',
    emailOrMobile: 'Email Address, Mobile, or SA ID',
    adviserEmail: 'Adviser Corporate Email',
    rememberDevice: 'Keep me signed in on this device (30 days)',
    enterClientPortal: 'Enter Private Client Portal',
    enterAdviserWorkspace: 'Enter Adviser Workspace',
    signInAndOnboard: 'Sign In & Launch Onboarding',
    newToRoyalSquare: 'Looking to onboard a new private portfolio?',
    beginOnboarding: 'Begin Digital Onboarding',

    uploadDoc: 'Upload document',
    exportPdf: 'Export to PDF',
    signAndSave: 'Sign & Record in Vault',
    statutorySigningSuite: 'Statutory Signing Suite',
    viewDocument: 'View document',
    verifiedFica: 'FICA Verified',
    popiaEncrypted: '256-Bit SSL · POPIA Compliant',
    faisFsp: 'FSP License No. 29370',
    languageSwitched: 'Language switched to English',

    tasksTitle: 'The next step is clear.',
    tasksDesc: 'Tasks are for you. Reminders make sure the right person is notified.',
    thingsToComplete: 'Things you must complete',
    activeReminders: 'We keep the rhythm',
    markComplete: 'Mark complete',
    showMyTasks: 'Show my Tasks',

    myRequests: 'My Requests',
    all: 'All',
    needsMe: 'Needs me',
    inProgress: 'In progress',
    completed: 'Completed',
    openSigningSuite: 'Open Signing Suite',
  },

  'zu-ZA': {
    home: 'Ikhaya',
    requests: 'Izicelo',
    documents: 'Amadokhumenti',
    finances: 'Ezezimali',
    tasks: 'Imisebenzi',
    onboarding: 'Ukubhalisa',
    simpleModeOn: 'Imodi Elula: IVULIWE',
    simpleModeOff: 'Imodi Elula',

    welcomeBack: 'Siyakwamukela kuphothali yakho yengcebo',
    wealthHorizon: 'Imali yakho, enombono ocacile wesikhathi esizayo.',
    financesIntroDesc: 'Ukubuka okulula kwalapho okhona manje nalokho osebenzela kukho noQiniso.',
    needsAttention: 'Kudinga ukunaka kwakho',
    activeCases: 'Izicelo Zomsebenzi Eziqhubekayo',
    allInOnePlace: 'Konke okudingwa yi-Royal Square, endaweni eyodwa.',

    currentPosition: 'Isikhundla sezezimali samanje',
    netWorth: 'Inani Lilonke Lempahla',
    netWorthDesc: 'Izimpahla kususwe izikweletu, ngokwesikhundla sakamuva esilayishwe umeluleki wakho.',
    assets: 'Izimpahla',
    liabilities: 'Izikweletu',
    investments: 'Ukutshalwa Kwezimali',
    retirement: 'Umhlalaphansi',
    protection: 'Ukuvikelwa / Umshwalense',
    goalsTitle: 'Imigomo yomuntu ngamunye neyokubambisana',
    addGoal: 'Engeza umgomo',
    sharedGoalsPrivate: 'Imigomo ehlanganyelwe ihlala iyimfihlo. Abanye babona kuphela intuthuko yomgomo, hhayi yonke imali yakho.',
    voiceRecalibrate: 'Lungisa Ngezwi',

    signIn: 'Ngena kuphothali yakho eyimfihlo',
    privateClient: 'Ikhasimende Elizimele',
    adviserWorkspace: 'Indawo Yomeluleki',
    signInSubtitleClient: 'Finyelela izimpahla zakho, izicelo eziqhubekayo, namadokhumenti omthetho.',
    signInSubtitleAdviser: 'Itheminali yomeluleki egunyaziwe ka-Qiniso Ntuli (FSP 29370).',
    password: 'Iphasiwedi',
    oneTimePin: 'I-PIN Yesikhashana (OTP)',
    authMethod: 'Indlela Yokungena',
    emailOrMobile: 'Ikheli le-Imeyili, Iselula, noma i-ID yaseNingizimu Afrika',
    adviserEmail: 'I-Imeyili Yenkampani Yomeluleki',
    rememberDevice: 'Ngigcine ngingenile kule divayisi (izinsuku ezingu-30)',
    enterClientPortal: 'Ngena Kuphothali Yekhasimende',
    enterAdviserWorkspace: 'Ngena Endaweni Yomeluleki',
    signInAndOnboard: 'Ngena bese Uqala Ukubhaliswa',
    newToRoyalSquare: 'Ingabe ufuna ukubhalisa iphothifoliyo entsha?',
    beginOnboarding: 'Qala Ukubhalisa Kwedijithali',

    uploadDoc: 'Layisha idokhumenti',
    exportPdf: 'Khipha njenge-PDF',
    signAndSave: 'Sayina & Gcina Endaweni Ephephile',
    statutorySigningSuite: 'Iqoqo Lokusayina Lomthetho',
    viewDocument: 'Buka idokhumenti',
    verifiedFica: 'I-FICA Iqinisekisiwe',
    popiaEncrypted: 'I-SSL Engu-256-Bit · Ivikelwe Ngaphansi Kwe-POPIA',
    faisFsp: 'Inombolo Yelayisensi ye-FSP 29370',
    languageSwitched: 'Ulimi lwashintshwa lwaba isiZulu',

    tasksTitle: 'Isinyathelo esilandelayo sicacile.',
    tasksDesc: 'Imisebenzi ngeyakho. Izikhumbuzi ziqinisekisa ukuthi umuntu ofanele uyaziswa.',
    thingsToComplete: 'Izinto okufanele uziqede',
    activeReminders: 'Sigcina isivinini somsebenzi',
    markComplete: 'Maka njengokuqediwe',
    showMyTasks: 'Buka Imisebenzi Yami',

    myRequests: 'Izicelo Zami',
    all: 'Zonke',
    needsMe: 'Kudinga mina',
    inProgress: 'Iyaqhubeka',
    completed: 'Iqediwe',
    openSigningSuite: 'Vula Iqoqo Lokusayina',
  },

  'st-ZA': {
    home: 'Hae',
    requests: 'Likopo',
    documents: 'Litokomane',
    finances: 'Litšhelete',
    tasks: 'Mesebetsi',
    onboarding: 'Ngoliso',
    simpleModeOn: 'Mokhoa o Bonolo: O BULETSWE',
    simpleModeOff: 'Mokhoa o Bonolo',

    welcomeBack: 'Re u amohela hape ho phothali ea hau ea leruo',
    wealthHorizon: 'Tšhelete ea hau, e nang le pono e hlakileng ea bokamoso.',
    financesIntroDesc: 'Pono e bonolo ea moo u leng teng hona joale le seo u se sebeletsang le Qiniso.',
    needsAttention: 'E hloka tlhokomelo ea hau',
    activeCases: 'Likopo Tse Sebetsang',
    allInOnePlace: 'Tsohle tseo Royal Square e li hlokang, sebakeng se le seng.',

    currentPosition: 'Boemo ba lichelete ba hajoale',
    netWorth: 'Boleng Bohle ba Leruo',
    netWorthDesc: 'Matlotlo a tlosoang likoloto, ho latela boemo ba morao-rao bo behiloeng ke moeletsi.',
    assets: 'Matlotlo',
    liabilities: 'Likoloto',
    investments: 'Matsete',
    retirement: 'Ho Tlohela Mosebetsi',
    protection: 'Tšireletso / Inshorense',
    goalsTitle: 'Lipakane tsa motho ka mong le tse arolelanoang',
    addGoal: 'Kenya sepheo se secha',
    sharedGoalsPrivate: 'Lipakane tse arolelanoang li lula e le lekunutu. Batho ba bang ba bona feela tsoelo-pele ea sepheo.',
    voiceRecalibrate: 'Fetola ka Lentsoe',

    signIn: 'Kena phothaling ea hau e ikhethang',
    privateClient: 'Moreki ea Ikhethang',
    adviserWorkspace: 'Sebaka sa Moeletsi',
    signInSubtitleClient: 'Fumana matlotlo a hau, likopo tse sebetsang, le litokomane tsa molao.',
    signInSubtitleAdviser: 'Theminale e lumelletsoeng ea moeletsi ea Qiniso Ntuli (FSP 29370).',
    password: 'Phasewete',
    oneTimePin: 'PIN ea Nako e le ’Ngoe (OTP)',
    authMethod: 'Mokhoa oa ho Kena',
    emailOrMobile: 'Aterese ea Imeile, Selefouno, kapa ID ea Afrika Boroa',
    adviserEmail: 'Imeile ea Khampani ea Moeletsi',
    rememberDevice: 'Ntumelle ke lule ke kene sesebelisoeng sena (matsatsi a 30)',
    enterClientPortal: 'Kena Phothaling ea Moreki',
    enterAdviserWorkspace: 'Kena Sebakeng sa Moeletsi',
    signInAndOnboard: "Kena 'me u Qale ho Kena",
    newToRoyalSquare: 'Na u batla ho ngolisa potefolio e ncha?',
    beginOnboarding: 'Qala Ngoliso ea Dijithale',

    uploadDoc: 'Kenya tokomane',
    exportPdf: 'Romela joalo ka PDF',
    signAndSave: 'Saena le ho Boloka Sebakeng se Sireletsehileng',
    statutorySigningSuite: 'Suite ea ho Saena Litokomane tsa Molao',
    viewDocument: 'Sheba tokomane',
    verifiedFica: 'E netefalitsoe ke FICA',
    popiaEncrypted: '256-Bit SSL · E lumellana le POPIA',
    faisFsp: 'Nomoro ea Laesense ea FSP 29370',
    languageSwitched: 'Puo e fetoletsoe ho Sesotho',

    tasksTitle: 'Mohato o latelang o hlakile.',
    tasksDesc: 'Mesebetsi ke ea hau. Likhopotso li etsa bonnete ba hore motho ea nepahetseng oa tsebisoa.',
    thingsToComplete: 'Lintho tseo u lokelang ho li qeta',
    activeReminders: 'Re boloka morethetho oa mosebetsi',
    markComplete: 'Tšoaea e le e phethiloeng',
    showMyTasks: 'Bontša Mesebetsi ea Ka',

    myRequests: 'Likopo tsa Ka',
    all: 'Tsohle',
    needsMe: 'E hloka \'na',
    inProgress: 'E ntseng e sebetsa',
    completed: 'E phethiloe',
    openSigningSuite: 'Bula Suite ea ho Saena',
  },

  'af-ZA': {
    home: 'Tuisblad',
    requests: 'Versoeke',
    documents: 'Dokumente',
    finances: 'Finansies',
    tasks: 'Take',
    onboarding: 'Aanboordproses',
    simpleModeOn: 'Eenvoudige Modus: AAN',
    simpleModeOff: 'Eenvoudige Modus',

    welcomeBack: 'Welkom terug by jou welvaartsportaal',
    wealthHorizon: 'Jou geld, met ’n duidelike toekomsblik.',
    financesIntroDesc: '’n Eenvoudige blik op waar jy nou is en waarna jy saam met Qiniso werk.',
    needsAttention: 'Benodig jou aandag',
    activeCases: 'Aktiewe Diensgevalle',
    allInOnePlace: 'Alles wat Royal Square benodig, op een plek.',

    currentPosition: 'Huidige finansiële posisie',
    netWorth: 'Netto Waarde',
    netWorthDesc: 'Bates minus laste, gebaseer op jou jongste adviseur-gelaaide posisie.',
    assets: 'Bates',
    liabilities: 'Laste',
    investments: 'Beleggings',
    retirement: 'Aftrede',
    protection: 'Beskerming / Versekering',
    goalsTitle: 'Individuele en gedeelde doelwitte',
    addGoal: 'Voeg doelwit by',
    sharedGoalsPrivate: 'Gedeelde doelwitte bly privaat. Ander sien slegs die vordering vir die spesifieke doelwit.',
    voiceRecalibrate: 'Stemherkalibrasie',

    signIn: 'Meld aan by jou privaat portaal',
    privateClient: 'Privaat Kliënt',
    adviserWorkspace: 'Adviseur Werkspasie',
    signInSubtitleClient: 'Kry toegang tot jou bates, aktiewe diensversoeke en statutêre dokumente.',
    signInSubtitleAdviser: 'Gemagtigde adviseur-terminaal vir Qiniso Ntuli (FSP 29370).',
    password: 'Wagwoord',
    oneTimePin: 'Eenmalige PIN (OTP)',
    authMethod: 'Aanmeldmodus',
    emailOrMobile: 'E-posadres, Selfoon, of SA ID',
    adviserEmail: 'Adviseur Korporatiewe E-pos',
    rememberDevice: 'Hou my aangemeld op hierdie toestel (30 dae)',
    enterClientPortal: 'Gaan na Kliënteportaal',
    enterAdviserWorkspace: 'Gaan na Adviseur Werkspasie',
    signInAndOnboard: 'Meld aan & Begin Aanboording',
    newToRoyalSquare: 'Wil jy ’n nuwe privaat portefeulje aanboord neem?',
    beginOnboarding: 'Begin Digitale Aanboordproses',

    uploadDoc: 'Laai dokument op',
    exportPdf: 'Voer uit na PDF',
    signAndSave: 'Teken en Stoor in Bewaarplek',
    statutorySigningSuite: 'Statutêre Ondertekening Suite',
    viewDocument: 'Bekyk dokument',
    verifiedFica: 'FICA Geverifieer',
    popiaEncrypted: '256-Bis SSL · POPIA Voldoenend',
    faisFsp: 'FSP Lisensie No. 29370',
    languageSwitched: 'Taal verander na Afrikaans',

    tasksTitle: 'Die volgende stap is duidelik.',
    tasksDesc: 'Take is vir jou. Aanmanings verseker dat die regte persoon in kennis gestel word.',
    thingsToComplete: 'Dinge wat jy moet voltooi',
    activeReminders: 'Ons hou die ritme',
    markComplete: 'Merk as voltooi',
    showMyTasks: 'Wys my Take',

    myRequests: 'My Versoeke',
    all: 'Alles',
    needsMe: 'Benodig my',
    inProgress: 'Aan die gang',
    completed: 'Voltooi',
    openSigningSuite: 'Maak Teken-Suite Oop',
  },

  'xh-ZA': {
    home: 'Ikhaya',
    requests: 'Izicelo',
    documents: 'Amaxwebhu',
    finances: 'Ezemali',
    tasks: 'Imisebenzi',
    onboarding: 'Ukubhalisa',
    simpleModeOn: 'Imowudi Elula: IVULIWE',
    simpleModeOff: 'Imowudi Elula',

    welcomeBack: 'Wamkelekile kwiphothali yakho yobutyebi',
    wealthHorizon: 'Imali yakho, enombono ocacileyo.',
    financesIntroDesc: 'Umbono olula walapho ukhoyo ngoku kunye noko usebenzela kuko noQiniso.',
    needsAttention: 'Idinga ingqalelo yakho',
    activeCases: 'Izicelo Zeenkonzo Ezisebenzayo',
    allInOnePlace: 'Yonke into efunwa yi-Royal Square, kwindawo enye.',

    currentPosition: 'Isikhundla sezemali sangoku',
    netWorth: 'Ixabiso Lilonke Lempahla',
    netWorthDesc: 'Ii-asethi ezitsalwe amatyala, ngokwesikhundla sakutshanje somcebisi wakho.',
    assets: 'Ii-asethi',
    liabilities: 'Amatyala',
    investments: 'Utyalo-mali',
    retirement: 'Umhlala-phantsi',
    protection: 'Ukhuseleko / Inshorensi',
    goalsTitle: 'Iinjongo zomntu ngamnye nezokwabelana',
    addGoal: 'Faka injongo',
    sharedGoalsPrivate: 'Iinjongo ekwabelwana ngazo zihlala ziyimfihlo. Abanye babona kuphela inkqubela-phambili yenjongo.',
    voiceRecalibrate: 'Lungisa ngeLizwi',

    signIn: 'Ngena kwiphothali yakho yabucala',
    privateClient: 'Umxhasi Wabucala',
    adviserWorkspace: 'Indawo Yomcebisi',
    signInSubtitleClient: 'Fikelela kwii-asethi zakho, izicelo zenkonzo ezisebenzayo, namaxwebhu asemthethweni.',
    signInSubtitleAdviser: 'Itheminali yomcebisi egunyazisiweyo ka-Qiniso Ntuli (FSP 29370).',
    password: 'Igama lokugqitha',
    oneTimePin: 'I-PIN yeXesha eliNye (OTP)',
    authMethod: 'Indlela YokuNgena',
    emailOrMobile: 'Idilesi ye-Imeyile, iSelfowuni, okanye i-ID yoMzantsi Afrika',
    adviserEmail: 'I-Imeyile yeQumrhu lomCebisi',
    rememberDevice: 'Ndigcine ndingenile kwesi sixhobo (iintsuku ezingama-30)',
    enterClientPortal: 'Ngena kwiPhothali yoMxhasi',
    enterAdviserWorkspace: 'Ngena kwindawo yoMcebisi',
    signInAndOnboard: 'Ngena uze uQalise ukuNgqinisisa',
    newToRoyalSquare: 'Ingaba ujonge ukubhalisa iphothifoliyo entsha?',
    beginOnboarding: 'Qala uKubhalisa kweDijithali',

    uploadDoc: 'Layisha uxwebhu',
    exportPdf: 'Thumela njenge-PDF',
    signAndSave: 'Sayina & Gcina kwindawo eKhuselekileyo',
    statutorySigningSuite: 'I-Suite yokuSayina amaxwebhu oMthetho',
    viewDocument: 'Jonga uxwebhu',
    verifiedFica: 'I-FICA iQinisekisiwe',
    popiaEncrypted: 'I-SSL eyi-256-Bit · Ithobela i-POPIA',
    faisFsp: 'Inombolo yeLayisensi ye-FSP 29370',
    languageSwitched: 'Ulwimi lutshintshiwe lwaba sisiXhosa',

    tasksTitle: 'Inyathelo elilandelayo licacile.',
    tasksDesc: 'Imisebenzi yeyakho. Izikhumbuzi ziqinisekisa ukuba umntu ofanelekileyo uyaziswa.',
    thingsToComplete: 'Izinto ekufuneka uzigqibile',
    activeReminders: 'Sigcina isingqi somsebenzi',
    markComplete: 'Phawula njengegqityiweyo',
    showMyTasks: 'Bonisa Imisebenzi Yam',

    myRequests: 'Izicelo Zam',
    all: 'Zonke',
    needsMe: 'Ifuna mna',
    inProgress: 'Iyaqhubeka',
    completed: 'Igqityiwe',
    openSigningSuite: 'Vula i-Suite yokuSayina',
  }
}

export function useTranslation(locale: Locale): TranslationDictionary {
  return TRANSLATIONS[locale] || TRANSLATIONS['en-ZA']
}

// Configuration de la connexion Supabase
const SUPABASE_URL = "https://jphzmgscxpejcyjlnspq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHptZ3NjeHBlamN5amxuc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDM4ODMsImV4cCI6MjA5MzY3OTg4M30.QfEQRLnv3A05mstkARboKxR2ve3JiwDeubLHwmatZjw";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to dynamically pick high-quality brutalist placeholders
function getProductImage(item) {
  const group = ((item && item.group) || '').toUpperCase();
  const name = ((item && item.name) || '').toUpperCase();
  if (group.includes('SHOE') || name.includes('SHOES') || name.includes('TABAN') || name.includes('SNEAKER')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
}

// Catalogue de produits par défaut pour la simulation de scan (Flo DB Mocks)
const DEFAULT_CATALOG = [
  {
    barcode: "8683218016845",
    sku: "100002024",
    name: "2W T-Der Taban-W 2PR",
    price: "5700 da",
    price_discount: null,
    brand: "FLOGART",
    size: "STD",
    color: "KAHVE",
    gender: "WOMEN",
    group: "SHOES",
    type: "ACC",
    market: "NULL",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    barcode: "8683218018856",
    sku: "100002878",
    name: "1M PAGOL MESH M 1FX",
    price: "450 da",
    price_discount: null,
    brand: "KINETIX",
    size: "STD",
    color: "P",
    gender: "MEN",
    group: "SHOES",
    type: "FOO",
    market: "LEISUR",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    barcode: "8683218018924",
    sku: "100002876",
    name: "2W T-Kslk Taban-W 2PR",
    price: "750 da",
    price_discount: null,
    brand: "FLOGART",
    size: "STD",
    color: "VIZON",
    gender: "WOMEN",
    group: "SHOES",
    type: "ACC",
    market: "NULL",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  }
];

// Historique initial
const INITIAL_LOGS = [
  {
    id: "SEQ-0994-A",
    timestamp: "2026-05-28 14:32:01",
    barcode: "8683218016845",
    sku: "100002024",
    name: "2W T-Der Taban-W 2PR",
    price: "5700 da",
    price_discount: null,
    brand: "FLOGART",
    size: "STD",
    color: "KAHVE",
    gender: "WOMEN",
    group: "SHOES",
    type: "ACC",
    market: "NULL",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "SEQ-0993-A",
    timestamp: "2026-05-28 14:28:44",
    barcode: "8683218018856",
    sku: "100002878",
    name: "1M PAGOL MESH M 1FX",
    price: "450 da",
    price_discount: null,
    brand: "KINETIX",
    size: "STD",
    color: "P",
    gender: "MEN",
    group: "SHOES",
    type: "FOO",
    market: "LEISUR",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "SEQ-0992-A",
    timestamp: "2026-05-28 13:15:09",
    barcode: "8683218018924",
    sku: "100002876",
    name: "2W T-Kslk Taban-W 2PR",
    price: "750 da",
    price_discount: null,
    brand: "FLOGART",
    size: "STD",
    color: "VIZON",
    gender: "WOMEN",
    group: "SHOES",
    type: "ACC",
    market: "NULL",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
  }
];

// État Global de l'Application
let appState = {
  activeView: 'live',
  catalog: [],
  history: [],
  selectedProduct: null,
  isScanning: false,
  webcamActive: false,
  html5QrCodeInstance: null
};

// État Global de l'Impression (Stitch)
let printState = {
  mode: 'local', // 'local' ou 'remote'
  type: 'Thermal', // 'Thermal' ou 'Inkjet'
  copies: 1,
  progress: 0,
  intervalId: null,
  currentProduct: null
};

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  initData();
  initFlickerEffect();
  switchView('live');
});

// Initialise les données à partir de localStorage
function initData() {
  // Charger le catalogue
  const storedCatalog = localStorage.getItem('scancore_catalog');
  if (storedCatalog) {
    appState.catalog = JSON.parse(storedCatalog);
  } else {
    appState.catalog = [...DEFAULT_CATALOG];
    localStorage.setItem('scancore_catalog', JSON.stringify(appState.catalog));
  }

  // Charger l'historique
  const storedHistory = localStorage.getItem('scancore_history');
  if (storedHistory) {
    appState.history = JSON.parse(storedHistory);
    updateHistoryView();
  } else {
    loadInitialHistoryFromSupabase();
  }
}

// Fonction de chargement de 15 articles depuis Supabase pour l'historique initial
async function loadInitialHistoryFromSupabase() {
  const statusText = document.getElementById('scan-status-text');
  if (statusText) statusText.innerText = "STATUS: LOADING_DB...";
  
  try {
    const { data, error } = await supabaseClient
      .from('base_flo')
      .select('*')
      .not('Code-barres article', 'is', null)
      .limit(15);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const mappedLogs = data.map((row, index) => {
        const sequenceNum = 994 - index;
        const scanId = `SEQ-${sequenceNum}-A`;
        
        // Simuler des timestamps étalés dans le temps
        const date = new Date();
        date.setMinutes(date.getMinutes() - index * 12 - Math.floor(Math.random() * 5));
        const timestamp = date.toISOString().replace('T', ' ').substring(0, 19);
        
        return {
          id: scanId,
          timestamp: timestamp,
          barcode: String(row['Code-barres article']),
          sku: row['Ref'] || String(row['Code-barres article']),
          name: row['Nom de l\'article'] || 'Produit Sans Nom',
          price: row['Prix'] || '0 da',
          price_discount: row['Prix solde'] || null,
          brand: row['Brand'] || 'INCONNU',
          size: row['Taille'] || 'STD',
          color: row['Couleur'] || 'N/A',
          gender: row['Genre de l\'article'] || 'UNISEX',
          group: row['Groupe de l\'article'] || 'N/A',
          type: row['Type de l\'article'] || 'N/A',
          market: row['March'] || 'N/A',
          image: getProductImage({
            group: row['Groupe de l\'article'],
            name: row['Nom de l\'article']
          })
        };
      });
      
      appState.history = mappedLogs;
      localStorage.setItem('scancore_history', JSON.stringify(appState.history));
      updateHistoryView();
      showToast("HISTORIQUE INITIAL CHARGÉ DEPUIS SUPABASE", "success");
    } else {
      useFallbackMockData();
    }
  } catch (err) {
    console.error("Supabase initial load failed:", err);
    showToast("ERREUR DE CONNEXION SUPABASE. MODE HORS LIGNE.", "error");
    useFallbackMockData();
  }
}

// Fallback pour les logs hors ligne
function useFallbackMockData() {
  appState.history = [...INITIAL_LOGS];
  localStorage.setItem('scancore_history', JSON.stringify(appState.history));
  updateHistoryView();
}

// Simple SPA Router
function switchView(viewName) {
  // Arrêter la caméra si on quitte le scanner
  if (viewName !== 'live' && appState.webcamActive) {
    stopCamera();
  }

  // Si on navigue vers l'imprimante directement, s'assurer qu'un produit est sélectionné
  if (viewName === 'print') {
    let product = printState.currentProduct || appState.selectedProduct;
    if (!product && appState.history.length > 0) {
      product = appState.history[0];
    }
    if (!product) {
      showToast("VEUILLEZ SÉLECTIONNER OU SCANNER UN PRODUIT D'ABORD", "warning");
      // Retourner au scanner si aucun produit n'est disponible
      switchView('live');
      return;
    }
    // Si on a un produit mais que le printState n'est pas encore initialisé avec lui
    if (printState.currentProduct !== product) {
      openPrintInterface(printState.mode || 'local', product);
    }
  }

  appState.activeView = viewName;

  // Cacher toutes les sections
  const sections = ['view-live', 'view-history', 'view-detail', 'view-marketing', 'view-config', 'view-print'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Afficher la section active
  const activeEl = document.getElementById(`view-${viewName}`);
  if (activeEl) activeEl.classList.remove('hidden');

  // Mettre à jour les styles des boutons de navigation (En-tête)
  const navBtns = ['live', 'history', 'print', 'marketing'];
  navBtns.forEach(name => {
    const btn = document.getElementById(`nav-btn-${name}`);
    if (btn) {
      if (name === viewName || (viewName === 'detail' && name === 'live')) {
        btn.classList.add('text-secondary', 'font-bold', 'border-secondary');
        btn.classList.remove('text-primary', 'font-medium', 'border-transparent');
      } else {
        btn.classList.remove('text-secondary', 'font-bold', 'border-secondary');
        btn.classList.add('text-primary', 'font-medium', 'border-transparent');
      }
    }
  });

  // Mettre à jour les styles des boutons de navigation (Barre latérale)
  const sideBtns = ['live', 'history', 'print', 'marketing', 'config'];
  sideBtns.forEach(name => {
    const btn = document.getElementById(`side-btn-${name}`);
    if (btn) {
      if (name === viewName || (viewName === 'detail' && name === 'live')) {
        btn.classList.add('bg-primary', 'text-on-primary');
        btn.classList.remove('text-primary', 'hover:bg-secondary-container', 'hover:text-on-secondary-container');
      } else {
        btn.classList.remove('bg-primary', 'text-on-primary');
        btn.classList.add('text-primary', 'hover:bg-secondary-container', 'hover:text-on-secondary-container');
      }
    }
  });

  // Mettre à jour les styles des boutons de navigation (Barre mobile inférieure)
  const mobileBtns = ['live', 'history', 'print', 'marketing', 'config'];
  mobileBtns.forEach(name => {
    const btn = document.getElementById(`mobile-btn-${name}`);
    if (btn) {
      if (name === viewName || (viewName === 'detail' && name === 'live')) {
        btn.classList.add('text-secondary', 'font-bold');
        btn.classList.remove('text-primary', 'font-medium');
      } else {
        btn.classList.remove('text-secondary', 'font-bold');
        btn.classList.add('text-primary', 'font-medium');
      }
    }
  });

  // Rafraîchir les données de la vue concernée
  if (viewName === 'history') {
    updateHistoryView();
  }

  window.scrollTo(0, 0);
}

// Scanneur : Simulation d'effet de scintillement FPS
function initFlickerEffect() {
  const fpsCounter = document.getElementById('fps-counter');
  setInterval(() => {
    if (appState.activeView === 'live' && fpsCounter) {
      const fps = (58 + Math.random() * 3).toFixed(2);
      fpsCounter.innerText = `FPS: ${fps}`;
    }
  }, 250);
}

// Scanneur : Webcam toggle (Real Scan Optique)
async function toggleCameraInput() {
  const toggleBtn = document.getElementById('btn-toggle-camera');
  const modeText = document.getElementById('mode-text');
  const statusText = document.getElementById('scan-status-text');

  if (!appState.webcamActive) {
    showToast("INITIALISATION SYSTÈME OPTIQUE...", "info");
    
    // Instancier l'objet de scan html5-qrcode
    if (!appState.html5QrCodeInstance) {
      appState.html5QrCodeInstance = new Html5Qrcode("qr-reader");
    }

    const config = {
      fps: 10,
      qrbox: (width, height) => {
        const minEdge = Math.min(width, height);
        const qrboxEdgeSize = Math.floor(minEdge * 0.7);
        return {
          width: qrboxEdgeSize,
          height: qrboxEdgeSize
        };
      }
    };

    try {
      await appState.html5QrCodeInstance.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // Code lu avec succès
          stopCamera();
          if (statusText) statusText.innerText = "STATUS: CODE_DECODED";
          processScannedCode(decodedText);
        },
        (errorMessage) => {
          // Ignorer les erreurs d'analyse par trame
        }
      );
      
      appState.webcamActive = true;
      if (toggleBtn) toggleBtn.innerText = "Désactiver la Webcam";
      if (modeText) modeText.innerText = "MODE: CAMERA_SCANNING";
      if (statusText) statusText.innerText = "STATUS: SCANNING_ACTIVE";
      showToast("CAMÉRA EN DIRECT : ACTIVÉE", "success");
    } catch (err) {
      console.warn("Camera init failed: ", err);
      showToast("ACCÈS CAMÉRA IMPOSSIBLE (HTTPS REQUIS OU CAMERA INEXISTANTE)", "error");
      appState.webcamActive = false;
    }
  } else {
    stopCamera();
    showToast("CAMÉRA EN DIRECT : DÉSACTIVÉE", "info");
  }
}

// Scanneur : Arrêter la caméra de scan
function stopCamera() {
  const toggleBtn = document.getElementById('btn-toggle-camera');
  const modeText = document.getElementById('mode-text');
  const statusText = document.getElementById('scan-status-text');

  if (appState.html5QrCodeInstance && appState.webcamActive) {
    appState.html5QrCodeInstance.stop().then(() => {
      appState.webcamActive = false;
      if (toggleBtn) toggleBtn.innerText = "Activer la Webcam";
      if (modeText) modeText.innerText = "MODE: WEBCAM_IDLE";
      if (statusText) statusText.innerText = "STATUS: AWAITING_ALIGNMENT";
    }).catch(err => {
      console.error("Failed to stop html5Qrcode: ", err);
    });
  } else {
    appState.webcamActive = false;
    if (toggleBtn) toggleBtn.innerText = "Activer la Webcam";
    if (modeText) modeText.innerText = "MODE: WEBCAM_IDLE";
    if (statusText) statusText.innerText = "STATUS: AWAITING_ALIGNMENT";
  }
}

// Scanneur : Saisie Manuelle de Code-barres
function submitManualBarcode() {
  const inputEl = document.getElementById('manual-barcode-input');
  if (!inputEl) return;

  const value = inputEl.value.trim();
  if (!value) {
    showToast("ERREUR : SAISIE VIDE", "error");
    return;
  }

  showToast(`SAISIE MANUELLE : ENVOI DE ${value}...`, "info");
  
  // Vider le champ de saisie
  inputEl.value = "";

  // Déclencher le traitement après un délai pour simuler le calcul
  setTimeout(() => {
    processScannedCode(value);
  }, 400);
}

// Scanneur : Sélection d'un article aléatoire dans la base de données
async function selectRandomDatabaseProduct() {
  const statusText = document.getElementById('scan-status-text');
  if (statusText) statusText.innerText = "STATUS: RANDOM_QUERY";
  showToast("INTERROGATION DE LA BASE DE DONNÉES FLO...", "info");

  try {
    // 1. Demander le décompte estimé des lignes de base_flo
    const { count, error: countError } = await supabaseClient
      .from('base_flo')
      .select('*', { count: 'estimated', head: true });
      
    if (countError) throw countError;
    
    const totalRows = (count && count > 0) ? count : 15322;
    const randomOffset = Math.floor(Math.random() * totalRows);
    
    console.log(`Random selection: Offset ${randomOffset} out of estimated ${totalRows}`);

    // 2. Requêter 1 ligne avec ce décalage
    const { data, error } = await supabaseClient
      .from('base_flo')
      .select('*')
      .range(randomOffset, randomOffset)
      .limit(1);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const row = data[0];
      const barcode = String(row['Code-barres article'] || row['Ref']);
      console.log("Random article selected barcode:", barcode, "Name:", row['Nom de l\'article']);
      
      // Lancer le traitement standard
      processScannedCode(barcode);
    } else {
      throw new Error("No data returned for offset " + randomOffset);
    }
  } catch (err) {
    console.warn("Failed to retrieve random product from Supabase, falling back to local catalog:", err);
    if (appState.catalog && appState.catalog.length > 0) {
      const randomIndex = Math.floor(Math.random() * appState.catalog.length);
      const fallbackItem = appState.catalog[randomIndex];
      showToast(`PRODUIT ALÉATOIRE (LOCAL REPLI) : ${fallbackItem.name}`, "info");
      processScannedCode(fallbackItem.barcode || fallbackItem.sku);
    } else {
      showToast("ERREUR SYSTÈME : IMPOSSIBLE DE CHOISIR UN ARTICLE", "error");
      if (statusText) statusText.innerText = "STATUS: ERROR";
    }
  }
}

// Traitement du Code Détecté (Scanner ou Manuel)
async function processScannedCode(code) {
  if (!code) return;
  code = code.trim();

  const statusText = document.getElementById('scan-status-text');
  if (statusText) statusText.innerText = "STATUS: QUERYING_DB...";

  try {
    // 1. Essayer de trouver dans la base Supabase en temps réel
    // On convertit le code en nombre pour le comparer à Code-barres article (bigint)
    const numericCode = parseInt(code, 10);
    
    let query = supabaseClient
      .from('base_flo')
      .select('*');
      
    if (!isNaN(numericCode)) {
      query = query.or(`"Code-barres article".eq.${numericCode},Ref.eq.${code}`);
    } else {
      query = query.eq('Ref', code);
    }
    
    const { data, error } = await query.limit(1);
    
    if (error) throw error;
    
    let product = null;
    
    if (data && data.length > 0) {
      const row = data[0];
      product = {
        barcode: String(row['Code-barres article']),
        sku: row['Ref'] || String(row['Code-barres article']),
        name: row['Nom de l\'article'] || 'Produit Sans Nom',
        price: row['Prix'] || '0 da',
        price_discount: row['Prix solde'] || null,
        brand: row['Brand'] || 'INCONNU',
        size: row['Taille'] || 'STD',
        color: row['Couleur'] || 'N/A',
        gender: row['Genre de l\'article'] || 'UNISEX',
        group: row['Groupe de l\'article'] || 'N/A',
        type: row['Type de l\'article'] || 'N/A',
        market: row['March'] || 'N/A',
        image: getProductImage({
          group: row['Groupe de l\'article'],
          name: row['Nom de l\'article']
        })
      };
      showToast(`PRODUIT RECONNU : ${product.name}`, "success");
    } else {
      // 2. Si pas trouvé dans Supabase, chercher dans le catalogue local en mémoire
      const localProduct = appState.catalog.find(p => p.sku.toUpperCase() === code.toUpperCase() || p.barcode === code);
      if (localProduct) {
        product = localProduct;
        showToast(`PRODUIT RECONNU (LOCAL) : ${product.name}`, "success");
      }
    }
    
    if (!product) {
      showToast(`CODE INCONNU DANS LA BASE FLO : ${code}`, "error");
      if (statusText) statusText.innerText = "STATUS: CODE_UNKNOWN";
      return;
    }
    
    // Créer l'entrée correspondante dans le journal d'historique de scan
    const sequenceNum = Math.floor(1000 + Math.random() * 9000);
    const scanId = `SEQ-${sequenceNum}-A`;
    const now = new Date();
    const utcTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    const newScanEntry = {
      id: scanId,
      timestamp: utcTimestamp,
      ...product
    };
    
    // Enregistrer le scan dans l'historique local
    appState.history.unshift(newScanEntry);
    localStorage.setItem('scancore_history', JSON.stringify(appState.history));
    
    // Afficher les détails et rediriger vers l'écran Bento
    showProductDetails(newScanEntry);
    switchView('detail');
    
    if (statusText) statusText.innerText = "STATUS: CODE_DECODED";
  } catch (err) {
    console.error("Error processing scan code:", err);
    showToast("ERREUR LORS DU TRAITEMENT : CONNEXION DB PERDUE", "error");
    if (statusText) statusText.innerText = "STATUS: ERROR";
  }
}

// Fiche Produit : Afficher les détails d'un produit
function showProductDetails(item) {
  appState.selectedProduct = item;

  // Titre principal : combine Brand et Nom
  document.getElementById('detail-title').innerText = `${item.brand || 'INCONNU'} - ${item.name}`.toUpperCase();
  document.getElementById('detail-sku').innerText = `SKU / BARCODE: ${item.sku} [${item.barcode || item.sku}]`;

  // Gestion des prix
  const priceDiscountEl = document.getElementById('detail-price-discount');
  const priceEl = document.getElementById('detail-price');
  
  if (item.price_discount && item.price_discount.trim() !== '') {
    priceDiscountEl.innerText = item.price_discount;
    priceEl.innerHTML = `<span class="line-through opacity-60 text-xs md:text-sm block">Prix Orig: ${item.price}</span>`;
  } else {
    priceDiscountEl.innerText = item.price;
    priceEl.innerHTML = '';
  }

  // Grille Bento
  document.getElementById('detail-brand').innerText = item.brand || 'INCONNU';
  document.getElementById('detail-size').innerText = item.size || 'STD';
  document.getElementById('detail-color').innerText = item.color || 'N/A';
  document.getElementById('detail-gender').innerText = item.gender || 'UNISEX';
  document.getElementById('detail-group').innerText = item.group || 'N/A';
  document.getElementById('detail-type-market').innerText = `${item.type || 'N/A'} / ${item.market || 'N/A'}`;

  // Image de fond
  const imgEl = document.getElementById('detail-image');
  if (imgEl) {
    imgEl.style.backgroundImage = `url('${item.image || getProductImage(item)}')`;
  }

  // Lancer la recherche d'image sur le Web (Google Images via Bing/Proxy)
  const isPlaceholderImage = !item.image || item.image.includes('unsplash.com') || item.image.includes('lh3.googleusercontent.com');
  
  if (isPlaceholderImage) {
    const mediaLabel = document.getElementById('detail-media-label');
    
    // Nettoyer la requête principale
    const searchQuery = `${item.brand || ''} ${item.name}`;
    const cleanSearchQuery = searchQuery.replace(/[^\w\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (mediaLabel) {
      mediaLabel.innerText = `MEDIA_FEED_01 [RECHERCHE: ${cleanSearchQuery.toUpperCase()}]`;
      mediaLabel.classList.add('animate-pulse', 'text-secondary');
    }
    
    fetchWebImageForProduct(cleanSearchQuery).then(webImageUrl => {
      // Si la recherche principale échoue, tenter la recherche de repli simplifiée
      if (!webImageUrl) {
        const fallbackQuery = `${item.brand || ''} ${item.group || 'shoes'}`;
        const cleanFallbackQuery = fallbackQuery.replace(/[^\w\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`No results for "${cleanSearchQuery}". Retrying with fallback: "${cleanFallbackQuery}"`);
        if (mediaLabel) {
          mediaLabel.innerText = `MEDIA_FEED_01 [REPLI: ${cleanFallbackQuery.toUpperCase()}]`;
        }
        return fetchWebImageForProduct(cleanFallbackQuery);
      }
      return webImageUrl;
    }).then(webImageUrl => {
      if (webImageUrl) {
        // Enregistrer l'image dans l'item
        item.image = webImageUrl;
        
        // Persister dans l'historique
        const historyIndex = appState.history.findIndex(h => h.id === item.id);
        if (historyIndex > -1) {
          appState.history[historyIndex].image = webImageUrl;
          localStorage.setItem('scancore_history', JSON.stringify(appState.history));
        }
        
        // Persister dans le catalogue
        const catalogIndex = appState.catalog.findIndex(p => p.sku === item.sku || p.barcode === item.barcode);
        if (catalogIndex > -1) {
          appState.catalog[catalogIndex].image = webImageUrl;
          localStorage.setItem('scancore_catalog', JSON.stringify(appState.catalog));
        }

        // Mettre à jour l'image en direct si le produit est toujours affiché
        if (appState.selectedProduct && appState.selectedProduct.id === item.id) {
          if (imgEl) {
            imgEl.style.backgroundImage = `url('${webImageUrl}')`;
          }
        }
        showToast("IMAGE RÉCUPÉRÉE DEPUIS LE WEB AVEC SUCCÈS", "success");
        if (mediaLabel) {
          mediaLabel.innerText = "MEDIA_FEED_01 [COMPLET]";
          mediaLabel.classList.remove('animate-pulse', 'text-secondary');
        }
      } else {
        showToast("AUCUNE IMAGE TROUVÉE SUR LE WEB", "error");
        if (mediaLabel) {
          mediaLabel.innerText = "MEDIA_FEED_01 [INCONNU]";
          mediaLabel.classList.remove('animate-pulse', 'text-secondary');
        }
      }
    }).catch(err => {
      console.error("Image search error:", err);
      if (mediaLabel) {
        mediaLabel.innerText = "MEDIA_FEED_01 [ERREUR RÉSEAU]";
        mediaLabel.classList.remove('animate-pulse', 'text-secondary');
      }
    });
  }
}

// Fonction utilitaire de requête avec bascule automatique entre plusieurs proxys CORS
async function fetchHtmlWithProxyFallback(url) {
  // 1. Tenter avec AllOrigins (renvoie un objet JSON avec propriété "contents")
  try {
    const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    console.log("Tentative image search proxy: AllOrigins ->", allOriginsUrl);
    const response = await fetch(allOriginsUrl);
    if (response.ok) {
      const data = await response.json();
      if (data && data.contents) {
        console.log("AllOrigins OK. Taille HTML:", data.contents.length);
        return data.contents;
      }
    }
  } catch (e) {
    console.warn("AllOrigins a échoué:", e);
  }

  // 2. Tenter avec CorsProxy (renvoie directement le texte brut)
  try {
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    console.log("Tentative image search proxy: CorsProxy ->", corsProxyUrl);
    const response = await fetch(corsProxyUrl);
    if (response.ok) {
      const html = await response.text();
      console.log("CorsProxy OK. Taille HTML:", html.length);
      return html;
    }
  } catch (e) {
    console.warn("CorsProxy a échoué:", e);
  }

  // 3. Tenter avec ThingProxy (renvoie directement le texte brut)
  try {
    const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
    console.log("Tentative image search proxy: ThingProxy ->", thingProxyUrl);
    const response = await fetch(thingProxyUrl);
    if (response.ok) {
      const html = await response.text();
      console.log("ThingProxy OK. Taille HTML:", html.length);
      return html;
    }
  } catch (e) {
    console.warn("ThingProxy a échoué:", e);
  }

  // 4. Tenter une requête directe (fallback de la dernière chance)
  try {
    console.log("Tentative directe sans proxy ->", url);
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      return html;
    }
  } catch (e) {
    console.warn("Requête directe a échoué:", e);
  }

  throw new Error("Tous les proxys CORS ont échoué");
}

// Recherche d'image sur le web via le proxy CORS avec Bing Images (alternative à Google sans CAPTCHA)
async function fetchWebImageForProduct(query) {
  if (!query) return null;
  
  // Nettoyer les caractères spéciaux de la requête (supprimer le point d'interrogation et doubles espaces)
  const cleanQuery = query.replace(/[^\w\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanQuery) return null;
  
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanQuery)}`;
  
  try {
    const html = await fetchHtmlWithProxyFallback(searchUrl);
    
    // Essayer de trouver la première url d'image "murl" (originale)
    const murlRegex = /(?:"murl"|&quot;murl&quot;)\s*:\s*(?:"|&quot;)(https?:\/\/[^"'\s>]+?)(?:"|&quot;)/i;
    const murlMatch = html.match(murlRegex);
    if (murlMatch && murlMatch[1]) {
      let cleanUrl = murlMatch[1].replace(/\\/g, '');
      cleanUrl = cleanUrl.replace(/&amp;/g, '&');
      console.log(`Original image URL found for query "${cleanQuery}": ${cleanUrl}`);
      return cleanUrl;
    }
    
    // Sinon, essayer la première url de miniature "turl" ( Bing CDN )
    const turlRegex = /(?:"turl"|&quot;turl&quot;)\s*:\s*(?:"|&quot;)(https?:\/\/[^"'\s>]+?)(?:"|&quot;)/i;
    const turlMatch = html.match(turlRegex);
    if (turlMatch && turlMatch[1]) {
      let cleanUrl = turlMatch[1].replace(/\\/g, '');
      cleanUrl = cleanUrl.replace(/&amp;/g, '&');
      console.log(`Thumbnail image URL found for query "${cleanQuery}": ${cleanUrl}`);
      return cleanUrl;
    }
  } catch (err) {
    console.warn("Failed to fetch web image for query: " + cleanQuery, err);
  }
  return null;
}

// Ouvre l'interface de configuration d'impression Stitch
function openPrintInterface(mode, product = null) {
  const activeProduct = product || appState.selectedProduct;
  if (!activeProduct) {
    showToast("AUCUN PRODUIT DISPONIBLE POUR L'IMPRESSION", "warning");
    return;
  }
  
  printState.mode = mode;
  printState.currentProduct = activeProduct;
  printState.copies = 1;
  printState.type = 'Thermal';

  // Remplir l'aperçu du ticket
  const ticketAssetIdEl = document.getElementById('ticket-asset-id');
  const ticketTitleEl = document.getElementById('ticket-title');
  const ticketPriceEl = document.getElementById('ticket-price');
  const ticketRefEl = document.getElementById('ticket-ref');
  const ticketDateEl = document.getElementById('ticket-date');

  // Générer un Asset ID court à partir du code-barres
  const assetIdStr = activeProduct.barcode ? `Asset ID: ${activeProduct.barcode.slice(-6)}` : 'Asset ID: 9022-X';
  if (ticketAssetIdEl) ticketAssetIdEl.innerText = assetIdStr;
  if (ticketTitleEl) ticketTitleEl.innerText = `${activeProduct.brand || 'FLODB'} ${activeProduct.name}`.toUpperCase();
  
  // Formatage du prix
  const displayPrice = activeProduct.price_discount || activeProduct.price || '0.00 da';
  if (ticketPriceEl) ticketPriceEl.innerText = displayPrice.includes('da') ? displayPrice : `${displayPrice} da`;
  
  if (ticketRefEl) ticketRefEl.innerText = `Ref: ${activeProduct.sku || 'N/A'}`;
  
  const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');
  if (ticketDateEl) ticketDateEl.innerText = `Generated by Scan_Core_V.01 // ${todayStr}`;

  // Réinitialiser les champs de contrôle
  const modeBadgeEl = document.getElementById('print-mode-badge');
  if (modeBadgeEl) {
    if (mode === 'local') {
      modeBadgeEl.innerText = "Mode: Impression Locale";
      modeBadgeEl.className = "font-mono-labels text-xs text-secondary font-black uppercase bg-secondary-fixed px-2 py-1";
    } else {
      modeBadgeEl.innerText = "Mode: Impression Réseau";
      modeBadgeEl.className = "font-mono-labels text-xs text-white font-black uppercase bg-secondary-container px-2 py-1";
    }
  }

  const copiesInput = document.getElementById('print-copies');
  if (copiesInput) copiesInput.value = 1;

  selectPrintType('Thermal');

  // Naviguer vers l'interface
  switchView('print');

  // S'assurer que le sous-état config est affiché et les autres masqués
  document.getElementById('print-state-config').classList.remove('hidden');
  document.getElementById('print-state-processing').classList.add('hidden');
  document.getElementById('print-state-success').classList.add('hidden');
  document.getElementById('print-state-error').classList.add('hidden');
}

// Fonction de transition pour ouvrir l'imprimante à partir du bento
function simulatePrint(mode) {
  openPrintInterface(mode);
}

// Sélectionne le type d'imprimante (Thermique vs Jet d'encre)
function selectPrintType(type) {
  printState.type = type;

  const btnThermal = document.getElementById('print-type-thermal');
  const btnInkjet = document.getElementById('print-type-inkjet');
  const ticketBodyEl = document.querySelector('#view-print .border-dashed');

  if (type === 'Thermal') {
    if (btnThermal) {
      btnThermal.className = "bg-primary text-white font-mono-labels text-xs p-3 uppercase font-bold";
    }
    if (btnInkjet) {
      btnInkjet.className = "bg-white text-primary font-mono-labels text-xs p-3 uppercase hover:bg-secondary-container hover:text-white transition-colors font-bold";
    }
    if (ticketBodyEl) ticketBodyEl.style.borderStyle = 'dashed';
  } else {
    if (btnThermal) {
      btnThermal.className = "bg-white text-primary font-mono-labels text-xs p-3 uppercase hover:bg-secondary-container hover:text-white transition-colors font-bold";
    }
    if (btnInkjet) {
      btnInkjet.className = "bg-primary text-white font-mono-labels text-xs p-3 uppercase font-bold";
    }
    if (ticketBodyEl) ticketBodyEl.style.borderStyle = 'solid';
  }
}

// Déclenche le job d'impression (passage à l'état de transmission)
function triggerActualPrintJob() {
  const copiesInput = document.getElementById('print-copies');
  if (copiesInput) {
    printState.copies = parseInt(copiesInput.value) || 1;
  }

  // Masquer config, afficher processing
  document.getElementById('print-state-config').classList.add('hidden');
  document.getElementById('print-state-success').classList.add('hidden');
  document.getElementById('print-state-error').classList.add('hidden');
  document.getElementById('print-state-processing').classList.remove('hidden');

  printState.progress = 0;
  
  // Mettre à jour l'horodatage du log
  const timestampEl = document.getElementById('processing-timestamp');
  if (timestampEl) {
    timestampEl.innerText = Math.floor(Date.now() / 1000);
  }

  // Réinitialiser la console de logs
  const logsEl = document.getElementById('print-terminal-logs');
  if (logsEl) {
    logsEl.innerHTML = `
      <div class="text-secondary-container">&gt;&gt; INITIALISATION DU HANDSHAKE AVEC PRINT_CONTROLLER...</div>
      <div>&gt;&gt; AUTHENTIFICATION OPÉRATEUR_01... SUCCÈS.</div>
      <div>&gt;&gt; CHARGEMENT DES BLOCS DE CONFIGURATION (ID: #FB290)...</div>
      <div>&gt;&gt; PRÉPARATION DU CONTENU DE L'ÉTIQUETTE (\${printState.copies} EXEMPLAIRE(S))...</div>
    `;
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  if (printState.intervalId) clearInterval(printState.intervalId);

  // Intervalle d'animation du chargement
  printState.intervalId = setInterval(() => {
    // Augmentation progressive de la progression
    printState.progress += Math.floor(Math.random() * 8) + 4;
    if (printState.progress > 100) printState.progress = 100;

    // Mise à jour de la barre et du pourcentage
    const percentEl = document.getElementById('print-progress-percent');
    if (percentEl) percentEl.innerText = `\${printState.progress}%`;

    // Remplissage des briques de progression
    const numBlocks = Math.floor(printState.progress / 5);
    const progressContainer = document.getElementById('print-progress-bar-container');
    if (progressContainer) {
      let blocksHtml = '';
      for (let i = 0; i < 20; i++) {
        if (i < numBlocks) {
          blocksHtml += '<div class="h-full w-4 bg-secondary-container progress-block"></div>';
        } else {
          blocksHtml += '<div class="h-full w-4 bg-secondary-container progress-block opacity-10"></div>';
        }
      }
      progressContainer.innerHTML = blocksHtml;
    }

    // Fluctuation de la latence et hex dump
    const latencyVal = Math.floor(Math.random() * 8) + 8;
    const latencyEl = document.getElementById('processing-latency');
    if (latencyEl) latencyEl.innerText = `LATENCE : \${latencyVal}ms`;

    const randomHex = () => `0x\${Math.floor(Math.random()*256).toString(16).toUpperCase().padStart(2, '0')}`;
    const hexDumpEl = document.getElementById('processing-hexdump');
    if (hexDumpEl) hexDumpEl.innerText = `\${randomHex()} \${randomHex()} \${randomHex()} \${randomHex()}`;

    // Ajout d'une ligne de logs
    if (logsEl && Math.random() > 0.4 && printState.progress < 100) {
      const logLine = document.createElement('div');
      logLine.innerText = `>> EXPÉDITION DU PAQUET [\${printState.progress}/100]... RETOUR_ACK: VALIDE.`;
      logsEl.appendChild(logLine);
      logsEl.scrollTop = logsEl.scrollHeight;
    }

    // Fin du chargement
    if (printState.progress >= 100) {
      clearInterval(printState.intervalId);
      printState.intervalId = null;
      
      // Ligne de log finale
      if (logsEl) {
        const logLine = document.createElement('div');
        logLine.className = "text-secondary font-bold animate-pulse";
        logLine.innerText = ">> TRANSMISSION TERMINÉE. EN ATTENTE DE LA VÉRIFICATION DU PÉRIPHÉRIQUE...";
        logsEl.appendChild(logLine);
        logsEl.scrollTop = logsEl.scrollHeight;
      }

      // Décider de l'issue après un petit délai de confirmation
      setTimeout(() => {
        const success = Math.random() < 0.9; // 90% succès, 10% échec
        completePrintJob(success);
      }, 1000);
    }
  }, 150);
}

// Finalisation du processus d'impression (aiguillage Succès / Échec)
function completePrintJob(success) {
  document.getElementById('print-state-processing').classList.add('hidden');

  if (success) {
    // Succès
    document.getElementById('print-state-success').classList.remove('hidden');
    
    // Générer job ID et horodatage
    const jobId = `#SC-\${Math.floor(1000 + Math.random()*9000)}`;
    document.getElementById('success-job-id').innerText = jobId;
    
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    document.getElementById('success-timestamp').innerText = formattedDate;

    showToast(`IMPRESSION RÉUSSIE ! TICKET IMPRIMÉ EN \${printState.copies} EX.`, "success");

    // Envoi de la transaction à Supabase print_queue
    sendPrintJobToSupabase(printState.copies, 'done');
  } else {
    // Échec
    document.getElementById('print-state-error').classList.remove('hidden');
    
    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    document.getElementById('error-last-poll').innerText = formattedTime;

    // Remplir le log d'erreur
    const errLogEl = document.getElementById('error-troubleshooting-log');
    if (errLogEl) {
      errLogEl.innerHTML = `
        <div class="opacity-50">[\${formattedTime}] Début de la séquence de transmission...</div>
        <div class="opacity-50">[\${formattedTime}] Connexion socket TCP/IP 192.168.1.104:9100...</div>
        <div class="text-white">[\${formattedTime}] Envoi du signal d'impression...</div>
        <div class="text-error font-bold">[\${formattedTime}] ! ERREUR : Expiration de la réponse matérielle.</div>
        <div class="opacity-50">[\${formattedTime}] Tentative de réessai 1/3... ÉCHEC.</div>
        <div class="opacity-50">[\${formattedTime}] Tentative de réessai 2/3... ÉCHEC.</div>
        <div class="text-error font-bold">[\${formattedTime}] ! ÉCHEC CRITIQUE : Nœud de périphériques injoignable.</div>
      `;
    }

    showToast("ERREUR D'IMPRESSION : IMPRIMANTE HORS LIGNE", "error");
  }
}

// Insère la trace d'impression dans Supabase (table print_queue)
async function sendPrintJobToSupabase(copies, status) {
  const product = printState.currentProduct;
  if (!product) return;

  const barcode = product.barcode || product.sku;
  const details = `\${product.brand || 'INCONNU'} - \${product.name} - \${product.color || 'N/A'} - \${product.size || 'STD'}`;

  try {
    const { data, error } = await supabaseClient
      .from('print_queue')
      .insert([
        {
          barcode: barcode,
          details: details,
          quantity: copies,
          status: status
        }
      ]);

    if (error) {
      console.warn("Supabase print log insertion failed:", error);
      showToast("LOG IMPRESSION SAUVEGARDÉ LOCALEMENT (HORS LIGNE)", "info");
    } else {
      console.log("Print job logged in Supabase print_queue successfully:", data);
      showToast("HISTORIQUE D'IMPRESSION SAUVEGARDÉ DANS LA DB FLO", "success");
    }
  } catch (err) {
    console.error("Failed to insert print log into Supabase:", err);
    showToast("LOG IMPRESSION SAUVEGARDÉ LOCALEMENT (HORS LIGNE)", "info");
  }
}

// Permet de réinitialiser l'écran d'aperçu pour réimprimer
function retryPrintSetup() {
  if (printState.currentProduct) {
    openPrintInterface(printState.mode, printState.currentProduct);
  } else {
    switchView('live');
  }
}

// Simulation d'une exécution de diagnostics réseau/matériel
function runDiagnostics() {
  showToast("LANCEMENT DES DIAGNOSTICS MATÉRIELS...", "info");
  const errLogEl = document.getElementById('error-troubleshooting-log');
  if (errLogEl) {
    const diagLine = document.createElement('div');
    diagLine.className = "text-white mt-2 border-t border-gray-800 pt-1";
    diagLine.innerHTML = `
      <strong>&gt;&gt; DIAGNOSTICS RÉSEAU :</strong><br>
      PING gateway (192.168.1.1) ... OK<br>
      PING printer (192.168.1.104) ... DÉLAI EXSPIRÉ (100% perte)<br>
      Vérification alimentation ... IMPOSSIBLE À DÉTERMINER<br>
      <span class="text-secondary">&gt;&gt; Recommandation : Vérifiez le câblage RJ45.</span>
    `;
    errLogEl.appendChild(diagLine);
    errLogEl.scrollTop = errLogEl.scrollHeight;
  }
}


// Journal Historique : Mettre à jour l'affichage
function updateHistoryView() {
  const statsTotal = document.getElementById('stats-total-scans');
  const metaLastSeq = document.getElementById('meta-last-sequence');
  const metaErrorRate = document.getElementById('meta-error-rate');
  const dbLoadBar = document.getElementById('db-load-bar');
  const dbLoadWarn = document.getElementById('db-load-warn');

  // Mise à jour des widgets d'en-tête
  if (statsTotal) statsTotal.innerText = appState.history.length;
  
  if (appState.history.length > 0) {
    if (metaLastSeq) metaLastSeq.innerText = appState.history[0].id;
    
    // Calculer le taux de remise
    const discounted = appState.history.filter(item => item.price_discount && item.price_discount.trim() !== '').length;
    const rate = ((discounted / appState.history.length) * 100).toFixed(2);
    if (metaErrorRate) {
      metaErrorRate.innerText = `${rate}%`;
    }
  } else {
    if (metaLastSeq) metaLastSeq.innerText = "N/A";
    if (metaErrorRate) metaErrorRate.innerText = "0.00%";
  }

  // Charge de la base de données
  const loadPercentage = Math.min(appState.history.length * 5, 100);
  if (dbLoadBar) dbLoadBar.style.width = `${loadPercentage}%`;
  if (dbLoadWarn) {
    if (loadPercentage > 80) {
      dbLoadWarn.classList.remove('hidden');
    } else {
      dbLoadWarn.classList.add('hidden');
    }
  }

  applyFilters();
}

// Journal Historique : Recherche et filtrage
function applyFilters() {
  const searchInputEl = document.getElementById('search-input');
  const searchVal = searchInputEl ? searchInputEl.value.toLowerCase() : '';
  const genderFilterEl = document.getElementById('filter-gender');
  const genderFilter = genderFilterEl ? genderFilterEl.value : 'all';
  const container = document.getElementById('history-rows-container');

  if (!container) return;
  container.innerHTML = '';

  const filteredHistory = appState.history.filter(item => {
    // Filtre recherche
    const matchesSearch = (item.name || '').toLowerCase().includes(searchVal) ||
                          (item.sku || '').toLowerCase().includes(searchVal) ||
                          (item.barcode || '').toLowerCase().includes(searchVal) ||
                          (item.id || '').toLowerCase().includes(searchVal);

    // Filtre genre
    let matchesGender = true;
    if (genderFilter !== 'all') {
      matchesGender = (item.gender || '').toUpperCase() === genderFilter.toUpperCase();
    }

    return matchesSearch && matchesGender;
  });

  if (filteredHistory.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-outline font-mono-labels text-xs uppercase bg-surface-container-low border-b border-primary">
        Aucun enregistrement trouvé correspondant aux critères.
      </div>
    `;
    return;
  }

  filteredHistory.forEach((item, index) => {
    const isOdd = index % 2 !== 0;
    const rowClass = isOdd ? 'bg-surface-container-low' : 'bg-surface';
    const rowHtml = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-primary hover:bg-surface-container-high transition-colors items-center cursor-pointer ${rowClass}" onclick="openProductDetail('${item.id}')">
        <div class="col-span-1 p-3 md:border-r border-primary flex justify-center">
          <div class="w-12 h-12 border-2 border-primary bg-surface-variant overflow-hidden">
            <img alt="Visuel article" class="w-full h-full object-cover grayscale" src="${item.image || getProductImage(item)}"/>
          </div>
        </div>
        <div class="col-span-2 p-3 md:border-r border-primary font-mono-labels text-xs text-surface-tint">
          ${item.timestamp}
        </div>
        <div class="col-span-3 p-3 md:border-r border-primary font-mono-labels text-xs font-bold truncate">
          ${item.id} / ${item.sku}
        </div>
        <div class="col-span-3 p-3 md:border-r border-primary font-bold text-sm uppercase text-primary truncate">
          ${item.name}
        </div>
        <div class="col-span-1 p-3 md:border-r border-primary font-mono-labels text-xs text-right">
          ${item.price}
        </div>
        <div class="col-span-2 p-3 font-mono-labels text-xs text-center font-bold text-primary truncate">
          ${item.brand || 'N/A'}
        </div>
      </div>
    `;
    container.innerHTML += rowHtml;
  });
}

function openProductDetail(scanId) {
  const item = appState.history.find(log => log.id === scanId);
  if (item) {
    showProductDetails(item);
    switchView('detail');
  }
}

// Journal Historique : Exportation CSV
function exportHistoryCSV() {
  if (appState.history.length === 0) {
    showToast("HISTORIQUE VIDE : EXPORT ANNULÉ", "error");
    return;
  }

  showToast("GÉNÉRATION DU DOCUMENT CSV...", "info");

  setTimeout(() => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID_SCAN,TIMESTAMP,BARCODE,SKU,NOM,PRIX,PRIX_SOLDE,MARQUE,TAILLE,COULEUR,GENRE,GROUPE,TYPE,MARCHE\r\n";

    appState.history.forEach(row => {
      const line = [
        row.id,
        row.timestamp,
        row.barcode || '',
        row.sku,
        `"${row.name}"`,
        `"${row.price}"`,
        `"${row.price_discount || ''}"`,
        `"${row.brand || ''}"`,
        `"${row.size || ''}"`,
        `"${row.color || ''}"`,
        `"${row.gender || ''}"`,
        `"${row.group || ''}"`,
        `"${row.type || ''}"`,
        `"${row.market || ''}"`
      ].join(",");
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SCAN_CORE_LOGS_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("LOGS EXPORTÉS EN FICHIER CSV", "success");
  }, 800);
}

// Configuration : Ajouter un produit personnalisé
function addCustomProduct() {
  const name = document.getElementById('config-name').value.trim();
  const sku = document.getElementById('config-sku').value.trim();
  const priceInput = document.getElementById('config-price').value;
  const weight = document.getElementById('config-weight').value.trim();
  const origin = document.getElementById('config-origin').value.trim();
  const batch = document.getElementById('config-batch').value.trim();
  const image = document.getElementById('config-image').value.trim();
  const integrity = document.getElementById('config-integrity').value;

  if (!name || !sku || !priceInput || !weight || !origin || !batch) {
    showToast("ERREUR : TOUS LES CHAMPS SONT REQUIS", "error");
    return;
  }

  const price = parseFloat(priceInput);
  if (isNaN(price)) {
    showToast("ERREUR : PRIX INVALIDE", "error");
    return;
  }

  const newProduct = {
    barcode: sku,
    sku: sku,
    name: name,
    price: `${price.toFixed(2)} da`,
    price_discount: null,
    brand: "CUSTOM",
    size: "STD",
    color: "N/A",
    gender: integrity === 'verified' ? 'UNISEX' : 'MEN',
    group: "CUSTOM",
    type: "ACC",
    market: "LOCAL",
    image: image || getProductImage({ group: 'CUSTOM', name: name }),
    weight: weight,
    origin: origin,
    batch: batch,
    integrity: integrity
  };

  appState.catalog.push(newProduct);
  localStorage.setItem('scancore_catalog', JSON.stringify(appState.catalog));

  showToast(`PRODUIT ENREGISTRÉ : ${sku}`, "success");

  // Réinitialiser les champs
  document.getElementById('config-name').value = '';
  document.getElementById('config-sku').value = '';
  document.getElementById('config-price').value = '';
  document.getElementById('config-weight').value = '';
  document.getElementById('config-origin').value = '';
  document.getElementById('config-batch').value = '';
  document.getElementById('config-image').value = '';
}

// Configuration : Réinitialisation globale de l'historique
function resetDatabase() {
  appState.history = [];
  localStorage.setItem('scancore_history', JSON.stringify([]));
  updateHistoryView();
  showToast("HISTORIQUE DE SCAN VIDÉ", "error");
}

// Configuration : Recharger les données par défaut depuis Supabase
async function loadDefaultMockData() {
  showToast("CONNEXION SUPABASE EN COURS...", "info");
  await loadInitialHistoryFromSupabase();
}

// Configuration : Copier un code de démo et le coller dans la saisie manuelle
function copyDemoCode(code) {
  const inputEl = document.getElementById('manual-barcode-input');
  if (inputEl) {
    inputEl.value = code;
    showToast(`CODE ${code} COLLÉ DANS LA SAISIE MANUELLE`, "success");
    switchView('live');
  }
}

// Modals Système et Actions globales
function confirmReset() {
  document.getElementById('modal-reset').classList.remove('hidden');
}

// Modals Système et Actions globales
function cancelReset() {
  document.getElementById('modal-reset').classList.add('hidden');
}

function doReset() {
  cancelReset();
  resetDatabase();
}

function showSystemStatus(info) {
  showToast(info.toUpperCase(), "info");
}

// Notification Toast Brutaliste
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  
  // Classes CSS brutalistes adaptées au type
  let bgClass = 'bg-primary text-on-primary';
  let borderClass = 'border-primary';
  
  if (type === 'success') {
    bgClass = 'bg-white text-primary';
    borderClass = 'border-secondary border-t-4';
  } else if (type === 'error') {
    bgClass = 'bg-secondary text-on-secondary';
    borderClass = 'border-primary';
  }

  toast.className = `p-4 border-2 ${borderClass} ${bgClass} font-mono-labels text-xs uppercase hard-shadow pointer-events-auto flex justify-between items-center transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-4 font-bold hover:text-outline" onclick="this.parentElement.remove()">[X]</button>
  `;

  container.appendChild(toast);

  // Animation Entrée
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto suppression après 3.5s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-1');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

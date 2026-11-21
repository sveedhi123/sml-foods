/*
 * Default store settings, categories and starter catalogue.
 * These are used until you save your own from the Admin dashboard (admin.html).
 * PRICES BELOW ARE SAMPLES — change them in Admin → Products before opening the store.
 */
(function () {
  const DEFAULT_SETTINGS = {
    storeOpen: false,                 // online checkout is off until you switch it on in Admin → Settings
    announcement: "Made fresh in small batches at Tatipaka, Konaseema",
    heroTitle: "The taste of home, from Konaseema",
    heroTitleTe: "మన ఇంటి రుచి",
    heroText: "Pure buffalo ghee, traditional Andhra pickles and fresh paneer — made by us in small batches and packed with care.",
    upiId: "",                         // e.g. smlfoods@ybl (your PhonePe / GPay / Paytm Business UPI ID)
    upiPayee: "SML Foods",
    whatsapp: "",                      // 10-digit number, e.g. 9xxxxxxxxx
    phone: "",
    email: "",
    address: "Tatipaka, Konaseema District, Andhra Pradesh",
    fssai: "",
    gstin: "",
    deliveryFee: 60,
    freeDeliveryAbove: 999,
    minOrder: 0,
    serviceablePincodes: "50,51,52,53",   // pincode prefixes we deliver to (blank = all India). 50 = Telangana, 51–53 = Andhra Pradesh
    localPincodes: "533,500",             // perishable items (paneer) only to these prefixes
    dispatchNote: "Orders are packed and dispatched within 1–2 working days.",
    instagram: "",
    facebook: "",
    youtube: ""
  };

  const DEFAULT_CATEGORIES = [
    { id: "ghee", name: "Ghee", te: "నెయ్యి", blurb: "Slow-cooked, grainy, aromatic", sort: 1 },
    { id: "pickles", name: "Pickles", te: "పచ్చళ్ళు", blurb: "Traditional Andhra recipes", sort: 2 },
    { id: "paneer", name: "Paneer", te: "పన్నీర్", blurb: "Fresh, soft, made by us", sort: 3 }
  ];

  const pickleSizes = (a, b, c) => [
    { id: "250g", label: "250 g", price: a, mrp: null, stock: null, inStock: true },
    { id: "500g", label: "500 g", price: b, mrp: null, stock: null, inStock: true },
    { id: "1kg", label: "1 kg", price: c, mrp: null, stock: null, inStock: true }
  ];

  const pickle = (id, nameEn, nameTe, color, shortDesc, description, sort, extra = {}) => ({
    id, nameEn, nameTe, category: "pickles", color, shortDesc, description,
    ingredients: "", shelfLife: "", storage: "Always use a dry spoon. Keep the lid tightly closed.",
    badges: [], images: [], variants: pickleSizes(160, 300, 580),
    status: "active", localOnly: false, featured: false, sort, ...extra
  });

  const DEFAULT_PRODUCTS = [
    {
      id: "buffalo-ghee", nameEn: "Pure Buffalo Ghee", nameTe: "గేదె నెయ్యి", category: "ghee", color: "#EFE3C2",
      shortDesc: "Slow-cooked from buffalo milk butter — creamy, grainy and full of aroma.",
      description: "Our buffalo ghee is slow-cooked in small batches from buffalo milk butter until it develops its rich, nutty aroma and the grainy (రవ్వ) texture Andhra kitchens love. It sets creamy-white and melts clear. Pour it over hot rice with pappu, spread it on dosas and pesarattu, or use it for sweets and everyday cooking.",
      ingredients: "", shelfLife: "", storage: "Store at room temperature, away from moisture. Use a dry spoon.",
      badges: ["Bestseller"], images: [],
      variants: [
        { id: "250g", label: "250 g", price: 220, mrp: null, stock: null, inStock: true },
        { id: "500g", label: "500 g", price: 430, mrp: null, stock: null, inStock: true },
        { id: "1kg", label: "1 kg", price: 840, mrp: null, stock: null, inStock: true }
      ],
      status: "active", localOnly: false, featured: true, sort: 1
    },
    {
      id: "cow-ghee", nameEn: "Pure Cow Ghee", nameTe: "ఆవు నెయ్యి", category: "ghee", color: "#F3D98B",
      shortDesc: "Golden cow ghee — coming soon.",
      description: "Golden, fragrant cow ghee, slow-cooked in small batches. Coming soon.",
      ingredients: "", shelfLife: "", storage: "Store at room temperature, away from moisture. Use a dry spoon.",
      badges: [], images: [],
      variants: [
        { id: "250g", label: "250 g", price: 280, mrp: null, stock: null, inStock: true },
        { id: "500g", label: "500 g", price: 550, mrp: null, stock: null, inStock: true },
        { id: "1kg", label: "1 kg", price: 1080, mrp: null, stock: null, inStock: true }
      ],
      status: "coming_soon", localOnly: false, featured: false, sort: 2
    },
    pickle("avakaya", "Avakaya (Mango Pickle)", "ఆవకాయ", "#B5341F",
      "The king of Andhra pickles — raw mango, mustard and red chilli.",
      "Andhra's most-loved pickle. Firm raw mango pieces, cut with the seed shell, are mixed with freshly ground mustard, red chilli powder and salt, then rested in oil until the flavours mature. Bold, fiery and tangy — mix it with hot rice and a spoon of ghee.", 10, { badges: ["Bestseller"], featured: true }),
    pickle("magaya", "Magaya (Sun-dried Mango Pickle)", "మాగాయ", "#C8641E",
      "Salted, sun-dried mango slices with a tangy spice mix.",
      "Peeled raw mango pieces are salted and sun-dried, then mixed with red chilli, mustard and fenugreek. Tangier and gentler than avakaya, with a chewy bite — a classic with curd rice.", 11),
    pickle("tomato", "Tomato Pickle", "టమాటా పచ్చడి", "#A82A22",
      "Ripe tomatoes cooked down with tamarind and spices.",
      "Ripe tomatoes slow-cooked with tamarind and red chilli, finished with a crackling tempering. Tangy, spicy and spreadable — perfect with idli, dosa, chapati and hot rice.", 12),
    pickle("nimmakaya", "Lemon Pickle", "నిమ్మకాయ", "#C9A227",
      "Lemons cured in salt and turmeric, then spiced.",
      "Juicy lemon pieces are cured in salt and turmeric until soft, then spiced with red chilli and a mustard–fenugreek tempering. Sour, spicy and better with every passing week.", 13),
    pickle("dabbakaya", "Dabbakaya (Citron Pickle)", "దబ్బకాయ", "#9C8A1E",
      "A Godavari favourite made from Indian citron.",
      "Made from dabbakaya — the thick-skinned Indian citron grown across the Godavari region. Cured and spiced the traditional way for a sour, aromatic, gently bitter pickle you rarely find in shops.", 14, { badges: ["Regional special"] }),
    pickle("pachimirchi", "Green Chilli Pickle", "పచ్చిమిర్చి", "#4F7A2A",
      "Fresh green chillies with mustard and lemon.",
      "Slit green chillies cured with mustard, salt and lemon juice for a sharp, fresh heat. A small piece lifts any meal.", 15),
    pickle("gongura", "Gongura Pickle", "గోంగూర", "#5E3326",
      "Tangy sorrel leaves with red chilli and garlic.",
      "Andhra's pride. Tangy gongura (sorrel) leaves are sautéed and ground with red chillies, then finished with a garlic and mustard tempering. Unbeatable with hot rice and ghee.", 16, { badges: ["Andhra special"], featured: true }),
    pickle("usirikaya", "Amla Pickle", "ఉసిరికాయ", "#7C8A34",
      "Indian gooseberries cured and spiced.",
      "Amla (Indian gooseberry) cured with salt and turmeric, then spiced with red chilli and mustard. Tart, slightly astringent and full of character.", 17),
    pickle("allam", "Ginger Pickle", "అల్లం పచ్చడి", "#A2622C",
      "Sweet, sour and spicy ginger with tamarind and jaggery.",
      "Fresh ginger ground with tamarind, jaggery and red chilli — the sweet, sour and spicy allam pachadi that belongs next to pesarattu, idli and upma.", 18),
    {
      id: "paneer", nameEn: "Fresh Paneer", nameTe: "పన్నీర్", category: "paneer", color: "#F4EEDD",
      shortDesc: "Soft, fresh paneer made by us. Delivered chilled to nearby pincodes.",
      description: "Fresh paneer made by us from milk — soft and creamy, yet firm enough to hold its shape in curries, tikka and bhurji. Because it is fresh, we deliver paneer only to nearby pincodes and pack it chilled.",
      ingredients: "", shelfLife: "", storage: "Keep refrigerated (below 4°C). Use within the shelf life printed on the pack.",
      badges: ["Fresh"], images: [],
      variants: [
        { id: "200g", label: "200 g", price: 100, mrp: null, stock: null, inStock: true },
        { id: "500g", label: "500 g", price: 240, mrp: null, stock: null, inStock: true },
        { id: "1kg", label: "1 kg", price: 460, mrp: null, stock: null, inStock: true }
      ],
      status: "active", localOnly: true, featured: true, sort: 30
    }
  ];

  window.SML_DEFAULTS = { DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS };
})();

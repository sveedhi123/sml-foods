/*
 * Default store settings, categories and starter catalogue.
 * These are used until you save your own from the Admin dashboard (admin.html).
 * PRICES BELOW ARE SAMPLES — change them in Admin → Products before opening the store.
 */
(function () {
  const DEFAULT_SETTINGS = {
    storeOpen: false,                 // online checkout is off until you switch it on in Admin → Settings
    announcement: "From the coconut groves of Konaseema · Free delivery on orders above ₹999",
    heroTitle: "The taste of Konaseema, made at home",
    heroTitleTe: "కోనసీమ ఇంటి రుచి",
    heroText: "Slow-cooked buffalo ghee, traditional Andhra pickles and fresh paneer — made by our family in small batches at Tatipaka, in the heart of the Godavari delta.",
    heroImage: "https://images.unsplash.com/photo-1664791461482-79f5deee490f",
    storyImage: "https://images.unsplash.com/photo-1694011772133-dc4b3ff3f24f",
    promiseImage: "https://images.unsplash.com/photo-1716816211590-c15a328a5ff0",
    promiseImage2: "https://images.unsplash.com/photo-1600984177310-c86c8f8fa9c7",
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
    { id: "ghee", name: "Ghee", te: "నెయ్యి", blurb: "Slow-cooked, grainy, aromatic", sort: 1, image: "https://images.unsplash.com/photo-1605880980331-20a711b27338" },
    { id: "pickles", name: "Pickles", te: "పచ్చళ్ళు", blurb: "Traditional Andhra recipes", sort: 2, image: "https://images.unsplash.com/photo-1601702538934-efffab67ab65" },
    { id: "paneer", name: "Paneer", te: "పన్నీర్", blurb: "Fresh, soft, made by us", sort: 3, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8" }
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
      badges: ["Bestseller"], images: ["https://images.unsplash.com/photo-1573812461383-e5f8b759d12e", "https://images.unsplash.com/photo-1600984177310-c86c8f8fa9c7"],
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
      badges: [], images: ["https://images.unsplash.com/photo-1605880980331-20a711b27338", "https://images.unsplash.com/photo-1736752346246-61f4daedfde0"],
      variants: [
        { id: "250g", label: "250 g", price: 280, mrp: null, stock: null, inStock: true },
        { id: "500g", label: "500 g", price: 550, mrp: null, stock: null, inStock: true },
        { id: "1kg", label: "1 kg", price: 1080, mrp: null, stock: null, inStock: true }
      ],
      status: "coming_soon", localOnly: false, featured: false, sort: 2
    },
    pickle("avakaya", "Avakaya (Mango Pickle)", "ఆవకాయ", "#B5341F",
      "The king of Andhra pickles — raw mango, mustard and red chilli.",
      "Andhra's most-loved pickle. Firm raw mango pieces, cut with the seed shell, are mixed with freshly ground mustard, red chilli powder and salt, then rested in oil until the flavours mature. Bold, fiery and tangy — mix it with hot rice and a spoon of ghee.", 10, { badges: ["Bestseller"], featured: true, images: ["https://images.unsplash.com/photo-1589135233689-d56032e9680a", "https://images.unsplash.com/photo-1664791461482-79f5deee490f"] }),
    pickle("magaya", "Magaya (Sun-dried Mango Pickle)", "మాగాయ", "#C8641E",
      "Salted, sun-dried mango slices with a tangy spice mix.",
      "Peeled raw mango pieces are salted and sun-dried, then mixed with red chilli, mustard and fenugreek. Tangier and gentler than avakaya, with a chewy bite — a classic with curd rice.", 11, { images: ["https://images.unsplash.com/photo-1601702538934-efffab67ab65", "https://images.unsplash.com/photo-1622629111578-d2312c53cde9"] }),
    pickle("tomato", "Tomato Pickle", "టమాటా పచ్చడి", "#A82A22",
      "Ripe tomatoes cooked down with tamarind and spices.",
      "Ripe tomatoes slow-cooked with tamarind and red chilli, finished with a crackling tempering. Tangy, spicy and spreadable — perfect with idli, dosa, chapati and hot rice.", 12, { images: ["https://images.unsplash.com/photo-1654080358382-0393e9b6a68a", "https://images.unsplash.com/photo-1472476443507-c7a5948772fc"] }),
    pickle("nimmakaya", "Lemon Pickle", "నిమ్మకాయ", "#C9A227",
      "Lemons cured in salt and turmeric, then spiced.",
      "Juicy lemon pieces are cured in salt and turmeric until soft, then spiced with red chilli and a mustard–fenugreek tempering. Sour, spicy and better with every passing week.", 13, { images: ["https://images.unsplash.com/photo-1631387268524-6e02eb71794f", "https://images.unsplash.com/photo-1785605121301-c5ab1cd740d7"] }),
    pickle("dabbakaya", "Dabbakaya (Citron Pickle)", "దబ్బకాయ", "#9C8A1E",
      "A Godavari favourite made from Indian citron.",
      "Made from dabbakaya — the thick-skinned Indian citron grown across the Godavari region. Cured and spiced the traditional way for a sour, aromatic, gently bitter pickle you rarely find in shops.", 14, { badges: ["Regional special"], images: ["https://images.unsplash.com/photo-1675950786654-14cf38121796", "https://images.unsplash.com/photo-1516148386536-d062f6f5a0f2"] }),
    pickle("pachimirchi", "Green Chilli Pickle", "పచ్చిమిర్చి", "#4F7A2A",
      "Fresh green chillies with mustard and lemon.",
      "Slit green chillies cured with mustard, salt and lemon juice for a sharp, fresh heat. A small piece lifts any meal.", 15, { images: ["https://images.unsplash.com/photo-1623265292956-781d1d326c68", "https://images.unsplash.com/photo-1524593410820-38510f580a77"] }),
    pickle("gongura", "Gongura Pickle", "గోంగూర", "#5E3326",
      "Tangy sorrel leaves with red chilli and garlic.",
      "Andhra's pride. Tangy gongura (sorrel) leaves are sautéed and ground with red chillies, then finished with a garlic and mustard tempering. Unbeatable with hot rice and ghee.", 16, { badges: ["Andhra special"], featured: true, images: ["https://images.unsplash.com/photo-1645432524571-0e469b22e43f", "https://images.unsplash.com/photo-1659694459412-02735752031f"] }),
    pickle("usirikaya", "Amla Pickle", "ఉసిరికాయ", "#7C8A34",
      "Indian gooseberries cured and spiced.",
      "Amla (Indian gooseberry) cured with salt and turmeric, then spiced with red chilli and mustard. Tart, slightly astringent and full of character.", 17, { images: ["https://images.unsplash.com/photo-1676043967557-2b70d9facd71", "https://images.unsplash.com/photo-1676043966983-f5bd22435e64"] }),
    pickle("allam", "Ginger Pickle", "అల్లం పచ్చడి", "#A2622C",
      "Sweet, sour and spicy ginger with tamarind and jaggery.",
      "Fresh ginger ground with tamarind, jaggery and red chilli — the sweet, sour and spicy allam pachadi that belongs next to pesarattu, idli and upma.", 18, { images: ["https://images.unsplash.com/photo-1589707790848-9097c28e8569", "https://images.unsplash.com/photo-1617854307432-13950e24ba07"] }),
    {
      id: "paneer", nameEn: "Fresh Paneer", nameTe: "పన్నీర్", category: "paneer", color: "#F4EEDD",
      shortDesc: "Soft, fresh paneer made by us. Delivered chilled to nearby pincodes.",
      description: "Fresh paneer made by us from milk — soft and creamy, yet firm enough to hold its shape in curries, tikka and bhurji. Because it is fresh, we deliver paneer only to nearby pincodes and pack it chilled.",
      ingredients: "", shelfLife: "", storage: "Keep refrigerated (below 4°C). Use within the shelf life printed on the pack.",
      badges: ["Fresh"], images: ["https://images.unsplash.com/photo-1702650730093-43cfa3237228", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8"],
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

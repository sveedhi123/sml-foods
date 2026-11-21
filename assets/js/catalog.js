/*
 * Default store settings, categories and starter catalogue.
 * These are used until you save your own from the Admin dashboard (admin.html).
 * PRICES BELOW ARE SAMPLES — change them in Admin → Products before opening the store.
 */
(function () {
  const DEFAULT_SETTINGS = {
    storeOpen: false,                 // online checkout is off until you switch it on in Admin → Settings
    announcement: "కోనసీమ నుండి నేరుగా మీ ఇంటికి · ₹999 పైన ఉచిత డెలివరీ",
    heroTitle: "Konaseema pickles, ghee & paneer",
    heroTitleTe: "కోనసీమ పచ్చళ్ళు",
    heroText: "ఆవకాయ, గోంగూర, మాగాయ, దబ్బకాయ... మా ఇంట్లో పెట్టినట్టే. Pickles, buffalo ghee and fresh paneer, made in our own kitchen in Konaseema.",
    heroImage: "https://images.unsplash.com/photo-1664791461482-79f5deee490f",
    storyImage: "https://images.unsplash.com/photo-1694011772133-dc4b3ff3f24f",
    promiseImage: "https://images.unsplash.com/photo-1716816211590-c15a328a5ff0",
    promiseImage2: "https://images.unsplash.com/photo-1600984177310-c86c8f8fa9c7",
    upiId: "",                         // e.g. smlfoods@ybl (your PhonePe / GPay / Paytm Business UPI ID)
    upiPayee: "SML Foods",
    whatsapp: "",                      // 10-digit number, e.g. 9xxxxxxxxx
    phone: "",
    email: "",
    address: "Konaseema, Andhra Pradesh",
    fssai: "",
    gstin: "",
    deliveryFee: 60,
    freeDeliveryAbove: 999,
    minOrder: 0,
    serviceablePincodes: "50,51,52,53",   // pincode prefixes we deliver to (blank = all India). 50 = Telangana, 51–53 = Andhra Pradesh
    localPincodes: "533,500",             // perishable items (paneer) only to these prefixes
    dispatchNote: "Packed and dispatched in 1–2 working days.",
    instagram: "",
    facebook: "",
    youtube: ""
  };

  const DEFAULT_CATEGORIES = [
    { id: "ghee", name: "Ghee", te: "నెయ్యి", blurb: "Buffalo ghee", sort: 1, image: "https://images.unsplash.com/photo-1605880980331-20a711b27338" },
    { id: "pickles", name: "Pickles", te: "పచ్చళ్ళు", blurb: "Konaseema special", sort: 2, image: "https://images.unsplash.com/photo-1601702538934-efffab67ab65" },
    { id: "paneer", name: "Paneer", te: "పన్నీర్", blurb: "Fresh paneer", sort: 3, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8" }
  ];

  // Starter products. Edit them in Admin → Products (prices are samples).
  const DEFAULT_PRODUCTS = [
    {
      "id": "buffalo-ghee",
      "nameEn": "Pure Buffalo Ghee",
      "nameTe": "గేదె నెయ్యి",
      "category": "ghee",
      "color": "#EFE3C2",
      "shortDesc": "గేదె పాల వెన్నతో కాచిన నెయ్యి. రవ్వ రవ్వగా, మంచి వాసనతో.",
      "description": "Made by slowly heating buffalo milk butter in small batches. It sets white and grainy (రవ్వ నెయ్యి) and has the strong aroma of home-made ghee. Use it on hot rice with pappu, on dosas and for sweets.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Store at room temperature, away from moisture. Use a dry spoon.",
      "badges": [
        "Bestseller"
      ],
      "images": [
        "https://images.unsplash.com/photo-1600984177310-c86c8f8fa9c7",
        "https://images.unsplash.com/photo-1573812461383-e5f8b759d12e"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 220,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 430,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 840,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": true,
      "sort": 1
    },
    {
      "id": "cow-ghee",
      "nameEn": "Pure Cow Ghee",
      "nameTe": "ఆవు నెయ్యి",
      "category": "ghee",
      "color": "#F3D98B",
      "shortDesc": "త్వరలో వస్తుంది.",
      "description": "Cow ghee, made the same way as our buffalo ghee. Coming soon.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Store at room temperature, away from moisture. Use a dry spoon.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1605880980331-20a711b27338",
        "https://images.unsplash.com/photo-1736752346246-61f4daedfde0"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 280,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 550,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 1080,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "coming_soon",
      "localOnly": false,
      "featured": false,
      "sort": 2
    },
    {
      "id": "avakaya",
      "nameEn": "Avakaya (Mango Pickle)",
      "nameTe": "ఆవకాయ",
      "category": "pickles",
      "color": "#B5341F",
      "shortDesc": "కొత్త మామిడికాయ, ఆవపిండి, కారం.",
      "description": "Raw mango pieces cut with the inner shell, mixed with mustard powder, red chilli powder and salt, and rested in oil. Spicy and sour. Best with hot rice and a spoon of ghee.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [
        "Bestseller"
      ],
      "images": [
        "https://images.unsplash.com/photo-1589135233689-d56032e9680a",
        "https://images.unsplash.com/photo-1664791461482-79f5deee490f"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": true,
      "sort": 10
    },
    {
      "id": "magaya",
      "nameEn": "Magaya (Sun-dried Mango Pickle)",
      "nameTe": "మాగాయ",
      "category": "pickles",
      "color": "#C8641E",
      "shortDesc": "ఎండబెట్టిన మామిడి ముక్కలతో.",
      "description": "Peeled mango pieces are salted and dried in the sun, then mixed with chilli powder, mustard and fenugreek. Less spicy than avakaya. Goes well with curd rice.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1601702538934-efffab67ab65",
        "https://images.unsplash.com/photo-1622629111578-d2312c53cde9"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 11
    },
    {
      "id": "tomato",
      "nameEn": "Tomato Pickle",
      "nameTe": "టమాటా పచ్చడి",
      "category": "pickles",
      "color": "#A82A22",
      "shortDesc": "పుల్లగా, కారంగా. చింతపండుతో.",
      "description": "Ripe tomatoes cooked down with tamarind and red chilli, finished with a tempering. Good with idli, dosa, chapati and rice.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1654080358382-0393e9b6a68a",
        "https://images.unsplash.com/photo-1472476443507-c7a5948772fc"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 12
    },
    {
      "id": "nimmakaya",
      "nameEn": "Lemon Pickle",
      "nameTe": "నిమ్మకాయ",
      "category": "pickles",
      "color": "#C9A227",
      "shortDesc": "ఉప్పు, పసుపులో ఊరిన నిమ్మకాయ.",
      "description": "Lemon pieces cured in salt and turmeric until soft, then mixed with chilli powder and a mustard and fenugreek tempering.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1631387268524-6e02eb71794f",
        "https://images.unsplash.com/photo-1785605121301-c5ab1cd740d7"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 13
    },
    {
      "id": "dabbakaya",
      "nameEn": "Dabbakaya (Citron Pickle)",
      "nameTe": "దబ్బకాయ",
      "category": "pickles",
      "color": "#9C8A1E",
      "shortDesc": "గోదావరి జిల్లాల స్పెషల్.",
      "description": "Made with dabbakaya (Indian citron), common in Godavari homes and hard to find in shops. Sour, slightly bitter and very aromatic.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [
        "గోదావరి స్పెషల్"
      ],
      "images": [
        "https://images.unsplash.com/photo-1675950786654-14cf38121796",
        "https://images.unsplash.com/photo-1516148386536-d062f6f5a0f2"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 14
    },
    {
      "id": "pachimirchi",
      "nameEn": "Green Chilli Pickle",
      "nameTe": "పచ్చిమిర్చి",
      "category": "pickles",
      "color": "#4F7A2A",
      "shortDesc": "పచ్చిమిర్చి, ఆవాలు, నిమ్మరసం.",
      "description": "Slit green chillies cured with mustard, salt and lemon juice. Sharp and hot.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1623265292956-781d1d326c68",
        "https://images.unsplash.com/photo-1524593410820-38510f580a77"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 15
    },
    {
      "id": "gongura",
      "nameEn": "Gongura Pickle",
      "nameTe": "గోంగూర",
      "category": "pickles",
      "color": "#5E3326",
      "shortDesc": "పుల్లని గోంగూర, ఎండుమిర్చి, వెల్లుల్లి.",
      "description": "Gongura leaves cooked and ground with red chillies, finished with a garlic and mustard tempering. Eat it with hot rice and ghee.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [
        "Konaseema special"
      ],
      "images": [
        "https://images.unsplash.com/photo-1645432524571-0e469b22e43f",
        "https://images.unsplash.com/photo-1659694459412-02735752031f"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": true,
      "sort": 16
    },
    {
      "id": "usirikaya",
      "nameEn": "Amla Pickle",
      "nameTe": "ఉసిరికాయ",
      "category": "pickles",
      "color": "#7C8A34",
      "shortDesc": "ఉసిరికాయ పచ్చడి.",
      "description": "Whole amla cured with salt and turmeric, then mixed with chilli powder and mustard. Sour and slightly bitter.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1676043967557-2b70d9facd71",
        "https://images.unsplash.com/photo-1676043966983-f5bd22435e64"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 17
    },
    {
      "id": "allam",
      "nameEn": "Ginger Pickle",
      "nameTe": "అల్లం పచ్చడి",
      "category": "pickles",
      "color": "#A2622C",
      "shortDesc": "అల్లం, చింతపండు, బెల్లం.",
      "description": "Fresh ginger ground with tamarind, jaggery and red chilli. Sweet, sour and spicy. Goes with pesarattu, idli and upma.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Always use a dry spoon. Keep the lid tightly closed.",
      "badges": [],
      "images": [
        "https://images.unsplash.com/photo-1589707790848-9097c28e8569",
        "https://images.unsplash.com/photo-1617854307432-13950e24ba07"
      ],
      "variants": [
        {
          "id": "250g",
          "label": "250 g",
          "price": 160,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 300,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 580,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": false,
      "featured": false,
      "sort": 18
    },
    {
      "id": "paneer",
      "nameEn": "Fresh Paneer",
      "nameTe": "పన్నీర్",
      "category": "paneer",
      "color": "#F4EEDD",
      "shortDesc": "తాజా పన్నీర్. దగ్గర్లోని పిన్‌కోడ్‌లకు మాత్రమే.",
      "description": "Fresh paneer, made by us. Soft, and holds its shape in curries and tikka. Because it is fresh, we deliver it only to nearby pincodes, packed cold.",
      "ingredients": "",
      "shelfLife": "",
      "storage": "Keep refrigerated (below 4°C). Use within the shelf life printed on the pack.",
      "badges": [
        "తాజా"
      ],
      "images": [
        "https://images.unsplash.com/photo-1702650730093-43cfa3237228",
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8"
      ],
      "variants": [
        {
          "id": "200g",
          "label": "200 g",
          "price": 100,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "500g",
          "label": "500 g",
          "price": 240,
          "mrp": null,
          "stock": null,
          "inStock": true
        },
        {
          "id": "1kg",
          "label": "1 kg",
          "price": 460,
          "mrp": null,
          "stock": null,
          "inStock": true
        }
      ],
      "status": "active",
      "localOnly": true,
      "featured": true,
      "sort": 30
    }
  ];

  window.SML_DEFAULTS = { DEFAULT_SETTINGS, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS };
})();

# SML Foods — Seetha Maha Lakshmi (సీత మహాలక్ష్మి)

Online shop for **buffalo ghee, Andhra pickles and fresh paneer**, made in Konaseema.

- **Shop:** `index.html`. Fast, clean and mobile-first. Product names in Telugu + English, sizes, cart and checkout.
- **Payment:** direct UPI to your own UPI ID, with **₹0 gateway fees**. The customer pays from any UPI app and enters the 12-digit UTR; you confirm it in Admin.
- **Order tracking:** `order.html?id=…`. Customers see the status and courier tracking.
- **Admin dashboard:** `admin.html`. Has orders, products (prices, sizes, stock, photos, descriptions), categories, real customer reviews and settings.
- **Policy pages:** shipping, refunds, privacy, terms.
- **Hosting:** no build step and no monthly cost. It runs on GitHub Pages or Firebase Hosting with the free Firebase **Spark** plan.

---

## తెలుగులో సంక్షిప్తంగా

1. Firebase లో Email/Password login ఆన్ చేసి, మీ ఈమెయిల్‌తో user create చేయండి.
2. `firestore.rules` ఫైల్‌ను Firebase → Firestore → Rules లో పేస్ట్ చేసి **Publish** చేయండి.
3. `admin.html` ఓపెన్ చేసి లాగిన్ అవ్వండి. అక్కడ కనిపించే UID ని Firestore లో `admins` collection లో document ID గా పెట్టండి.
4. Admin → **Load starter catalogue** నొక్కండి. తర్వాత ప్రతి ప్రోడక్ట్‌కి **నిజమైన ధరలు**, ఫోటోలు, ingredients, shelf life పెట్టండి.
5. PhonePe Business / Google Pay for Business / Paytm for Business యాప్‌లో మీ savings account లింక్ చేసి **merchant UPI ID** తీసుకోండి. దాన్ని Admin → Settings లో పెట్టండి. ఛార్జీలు ఉండవు.
6. WhatsApp నంబర్, FSSAI నంబర్, అడ్రస్ పెట్టి **Accept online orders** ఆన్ చేయండి.
7. కొత్త ఆర్డర్ వచ్చినప్పుడు: Admin లో **Verify payment** చూడండి → బ్యాంక్/UPI యాప్‌లో అమౌంట్ & UTR చెక్ చేయండి → **Confirm** → Packed → Shipped (courier + tracking no.) → Delivered. ప్రతి స్టెప్‌లో "Send status on WhatsApp" బటన్ ఉంటుంది.

---

## Setup (one time)

### 1. Firebase (free Spark plan)
Project: `sml-foods`.

1. **Firestore Database** → create it (production mode) if it isn't there yet.
2. **Authentication** → Sign-in method → enable **Email/Password**. Then Users → **Add user** with your email and a strong password.
3. **Firestore → Rules** → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.
4. Open `admin.html` and sign in. You'll see a screen with your **UID**. In Firestore, create collection **`admins`** and add a document whose **Document ID is that UID** (no fields needed). Click "check again".
5. **Authentication → Settings → Authorized domains**: add your site domain (for example `sveedhi123.github.io` or your own domain), otherwise admin login won't work there.

> The Firebase web config in `assets/js/config.js` is public by design. Your data is protected by the rules, which let only admins change products and settings or read orders.

### 2. Products
Admin → Overview → **Load starter catalogue** adds 12 starter products:
- Ghee: Buffalo ghee, plus Cow ghee set to "coming soon"
- Pickles: Avakaya, Magaya, Tomato, Nimmakaya, Dabbakaya, Pachimirchi, Gongura, Usirikaya, Allam
- Paneer: marked local delivery only

⚠️ **The starter prices are samples.** Edit every product: prices, sizes, ingredients, shelf life and photos. Square photos look best. They are compressed automatically and stored in Firestore, because Firebase Storage needs the paid plan.

### 3. Payments (₹0 fees)
Get a free **merchant UPI ID / QR** from PhonePe Business, Google Pay for Business or Paytm for Business, linked to your bank account (a savings account works to start with). Enter it in Admin → Settings → **UPI payment**. Scan the ₹1 test QR to check it.

Payment flow on the site:
1. The customer fills in their details. Pincode rules are checked: only serviceable pincodes are accepted, and paneer only goes to local pincodes.
2. The site shows a UPI QR, plus an "Open UPI app" button on mobile, with the exact amount and order number.
3. The customer enters the **12-digit UTR** after paying. Each UTR can only be used once.
4. You verify the amount in your UPI or bank app → **Confirm** in Admin. Tracked stock reduces automatically.

### 4. Settings
In Admin → Settings, enter:
- Your WhatsApp number, phone, email, address, **FSSAI no.** (required by law) and GSTIN if you have one
- Delivery charge, the order amount above which delivery is free, and a minimum order
- **Serviceable pincodes:** default `50,51,52,53` covers Telangana and Andhra Pradesh. Leave it empty for all of India.
- **Fresh/local pincodes for paneer:** default `533,500` covers Konaseema / East Godavari and Hyderabad.

Then switch on **Accept online orders**. While it is off, customers can still send their cart to you on WhatsApp.

### 5. Hosting
- **GitHub Pages (free):** repo → Settings → Pages → Deploy from branch → `main` / root.
- **Firebase Hosting (free):** `firebase deploy`. `firebase.json` is included.
- Add a custom domain later (for example `smlfoods.in`) in either one.

---

## Daily use
- Keep **Admin** open on your phone or computer. New orders play a sound, show a notification and appear under **Verify payment**. Customers are also asked to send the order to your WhatsApp.
- In each order you can copy the address, print a packing slip, save courier and tracking details, add an internal note, send a ready-made WhatsApp status message, and see the history.
- **Export CSV** gives you accounts and records.
- Add new categories (for example Podis · పొడులు) under Categories, and add **real** customer reviews under Reviews.

## Free-plan limits (Spark)
Firestore free tier: 50,000 reads per day, 20,000 writes per day and 1 GiB of storage. That is plenty to start with. If you get a lot of traffic, move product photos into this repo's `assets/img/` folder and use **Paste image link** in the product editor.

## Later upgrades
- **Automatic payment gateway** (Razorpay or PhonePe PG, about 2% per payment): needs a server function, which means the Firebase Blaze plan.
- Automatic WhatsApp or email notifications, coupons, and shipping-label integration (Shiprocket).

## Files
```
index.html            shop
order.html            order tracking
admin.html            admin dashboard
shipping|refund|privacy|terms.html
assets/css/site.css   storefront styles
assets/css/admin.css  admin styles
assets/js/config.js   Firebase config + brand
assets/js/catalog.js  default settings, categories, starter products
assets/js/common.js   shared helpers (data loading, UPI link, product illustration)
assets/js/store.js    shop, cart, checkout
assets/js/order.js    tracking page
assets/js/admin.js    admin dashboard
firestore.rules       database security rules
```

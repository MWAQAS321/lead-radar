# Local Lead Radar — 100% Free Private Lead Generation System

Rozana automatic tareeqe se local business leads scrape karke aapko email
karta hai, aur ek private dashboard pe live dikhata hai. **Koi API key,
credit card, ya billing account ki zaroorat nahi.**

**Architecture (3 hisse):**

```
[Dashboard + Backend]  <-- config aur leads store karta hai (aap ka apna server)
        |  (webhook: "Scan Now")
        v
     [n8n]  -->  OpenStreetMap (Nominatim + Overpass)  -->  top N leads  -->  Backend + Email
        ^
        |
  Cron (roz 8AM khud chalta hai)
```

---

## Kyun Google Places API nahi?

Google Places API ka "free tier" hone ke bawajood usay use karne ke liye
**billing account + credit card lazmi** hai (chahay charge kabhi na ho —
Google 2018 se ye policy rakhta hai aur 2026 mein bhi wahi hai). Chunke
aapne bilkul free method maanga hai, ye setup us ke bajaye
**OpenStreetMap** use karta hai:

- **Nominatim** — location ko lat/lon mein convert karta hai (free, no key)
- **Overpass API** — us location ke around business listings deta hai
  (free, no key)

**Trade-off jo honest tareeqe se bata dena zaroori hai:** OpenStreetMap ka
data community-maintained hai — Google jitna complete nahi hota, khaas kar
chhote shehron mein phone number ya website kabhi missing bhi ho sakte hain.
Bade shehron (Karachi, Lahore, Islamabad) mein coverage acha hai. Agar kabhi
aage chal kar zyada complete data chahiye ho to Google Places (paid) ya
Apollo/Hunter jese paid lead-APIs switch-in kiye ja sakte hain — architecture
wahi rahega, sirf ek node badalna hoga.

---

## 1. Backend + Dashboard chalayein

```bash
cd lead-machine
npm install
npm start
```

`http://localhost:3000` pe dashboard khul jayega. Hamesha chalu rakhne ke
liye kisi free/cheap host pe deploy karein (Render free tier, Railway,
Fly.io, ya apne VPS pe `pm2 start server.js`).

Dashboard mein set karte hain:
- **Business type** — jaise `restaurant`, `dentist`, `electrician`,
  `plumber`, `cafe`, `pharmacy` (poori list workflow ke andar hai — koi
  ajeeb keyword ho to woh naam-matching se automatically try hota hai)
- **Location** — jaise `Peshawar, Pakistan`
- **Search radius** — meters mein (default 5000 = 5km)
- **Email** — jahan roz leads jayein
- **Leads per run** — default 10

---

## 2. n8n Workflow import karein

1. `n8n-workflow.json` ko apne n8n instance mein **Import from File** karein
2. In jagahon ko edit karein:
   - `Get Config` aur `Save Leads to Backend` nodes mein `BACKEND_URL` apne
     asal backend URL se replace karein
   - `Geocode Location` aur `Query Overpass` mein `User-Agent` header ko
     apni koi identifying string se badal dein (jaise
     `LocalLeadRadar/1.0 (aap-ka-email@example.com)`) — OpenStreetMap ki
     policy hai ke request identify ho, koi cost nahi
   - `Send Email` node mein apni SMTP ya Gmail credential attach karein
3. Workflow **Activate** karein
4. `Manual Scan Webhook` node ka **Production URL** copy karein
5. Wo URL dashboard ke "n8n Webhook URL" field mein paste karke Save karein

Ab do tareeqe se scan chalega:
- **Khud-ba-khud**: har roz 8:00 AM
- **Manual**: dashboard mein "Abhi Scan Chalayein" button se turant

---

## Kaise kaam karta hai

1. Cron ya webhook trigger hota hai
2. n8n backend se current config (query/location/radius/email) leta hai
3. Nominatim location ko coordinates mein convert karta hai
4. Overpass API un coordinates ke around matching businesses dhoondta hai
5. Top N (jitne aapne set kiye) select hote hain — name, address, phone,
   website (jo mil sake)
6. Leads backend ko save hoti hain (dashboard pe live dikhengi, duplicate
   dobara add nahi hoti)
7. Same leads ek formatted email mein bhej di jaati hain

---

## Customize karna

- **Query/location kabhi bhi badlein** — dashboard se save karein, agla
  scan naya query use karega
- **Radius chota/bada karein** — zyada ya kam area cover karne ke liye
- **Naye business types add karne hon** jo default list mein nahi — n8n ke
  "Build Overpass Query" code node mein `tagMap` object mein ek line add
  kar dein, ya bas woh keyword type karein — system automatically naam-based
  fallback search kar lega
- **Multiple sheher/query ek sath chahiye hon** — batayein, main ek loop
  wala variant bana dunga jo array of queries pe chale

---

## Free rehne ki guarantee

- Backend: aapka apna server — free hosting tiers (Render/Railway) kaafi hain
- n8n: khud host karein (free, open source) ya n8n Cloud ka free trial
- OpenStreetMap (Nominatim + Overpass): hamesha free, koi key/card nahi
- Email: apna Gmail/SMTP (free tier kaafi hai 10 emails/day ke liye)

Is poore stack mein kahin bhi credit card required nahi hai.

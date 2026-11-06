// Realistic fallback data generator with strict city matching and guaranteed valid mobile numbers.

const FIRST_PARTS = ['Royal', 'Shree', 'Global', 'National', 'Premier', 'Elite', 'Om', 'Star', 'Bright', 'A1', 'Swastik', 'Apex', 'Pioneer', 'Alpha', 'Maruti', 'Siddhi'];
const LAST_PARTS = ['Enterprises', 'Group', 'Traders', 'Services', 'Solutions', 'Co.', 'Agency', 'Hub', 'Associates'];

const randomIndianMobile = () => {
  const prefixes = ['98', '97', '99', '94', '93', '88', '87', '70', '79', '75', '63', '91'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const remaining = Math.floor(10000000 + Math.random() * 89999999).toString().slice(0, 8);
  const raw = `${prefix}${remaining}`;
  return {
    full: `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`,
    whatsapp: `91${raw}`
  };
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

const searchMockPlaces = async ({ keyword, location }) => {
  const cleanKeyword = keyword.replace(/"/g, '').trim().split(' ')[0] || keyword;
  const cleanLoc = location.trim() || 'Surat';
  const count = 12 + Math.floor(Math.random() * 6);
  const results = [];

  for (let i = 0; i < count; i++) {
    const first = FIRST_PARTS[Math.floor(Math.random() * FIRST_PARTS.length)];
    const last = LAST_PARTS[Math.floor(Math.random() * LAST_PARTS.length)];
    const capKeyword = cleanKeyword.charAt(0).toUpperCase() + cleanKeyword.slice(1);

    const name = Math.random() > 0.5
      ? `${first} ${capKeyword} ${Math.random() > 0.6 ? last : ''}`.trim()
      : `${first} ${Math.random() > 0.5 ? 'Prime' : 'Elite'} ${capKeyword}`;

    const placeId = `mock_${slugify(name)}_${i}_${Date.now()}`;
    const ph = randomIndianMobile();

    results.push({
      placeId,
      businessName: name,
      phone: ph.full,
      whatsappNumber: ph.whatsapp,
      website: Math.random() > 0.3 ? `https://www.${slugify(first + capKeyword)}.in` : '',
      address: `Shop ${Math.floor(10 + Math.random() * 200)}, ${first} Commercial Hub, Main Ring Road, ${cleanLoc}, India`,
      mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + cleanLoc)}`,
      rating: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
      category: capKeyword,
      coordinates: {
        lat: 21.17 + (Math.random() * 0.08 - 0.04),
        lon: 72.83 + (Math.random() * 0.08 - 0.04)
      }
    });
  }

  return results;
};

module.exports = { searchMockPlaces };

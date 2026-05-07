const toLowerTR = (str: string): string =>
  str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase();

const toUpperTR = (str: string): string =>
  str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ş/g, 'Ş')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase();

const capitalizeFirstTR = (str: string): string => {
  if (!str) return '';
  const lower = toLowerTR(str);
  const first = lower[0].replace('i', 'İ').replace('ı', 'I').toUpperCase();
  return first + lower.slice(1);
};

const KNOWN_FIRST_NAMES = [
  'cihat', 'demet', 'emre', 'ayse', 'mehmet', 'ahmet', 'fatma', 'burak', 'ali', 'can', 'zeynep', 'elif', 'mustafa',
  'yusuf', 'hasan', 'huseyin', 'ibrahim', 'ismail', 'osman', 'halil', 'suleyman', 'mahmut', 'omer', 'ramazan',
  'abdullah', 'kemal', 'bekir', 'salih', 'murat', 'hakan', 'volkan', 'gokhan', 'serkan', 'fatih', 'ugur', 'ozgur',
  'yasin', 'selim', 'sinan', 'cem', 'cemal', 'erdal', 'serdar', 'selcuk', 'orhan', 'ayhan', 'turan', 'yasar',
  'kadir', 'adem', 'gizem', 'busra', 'kubra', 'merve', 'seda', 'esra', 'eda', 'selin', 'pelin', 'ceren', 'gamze',
  'irem', 'tugce', 'tugba', 'asli', 'betul', 'ceyda', 'deniz', 'dilara', 'duygu', 'ece', 'ezgi', 'gokce', 'gozde',
  'hazal', 'ilayda', 'melis', 'nihal', 'nur', 'ozge', 'pinar', 'rabia', 'sena', 'sevval', 'sinem', 'yasemin',
  'berk', 'baris', 'kaan', 'mert', 'onur', 'ozan', 'tolga', 'umut', 'utku', 'yigit', 'eren', 'enes', 'emir', 'efe'
];

export const formatDisplayName = (fullName: string): string => {
  const clean = fullName.replace(/[0-9]/g, '').trim();
  if (!clean) return '';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const firstName = capitalizeFirstTR(parts[0]);

  if (parts.length === 1) return firstName;

  const surname = parts.slice(1).map((p) => capitalizeFirstTR(p)).join(' ');

  return `${firstName} ${surname}`;
};

export const formatDisplayNameFromEmail = (
  email: string,
  fallback: string,
): string => {
  const username = (email.split('@')[0] ?? '').trim();
  const clean = username
    .replace(/[0-9]/g, '')
    .replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ._-]/g, '')
    .trim();

  if (!clean) return fallback;

  let parts = clean
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => toLowerTR(part));

  if (parts.length === 1) {
    const token = parts[0];
    const known = KNOWN_FIRST_NAMES.find((name) => token.startsWith(name) && token.length > name.length + 1);
    if (known) {
      parts = [known, token.slice(known.length)];
    } else if (token.length >= 8) {
      const splitIndex = Math.max(3, Math.min(token.length - 3, Math.floor(token.length / 2)));
      parts = [token.slice(0, splitIndex), token.slice(splitIndex)];
    }
  }

  if (parts.length >= 2) {
    const firstName = capitalizeFirstTR(parts[0]);
    const surname = parts.slice(1).map((p) => capitalizeFirstTR(p)).join(' ');
    return `${firstName} ${surname}`.trim();
  }

  if (parts.length === 1) {
    return capitalizeFirstTR(parts[0]);
  }

  return fallback;
};

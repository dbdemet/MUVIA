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
  'mehmet','mustafa','ahmet','ali','huseyin','hasan','ibrahim','ismail','yusuf','osman',
  'murat','ramazan','halil','omer','suleyman','mahmut','abdullah','kemal','bekir','salih',
  'fatih','burak','emre','cemal','erdal','serdar','selcuk','orhan','ayhan','yasar',
  'kadir','adem','hakan','volkan','gokhan','serkan','ugur','ozgur','yasin','selim',
  'sinan','cem','turan','can','baris','kaan','mert','onur','ozan','tolga',
  'umut','utku','yigit','eren','enes','emir','efe','berk','arda','tuna',
  'furkan','alp','alperen','berat','bilal','cihat','cihan','deniz','dogan','engin',
  'ercan','erdem','erhan','ersin','faruk','ferit','ferhat','fikret','goksel','gurkan',
  'hamza','hakan','hayri','hikmet','ilhan','ilker','ilyas','irfan','ismet','kamil',
  'kasim','koray','levent','metin','muammer','muhammed','necati','nuri','oguz','polat',
  'recep','ridvan','saban','samet','sedat','sefa','semih','suat','sukru','tahir',
  'taner','tarik','timur','tufan','turgut','ufuk','umit','vedat','volkan','yavuz',
  'zafer','zeki',
  'fatma','ayse','emine','hatice','zeynep','elif','havva','meryem','mine','sultan',
  'demet','gizem','busra','kubra','merve','seda','esra','eda','selin','pelin',
  'ceren','gamze','irem','tugce','tugba','asli','betul','ceyda','dilara','duygu',
  'ece','ezgi','gokce','gozde','hazal','ilayda','melis','nihal','nur','ozge',
  'pinar','rabia','sena','sevval','sinem','yasemin','aylin','banu','basak','berna',
  'beyza','birsen','burcu','cansu','damla','defne','derya','didem','dilek','ebru',
  'elcin','elifnur','esin','feride','figen','filiz','fulya','gonca','gulden','gulsah',
  'gulsen','hande','hulya','inci','ipek','jale','laden','lale','leyda','melek',
  'meltem','miray','nalan','nazan','neslihan','nesrin','nihan','nilgun','nuray','olcay',
  'oyku','ozlem','pervin','reyhan','ruya','sanem','seher','selen','selma','sevgi',
  'sevil','sibel','simge','songul','sude','suzan','tansu','tuba','tugba','tulin',
  'yagmur','yaprak','yeliz','yesim','zehra','zilan'
];

const KNOWN_LAST_NAMES = [
  'yilmaz','kaya','demir','sahin','celik','yildiz','yildirim','ozturk','arslan','dogan',
  'koc','kurt','ozdemir','demirci','aksoy','acar','akbulut','akin','kilic','karaca',
  'turk','gunes','toprak','polat','tekin','tas','aslan','unal','can','ozkan',
  'ozcan','sezer','kaplan','cetin','guler','bozkurt','kara','kocak','bektas','sari',
  'ergun','kaynak','oktay','ergul','esen','bayraktar','kalayci','alkan','yavuz','bas',
  'kayaalp','demirel','turan','gok','sener','korkmaz','altun','erkan','akman','kasap',
  'yalcin','bayram','karakus','genc','bulut','derin','soylu','bolat','cetinkaya','aydin',
  'erdogan','ates','basar','cakir','caliskan','cakmak','coban','durmus','ekinci','erol',
  'gul','gultekin','gungor','inal','ince','karaman','kavak','keskin','kocer','kose',
  'kutlu','oguz','onal','ozer','ozgur','pala','parlak','sari','savci','soydan',
  'sen','simsek','tan','tanriverdi','tekeli','temiz','tok','tokat','tosun','tuncer',
  'turkmen','ucak','ulus','uslu','uzun','vardar','yalcinkaya','yalin','yazici','yoruk',
  'yuksel','zengin',
  'aktas','akyol','altas','altintas','asik','atakan','atay','avci','balci','balik',
  'basaran','baser','bayar','bayrak','bilgin','bircan','candan','cevik','cicek','colak',
  'dalkiran','dede','dinc','dincer','dursun','durmaz','ekim','elmas','erdem','eryilmaz',
  'gedik','gonul','gurbuz','guven','isik','kalabalik','kanat','kangal','kaptan','karatas',
  'keles','kilinc','kiral','konak','kuru','mercan','nacar','oguzhan','onder','ozay',
  'ozbek','ozcelik','ozden','ozturk','saglam','sakalli','sarac','sezgin','solmaz','sonmez',
  'soylemez','sucu','talay','tanis','taskin','tatli','tezcan','topal','topcu','tunc',
  'turhan','ucar','uludag','ulusoy','ustun','yaman','yanmaz','yavas','yetim','yildiran',
  'yolcu','zaman'
];

const firstNameSet = new Set(KNOWN_FIRST_NAMES);
const lastNameSet = new Set(KNOWN_LAST_NAMES);

const splitKnownNameParts = (token: string): [string, string] | null => {
  const lower = toLowerTR(token);

  // Strategy 1: firstName + lastName
  for (const first of KNOWN_FIRST_NAMES) {
    if (!lower.startsWith(first)) continue;
    const rest = lower.slice(first.length);
    if (!rest) continue;
    if (lastNameSet.has(rest)) return [first, rest];
    for (const last of KNOWN_LAST_NAMES) {
      if (rest.startsWith(last) && rest.length === last.length) return [first, last];
    }
  }

  // Strategy 2: lastName + firstName (reverse order)
  for (const last of KNOWN_LAST_NAMES) {
    if (!lower.startsWith(last)) continue;
    const rest = lower.slice(last.length);
    if (!rest) continue;
    if (firstNameSet.has(rest)) return [rest, last];
  }

  // Strategy 3: any firstName anywhere + remainder as lastName
  for (const first of KNOWN_FIRST_NAMES) {
    if (!lower.startsWith(first)) continue;
    const rest = lower.slice(first.length);
    if (rest.length >= 2) return [first, rest];
  }

  // Strategy 4: known lastName at end
  for (const last of KNOWN_LAST_NAMES) {
    if (!lower.endsWith(last)) continue;
    const pre = lower.slice(0, lower.length - last.length);
    if (pre.length >= 2) return [pre, last];
  }

  return null;
};

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
    const knownSplit = splitKnownNameParts(token);
    if (knownSplit) {
      parts = [knownSplit[0], knownSplit[1]];
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

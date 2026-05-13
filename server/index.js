const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/event_images', express.static(path.join(__dirname, '../event_images')));



function formatNameFromEmail(email) {
  // ── Comprehensive Turkish First Names Dictionary ──
  const firstNames = [
    // Male - very common
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
    // Female - very common
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

  // ── Comprehensive Turkish Last Names Dictionary ──
  const lastNames = [
    // Top 100+ most common Turkish surnames
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
    // Additional common surnames
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

  // ── Build lookup Sets for O(1) matching ──
  const firstNameSet = new Set(firstNames);
  const lastNameSet = new Set(lastNames);

  const rawUsername = (email || '').split('@')[0] || 'User';
  const cleaned = rawUsername.replace(/\d+$/g, '').replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ._-]/g, '');
  if (!cleaned) return 'User';

  const lower = cleaned.toLowerCase();
  const parts = lower.split(/[._-]+/).filter(Boolean);

  const capitalizeTR = (text) => text ? text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1).toLocaleLowerCase('tr-TR') : '';

  // ── Smart split: try firstName+lastName then lastName+firstName ──
  const splitKnown = (token) => {
    // Strategy 1: firstName + lastName (most common email format)
    for (const first of firstNames) {
      if (!token.startsWith(first)) continue;
      const rest = token.slice(first.length);
      if (!rest) continue;
      if (lastNameSet.has(rest)) return [first, rest];
      // Check if rest starts with a known last name (compound surnames)
      for (const last of lastNames) {
        if (rest.startsWith(last) && rest.length === last.length) return [first, last];
      }
    }
    // Strategy 2: lastName + firstName (reverse order)
    for (const last of lastNames) {
      if (!token.startsWith(last)) continue;
      const rest = token.slice(last.length);
      if (!rest) continue;
      if (firstNameSet.has(rest)) return [rest, last]; // Return as [firstName, lastName]
    }
    // Strategy 3: any firstName anywhere + remainder as lastName
    for (const first of firstNames) {
      if (!token.startsWith(first)) continue;
      const rest = token.slice(first.length);
      if (rest.length >= 2) return [first, rest]; // Accept any reasonable remainder
    }
    // Strategy 4: known lastName at end
    for (const last of lastNames) {
      if (!token.endsWith(last)) continue;
      const pre = token.slice(0, token.length - last.length);
      if (pre.length >= 2) return [pre, last];
    }
    return null;
  };

  let normalizedParts = parts;
  if (normalizedParts.length === 1) {
    const token = normalizedParts[0];
    const known = splitKnown(token);
    if (known) normalizedParts = known;
    else if (token.length >= 8) {
      const splitIndex = Math.max(3, Math.min(token.length - 3, Math.floor(token.length / 2)));
      normalizedParts = [token.slice(0, splitIndex), token.slice(splitIndex)];
    }
  }

  return normalizedParts.map((part) => capitalizeTR(part)).join(' ').trim() || 'User';
}

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';

const DEPARTMENTS = [
  { department: 'Software Engineering', faculty: 'Faculty of Engineering', courses: ['SE301','SE302','SE305'] },
  { department: 'Computer Engineering', faculty: 'Faculty of Engineering', courses: ['CE201','CE303','SE301'] },
  { department: 'Civil Engineering', faculty: 'Faculty of Engineering', courses: ['CVE101','CVE202','MAT101'] },
  { department: 'Business Administration', faculty: 'FEAS', courses: ['BUS101','ECO201','FIN301'] },
  { department: 'Economics', faculty: 'FEAS', courses: ['ECO201','ECO202','MAT101'] },
  { department: 'Mathematics', faculty: 'Faculty of Science', courses: ['MAT101','MAT201','MAT301'] },
  { department: 'Physics', faculty: 'Faculty of Science', courses: ['PHY101','PHY201','MAT101'] },
  { department: 'Biology', faculty: 'Faculty of Science', courses: ['BIO101','BIO201','CHE101'] },
  { department: 'Turkish Language and Literature', faculty: 'Faculty of Letters', courses: ['TLL101','TLL201','HIS101'] },
  { department: 'History', faculty: 'Faculty of Letters', courses: ['HIS101','HIS201','TLL101'] },
  { department: 'Primary Education', faculty: 'Faculty of Education', courses: ['EDU101','EDU201','PSY101'] },
  { department: 'Guidance and Counseling', faculty: 'Faculty of Education', courses: ['PSY101','EDU101','SOC101'] },
];
function hashEmail(email) {
  let h = 0;
  for (let i = 0; i < email.length; i++) { h = ((h << 5) - h + email.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function getDeptForEmail(email) {
  return DEPARTMENTS[hashEmail(email) % DEPARTMENTS.length];
}

const courses = [
  { code: 'SE301', name: 'Software Architecture', credits: 4, professor: 'Dr. Cihat Çetinkaya', professorEmail: 'cihat.cetinkaya@mu.edu.tr', room: 'ENG-B204', day: 'Monday', startTime: '09:00', endTime: '10:50', type: 'Lecture', description: 'Design patterns and system architecture.', enrolledCount: 42 },
  { code: 'SE302', name: 'Web Development', credits: 3, professor: 'Dr. Burak Sahin', professorEmail: 'burak.sahin@mu.edu.tr', room: 'ENG-A101', day: 'Tuesday', startTime: '11:00', endTime: '12:50', type: 'Lecture', description: 'Frontend and backend frameworks.', enrolledCount: 38 },
  { code: 'SE305', name: 'Software Testing', credits: 3, professor: 'Dr. Cihat Çetinkaya', professorEmail: 'cihat.cetinkaya@mu.edu.tr', room: 'ENG-A205', day: 'Friday', startTime: '11:00', endTime: '12:50', type: 'Lecture', description: 'TDD and QA methodologies.', enrolledCount: 55 },
  { code: 'CE201', name: 'Data Structures', credits: 4, professor: 'Dr. Mehmet Celik', professorEmail: 'mehmet.celik@mu.edu.tr', room: 'ENG-C301', day: 'Wednesday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: 'Trees, graphs, dynamic programming.', enrolledCount: 65 },
  { code: 'CE303', name: 'Operating Systems', credits: 4, professor: 'Prof. Fatma Ozturk', professorEmail: 'fatma.ozturk@mu.edu.tr', room: 'ENG-C301', day: 'Wednesday', startTime: '09:00', endTime: '11:50', type: 'Lecture', description: 'Process and memory management.', enrolledCount: 35 },
  { code: 'CVE101', name: 'Statics', credits: 3, professor: 'Prof. Ali Yilmaz', professorEmail: 'ali.yilmaz@mu.edu.tr', room: 'ENG-D101', day: 'Thursday', startTime: '09:00', endTime: '10:50', type: 'Lecture', description: 'Vector mechanics for engineers.', enrolledCount: 80 },
  { code: 'CVE202', name: 'Mechanics of Materials', credits: 4, professor: 'Prof. Ali Yilmaz', professorEmail: 'ali.yilmaz@mu.edu.tr', room: 'ENG-D102', day: 'Monday', startTime: '13:00', endTime: '15:50', type: 'Lecture', description: 'Stress, strain, and deformation.', enrolledCount: 70 },
  { code: 'BUS101', name: 'Intro to Business', credits: 3, professor: 'Dr. Ayse Demir', professorEmail: 'ayse.demir@mu.edu.tr', room: 'FEAS-A10', day: 'Tuesday', startTime: '10:00', endTime: '11:50', type: 'Lecture', description: 'Basics of business management.', enrolledCount: 120 },
  { code: 'ECO201', name: 'Microeconomics', credits: 3, professor: 'Dr. Ahmet Kaya', professorEmail: 'ahmet.kaya@mu.edu.tr', room: 'FEAS-B20', day: 'Wednesday', startTime: '14:00', endTime: '15:50', type: 'Lecture', description: 'Supply, demand, and markets.', enrolledCount: 90 },
  { code: 'ECO202', name: 'Macroeconomics', credits: 3, professor: 'Dr. Ahmet Kaya', professorEmail: 'ahmet.kaya@mu.edu.tr', room: 'FEAS-B20', day: 'Friday', startTime: '09:00', endTime: '10:50', type: 'Lecture', description: 'National income and monetary policy.', enrolledCount: 85 },
  { code: 'FIN301', name: 'Corporate Finance', credits: 3, professor: 'Dr. Ayse Demir', professorEmail: 'ayse.demir@mu.edu.tr', room: 'FEAS-C15', day: 'Thursday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: 'Capital budgeting and risk.', enrolledCount: 60 },
  { code: 'MAT101', name: 'Calculus I', credits: 4, professor: 'Prof. Hakan Ozturk', professorEmail: 'hakan.ozturk@mu.edu.tr', room: 'SCI-101', day: 'Monday', startTime: '09:00', endTime: '11:50', type: 'Lecture', description: 'Limits, derivatives, integrals.', enrolledCount: 200 },
  { code: 'MAT201', name: 'Linear Algebra', credits: 3, professor: 'Prof. Hakan Ozturk', professorEmail: 'hakan.ozturk@mu.edu.tr', room: 'SCI-102', day: 'Tuesday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: 'Vectors, matrices, eigenvalues.', enrolledCount: 150 },
  { code: 'MAT301', name: 'Differential Equations', credits: 3, professor: 'Prof. Hakan Ozturk', professorEmail: 'hakan.ozturk@mu.edu.tr', room: 'SCI-103', day: 'Wednesday', startTime: '10:00', endTime: '11:50', type: 'Lecture', description: 'ODEs and PDEs.', enrolledCount: 80 },
  { code: 'PHY101', name: 'Physics I', credits: 4, professor: 'Dr. Zeynep Can', professorEmail: 'zeynep.can@mu.edu.tr', room: 'SCI-201', day: 'Thursday', startTime: '09:00', endTime: '11:50', type: 'Lecture', description: 'Mechanics and thermodynamics.', enrolledCount: 180 },
  { code: 'PHY201', name: 'Electromagnetism', credits: 4, professor: 'Dr. Zeynep Can', professorEmail: 'zeynep.can@mu.edu.tr', room: 'SCI-202', day: 'Friday', startTime: '14:00', endTime: '16:50', type: 'Lecture', description: 'Electric and magnetic fields.', enrolledCount: 100 },
  { code: 'BIO101', name: 'General Biology', credits: 3, professor: 'Prof. Elif Yilmaz', professorEmail: 'elif.yilmaz@mu.edu.tr', room: 'SCI-301', day: 'Monday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: 'Cell biology and genetics.', enrolledCount: 150 },
  { code: 'BIO201', name: 'Molecular Biology', credits: 3, professor: 'Prof. Elif Yilmaz', professorEmail: 'elif.yilmaz@mu.edu.tr', room: 'SCI-302', day: 'Tuesday', startTime: '09:00', endTime: '10:50', type: 'Lecture', description: 'DNA, RNA, and protein synthesis.', enrolledCount: 90 },
  { code: 'CHE101', name: 'General Chemistry', credits: 4, professor: 'Dr. Murat Kara', professorEmail: 'murat.kara@mu.edu.tr', room: 'SCI-401', day: 'Wednesday', startTime: '13:00', endTime: '15:50', type: 'Lecture', description: 'Atomic structure and bonding.', enrolledCount: 160 },
  { code: 'TLL101', name: 'Ottoman Literature', credits: 3, professor: 'Dr. Deniz Arslan', professorEmail: 'deniz.arslan@mu.edu.tr', room: 'LET-101', day: 'Thursday', startTime: '10:00', endTime: '11:50', type: 'Lecture', description: 'Poetry and prose.', enrolledCount: 70 },
  { code: 'TLL201', name: 'Modern Turkish Lit', credits: 3, professor: 'Dr. Deniz Arslan', professorEmail: 'deniz.arslan@mu.edu.tr', room: 'LET-102', day: 'Friday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: '20th century authors.', enrolledCount: 65 },
  { code: 'HIS101', name: 'History of Republic', credits: 2, professor: 'Prof. Osman Yildirim', professorEmail: 'osman.yildirim@mu.edu.tr', room: 'LET-201', day: 'Monday', startTime: '15:00', endTime: '16:50', type: 'Lecture', description: 'Founding of modern Turkey.', enrolledCount: 250 },
  { code: 'HIS201', name: 'Ottoman History', credits: 3, professor: 'Prof. Osman Yildirim', professorEmail: 'osman.yildirim@mu.edu.tr', room: 'LET-202', day: 'Tuesday', startTime: '15:00', endTime: '16:50', type: 'Lecture', description: 'Empire expansion and decline.', enrolledCount: 80 },
  { code: 'EDU101', name: 'Intro to Education', credits: 3, professor: 'Dr. Aylin Kocer', professorEmail: 'aylin.kocer@mu.edu.tr', room: 'EDU-101', day: 'Wednesday', startTime: '09:00', endTime: '10:50', type: 'Lecture', description: 'Educational theories.', enrolledCount: 120 },
  { code: 'EDU201', name: 'Curriculum Dev', credits: 3, professor: 'Dr. Aylin Kocer', professorEmail: 'aylin.kocer@mu.edu.tr', room: 'EDU-102', day: 'Thursday', startTime: '13:00', endTime: '14:50', type: 'Lecture', description: 'Designing effective syllabi.', enrolledCount: 100 },
  { code: 'PSY101', name: 'Intro to Psychology', credits: 3, professor: 'Dr. Kaan Demir', professorEmail: 'kaan.demir@mu.edu.tr', room: 'EDU-201', day: 'Friday', startTime: '10:00', endTime: '11:50', type: 'Lecture', description: 'Human mind and behavior.', enrolledCount: 180 },
  { code: 'SOC101', name: 'Intro to Sociology', credits: 3, professor: 'Dr. Kaan Demir', professorEmail: 'kaan.demir@mu.edu.tr', room: 'EDU-202', day: 'Monday', startTime: '10:00', endTime: '11:50', type: 'Lecture', description: 'Society and social structures.', enrolledCount: 150 },
];

const exams = [
  { id: 'e1', courseCode: 'SE301', courseName: 'Software Architecture', type: 'Midterm', date: '2026-05-08', startTime: '10:00', endTime: '12:00', room: 'ENG-C301', professor: 'Dr. Cihat Çetinkaya', topics: ['Patterns', 'MVC'], notes: 'Closed book.' },
  { id: 'e2', courseCode: 'SE302', courseName: 'Web Development', type: 'Midterm', date: '2026-05-14', startTime: '14:00', endTime: '16:00', room: 'ENG-A101', professor: 'Dr. Burak Sahin', topics: ['React', 'NodeJS'], notes: 'Open notes allowed.' },
  { id: 'e3', courseCode: 'CE201', courseName: 'Data Structures', type: 'Quiz', date: '2026-05-18', startTime: '09:00', endTime: '09:30', room: 'ENG-C301', professor: 'Dr. Mehmet Celik', topics: ['Trees'], notes: 'Short quiz.' },
  { id: 'e4', courseCode: 'MAT101', courseName: 'Calculus I', type: 'Midterm', date: '2026-05-20', startTime: '13:00', endTime: '15:00', room: 'SCI-101', professor: 'Prof. Hakan Ozturk', topics: ['Derivatives'], notes: 'No calculators.' },
  { id: 'e5', courseCode: 'BUS101', courseName: 'Intro to Business', type: 'Midterm', date: '2026-05-15', startTime: '10:00', endTime: '12:00', room: 'FEAS-A10', professor: 'Dr. Ayse Demir', topics: ['Management'], notes: 'Multiple choice.' },
  { id: 'e6', courseCode: 'SE305', courseName: 'Software Testing', type: 'Final', date: '2026-06-05', startTime: '09:00', endTime: '11:00', room: 'ENG-A205', professor: 'Dr. Cihat Çetinkaya', topics: ['Unit Testing', 'TDD'], notes: 'Final exam.' },
  { id: 'e7', courseCode: 'CE303', courseName: 'Operating Systems', type: 'Midterm', date: '2026-05-12', startTime: '09:30', endTime: '11:30', room: 'ENG-C301', professor: 'Prof. Fatma Ozturk', topics: ['Scheduling'], notes: 'Standard midterm.' },
  { id: 'e8', courseCode: 'CVE101', courseName: 'Statics', type: 'Midterm', date: '2026-05-11', startTime: '10:00', endTime: '12:00', room: 'ENG-D101', professor: 'Prof. Ali Yilmaz', topics: ['Vectors'], notes: 'Bring ruler.' },
  { id: 'e9', courseCode: 'MAT201', courseName: 'Linear Algebra', type: 'Quiz', date: '2026-05-09', startTime: '14:00', endTime: '14:45', room: 'SCI-102', professor: 'Prof. Hakan Ozturk', topics: ['Matrices'], notes: 'No formulas.' },
  { id: 'e10', courseCode: 'PHY101', courseName: 'Physics I', type: 'Midterm', date: '2026-05-19', startTime: '10:00', endTime: '12:00', room: 'SCI-201', professor: 'Dr. Zeynep Can', topics: ['Dynamics'], notes: 'Formula sheet provided.' },
  { id: 'e11', courseCode: 'ECO201', courseName: 'Microeconomics', type: 'Midterm', date: '2026-05-13', startTime: '15:00', endTime: '16:30', room: 'FEAS-B20', professor: 'Dr. Ahmet Kaya', topics: ['Elasticity'], notes: 'Calc allowed.' },
  { id: 'e12', courseCode: 'ECO202', courseName: 'Macroeconomics', type: 'Midterm', date: '2026-05-22', startTime: '09:00', endTime: '11:00', room: 'FEAS-B20', professor: 'Dr. Ahmet Kaya', topics: ['Inflation'], notes: 'Midterm 2.' },
  { id: 'e13', courseCode: 'FIN301', courseName: 'Corporate Finance', type: 'Midterm', date: '2026-05-25', startTime: '13:00', endTime: '15:00', room: 'FEAS-C15', professor: 'Dr. Ayse Demir', topics: ['Cash Flow'], notes: 'Standard midterm.' },
  { id: 'e14', courseCode: 'MAT301', courseName: 'Differential Equations', type: 'Midterm', date: '2026-05-21', startTime: '10:00', endTime: '12:00', room: 'SCI-103', professor: 'Prof. Hakan Ozturk', topics: ['ODEs'], notes: 'Hard exam.' },
  { id: 'e15', courseCode: 'PHY201', courseName: 'Electromagnetism', type: 'Midterm', date: '2026-05-26', startTime: '14:00', endTime: '16:00', room: 'SCI-202', professor: 'Dr. Zeynep Can', topics: ['Maxwell'], notes: 'Midterm.' },
  { id: 'e16', courseCode: 'BIO101', courseName: 'General Biology', type: 'Midterm', date: '2026-05-12', startTime: '13:00', endTime: '14:30', room: 'SCI-301', professor: 'Prof. Elif Yilmaz', topics: ['Cells'], notes: 'Midterm.' },
  { id: 'e17', courseCode: 'BIO201', courseName: 'Molecular Biology', type: 'Quiz', date: '2026-05-09', startTime: '09:00', endTime: '09:45', room: 'SCI-302', professor: 'Prof. Elif Yilmaz', topics: ['DNA'], notes: 'Quick quiz.' },
  { id: 'e18', courseCode: 'CHE101', courseName: 'General Chemistry', type: 'Midterm', date: '2026-05-15', startTime: '13:00', endTime: '15:00', room: 'SCI-401', professor: 'Dr. Murat Kara', topics: ['Bonds'], notes: 'Periodic table provided.' },
  { id: 'e19', courseCode: 'TLL101', courseName: 'Ottoman Literature', type: 'Midterm', date: '2026-05-18', startTime: '10:00', endTime: '11:30', room: 'LET-101', professor: 'Dr. Deniz Arslan', topics: ['Poetry'], notes: 'Written exam.' },
  { id: 'e20', courseCode: 'TLL201', courseName: 'Modern Turkish Lit', type: 'Midterm', date: '2026-05-22', startTime: '13:00', endTime: '14:30', room: 'LET-102', professor: 'Dr. Deniz Arslan', topics: ['Authors'], notes: 'Midterm.' },
  { id: 'e21', courseCode: 'HIS101', courseName: 'History of Republic', type: 'Midterm', date: '2026-05-11', startTime: '15:00', endTime: '16:30', room: 'LET-201', professor: 'Prof. Osman Yildirim', topics: ['Atatürk'], notes: 'Big hall.' },
  { id: 'e22', courseCode: 'HIS201', courseName: 'Ottoman History', type: 'Midterm', date: '2026-05-19', startTime: '15:00', endTime: '16:30', room: 'LET-202', professor: 'Prof. Osman Yildirim', topics: ['Ottoman'], notes: 'Midterm.' },
  { id: 'e23', courseCode: 'EDU101', courseName: 'Intro to Education', type: 'Midterm', date: '2026-05-13', startTime: '09:00', endTime: '10:30', room: 'EDU-101', professor: 'Dr. Aylin Kocer', topics: ['Theories'], notes: 'Midterm.' },
  { id: 'e24', courseCode: 'EDU201', courseName: 'Curriculum Dev', type: 'Midterm', date: '2026-05-14', startTime: '13:00', endTime: '14:30', room: 'EDU-102', professor: 'Dr. Aylin Kocer', topics: ['Syllabus'], notes: 'Midterm.' },
  { id: 'e25', courseCode: 'PSY101', courseName: 'Intro to Psychology', type: 'Midterm', date: '2026-05-15', startTime: '10:00', endTime: '11:30', room: 'EDU-201', professor: 'Dr. Kaan Demir', topics: ['Mind'], notes: 'Midterm.' },
  { id: 'e26', courseCode: 'SOC101', courseName: 'Intro to Sociology', type: 'Midterm', date: '2026-05-11', startTime: '10:00', endTime: '11:30', room: 'EDU-202', professor: 'Dr. Kaan Demir', topics: ['Society'], notes: 'Midterm.' },
  { id: 'e27', courseCode: 'CVE202', courseName: 'Mechanics of Materials', type: 'Midterm', date: '2026-05-18', startTime: '13:00', endTime: '15:30', room: 'ENG-D102', professor: 'Prof. Ali Yilmaz', topics: ['Stress'], notes: 'Midterm.' },
];

const academics = [
  { id: 'a1', name: 'Dr. Cihat Cetinkaya', title: 'Assoc. Prof.', email: 'cihat.cetinkaya@mu.edu.tr', department: 'Software Engineering', faculty: 'Faculty of Engineering', officeRoom: 'ENG-214', phone: '+90 252 211 1234', courses: ['SE301', 'SE305'], officeHours: [{ day: 'Tuesday', startTime: '14:00', endTime: '16:00', room: 'ENG-214' }], availability: 'available', availabilityNote: '' },
  { id: 'a2', name: 'Prof. Fatma Ozturk', title: 'Professor', email: 'fatma.ozturk@mu.edu.tr', department: 'Computer Engineering', faculty: 'Faculty of Engineering', officeRoom: 'ENG-301', phone: '+90 252 211 1235', courses: ['CE303'], officeHours: [{ day: 'Wednesday', startTime: '09:00', endTime: '11:00', room: 'ENG-301' }], availability: 'in-meeting', availabilityNote: 'Board meeting.' },
  { id: 'a3', name: 'Prof. Ali Yilmaz', title: 'Professor', email: 'ali.yilmaz@mu.edu.tr', department: 'Civil Engineering', faculty: 'Faculty of Engineering', officeRoom: 'ENG-405', phone: '+90 252 211 1236', courses: ['CVE101', 'CVE202'], officeHours: [{ day: 'Monday', startTime: '10:00', endTime: '12:00', room: 'ENG-405' }], availability: 'away', availabilityNote: 'At conference.' },
  { id: 'a4', name: 'Dr. Ayse Demir', title: 'Assoc. Prof.', email: 'ayse.demir@mu.edu.tr', department: 'Business Administration', faculty: 'FEAS', officeRoom: 'FEAS-210', phone: '+90 252 211 1237', courses: ['BUS101', 'FIN301'], officeHours: [{ day: 'Thursday', startTime: '09:00', endTime: '11:00', room: 'FEAS-210' }], availability: 'available', availabilityNote: '' },
  { id: 'a5', name: 'Prof. Hakan Ozturk', title: 'Professor', email: 'hakan.ozturk@mu.edu.tr', department: 'Mathematics', faculty: 'Faculty of Science', officeRoom: 'SCI-305', phone: '+90 252 211 1238', courses: ['MAT101', 'MAT201', 'MAT301'], officeHours: [{ day: 'Friday', startTime: '10:00', endTime: '12:00', room: 'SCI-305' }], availability: 'available', availabilityNote: '' },
];

const events = [
  { id: 'ev1', title: 'Spring Festival Concert', description: 'Live music and activities.', date: '2026-05-10', time: '19:00', location: 'Open Air Stage', category: 'Culture', icon: '🎵', imageUrl: '/event_images/image.png', targetDepartments: [], interestedCount: 340, capacity: 500 },
  { id: 'ev2', title: 'Hackathon: Code for Good', description: '24-hour coding marathon.', date: '2026-05-17', time: '09:00', location: 'Engineering Lab 3', category: 'Workshop', icon: '💻', imageUrl: '/event_images/image copy.png', targetDepartments: ['Software Engineering', 'Computer Engineering'], interestedCount: 89, capacity: 120 },
  { id: 'ev3', title: 'Career Fair 2026', description: 'Meet recruiters and apply.', date: '2026-05-20', time: '10:00', location: 'Student Center', category: 'Career', icon: '💼', imageUrl: '/event_images/image copy 2.png', targetDepartments: [], interestedCount: 215, capacity: 450 },
];

let announcements = [
  { id: 'an1', title: 'Library Extended Hours', content: 'The upper floors of the library are open until 23:00 for 2 weeks (May 10 - May 24) during the exam period.', author: 'Library Management', authorRole: 'university', timestamp: '2026-05-01T10:00:00', icon: '📚' },
];
const weeklyMeals = [
  { date: '2026-05-04', dayName: 'Monday', items: [{ name: 'Tomato Soup', calories: 150, category: 'Soup' }, { name: 'Grilled Chicken', calories: 450, category: 'Main Course' }, { name: 'Rice Pilaf', calories: 300, category: 'Pasta/Rice' }, { name: 'Chocolate Pudding', calories: 250, category: 'Dessert' }], totalCalories: 1150, averageRating: 4.5, ratingCount: 42 },
  { date: '2026-05-05', dayName: 'Tuesday', items: [{ name: 'Lentil Soup', calories: 180, category: 'Soup' }, { name: 'Beef Stew', calories: 500, category: 'Main Course' }, { name: 'Bulgur Pilaf', calories: 280, category: 'Pasta/Rice' }, { name: 'Baklava', calories: 350, category: 'Dessert' }], totalCalories: 1310, averageRating: 4.8, ratingCount: 56 },
  { date: '2026-05-06', dayName: 'Wednesday', items: [{ name: 'Mushroom Soup', calories: 160, category: 'Soup' }, { name: 'Baked Salmon', calories: 420, category: 'Main Course' }, { name: 'Macaroni', calories: 320, category: 'Pasta/Rice' }, { name: 'Fruit Salad', calories: 120, category: 'Dessert' }], totalCalories: 1020, averageRating: 4.2, ratingCount: 38 },
  { date: '2026-05-07', dayName: 'Thursday', items: [{ name: 'Vegetable Soup', calories: 140, category: 'Soup' }, { name: 'Meatballs', calories: 480, category: 'Main Course' }, { name: 'Mashed Potatoes', calories: 250, category: 'Pasta/Rice' }, { name: 'Rice Pudding', calories: 280, category: 'Dessert' }], totalCalories: 1150, averageRating: 4.6, ratingCount: 61 },
  { date: '2026-05-08', dayName: 'Friday', items: [{ name: 'Chicken Soup', calories: 170, category: 'Soup' }, { name: 'Doner Kebab', calories: 550, category: 'Main Course' }, { name: 'Fries', calories: 380, category: 'Pasta/Rice' }, { name: 'Ice Cream', calories: 200, category: 'Dessert' }], totalCalories: 1300, averageRating: 4.9, ratingCount: 89 },
];

const communityClubs = [
  { id: 'club-ai', name: 'AI Club', description: 'AI, ML and product labs', members: 124, president: 'Ahmet Kaya', presidentEmail: 'ahmet.kaya@posta.mu.edu.tr' },
  { id: 'club-hike', name: 'Hiking Club', description: 'Weekend nature activities', members: 76, president: 'Zeynep Demir', presidentEmail: 'zeynep.demir@posta.mu.edu.tr' },
  { id: 'club-career', name: 'Career Network', description: 'CV, interview and referral sessions', members: 212, president: 'Can Yilmaz', presidentEmail: 'can.yilmaz@posta.mu.edu.tr' },
];
let communityPosts = [{ id: 'post1', authorName: 'Campus Team', authorEmail: 'team@muvia.app', content: 'Welcome to the new MUVIA community feed!', tags: ['announcement'], createdAt: new Date().toISOString() }];
let clubMessages = {}; // { clubId: [ {id, authorName, authorEmail, content, timestamp} ] }
let clubMembers = {
  'club-ai': [{ name: 'Ahmet Kaya', email: 'ahmet.kaya@posta.mu.edu.tr', role: 'President' }],
  'club-hike': [{ name: 'Zeynep Demir', email: 'zeynep.demir@posta.mu.edu.tr', role: 'President' }],
  'club-career': [{ name: 'Can Yilmaz', email: 'can.yilmaz@posta.mu.edu.tr', role: 'President' }],
};
let sportsBoard = [
  { id: 'sp1', title: 'Football Match - Need 3 Players', sport: 'Football', type: 'teammate', description: 'Saturday 4pm at campus field. Need 3 more for 7v7.', contact: 'emre@posta.mu.edu.tr', contactName: 'Emre B.', slots: 3, date: '2026-05-10', createdAt: new Date().toISOString() },
  { id: 'sp2', title: 'Tennis Lessons - Beginners Welcome', sport: 'Tennis', type: 'trainee', description: 'Free tennis lessons every Wednesday 10am. All levels.', contact: 'coach@mu.edu.tr', contactName: 'Sports Center', slots: 8, date: '2026-05-07', createdAt: new Date().toISOString() },
  { id: 'sp3', title: 'Basketball Team Tryouts', sport: 'Basketball', type: 'participant', description: 'University basketball team tryouts. Must be enrolled student.', contact: 'sports@mu.edu.tr', contactName: 'Athletics Dept', slots: 5, date: '2026-05-12', createdAt: new Date().toISOString() },
];
let complaints = [];
let messages = [];
let eventCheckins = {};
let eventCheckouts = {};
let eventFeedbacks = {};
let userProfiles = {};
// --- Simple JSON persistence to keep user histories and complaints across restarts ---
const DATA_FILE = path.join(__dirname, 'data.json');
function loadState() {
  try { if (!fs.existsSync(DATA_FILE)) return null; return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { console.warn('Failed to load data.json', e); return null; }
}
function saveState() {
  try {
    const state = {
      userProfiles,
      complaints,
      communityPosts,
      messages,
      clubMessages,
      clubMembers,
      sportsBoard,
      eventFeedbacks: eventFeedbacks || {},
      eventCheckins: Object.fromEntries(Object.entries(eventCheckins).map(([k, s]) => [k, [...s]])),
      eventCheckouts: Object.fromEntries(Object.entries(eventCheckouts).map(([k, s]) => [k, [...s]])),
      announcements,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) { console.warn('Failed to save data.json', e); }
}
// hydrate state if present
const persisted = loadState();
if (persisted) {
  userProfiles = persisted.userProfiles || userProfiles;
  complaints = persisted.complaints || complaints;
  communityPosts = persisted.communityPosts || communityPosts;
  messages = persisted.messages || messages;
  clubMessages = persisted.clubMessages || clubMessages;
  clubMembers = persisted.clubMembers || clubMembers;
  sportsBoard = persisted.sportsBoard || sportsBoard;
  eventFeedbacks = persisted.eventFeedbacks || eventFeedbacks;
  eventCheckins = {};
  Object.entries(persisted.eventCheckins || {}).forEach(([k, arr]) => { eventCheckins[k] = new Set(arr); });
  eventCheckouts = {};
  Object.entries(persisted.eventCheckouts || {}).forEach(([k, arr]) => { eventCheckouts[k] = new Set(arr); });
  announcements = persisted.announcements || announcements;
}
let nextId = 1000;
const genId = (p = 'id') => `${p}${++nextId}`;

const UNIT_MANAGERS = {
  // ── FIRST TIER: Faculty and Main Building Managements ──
  engineering_faculty: {
    id: "engineering_faculty",
    displayName: "Dean's Office of Engineering",
    managerName: "Dean of Engineering",
    email: "muhendislik@msku.edu.tr"
  },
  literature_faculty: {
    id: "literature_faculty",
    displayName: "Dean's Office of Letters",
    managerName: "Dean of Letters",
    email: "edebiyat@msku.edu.tr"
  },
  education_faculty: {
    id: "education_faculty",
    displayName: "Dean's Office of Education",
    managerName: "Dean of Education",
    email: "egitim@msku.edu.tr"
  },
  technology_faculty: {
    id: "technology_faculty",
    displayName: "Dean's Office of Technology",
    managerName: "Dean of Technology",
    email: "teknoloji@msku.edu.tr"
  },
  economics_faculty: {
    id: "economics_faculty",
    displayName: "Dean's Office of Economics (FEAS)",
    managerName: "Dean of FEAS",
    email: "iibf@msku.edu.tr"
  },
  tourism_faculty: {
    id: "tourism_faculty",
    displayName: "Dean's Office of Tourism",
    managerName: "Dean of Tourism",
    email: "turizm@msku.edu.tr"
  },
  foreign_languages_faculty: {
    id: "foreign_languages_faculty",
    displayName: "School of Foreign Languages",
    managerName: "Director of Foreign Languages",
    email: "yabancidiller@msku.edu.tr"
  },
  fine_arts_faculty: {
    id: "fine_arts_faculty",
    displayName: "Dean's Office of Fine Arts",
    managerName: "Dean of Fine Arts",
    email: "guzelsanatlar@msku.edu.tr"
  },
  theology_faculty: {
    id: "theology_faculty",
    displayName: "Dean's Office of Theology",
    managerName: "Dean of Theology",
    email: "islamiilimler@msku.edu.tr"
  },
  medicine_faculty: {
    id: "medicine_faculty",
    displayName: "Dean's Office of Medicine",
    managerName: "Dean of Medicine",
    email: "tip@msku.edu.tr"
  },
  health_sciences_faculty: {
    id: "health_sciences_faculty",
    displayName: "Dean's Office of Health Sciences",
    managerName: "Dean of Health Sciences",
    email: "saglikbilimleri@msku.edu.tr"
  },
  science_faculty: {
    id: "science_faculty",
    displayName: "Dean's Office of Science",
    managerName: "Dean of Science",
    email: "fen@msku.edu.tr"
  },
  architecture_faculty: {
    id: "architecture_faculty",
    displayName: "Dean's Office of Architecture",
    managerName: "Dean of Architecture",
    email: "mimarlik@msku.edu.tr"
  },
  sports_sciences_faculty: {
    id: "sports_sciences_faculty",
    displayName: "Dean's Office of Sports Sciences",
    managerName: "Dean of Sports Sciences",
    email: "sporbilimleri@msku.edu.tr"
  },
  aquatic_sciences_faculty: {
    id: "aquatic_sciences_faculty",
    displayName: "Dean's Office of Aquatic Sciences",
    managerName: "Dean of Aquatic Sciences",
    email: "suurunleri@msku.edu.tr"
  },
  central_library: {
    id: "central_library",
    displayName: "MSKU Central Library",
    managerName: "Library Director",
    email: "kutuphane@msku.edu.tr"
  },
  rectorate: {
    id: "rectorate",
    displayName: "Rectorate Office",
    managerName: "Vice Rector",
    email: "rektorluk@msku.edu.tr"
  },
  sports_center: {
    id: "sports_center",
    displayName: "Campus Sports Center",
    managerName: "Sports Center Director",
    email: "spor@msku.edu.tr"
  },

  // ── SECOND TIER: Technical and Service Units ──
  yapi_isleri: {
    id: "yapi_isleri",
    displayName: "Dept. of Construction and Technical Services",
    managerName: "Head of Technical Services",
    email: "yapiisleri@msku.edu.tr"
  },
  bilgi_islem: {
    id: "bilgi_islem",
    displayName: "Department of IT Services",
    managerName: "Head of IT Department",
    email: "bilgiislem@msku.edu.tr"
  },
  saglik_hizmetleri: {
    id: "saglik_hizmetleri",
    displayName: "Health, Culture and Sports Department (SKS)",
    managerName: "Head of SKS Department",
    email: "sks@msku.edu.tr"
  },
  ogrenci_isleri: {
    id: "ogrenci_isleri",
    displayName: "Student Affairs Department",
    managerName: "Head of Student Affairs",
    email: "ogrenciisleri@msku.edu.tr"
  },
  idari_mali: {
    id: "idari_mali",
    displayName: "Department of Administrative and Financial Affairs",
    managerName: "Head of Admin Affairs",
    email: "idari@msku.edu.tr"
  }
};

// ── FACILITIES MAP: Building/Faculty names → First tier unit ──
const FACILITIES_MAP = {
  "research laboratory center": "engineering_faculty",
  "research labaratory center": "engineering_faculty",
  "faculty of health sciences": "health_sciences_faculty",
  "faculty of medicine": "medicine_faculty",
  "office of president": "rectorate",
  "faculty of sport sciences": "sports_sciences_faculty",
  "faculty of technology": "technology_faculty",
  "faculty of education": "education_faculty",
  "faculty of economics": "economics_faculty",
  "faculty of literature": "literature_faculty",
  "faculty of science": "science_faculty",
  "department of informatics": "engineering_faculty",
  "faculty of engineering": "engineering_faculty",
  "faculty of tourism": "tourism_faculty",
  "faculty of theology": "theology_faculty",
  "faculty of fine arts": "fine_arts_faculty",
  "university library": "central_library",
  "stadium": "sports_center",
  "indoor swimming pool": "sports_center",
  "ataturk cultural center": "rectorate",
  "sitki kocman student union": "rectorate",
  "sitki kocman dining hall": "rectorate"
};

// ── PROBLEM TYPE ROUTING: Keywords → Service unit ──
const SERVICE_UNIT_MAP = {
  "wifi": "bilgi_islem",
  "wi-fi": "bilgi_islem",
  "internet": "bilgi_islem",
  "network": "bilgi_islem",
  "connection": "bilgi_islem",
  "internet connection": "bilgi_islem",
  "computer": "bilgi_islem",
  "system": "bilgi_islem",
  "sabis": "bilgi_islem",
  "email": "bilgi_islem",
  "printer": "bilgi_islem",
  "projection": "bilgi_islem",
  "screen": "bilgi_islem",
  "software": "bilgi_islem",
  "application": "bilgi_islem",
  "smell": "yapi_isleri",
  "odor": "yapi_isleri",
  "maintenance": "yapi_isleri",
  "broken": "yapi_isleri",
  "elevator": "yapi_isleri",
  "electricity": "yapi_isleri",
  "water": "yapi_isleri",
  "heating": "yapi_isleri",
  "cooling": "yapi_isleri",
  "cleaning": "yapi_isleri",
  "building": "yapi_isleri",
  "infrastructure": "yapi_isleri",
  "registration": "ogrenci_isleri",
  "document": "ogrenci_isleri",
  "transcript": "ogrenci_isleri",
  "enrollment": "ogrenci_isleri",
  "academic": "ogrenci_isleri",
  "course": "ogrenci_isleri",
  "student affairs": "ogrenci_isleri"
};

const COMPLAINT_STATUSES = ['pending', 'triaged', 'assigned', 'in-progress', 'resolved', 'closed', 'escalated'];

function ensureUser(email, role = 'student') {
  const e = (email || '').trim().toLowerCase();
  if (!e) return null;
  if (!userProfiles[e]) {
    const baseName = formatNameFromEmail(e);
    const isStudent = role === 'student' || e.endsWith('@posta.mu.edu.tr');
    const id = isStudent ? `s-${baseName.toLowerCase().replace(/\s+/g, '-')}` : `a-${baseName.toLowerCase().replace(/\s+/g, '-')}`;
    const dept = getDeptForEmail(e);
    const studentId = isStudent ? `22${String(hashEmail(e) % 900000 + 100000)}` : undefined;
    const yearVal = (hashEmail(e) % 4) + 1;
    const gpaVal = Number((2.5 + (hashEmail(e) % 20) / 10).toFixed(2));
    userProfiles[e] = {
      id,
      role: isStudent ? 'student' : role,
      name: isStudent ? baseName : `Dr. ${baseName}`,
      email: e,
      studentId,
      department: dept.department,
      faculty: dept.faculty,
      year: yearVal,
      gpa: gpaVal,
      interests: ['AI', 'Web Development'],
      enrolledCourses: dept.courses,
      title: isStudent ? undefined : 'Assoc. Prof.',
      officeRoom: isStudent ? undefined : 'ENG-214',
      courses: isStudent ? undefined : dept.courses,
      accessibility: { largeText: false, highContrast: false, reducedMotion: false, screenReaderOptimized: false, dyslexiaFont: false, colorBlindMode: 'none', textToSpeech: false, increasedTouchTargets: false, language: 'en', fontSizeScale: 1, autoReadNotifications: false },
      joinedClubs: [],
      lastActiveAt: new Date().toISOString(),
    };
    try { saveState(); } catch (e) { /* ignore */ }
  }
  const dept = getDeptForEmail(e);
  if (role === 'student') userProfiles[e].enrolledCourses = dept.courses;
  if (role === 'academic') { userProfiles[e].courses = dept.courses; userProfiles[e].enrolledCourses = dept.courses; }
  userProfiles[e].lastActiveAt = new Date().toISOString();
  if (role) userProfiles[e].role = role;
  // Always re-derive name from email to pick up dictionary improvements
  const freshName = formatNameFromEmail(e);
  const isStudentNow = userProfiles[e].role === 'student' || e.endsWith('@posta.mu.edu.tr');
  userProfiles[e].name = isStudentNow ? freshName : `Dr. ${freshName}`;
  return userProfiles[e];
}

function userByReq(req, role = 'student') {
  const queryEmail = req.query?.email;
  const bodyEmail = req.body?.email;
  const email = queryEmail || bodyEmail;
  if (email) return ensureUser(String(email), role);

  const studentId = req.params?.id;
  if (studentId) {
    const existing = Object.values(userProfiles).find((user) => user.id === studentId && (!role || user.role === role || role === 'student'));
    if (existing) return existing;
  }

  return null;
}

function enrichEventForUser(ev, email) {
  const cins = (eventCheckins[ev.id] || new Set());
  const couts = (eventCheckouts[ev.id] || new Set());
  const fbs = eventFeedbacks[ev.id] || [];
  const checkedInCount = cins.size;
  const remaining = Math.max(0, (ev.capacity || 0) - checkedInCount);
  const avgSatisfaction = fbs.length ? Number((fbs.reduce((a, b) => a + b.rating, 0) / fbs.length).toFixed(2)) : 0;
  return {
    ...ev,
    checkedInCount,
    remaining,
    isFull: remaining <= 0,
    userCheckedIn: email ? cins.has(email) : false,
    userCheckedOut: email ? couts.has(email) : false,
    avgSatisfaction,
    feedbackCount: fbs.length,
  };
}

async function callAnthropic(system, messages) {
  if (!ANTHROPIC_KEY || !ANTHROPIC_KEY.startsWith('sk-ant-')) return null;
  try {
    const msgArray = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 700, system, messages: msgArray }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

function localAssistantReply(user, text) {
  const t = String(text || '').toLowerCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userCourses = (user.enrolledCourses || []).map(c => courses.find(x => x.code === c)).filter(Boolean);
  const userExams = exams.filter(e => (user.enrolledCourses || []).includes(e.courseCode));
  if (t.includes('event')) return `${greeting} ${user.name}! There are ${events.length} upcoming events: ${events.map(e => e.title).join(', ')}. Would you like details on any of them?`;
  if (t.includes('exam') || t.includes('midterm')) return `${greeting} ${user.name}! Your upcoming exams: ${userExams.map(e => `${e.courseName} (${e.type}) on ${e.date} at ${e.startTime}`).join('; ')}. Need study tips?`;
  if (t.includes('meal') || t.includes('food') || t.includes('menu') || t.includes('cafeteria')) return `${greeting} ${user.name}! Today's menu: ${weeklyMeals[0].items.map(i => `${i.name} (${i.calories} cal)`).join(', ')}. Total: ${weeklyMeals[0].totalCalories} cal. Rating: ${weeklyMeals[0].averageRating}/5`;
  if (t.includes('schedule') || t.includes('class')) return `${greeting} ${user.name}! Your classes: ${userCourses.map(c => `${c.name} (${c.day} ${c.startTime}, ${c.room})`).join('; ')}.`;
  if (t.includes('library')) return `${greeting} ${user.name}! Main Library hours: Mon-Fri 08:00-22:00, weekends 10:00-18:00. Extended hours during exam periods.`;
  if (t.includes('route') || t.includes('map') || t.includes('direction')) return `${greeting} ${user.name}! You can use the Map tab for route planning. Grant location permission to use 'My Location' as starting point, then choose walking/driving/bus mode.`;
  if (t.includes('gpa') || t.includes('grade')) return `${greeting} ${user.name}! Your current GPA is ${user.gpa || 'N/A'}. You're in Year ${user.year || '?'} of ${user.department || 'your program'}.`;
  if (t.includes('complaint') || t.includes('problem') || t.includes('issue')) return `${greeting} ${user.name}! You can submit complaints from the Home tab. Our smart routing system will automatically direct your issue to the correct department (Infrastructure, IT, Student Affairs, etc.).`;
  if (t.includes('hello') || t.includes('hi') || t.includes('hey')) return `${greeting} ${user.name}! 👋 I'm your MUVIA assistant. I can help with schedules, exams, events, campus map, complaints, and more. What do you need?`;
  return `${greeting} ${user.name}! I'm here to help with anything campus-related. You're studying ${user.department || 'at MSKU'} (${user.faculty || ''}). Ask me about your classes, exams, events, map directions, complaints, or campus facilities!`;
}

async function smartAcademicReply(userMsg, academicName) {
  const llm = await callAnthropic(
    'You are an academic staff member replying clearly and naturally in English. Keep it concise and helpful.',
    `Student message: ${userMsg}\nAcademic name: ${academicName}`
  );
  if (llm) return llm;
  const templates = [
    'Thank you for your message. Let\'s evaluate the issue together; could you share a suitable time interval?',
    'I understand the problem. If you send a short summary first, we can solve it faster.',
    'I can help with this. Let\'s set a meeting time if you wish.',
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function heuristicComplaintRouting(complaint) {
  const text = `${complaint.subject || ''} ${complaint.description || ''}`.toLowerCase();
  const faculty = complaint.faculty || 'Faculty';
  const facultyUnit = `${faculty} Dean's Office / Student Affairs`;
  const contains = (...k) => k.some((x) => text.includes(x));
  if (contains('internet', 'wifi', 'obs', 'sistem', 'uygulama', 'yazılım', 'bilgisayar', 'printer', 'yazıcı', 'e-posta', 'şifre', 'ağ', 'network', 'software', 'computer')) return { facultyUnit, unitKey: 'IT', priority: 'high', summary: `Technical issue detected. Routed to Faculty first, then IT.`, escalationChain: [facultyUnit, 'MSKU IT Department'] };
  if (contains('kırık', 'bakım', 'asansör', 'elektrik', 'su', 'sınıf', 'projeksiyon', 'yol', 'bahçe', 'bank', 'turnike', 'kapı', 'cam', 'çatı', 'tuvalet', 'temizlik', 'ısıtma', 'soğutma', 'klima', 'aydınlatma', 'merdiven', 'broken', 'maintenance', 'elevator', 'cleaning')) return { facultyUnit, unitKey: 'Infrastructure', priority: 'high', summary: `Infrastructure issue detected. Routed to Faculty first, then Technical Services.`, escalationChain: [facultyUnit, 'Construction and Technical Services'] };
  if (contains('öğrenci kartı', 'kart', 'kimlik', 'turnike geçiş', 'giriş kartı', 'yemek kartı', 'student card', 'id card', 'access card')) return { facultyUnit, unitKey: 'StudentAffairs', priority: 'high', summary: `Card access issue. Routed to Faculty first, then Student Affairs.`, escalationChain: [facultyUnit, 'Student Affairs Department', 'MSKU IT'] };
  if (contains('öğrenci işleri', 'belge', 'kayıt', 'ders seçimi', 'transkript', 'not', 'devamsızlık', 'burs', 'harç', 'hoca', 'professor', 'grade', 'attendance', 'registration', 'course', 'faculty')) return { facultyUnit, unitKey: 'Academic', priority: 'medium', summary: `Academic issue. Routed to ${facultyUnit}.`, escalationChain: [facultyUnit] };
  if (contains('güvenlik', 'tehdit', 'acil', 'hırsızlık', 'kavga', 'yangın', 'security', 'theft', 'emergency', 'fire')) return { facultyUnit, unitKey: 'Security', priority: 'critical', summary: `Security/Emergency issue. Routed to Security Unit.`, escalationChain: ['Campus Security Unit'] };
  if (contains('otobüs', 'ulaşım', 'durak', 'ring', 'servis', 'toplu taşıma', 'bus', 'transport', 'shuttle')) return { facultyUnit, unitKey: 'Transport', priority: 'medium', summary: `Transport issue. Routed to Campus Transport Unit.`, escalationChain: ['Campus Transport Unit'] };
  if (contains('sağlık', 'doktor', 'hastane', 'revir', 'ilaç', 'health', 'doctor', 'hospital', 'medical')) return { facultyUnit, unitKey: 'Health', priority: 'high', summary: `Health issue. Routed to Campus Health Unit.`, escalationChain: ['Campus Health Unit'] };
  if (contains('yemek', 'yemekhane', 'kantin', 'kafeterya', 'food', 'cafeteria', 'dining')) return { facultyUnit, unitKey: 'General', priority: 'medium', summary: `Dining/Cafeteria issue. Routed to General Admin Unit.`, escalationChain: [facultyUnit, 'General Administrative Unit'] };
  return { facultyUnit, unitKey: 'StudentAffairs', priority: 'medium', summary: `General student issue. Routed to Faculty first, then Student Affairs.`, escalationChain: [facultyUnit, 'Student Affairs Department'] };
}

async function llmComplaintRouting(complaint) {
  const text = `${complaint.subject || ''} ${complaint.description || ''}`.toLowerCase();
  
  // Step 1: Identify facility/building (First Tier Unit)
  let facultyUnit = null;
  for (const [facilityName, unitKey] of Object.entries(FACILITIES_MAP)) {
    if (text.includes(facilityName)) {
      facultyUnit = unitKey;
      break;
    }
  }
  
  // If no facility found, default to engineering_faculty (most common)
  if (!facultyUnit) {
    facultyUnit = "engineering_faculty";
  }
  
  // Step 2: Identify problem type (Second Tier Service Unit)
  let serviceUnit = "bilgi_islem"; // default to IT
  for (const [keyword, unitKey] of Object.entries(SERVICE_UNIT_MAP)) {
    if (text.includes(keyword)) {
      serviceUnit = unitKey;
      break;
    }
  }
  
  // Verify units exist
  if (!UNIT_MANAGERS[facultyUnit]) facultyUnit = "engineering_faculty";
  if (!UNIT_MANAGERS[serviceUnit]) serviceUnit = "bilgi_islem";
  
  return {
    facultyUnit,
    serviceUnit,
    actionPlan: `This complaint has been analyzed and routed. First tier: ${UNIT_MANAGERS[facultyUnit].displayName}. Second tier: ${UNIT_MANAGERS[serviceUnit].displayName}.`,
    confidence: 0.85,
    reasoning: `Facility identified: ${UNIT_MANAGERS[facultyUnit].displayName}. Service unit: ${UNIT_MANAGERS[serviceUnit].displayName}.`
  };
}


function appendComplaintHistory(complaint, status, note, actor) {
  complaint.history = complaint.history || [];
  complaint.history.push({ status, note, actor, at: new Date().toISOString() });
  complaint.lastUpdatedAt = new Date().toISOString();
}

function updateComplaintStatus(complaint, status, note, actor) {
  complaint.status = status;
  complaint.response = note;
  complaint.respondedAt = new Date().toISOString();
  complaint.respondedBy = actor;
  appendComplaintHistory(complaint, status, note, actor);
}

function sendNotificationToUnit(unitId, notification) {
  const unit = UNIT_MANAGERS[unitId];
  if (!unit) {
    console.warn(`⚠ Unknown unit: ${unitId}`);
    return;
  }

  const message = {
    id: `msg${genId()}`,
    toId: unit.managerName,
    toUnitId: unitId,
    toEmail: unit.email,
    fromId: 'system',
    fromName: 'MUVIA System',
    toName: unit.managerName,
    type: notification.type,
    priority: notification.priority || "normal",
    subject: `MUVIA Notification: ${notification.type}`,
    content: notification.message,
    complaintId: notification.complaintId,
    timestamp: new Date().toISOString(),
    read: false
  };

  messages.push(message);
  console.log(`📨 Notification sent → ${unit.displayName} (${unit.managerName}):  Type: ${notification.type}`);
}

async function routeComplaint(complaint) {
  const result = await llmComplaintRouting(complaint);
  if (!result) {
    // Fallback: Route to faculty of engineering and IT
    complaint.facultyUnit = "engineering_faculty";
    complaint.serviceUnit = "bilgi_islem";
    complaint.actionPlan = "Complaint could not be analyzed automatically, routed to default units.";
    complaint.llmConfidence = 0.3;
  } else {
    complaint.facultyUnit = result.facultyUnit;
    complaint.serviceUnit = result.serviceUnit;
    complaint.actionPlan = result.actionPlan;
    complaint.llmConfidence = result.confidence;
  }

  const faculty = UNIT_MANAGERS[complaint.facultyUnit];
  const service = UNIT_MANAGERS[complaint.serviceUnit];
  
  complaint.facultyUnitDisplayName = faculty.displayName;
  complaint.serviceUnitDisplayName = service.displayName;
  complaint.routedTo = [faculty.displayName, service.displayName]; // Track routing chain
  complaint.status = "triaged";
  complaint.routedUnit = service.displayName;
  complaint.managerName = service.managerName;

  // Send FIRST notification to Faculty Administration
  sendNotificationToUnit(complaint.facultyUnit, {
    type: "new_complaint_received",
    priority: "high",
    message: `NEW COMPLAINT RECEIVED: "${complaint.subject}"\nStudent Email: ${complaint.studentEmail}\nDescription: ${complaint.description}\n\nThis complaint has been routed to your unit as the first tier administrator. Please acknowledge receipt and coordinate with the second tier unit: ${service.displayName}.`,
    complaintId: complaint.id
  });

  // Send SECOND notification to Service Unit (after 1 second)
  setTimeout(() => {
    sendNotificationToUnit(complaint.serviceUnit, {
      type: "new_complaint_routed",
      priority: "high",
      message: `COMPLAINT ROUTED TO YOUR UNIT: "${complaint.subject}"\nStudent Email: ${complaint.studentEmail}\nFirst Tier: ${faculty.displayName}\nDescription: ${complaint.description}\n\nAction Plan: ${complaint.actionPlan}\n\nPlease begin investigation and provide updates to the first tier unit.`,
      complaintId: complaint.id
    });
  }, 1000);

  return {
    success: true,
    message: `Complaint analyzed and routed successfully.\n1st Tier: ${faculty.displayName}\n2nd Tier: ${service.displayName}`,
    routedTo: [faculty.displayName, service.displayName]
  };
}

app.post('/api/auth/student-login', (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  if (!email.endsWith('@posta.mu.edu.tr')) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const user = ensureUser(email, 'student');
  return res.json({ success: true, user });
});
app.post('/api/auth/academic-login', (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  if (!email.endsWith('@mu.edu.tr')) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const user = ensureUser(email, 'academic');
  return res.json({ success: true, user });
});
app.get('/api/user/profile', (req, res) => {
  const email = String(req.query.email || '');
  const role = String(req.query.role || 'student');
  const user = ensureUser(email, role);
  if (!user) return res.status(400).json({ error: 'email required' });
  res.json(user);
});
app.get('/api/user/settings/accessibility', (req, res) => {
  const user = userByReq(req);
  if (!user) return res.status(400).json({ error: 'email required' });
  res.json(user.accessibility || {});
});
app.patch('/api/user/settings/accessibility', (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  user.accessibility = { ...user.accessibility, ...(req.body.settings || {}) };
  res.json({ success: true, settings: user.accessibility });
});
app.patch('/api/user/profile', (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  const { interests, enrolledCourses, name } = req.body;
  if (interests) user.interests = interests;
  if (enrolledCourses) user.enrolledCourses = enrolledCourses;
  if (name) user.name = name;
  res.json({ success: true, user });
});

app.get('/api/student/:id', (req, res) => {
  const user = userByReq(req, 'student');
  if (user) return res.json(user);
  return res.json(ensureUser('demo@posta.mu.edu.tr', 'student'));
});
app.get('/api/student/:id/schedule', (req, res) => {
  const user = userByReq(req, 'student') || Object.values(userProfiles).find((candidate) => candidate.id === req.params.id && candidate.role === 'student');
  const dept = getDeptForEmail(user?.email || 'demo@posta.mu.edu.tr');
  const selected = user?.enrolledCourses || dept.courses;
  res.json(courses.filter((c) => selected.includes(c.code)));
});
app.get('/api/student/:id/exams', (req, res) => {
  const user = userByReq(req, 'student') || Object.values(userProfiles).find((candidate) => candidate.id === req.params.id && candidate.role === 'student');
  const dept = getDeptForEmail(user?.email || 'demo@posta.mu.edu.tr');
  const selected = user?.enrolledCourses || dept.courses;
  res.json(exams.filter((e) => selected.includes(e.courseCode)));
});
app.get('/api/courses', (_req, res) => res.json(courses));
app.get('/api/courses/:code', (req, res) => {
  const c = courses.find((x) => x.code === req.params.code);
  c ? res.json(c) : res.status(404).json({ error: 'Not found' });
});
app.get('/api/exams', (_req, res) => res.json(exams));

app.get('/api/events', (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  res.json(events.map((e) => enrichEventForUser(e, email)));
});
app.get('/api/events/recommended/:department', (req, res) => {
  const dept = req.params.department;
  const email = String(req.query.email || '').toLowerCase();
  const filtered = events.filter((e) => !e.targetDepartments?.length || e.targetDepartments.includes(dept));
  res.json(filtered.map((e) => enrichEventForUser(e, email)));
});
app.post('/api/events/:id/check-in', (req, res) => {
  const { id } = req.params;
  const email = String(req.body.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });
  const ev = events.find((e) => e.id === id);
  if (!ev) return res.status(404).json({ error: 'event not found' });
  eventCheckins[id] = eventCheckins[id] || new Set();
  if (eventCheckins[id].size >= ev.capacity) return res.status(409).json({ error: 'Event is full' });
  eventCheckins[id].add(email);
  res.json({ success: true, event: enrichEventForUser(ev, email) });
});
app.post('/api/events/:id/check-out', (req, res) => {
  const { id } = req.params;
  const email = String(req.body.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });
  const ev = events.find((e) => e.id === id);
  if (!ev) return res.status(404).json({ error: 'event not found' });
  eventCheckins[id] = eventCheckins[id] || new Set();
  eventCheckouts[id] = eventCheckouts[id] || new Set();
  eventCheckins[id].delete(email);
  eventCheckouts[id].add(email);
  res.json({ success: true, event: enrichEventForUser(ev, email) });
});
app.post('/api/events/:id/feedback', (req, res) => {
  const { id } = req.params;
  const email = String(req.body.email || '').toLowerCase();
  const rating = Number(req.body.rating || 0);
  const comment = String(req.body.comment || '');
  if (!email || rating < 1 || rating > 5) return res.status(400).json({ error: 'invalid payload' });
  eventFeedbacks[id] = eventFeedbacks[id] || [];
  eventFeedbacks[id].push({ email, rating, comment, at: new Date().toISOString() });
  const ev = events.find((e) => e.id === id);
  if (!ev) return res.status(404).json({ error: 'event not found' });
  res.json({ success: true, event: enrichEventForUser(ev, email) });
});

app.get('/api/announcements', (_req, res) => res.json(announcements));
app.post('/api/announcements', (req, res) => {
  const ann = { id: `an${genId()}`, ...req.body, timestamp: new Date().toISOString() };
  announcements.unshift(ann);
  res.json({ success: true, announcement: ann });
});
app.get('/api/meals/today', (_req, res) => {
  const today = new Date().getDay();
  // Monday is 1, Friday is 5. If weekend (0, 6) default to Monday
  const dayIndex = (today >= 1 && today <= 5) ? today - 1 : 0;
  res.json(weeklyMeals[dayIndex] || weeklyMeals[0]);
});
app.get('/api/meals/weekly', (_req, res) => res.json(weeklyMeals));
app.post('/api/meals/rate', (req, res) => {
  const { date, rating } = req.body;
  const meal = weeklyMeals.find((m) => m.date === date);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  meal.ratingCount += 1;
  meal.averageRating = Math.round((((meal.averageRating * (meal.ratingCount - 1)) + rating) / meal.ratingCount) * 10) / 10;
  res.json({ success: true, newRating: meal.averageRating, ratingCount: meal.ratingCount });
});
app.get('/api/academics', (req, res) => {
  const dept = req.query.department;
  let result = academics;
  if (dept) result = academics.filter(a => a.department === dept);
  res.json(result);
});
app.get('/api/academics/:id', (req, res) => {
  const ac = academics.find((a) => a.id === req.params.id);
  ac ? res.json(ac) : res.status(404).json({ error: 'Not found' });
});
app.patch('/api/academics/:id/availability', (req, res) => {
  const ac = academics.find((a) => a.id === req.params.id);
  if (!ac) return res.status(404).json({ error: 'Not found' });
  ac.availability = req.body.availability || ac.availability;
  ac.availabilityNote = req.body.availabilityNote ?? ac.availabilityNote;
  res.json({ success: true, academic: ac });
});

app.get('/api/community/feed', (req, res) => {
  const user = userByReq(req, 'student');
  const feed = [...communityPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ posts: feed, me: user?.name || 'Guest' });
});
app.post('/api/community/feed', (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  const post = { id: genId('post'), authorName: user.name, authorEmail: user.email, content: String(req.body.content || ''), tags: req.body.tags || [], createdAt: new Date().toISOString() };
  communityPosts.unshift(post);
  try { saveState(); } catch (e) {}
  res.json({ success: true, post });
});
app.get('/api/community/clubs', (req, res) => {
  const user = userByReq(req, 'student');
  const joined = new Set(user?.joinedClubs || []);
  res.json(communityClubs.map((c) => ({ ...c, joined: joined.has(c.id) })));
});
app.post('/api/community/clubs/toggle', (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  const clubId = req.body.clubId;
  const set = new Set(user.joinedClubs || []);
  if (set.has(clubId)) {
    set.delete(clubId);
    if (clubMembers[clubId]) {
      clubMembers[clubId] = clubMembers[clubId].filter(m => m.email !== user.email);
    }
  } else {
    set.add(clubId);
    clubMembers[clubId] = clubMembers[clubId] || [];
    if (!clubMembers[clubId].find(m => m.email === user.email)) {
      clubMembers[clubId].push({ name: user.name, email: user.email, role: user.role });
    }
  }
  user.joinedClubs = [...set];
  try { saveState(); } catch (e) {}
  res.json({ success: true, joinedClubs: user.joinedClubs });
});

app.get('/api/sports', (_req, res) => res.json(sportsBoard));
app.post('/api/sports/apply', (req, res) => {
  const { id, email } = req.body;
  const sp = sportsBoard.find(s => s.id === id);
  if (!sp) return res.status(404).json({ error: 'not found' });
  if (sp.slots > 0) sp.slots -= 1;
  saveState();
  res.json({ success: true, sportsBoard });
});
app.post('/api/sports', (req, res) => {
  const { title, sport, description, contact, contactName, slots, date } = req.body;
  const newSp = { id: genId('sp'), title, sport, type: 'participant', description, contact, contactName, slots: Number(slots) || 1, date, createdAt: new Date().toISOString() };
  sportsBoard.unshift(newSp);
  saveState();
  res.json({ success: true, sportsBoard });
});

app.post('/api/assistant/query', async (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  const message = String(req.body.message || '');
  const history = req.body.history || [];
  const userCourses = (user.enrolledCourses || []).map(c => courses.find(x => x.code === c)).filter(Boolean);
  const userExams = exams.filter(e => (user.enrolledCourses || []).includes(e.courseCode));
  const userComplaints = complaints.filter(c => c.studentEmail === user.email).slice(0, 3);
  const context = {
    user: { name: user.name, role: user.role, department: user.department, faculty: user.faculty, year: user.year, gpa: user.gpa, studentId: user.studentId },
    courses: userCourses.map(c => ({ code: c.code, name: c.name, professor: c.professor, day: c.day, time: `${c.startTime}-${c.endTime}`, room: c.room })),
    upcomingExams: userExams.map(e => ({ course: e.courseName, type: e.type, date: e.date, time: `${e.startTime}-${e.endTime}`, room: e.room })),
    todayMeal: weeklyMeals[0],
    events: events.slice(0, 3).map(e => ({ title: e.title, date: e.date, time: e.time, location: e.location })),
    recentComplaints: userComplaints.map(c => ({ subject: c.subject, status: c.status, unit: c.routedUnit })),
    currentTime: new Date().toISOString(),
  };
  const systemPrompt = `You are MUVIA, the AI assistant for MUGLA SITKI KOCMAN UNIVERSITY. The user is ${user.name} (${user.role}), studying ${user.department} at ${user.faculty}.
You have access to the user's real data below. Use it to give accurate, personalized answers.
Always reply in English. Be concise, friendly, and actionable.
If asked about something not in the context, say so honestly.

USER DATA:\n${JSON.stringify(context, null, 1)}`;
  const llmMessages = [...history.slice(-8), { role: 'user', content: message }];
  const llm = await callAnthropic(systemPrompt, llmMessages);
  res.json({ success: true, reply: llm || localAssistantReply(user, message), contextUsed: context });
});

app.post('/api/navigation/route', (req, res) => {
  const { origin, destination, mode } = req.body || {};
  if (!origin || !destination) return res.status(400).json({ error: 'origin/destination required' });
  const dx = Number(destination.lat) - Number(origin.lat);
  const dy = Number(destination.lng) - Number(origin.lng);
  const distKm = Math.max(0.15, Math.sqrt(dx * dx + dy * dy) * 111 * 1.2);
  const speeds = { walking: 4.7, driving: 23, bus: 18 };
  const speed = speeds[mode] || 4.7;
  const etaMin = Math.max(2, Math.round((distKm / speed) * 60));
  const modeIcons = { walking: '🚶', driving: '🚗', bus: '🚌' };
  const distM = Math.round(distKm * 1000);
  const steps = [
    { instruction: `Start from ${origin.name || 'Your Location'}`, distance: '0 m', icon: '📍' },
    { instruction: `Head ${dx > 0 ? 'north' : 'south'} on the main campus path`, distance: `${Math.round(distM * 0.3)} m`, icon: modeIcons[mode] || '🚶' },
    { instruction: `Turn ${dy > 0 ? 'east' : 'west'} toward ${destination.name || 'destination'}`, distance: `${Math.round(distM * 0.5)} m`, icon: '↪️' },
    { instruction: `Continue straight for ${Math.round(distM * 0.2)} m`, distance: `${Math.round(distM * 0.2)} m`, icon: '⬆️' },
    { instruction: `Arrive at ${destination.name || 'destination'}`, distance: '0 m', icon: '🏁' },
  ];
  const alternatives = [
    { mode: 'walking', icon: '🚶', etaMin: Math.max(2, Math.round((distKm / 4.7) * 60)), distanceKm: Number(distKm.toFixed(2)) },
    { mode: 'bus', icon: '🚌', etaMin: Math.max(2, Math.round((distKm / 18) * 60)) + 3, distanceKm: Number((distKm * 1.3).toFixed(2)), note: 'Includes wait time' },
    { mode: 'driving', icon: '🚗', etaMin: Math.max(2, Math.round((distKm / 23) * 60)), distanceKm: Number((distKm * 1.1).toFixed(2)) },
  ];
  res.json({ success: true, mode, distanceKm: Number(distKm.toFixed(2)), distanceLabel: distKm < 1 ? `${distM} m` : `${distKm.toFixed(1)} km`, etaMin, etaLabel: etaMin < 60 ? `${etaMin} min` : `${Math.floor(etaMin/60)}h ${etaMin%60}m`, steps, alternatives });
});

const BUS_LINES = [
  { id: 'line-1', name: 'Kampüs Ring', color: '#2A69AC', stops: [
    { id: 'stop-1', name: 'Ana Kapı (Main Gate)', lat: 37.1605, lng: 28.3685 },
    { id: 'stop-2', name: 'Mühendislik Fakültesi', lat: 37.1617, lng: 28.3751 },
    { id: 'stop-3', name: 'Fen Fakültesi', lat: 37.1628, lng: 28.3730 },
    { id: 'stop-4', name: 'Yemekhane', lat: 37.1615, lng: 28.3725 },
    { id: 'stop-5', name: 'Hastane', lat: 37.1655, lng: 28.3662 },
    { id: 'stop-6', name: 'Rektörlük', lat: 37.1636, lng: 28.3665 },
  ]},
  { id: 'line-2', name: 'Kötekli - Merkez', color: '#C05621', stops: [
    { id: 'stop-1', name: 'Ana Kapı (Main Gate)', lat: 37.1605, lng: 28.3685 },
    { id: 'stop-7', name: 'Kötekli Kavşak', lat: 37.1580, lng: 28.3650 },
    { id: 'stop-8', name: 'Muğla Otogar', lat: 37.1520, lng: 28.3580 },
    { id: 'stop-9', name: 'Muğla Merkez', lat: 37.1490, lng: 28.3540 },
  ]},
  { id: 'line-3', name: 'Kampüs - Menteşe', color: '#276749', stops: [
    { id: 'stop-1', name: 'Ana Kapı (Main Gate)', lat: 37.1605, lng: 28.3685 },
    { id: 'stop-10', name: 'Menteşe Belediyesi', lat: 37.1560, lng: 28.3620 },
    { id: 'stop-11', name: 'Menteşe Pazar Yeri', lat: 37.1540, lng: 28.3600 },
  ]},
];

app.get('/api/transport/live', (req, res) => {
  const line = String(req.query.line || 'Kampus-Center');
  const stop = String(req.query.stop || 'Main Gate');
  const now = Date.now();
  const eta = [4, 11, 19].map((m, i) => ({ busId: `${line}-${i + 1}`, etaMin: m + (now % 3), occupancy: ['low', 'medium', 'high'][i % 3], stop }));
  res.json({ line, stop, updatedAt: new Date().toISOString(), buses: eta });
});
app.get('/api/transport/lines', (_req, res) => {
  res.json(BUS_LINES.map(l => ({ id: l.id, name: l.name, color: l.color, stopCount: l.stops.length })));
});
app.get('/api/transport/lines/:lineId', (req, res) => {
  const line = BUS_LINES.find(l => l.id === req.params.lineId);
  if (!line) return res.status(404).json({ error: 'Line not found' });
  res.json(line);
});
app.get('/api/transport/stops/:stopId/arrivals', (req, res) => {
  const stopId = req.params.stopId;
  const now = Date.now();
  const arrivals = BUS_LINES.filter(l => l.stops.some(s => s.id === stopId)).map((l, i) => ({
    lineId: l.id, lineName: l.name, color: l.color,
    nextArrivals: [{ etaMin: 3 + i * 5 + (now % 4), busId: `${l.id}-bus-1`, occupancy: 'low' }, { etaMin: 15 + i * 7 + (now % 3), busId: `${l.id}-bus-2`, occupancy: 'medium' }],
  }));
  res.json({ stopId, arrivals, updatedAt: new Date().toISOString() });
});
app.get('/api/transport/bus/:busId/position', (req, res) => {
  const busId = req.params.busId;
  const lineId = busId.split('-bus-')[0];
  const line = BUS_LINES.find(l => l.id === lineId);
  if (!line) return res.status(404).json({ error: 'Bus not found' });
  const now = Date.now();
  const idx = Math.floor((now / 30000) % line.stops.length);
  const current = line.stops[idx];
  const next = line.stops[(idx + 1) % line.stops.length];
  const progress = (now % 30000) / 30000;
  res.json({ busId, lineId, lineName: line.name, lat: current.lat + (next.lat - current.lat) * progress, lng: current.lng + (next.lng - current.lng) * progress, currentStop: current.name, nextStop: next.name, occupancy: ['low','medium','high'][now % 3], updatedAt: new Date().toISOString() });
});

app.get('/api/complaints/:studentId', (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  if (email) return res.json(complaints.filter((c) => c.studentEmail === email));
  res.json(complaints.filter((c) => c.studentId === req.params.studentId));
});
app.post('/api/complaints', async (req, res) => {
  const complaint = { id: `c${genId()}`, ...req.body, studentEmail: String(req.body.email || '').toLowerCase(), status: 'pending', submittedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString(), response: '', respondedAt: '', respondedBy: '', history: [] };
  appendComplaintHistory(complaint, 'pending', 'Complaint received and added to triage queue.', 'System');
  complaints.push(complaint);
  
  // Route the complaint before sending response
  await routeComplaint(complaint);
  complaint.status = 'triaged';
  updateComplaintStatus(complaint, 'triaged', `Complaint routed to ${UNIT_MANAGERS[complaint.serviceUnit].displayName}.`, 'Triage Engine');
  
  // Schedule the 'assigned' status update
  setTimeout(() => updateComplaintStatus(complaint, 'assigned', `Processing started by ${UNIT_MANAGERS[complaint.serviceUnit].managerName}.`, UNIT_MANAGERS[complaint.serviceUnit].managerName), 2000);
  
  try { saveState(); } catch (e) {}
  res.json({ success: true, complaint });
});
app.patch('/api/complaints/:id/feedback', async (req, res) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  
  const { rating, comment } = req.body;
  const ratingInt = parseInt(rating);
  complaint.feedback = { rating: ratingInt, comment, submittedAt: new Date().toISOString() };
  
  // Store feedback/comment in complaint history
  const historyEntry = comment ? `Student feedback: ${ratingInt} stars. Comment: "${comment}"` : `Student feedback: ${ratingInt} stars`;
  appendComplaintHistory(complaint, 'feedback_received', historyEntry, 'Student');

  if (ratingInt >= 3) {
    // Positive feedback - mark as resolved
    complaint.status = "resolved";
    appendComplaintHistory(complaint, 'resolved', `Complaint resolved based on positive feedback (${ratingInt}/5 stars) from student.`, 'System');
    
    sendNotificationToUnit(complaint.facultyUnit, {
      type: "positive_feedback",
      priority: "normal",
      message: `FEEDBACK: Complaint "${complaint.subject}" has been successfully resolved.\nStudent Rating: ${ratingInt}/5 stars\nStudent Comment: ${comment || 'No additional comment'}`,
      complaintId: complaint.id
    });
  } else if (ratingInt < 3 && comment && comment.trim().length > 0) {
    // Negative feedback with comment - escalate
    complaint.status = "escalated";
    appendComplaintHistory(complaint, 'escalated', `Complaint escalated to ${UNIT_MANAGERS[complaint.serviceUnit].displayName} due to student dissatisfaction (${ratingInt}/5 stars). Student Comment: "${comment}"`, 'System');
    
    // First notification to Faculty Unit (acknowledgment)
    sendNotificationToUnit(complaint.facultyUnit, {
      type: "feedback_received",
      priority: "high",
      message: `FEEDBACK RECEIVED from Student: Complaint "${complaint.subject}"\nStudent Rating: ${ratingInt}/5 stars (DISSATISFIED)\nStudent Comment: "${comment}"\n\nThis complaint is being escalated to the service unit for re-investigation.`,
      complaintId: complaint.id
    });

    // Second notification to Service Unit (escalation request - after 1 second)
    setTimeout(() => {
      sendNotificationToUnit(complaint.serviceUnit, {
        type: "escalation_required",
        priority: "high",
        message: `ESCALATION REQUIRED: Complaint "${complaint.subject}" has been escalated.\nStudent Rating: ${ratingInt}/5 stars (DISSATISFIED)\nStudent Comment: "${comment}"\nFirst Tier Unit: ${UNIT_MANAGERS[complaint.facultyUnit].displayName}\n\nPlease prioritize and re-investigate this issue immediately.`,
        complaintId: complaint.id
      });
    }, 1000);
  } else if (ratingInt < 3) {
    // Negative feedback without comment
    complaint.status = "closed";
    appendComplaintHistory(complaint, 'closed', `Complaint closed after negative feedback (${ratingInt}/5 stars) from student with no additional comment.`, 'System');
    
    sendNotificationToUnit(complaint.facultyUnit, {
      type: "negative_feedback",
      priority: "normal",
      message: `FEEDBACK: Complaint "${complaint.subject}" received negative feedback from student (${ratingInt}/5 stars). No additional comment provided. Complaint marked as closed.`,
      complaintId: complaint.id
    });
  }

  try { saveState(); } catch (e) {}
  res.json({ 
    success: true, 
    message: ratingInt >= 3 ? "Thank you for your feedback. The complaint has been marked as resolved." : "Your feedback has been recorded. If escalated, relevant units will be notified.",
    status: complaint.status,
    history: complaint.history
  });
});

app.get('/api/admin/complaints', (_req, res) => res.json([...complaints].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))));
app.get('/api/admin/complaints/queue', (_req, res) => res.json(complaints.filter((c) => c.needsManualReview || c.status === 'pending' || c.status === 'triaged')));
app.patch('/api/admin/complaints/:id/assign', (req, res) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  complaint.managerName = req.body.managerName || complaint.managerName || UNIT_MANAGERS.General.manager;
  complaint.routedUnit = req.body.routedUnit || complaint.routedUnit || UNIT_MANAGERS.General.unit;
  complaint.needsManualReview = false;
  updateComplaintStatus(complaint, 'assigned', `Reassigned to: ${complaint.managerName} (${complaint.routedUnit})`, 'Campus Admin');
  try { saveState(); } catch (e) {}
  res.json({ success: true, complaint });
});
app.patch('/api/admin/complaints/:id/status', (req, res) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  const status = req.body.status;
  if (!COMPLAINT_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  updateComplaintStatus(complaint, status, req.body.note || `Status updated to ${status}.`, req.body.actor || 'Campus Admin');
  
  // Send notification only if status is escalated
  if (status === 'escalated') {
    console.log(`📊 Admin escalation for complaint ${complaint.id}`);
    console.log(`   Service unit ID: ${complaint.serviceUnit}`);
    console.log(`   Service unit display: ${complaint.serviceUnitDisplayName}`);
    
    if (complaint.serviceUnit) {
      sendNotificationToUnit(complaint.serviceUnit, {
        type: "admin_escalation",
        priority: "high",
        message: `ESCALATION FROM ADMIN: Complaint "${complaint.subject}" has been marked as escalated by the system admin.\nDescription: ${complaint.description}\n\nPlease prioritize and provide an update on this case.`,
        complaintId: complaint.id
      });
      console.log(`✓ Escalation notification sent to ${complaint.serviceUnitDisplayName}`);
    } else {
      console.warn(`⚠ No service unit found for complaint ${complaint.id}`);
    }
  }
  
  try { saveState(); } catch (e) {}
  res.json({ success: true, complaint });
});

app.get('/api/messages/:userId', (req, res) => {
  const userId = req.params.userId;
  res.json(messages.filter((m) => m.fromId === userId || m.toId === userId));
});
app.get('/api/messages/conversation/:id1/:id2', (req, res) => {
  const { id1, id2 } = req.params;
  const conv = messages.filter((m) => (m.fromId === id1 && m.toId === id2) || (m.fromId === id2 && m.toId === id1)).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json(conv);
});
app.post('/api/messages', async (req, res) => {
  const msg = { id: `msg${genId()}`, ...req.body, timestamp: new Date().toISOString(), read: false };
  messages.push(msg);
  // No auto-reply — professors reply manually from their own page
  try { saveState(); } catch (e) {}
  res.json({ success: true, message: msg });
});
app.patch('/api/messages/:id/read', (req, res) => {
  const m = messages.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  m.read = true;
  res.json({ success: true });
});
app.patch('/api/messages/conversation/:id1/:id2/read', (req, res) => {
  const { id1, id2 } = req.params;
  messages.forEach((m) => { if (m.toId === id1 && m.fromId === id2) m.read = true; });
  res.json({ success: true });
});

// ── Community Club Chat ────────────────────────────────────────────────────────
app.get('/api/community/clubs/:clubId/members', (req, res) => {
  const members = clubMembers[req.params.clubId] || [];
  res.json(members);
});
app.post('/api/community/clubs/:clubId/join', (req, res) => {
  const clubId = req.params.clubId;
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  clubMembers[clubId] = clubMembers[clubId] || [];
  const exists = clubMembers[clubId].find(m => m.email === user.email);
  if (!exists) {
    clubMembers[clubId].push({ name: user.name, email: user.email, role: req.body.role || 'student' });
    try { saveState(); } catch (e) {}
  }
  res.json({ success: true, members: clubMembers[clubId] });
});

app.get('/api/community/clubs/:clubId/messages', (req, res) => {
  const msgs = clubMessages[req.params.clubId] || [];
  res.json(msgs);
});
app.post('/api/community/clubs/:clubId/messages', (req, res) => {
  const clubId = req.params.clubId;
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  clubMessages[clubId] = clubMessages[clubId] || [];
  const msg = { id: genId('cmsg'), authorName: user.name, authorEmail: user.email, content: String(req.body.content || ''), timestamp: new Date().toISOString() };
  clubMessages[clubId].push(msg);
  try { saveState(); } catch (e) {}
  res.json({ success: true, message: msg });
});

// ── Sports Board ──────────────────────────────────────────────────────────────
app.get('/api/community/sports-board', (_req, res) => {
  res.json(sportsBoard);
});
app.post('/api/community/sports-board', (req, res) => {
  const user = ensureUser(req.body.email, req.body.role || 'student');
  if (!user) return res.status(400).json({ error: 'email required' });
  const item = { id: genId('sp'), ...req.body, contact: user.email, contactName: user.name, createdAt: new Date().toISOString() };
  sportsBoard.unshift(item);
  try { saveState(); } catch (e) {}
  res.json({ success: true, item });
});
app.post('/api/community/sports-board/:id/apply', (req, res) => {
  const item = sportsBoard.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  res.json({ success: true, contact: item.contact, contactName: item.contactName, title: item.title });
});

// ── Announcement Detail ───────────────────────────────────────────────────────
app.get('/api/announcements/:id', (req, res) => {
  const ann = announcements.find(a => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'not found' });
  res.json(ann);
});

// ── Map Admin: Get/Post campus point configurations ─────────────────────────────
const MAP_CONFIG_FILE = path.join(__dirname, 'map-config.json');
let mapPoints = [];

function loadMapConfig() {
  try {
    if (fs.existsSync(MAP_CONFIG_FILE)) {
      mapPoints = JSON.parse(fs.readFileSync(MAP_CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Failed to load map-config.json', e);
  }
}

function saveMapConfig() {
  try {
    fs.writeFileSync(MAP_CONFIG_FILE, JSON.stringify(mapPoints, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save map-config.json', e);
  }
}

loadMapConfig();

app.get('/api/map-config', (req, res) => {
  res.json(mapPoints);
});

app.post('/api/map-config', (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Expected array of points' });
  }
  mapPoints = req.body;
  saveMapConfig();
  res.json({ success: true, count: mapPoints.length });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MUVIA API running on http://localhost:${PORT}`);
  console.log(`📡 All endpoints active\n`);
});

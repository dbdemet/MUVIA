function f(e){let r=e.split('@')[0];r=r.replace(/\d+$/g,'');r=r.replace(/^\d+/g,'');r=r.replace(/[._-]/g,' ');r=r.replace(/([a-z])([A-Z])/g,'$1 $2');if(!r.includes(' ')&&r.length>3){const w=r.match(/[A-Za-z][a-z]*/g)||[r];r=w.join(' ');}return r.split(' ').filter(w=>w.length>0).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');}
console.log('Test 1:', f('demetbolat2@posta.mu.edu.tr'));
console.log('Test 2:', f('ahmet.kaya@mu.edu.tr'));
console.log('Test 3:', f('emre.bolat@posta.mu.edu.tr'));

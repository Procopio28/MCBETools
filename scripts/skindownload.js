(function(){
  var JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  function loadJSZip(){
    return new Promise(function(resolve,reject){
      if(window.JSZip) return resolve(window.JSZip);
      var s = document.createElement('script');
      s.src = JSZIP_CDN;
      s.onload = function(){ return window.JSZip ? resolve(window.JSZip) : reject(new Error('no JSZip')); };
      s.onerror = function(){ reject(new Error('failed to load JSZip')); };
      document.head.appendChild(s);
    });
  }
  function uuidv4(){
    if(window.crypto && crypto.randomUUID) try{ return crypto.randomUUID(); }catch(e){}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
  function extractNameFromUrl(url){
    try{
      var parts = url.split('/');
      var last = parts[parts.length-1] || '';
      return last.split('.')[0] || 'skin';
    }catch(e){ return 'skin'; }
  }
  function sanitizeDisplayName(n){
    if(!n) return 'skin';
    n = String(n).trim();
    if(!n) return 'skin';
    n = n.replace(/[\u0000-\u001F\u007F<>:"/\\|?*\u2000-\u200B]+/g,'').trim();
    if(!n) return 'skin';
    return n;
  }
  function safeInternalName(n){
    var s = sanitizeDisplayName(n);
    s = s.replace(/\s+/g,'_');
    return s || 'skin';
  }
  var WRAPPER_ID = 'mcbe-skinpack-wrapper';
  function findSkinImage(){
    var imgs = Array.from(document.querySelectorAll('img'));
    for(var i=0;i<imgs.length;i++){
      var im = imgs[i];
      if(!im.src) continue;
      if(im.src.indexOf('textures.minecraft.net') !== -1) return im;
      var meta = (im.alt||'') + ' ' + (im.className||'') + ' ' + (im.id||'') + ' ' + im.src;
      if(/(?:skin|texture|avatar|minecraft|profile)/i.test(meta)) return im;
    }
    return null;
  }
  function findNearbyTextFor(img){
    if(!img) return '';
    if(img.dataset && (img.dataset.username || img.dataset.name || img.dataset.gamertag)) return img.dataset.username || img.dataset.name || img.dataset.gamertag;
    var container = img.closest('.skin-card, .card, .profile, .result, .player, .skin-container') || img.parentElement || img;
    var selectors = ['.username','.gamertag','.name','.player-name','.display-name','h1','h2','h3','h4','b','strong','span'];
    for(var i=0;i<selectors.length;i++){
      try{
        var el = container.querySelector(selectors[i]);
        if(el && el.textContent){
          var t = el.textContent.trim();
          if(t && t.length < 48) return t;
        }
      }catch(e){}
    }
    var prev = img.previousElementSibling;
    for(var j=0;j<5 && prev; j++, prev = prev.previousElementSibling){
      var t = prev.textContent && prev.textContent.trim();
      if(t && t.length < 48) return t;
    }
    var input = document.querySelector('input[name="username"], input[id*="user"], input[placeholder*="name"], input[type="search"], input[type="text"]');
    if(input && input.value && input.value.trim()) return input.value.trim();
    return '';
  }
  function removeOldTextureLinks(img){
    if(!img || !img.parentElement) return;
    var parent = img.parentElement;
    var candidates = parent.querySelectorAll('a,button');
    for(var i=0;i<candidates.length;i++){
      var el = candidates[i];
      var t = el.textContent || el.innerText || '';
      if(/open\s+texture|download\s+texture|open\s+skin|download\s+skin|open\s+image|download\s+image/i.test(t)){
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
    var links = parent.querySelectorAll('a[href]');
    for(var k=0;k<links.length;k++){
      var a = links[k];
      if(a.href && a.href.indexOf('textures.minecraft.net') !== -1 && (/open|download|texture|skin/i.test(a.textContent||''))){
        a.parentNode && a.parentNode.removeChild(a);
      }
    }
  }
  function createStackedWrapper(img, displayName){
    var existing = document.getElementById(WRAPPER_ID);
    if(existing){
      existing.dataset.src = img.src || '';
      existing.dataset.name = displayName || '';
      var png = existing.querySelector('#mcbe-png-btn');
      var pack = existing.querySelector('#mcbe-pack-btn');
      if(png) png.onclick = function(){ downloadPNG(img, displayName); };
      if(pack) pack.onclick = function(){ downloadMCPack(img, displayName); };
      return existing;
    }
    var wrap = document.createElement('div');
    wrap.id = WRAPPER_ID;
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';
    wrap.style.gap = '8px';
    wrap.style.marginTop = '8px';
    var btnPng = document.createElement('button');
    btnPng.type = 'button';
    btnPng.id = 'mcbe-png-btn';
    btnPng.textContent = 'Download PNG';
    var btnPack = document.createElement('button');
    btnPack.type = 'button';
    btnPack.id = 'mcbe-pack-btn';
    btnPack.textContent = 'Download MCPACK';
    wrap.appendChild(btnPng);
    wrap.appendChild(btnPack);
    wrap.dataset.src = img.src || '';
    wrap.dataset.name = displayName || '';
    try{ img.parentNode.insertBefore(wrap, img.nextSibling); }catch(e){}
    btnPng.addEventListener('click', function(){ downloadPNG(img, displayName); });
    btnPack.addEventListener('click', function(){ downloadMCPack(img, displayName); });
    return wrap;
  }
  async function downloadPNG(img, displayName){
    if(!img || !img.src){ alert('No skin available'); return; }
    try{
      var r = await fetch(img.src);
      if(!r.ok){ alert('Failed to fetch PNG'); return; }
      var b = await r.blob();
      var name = sanitizeDisplayName(displayName || findNearbyTextFor(img) || extractNameFromUrl(img.src));
      var fname = name + '.png';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
    }catch(e){
      alert('Error downloading PNG');
    }
  }
  async function detectGeometryFromBlob(blob){
    try{
      var bmp = await createImageBitmap(blob);
      var w = bmp.width, h = bmp.height;
      if(h === 32) return 'geometry.humanoid.custom';
      if(w === 64 && h === 64){
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(bmp,0,0);
        try{
          var d = ctx.getImageData(54,20,1,1).data;
          if(d[3] === 0) return 'geometry.humanoid.customSlim';
        }catch(e){}
        return 'geometry.humanoid.custom';
      }
      return 'geometry.humanoid.custom';
    }catch(e){
      return 'geometry.humanoid.custom';
    }
  }
  async function downloadMCPack(img, displayName){
    if(!img || !img.src){ alert('No skin available'); return; }
    var zipLib;
    try{ zipLib = await loadJSZip(); }catch(e){ alert('Failed to load zip library'); return; }
    try{
      var r = await fetch(img.src);
      if(!r.ok){ alert('Failed to fetch skin'); return; }
      var blob = await r.blob();
      var geometry = await detectGeometryFromBlob(blob);
      var display = sanitizeDisplayName(displayName || findNearbyTextFor(img) || extractNameFromUrl(img.src));
      var internal = safeInternalName(display);
      var skinFilename = internal + '.png';
      var packDownloadName = display + '.mcpack';
      var headerUUID = uuidv4();
      var moduleUUID = uuidv4();
      var manifest = {
        format_version: 1,
        header: {
          name: display,
          description: 'Skin pack generated by MCBE Tools',
          uuid: headerUUID,
          version: [1,0,0],
          min_engine_version: [1,16,0]
        },
        modules: [
          { type: 'skin_pack', uuid: moduleUUID, version: [1,0,0] }
        ]
      };
      var serialize = 'mcbe_skin_' + internal;
      var skinsJson = {
        serialize_name: serialize,
        localization_name: serialize,
        skins: [
          {
            localization_name: display,
            geometry: geometry,
            texture: skinFilename,
            type: 'free'
          }
        ]
      };
      var lang = 'skinpack.' + serialize + '=' + display + '\n' + 'skin.' + serialize + '.' + internal + '=' + display;
      var zip = new window.JSZip();
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('skins.json', JSON.stringify(skinsJson, null, 2));
      zip.folder('texts').file('en_US.lang', lang);
      zip.file(skinFilename, blob);
      var out = await zip.generateAsync({type:'blob'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(out);
      a.download = packDownloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
    }catch(e){
      alert('Error generating MCPACK');
    }
  }
  function onNewSkinImage(img){
    if(!img) return;
    removeOldTextureLinks(img);
    var name = findNearbyTextFor(img) || extractNameFromUrl(img.src);
    name = sanitizeDisplayName(name);
    createStackedWrapper(img, name);
  }
  function observeDOM(){
    var mo = new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m = muts[i];
        if(m.type === 'childList' && m.addedNodes && m.addedNodes.length){
          for(var j=0;j<m.addedNodes.length;j++){
            var node = m.addedNodes[j];
            if(node.nodeType !== 1) continue;
            if(node.tagName === 'IMG' && node.src && (node.src.indexOf('textures.minecraft.net') !== -1 || /skin|texture|avatar|minecraft/i.test((node.alt||'')+' '+(node.className||'')+' '+(node.id||'')+' '+node.src))){
              node.addEventListener('load', function(){ onNewSkinImage(node); });
              onNewSkinImage(node);
              return;
            }
            try{
              var imgs = node.querySelectorAll && node.querySelectorAll('img');
              for(var k=0;k<(imgs?imgs.length:0);k++){
                var im = imgs[k];
                if(im.src && (im.src.indexOf('textures.minecraft.net') !== -1 || /skin|texture|avatar|minecraft/i.test((im.alt||'')+' '+(im.className||'')+' '+(im.id||'')+' '+im.src))){
                  im.addEventListener('load', function(){ onNewSkinImage(im); });
                  onNewSkinImage(im);
                  return;
                }
              }
            }catch(e){}
          }
        }
        if(m.type === 'attributes' && m.target && m.target.tagName === 'IMG' && (m.attributeName === 'src' || m.attributeName === 'data-src')){
          var t = m.target;
          if(t.src && (t.src.indexOf('textures.minecraft.net') !== -1 || /skin|texture|avatar|minecraft/i.test((t.alt||'')+' '+(t.className||'')+' '+(t.id||'')+' '+t.src))){
            onNewSkinImage(t);
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src','data-src'] });
    var periodic = setInterval(function(){
      var found = document.getElementById(WRAPPER_ID);
      if(found) return;
      var f = findSkinImage();
      if(f) onNewSkinImage(f);
    }, 700);
  }
  function moveShowDetails(){
    var all = Array.from(document.querySelectorAll('button,a,span'));
    var btn = all.find(function(el){
      return el.textContent && /show/i.test(el.textContent) && /detail/i.test(el.textContent);
    });
    if(!btn) return;
    var model = document.querySelector('canvas') || document.querySelector('.viewer') || document.querySelector('.model') || document.querySelector('.skin-viewer') || document.querySelector('#skin3d') || document.querySelector('.skin3d');
    if(!model) return;
    if(model.parentNode) model.parentNode.insertBefore(btn, model.nextSibling);
  }
  document.addEventListener('DOMContentLoaded', function(){
    var f = findSkinImage();
    if(f) onNewSkinImage(f);
    observeDOM();
    moveShowDetails();
    setTimeout(moveShowDetails, 800);
  });
})();
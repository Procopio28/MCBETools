(function(){
  function loadScript(url){
    return new Promise(function(res,rej){
      if(document.querySelector('script[src="'+url+'"]')) return res();
      var s=document.createElement('script');
      s.src=url;
      s.onload=res;
      s.onerror=rej;
      document.head.appendChild(s);
    });
  }
  function uuidv4(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);
      return v.toString(16);
    });
  }
  function findModelContainer(){
    var candidates=['#Transparent','.center','#model','#viewer','.viewer','.model','model-viewer','canvas','#player3d','.player3d','main'];
    for(var i=0;i<candidates.length;i++){
      var sel=candidates[i];
      var el=document.querySelector(sel);
      if(el) return el;
    }
    var canv=document.querySelector('canvas');
    if(canv) return canv.parentElement||document.body;
    return document.body;
  }
  function findSkinElement(){
    var imgs=Array.from(document.querySelectorAll('img'));
    for(var i=0;i<imgs.length;i++){
      var img=imgs[i];
      var s=img.src||'';
      if(s.indexOf('textures.minecraft.net')!==-1||s.indexOf('minecraft.net')!==-1||s.indexOf('data:image')===0||s.indexOf('blob:')===0) return {type:'img',el:img,src:s};
    }
    for(var i=0;i<imgs.length;i++){
      var img=imgs[i];
      if(img.dataset && (img.dataset.skin||img.dataset.src)) return {type:'img',el:img,src:img.dataset.skin||img.dataset.src};
    }
    var els=Array.from(document.querySelectorAll('*'));
    for(var i=0;i<els.length;i++){
      var bg=getComputedStyle(els[i]).backgroundImage||'';
      var m=bg.match(/url\(["']?(.*?)["']?\)/);
      if(m && (m[1].indexOf('textures.minecraft.net')!==-1||m[1].indexOf('minecraft.net')!==-1)) return {type:'bg',el:els[i],src:m[1]};
    }
    var canvases=Array.from(document.querySelectorAll('canvas'));
    for(var i=0;i<canvases.length;i++){
      try{
        var d=canvases[i].toDataURL('image/png');
        if(d && d.indexOf('data:image')===0) return {type:'canvas',el:canvases[i],src:d};
      }catch(e){}
    }
    return null;
  }
  function fetchBlob(src){
    if(src.indexOf('data:image')===0) return fetch(src).then(function(r){return r.blob();});
    return fetch(src, {mode:'cors'}).then(function(r){
      if(!r.ok) throw new Error('fetch failed: '+r.status);
      return r.blob();
    });
  }
  function triggerDownload(blob, name){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download=name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);}, 10000);
  }
  function safeName(s){
    if(!s) return 'skin';
    return String(s).trim().replace(/\s+/g,'_').replace(/[^\w\-\.]/g,'').slice(0,64) || 'skin';
  }
  function getDisplayedName(){
    var possible=['#username','input[name=username]','.username','#player','.playername','#nick'];
    for(var i=0;i<possible.length;i++){
      var el=document.querySelector(possible[i]);
      if(el) return el.value||el.textContent||el.innerText;
    }
    var h=document.querySelector('h1,h2,h3');
    if(h) return h.textContent.trim().split(/\s+/)[0];
    return 'skin';
  }
  function buildFilesForPack(blob, baseName){
    var packId = safeName(baseName);
    var manifest = {
      header: {
        name: "pack.name",
        version: [1,0,0],
        uuid: uuidv4()
      },
      modules: [
        {
          version: [1,0,0],
          type: "skin_pack",
          uuid: uuidv4()
        }
      ],
      format_version: 1
    };
    var skins = {
      serialize_name: packId,
      localization_name: packId,
      skins: [
        {
          localization_name: "skin_"+packId,
          geometry: "geometry.humanoid.custom",
          texture: baseName + ".png",
          type: "free"
        }
      ]
    };
    var en = "skinpack."+packId+"="+baseName+"\nskin."+packId+".skin_"+packId+"="+baseName+"\n";
    var languages = JSON.stringify({languages:["en_US"]});
    return {manifest:manifest,skins:skins,enUS:en,languages:languages};
  }
  function addButtonsAndWire(container){
    if(document.getElementById('mcpack-download-btns')) return;
    var wrap=document.createElement('div');
    wrap.id='mcpack-download-btns';
    wrap.style.marginTop='8px';
    var b1=document.createElement('button');
    b1.id='download-png';
    b1.textContent='Download PNG';
    var b2=document.createElement('button');
    b2.id='download-mcpack';
    b2.textContent='Download MCPACK';
    wrap.appendChild(b1);
    wrap.appendChild(b2);
    container.appendChild(wrap);
    b1.addEventListener('click', function(){
      var elem=findSkinElement();
      if(!elem){alert('Skin not found on page');return;}
      fetchBlob(elem.src).then(function(blob){
        var name = safeName(getDisplayedName()) + '.png';
        triggerDownload(blob, name);
      }).catch(function(err){
        alert('Failed to download PNG: '+err.message);
      });
    });
    b2.addEventListener('click', function(){
      var elem=findSkinElement();
      if(!elem){alert('Skin not found on page');return;}
      fetchBlob(elem.src).then(function(blob){
        var base=safeName(getDisplayedName());
        loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js').then(function(){
          var zip=new JSZip();
          var files=buildFilesForPack(blob, base);
          zip.file('manifest.json', JSON.stringify(files.manifest, null, 2));
          zip.file('skins.json', JSON.stringify(files.skins, null, 2));
          zip.file(base + '.png', blob);
          zip.folder('texts').file('en_US.lang', files.enUS);
          zip.folder('texts').file('languages.json', files.languages);
          return zip.generateAsync({type:'blob'});
        }).then(function(zblob){
          triggerDownload(zblob, base + '.mcpack');
        }).catch(function(err){
          alert('Failed to build mcpack: '+err.message);
        });
      }).catch(function(err){
        alert('Failed to fetch skin: '+err.message);
      });
    });
  }
  function moveShowDetailsBelow(container){
    var els=Array.from(document.querySelectorAll('button,a,input[type=button]'));
    for(var i=0;i<els.length;i++){
      var t=els[i].textContent||els[i].value||'';
      if(/show\s*detail/i.test(t)){
        container.appendChild(els[i]);
        return;
      }
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    var container=findModelContainer();
    addButtonsAndWire(container);
    moveShowDetailsBelow(container);
  });
})();
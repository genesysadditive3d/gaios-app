/* GAIOS Voice add-on: app ki awaaz ko natural Hindi (NVIDIA Magpie, DGX) banata hai.
   Sirf ek <script src="gaios-voice.js"></script> kaafi hai (</body> se pehle). Page ka baaki code nahi badalta.
   Page ke speakLine()/robotSpeak() ko override karta hai; fail hone par browser ki awaaz. */
(function(){
  var API = 'https://api.genesysadditive3dcreation.com';
  var audio = null;
  // Page ki Latin-Hinglish lines -> Devanagari (natural Hindi uchcharan ke liye)
  var MAP = {
    "🤖 Ek second... main aapki photo ko 3D mein badal raha hoon!":"एक सेकंड... मैं आपकी फ़ोटो को थ्री-डी में बदल रहा हूँ!",
    "😅 Itni sundar photo thi... ab 3D mein aur bhi sundar lagoge!":"इतनी सुंदर फ़ोटो थी... अब थ्री-डी में और भी सुंदर लगोगे!",
    "🔬 Har pixel ko personally check kar raha hoon... patience!":"हर पिक्सल को खुद जाँच रहा हूँ... ज़रा सब्र रखिए!",
    "🎨 Rang bharenge, chehra banayenge... Mimaki printer ke liye taiyaar!":"रंग भरेंगे, चेहरा बनाएँगे... मिमाकी प्रिंटर के लिए तैयार!",
    "🏗️ Ek ek layer build ho rahi hai... jaise Pali mein ghar banta hai!":"एक-एक परत बन रही है... जैसे पाली में घर बनता है!",
    "🧠 GAIOS™ soch raha hai... aur woh bahut tez sochta hai!":"गायोस सोच रहा है... और वो बहुत तेज़ सोचता है!",
    "☕ Thoda chai peeyein... model ban raha hai!":"थोड़ी चाय पीजिए... मॉडल बन रहा है!",
    "🎪 3D model almost ready... thoda aur wait karo mere dost!":"थ्री-डी मॉडल लगभग तैयार है... थोड़ा और इंतज़ार कीजिए मेरे दोस्त!",
    "🤩 Jab model aayega, tum dekhte reh jaoge!":"जब मॉडल आएगा, आप देखते रह जाएँगे!",
    "Ho gaya! Aapka teen dee model ready hai!":"हो गया! आपका थ्री-डी मॉडल तैयार है!"
  };
  // Daave wali lines (pehla/99.9%/DPIIT/MoU): jaanbujh kar MAP me nahi. Aap sach hone par yahan jodiye.
  function clean(t){
    return String(t||'').replace(/[\u{1F300}-\u{1FFFF}\u2600-\u27BF]/gu,'').replace(/[^\u0000-\u024F\u0900-\u097F .,!?।\-']/g,'').replace(/\s+/g,' ').trim();
  }
  var reqId = 0, audioDone = null;   // reqId: sirf sabse nayi line bajegi
  // Chal rahi Magpie audio rokna (pause + src hatana)
  function stopAudio(){
    var a = audio, d = audioDone;
    audio = null; audioDone = null;
    if(a){ try{ a.pause(); a.removeAttribute('src'); a.load(); }catch(e){} }
    if(d) d();
  }
  function speak(text){
    var raw = String(text||'').trim();
    var c = clean(MAP[raw] || text);
    if(!c) return Promise.resolve();
    if(c.length > 580) c = c.slice(0,580);
    var lang = /[\u0900-\u097F]/.test(c) ? 'hi-IN' : 'en-US';
    var id = ++reqId;
    stopAudio();
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    return fetch(API+'/api/speak?lang='+lang+'&text='+encodeURIComponent(c)).then(function(r){
      if(!r.ok) throw new Error('voice '+r.status);
      return r.blob();
    }).then(function(b){
      if(id !== reqId) return;   // nayi line aa chuki, purani mat bajao
      return new Promise(function(done){
        var u = URL.createObjectURL(b), a = new Audio(u); a.volume = 0.95;
        function fin(){ URL.revokeObjectURL(u); if(audio===a){ audio=null; audioDone=null; } done(); }
        a.onended = fin;
        a.onerror = fin;
        audio = a; audioDone = done;
        a.play().catch(fin);   // play ruka (autoplay) to fallback nahi
      });
    }, function(){
      // Sirf Magpie request sach me fail hui tab browser ki awaaz, aur tabhi jab ye abhi bhi nayi line ho
      if(id !== reqId) return;
      return new Promise(function(done){
        if(!window.speechSynthesis){ done(); return; }
        var s = new SpeechSynthesisUtterance(c); s.lang = lang; s.rate = 0.95;
        s.onend = function(){ done(); }; s.onerror = function(){ done(); };
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(s);
      });
    });
  }
  // Rokne par: bajti audio band + raaste me padi request bhi bekaar (reqId badha)
  function stopVoice(){
    reqId++;
    stopAudio();
  }
  window.gaiosSpeak = speak;
  window.speakLine = function(t){ return speak(t); };
  window.robotSpeak = function(t){ return speak(t); };
  var oldStop = window.stopSpeechBubbles;
  window.stopSpeechBubbles = function(){
    stopVoice();
    if(typeof oldStop === 'function') return oldStop.apply(this, arguments);
    if(window.speechSynthesis) window.speechSynthesis.cancel();
  };
  var oldStopAll = window.stopAllSpeech;
  window.stopAllSpeech = function(){
    stopVoice();
    if(typeof oldStopAll === 'function') return oldStopAll.apply(this, arguments);
    if(window.speechSynthesis) window.speechSynthesis.cancel();
  };
})();

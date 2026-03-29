(function(){
  // ES5-safe fallback click delegation for core buttons
  function getFn(path) {
    var parts = path.split('.');
    var fn = window;
    for (var i = 0; i < parts.length; i++) {
      if (!fn) { fn = undefined; break; }
      fn = fn[parts[i]];
    }
    return (typeof fn === 'function') ? fn : null;
  }
  function safeCall(path, args) {
    try {
      var fn = getFn(path);
      if (fn) return fn.apply(null, args || []);
    } catch (e) {
      console.error('safeCall error', path, e);
    }
  }
  function pauseAudioById(id) {
    try { var a = document.getElementById(id); if (a && !a.paused) { a.pause(); a.currentTime = 0; } } catch (e) {}
  }
  function handler(e) {
    var el = e.target;
    while (el && el.nodeName !== 'BUTTON') el = el.parentNode;
    if (!el) return;
    var label = (el.textContent || '').replace(/\s+/g, ' ').trim();
    var id = el.id || label;
    try {
      if (id === 'startIelts1Btn' || /Start Test 1|Open Test 1/i.test(id)) {
        safeCall('IELTS.Registry.setActiveTestId', ['ielts1']);
        safeCall('IELTS.UI.setExamStarted', [true]);
        safeCall('IELTS.UI.showOnly', ['listening']);
        safeCall('IELTS.Engines.Listening.initListeningSystem');
        return;
      }
      if (id === 'startIelts2Btn' || /Start Test 2|Open Test 2/i.test(id)) {
        safeCall('IELTS.Registry.setActiveTestId', ['ielts2']);
        safeCall('IELTS.UI.setExamStarted', [true]);
        safeCall('IELTS.UI.showOnly', ['listening']);
        safeCall('IELTS.Engines.Listening.initListeningSystem');
        return;
      }
      if (id === 'startIelts3Btn' || /Start Test 3|Open Test 3/i.test(id)) {
        safeCall('IELTS.Registry.setActiveTestId', ['ielts3']);
        safeCall('IELTS.UI.setExamStarted', [true]);
        safeCall('IELTS.UI.showOnly', ['listening']);
        safeCall('IELTS.Engines.Listening.initListeningSystem');
        return;
      }
      if (id === 'openHistoryBtn' || /My History/i.test(id)) {
        safeCall('IELTS.History.openHistory');
        return;
      }
      if (id === 'historyBackBtn') {
        safeCall('IELTS.History.closeHistory');
        safeCall('IELTS.UI.showOnly', ['home']);
        return;
      }
      if (id === 'historyDetailCloseBtn') {
        safeCall('IELTS.History.closeHistory');
        return;
      }
      if (id === 'openSpeakingExamBtn') {
        safeCall('IELTS.Speaking.initSpeakingExam');
        safeCall('IELTS.UI.showOnly', ['speaking']);
        return;
      }
      if (id === 'backFromSpeakingBtn') {
        pauseAudioById('listeningAudio');
        pauseAudioById('speakingPlayback');
        safeCall('IELTS.UI.showOnly', ['home']);
        safeCall('IELTS.UI.setExamNavStatus', ['Status: Home']);
        return;
      }
      if (id === 'navToHomeBtn' || id === 'navToListeningBtn' || id === 'navToReadingBtn' || id === 'navToWritingBtn') {
        if (id === 'navToHomeBtn') {
          pauseAudioById('listeningAudio');
          pauseAudioById('speakingPlayback');
          safeCall('IELTS.UI.showOnly', ['home']);
          safeCall('IELTS.UI.updateHomeStatusLine');
          return;
        }
        if (id === 'navToListeningBtn') {
          safeCall('IELTS.UI.setExamStarted', [true]);
          safeCall('IELTS.Engines.Listening.initListeningSystem');
          safeCall('IELTS.UI.showOnly', ['listening']);
          return;
        }
        if (id === 'navToReadingBtn') {
          safeCall('IELTS.UI.setExamStarted', [true]);
          safeCall('IELTS.Engines.Reading.startReadingSystem');
          safeCall('IELTS.UI.showOnly', ['reading']);
          return;
        }
        if (id === 'navToWritingBtn') {
          safeCall('IELTS.UI.setExamStarted', [true]);
          safeCall('IELTS.Engines.Writing.startWritingSystem');
          safeCall('IELTS.UI.showOnly', ['writing']);
          return;
        }
      }
      if (id === 'logoutBtn' || /Log out/i.test(id)) {
        safeCall('IELTS.Auth.logout');
        return;
      }
    } catch (err) {
      try { console.error('fallback handler failed', err); } catch (e) {}
    }
  }
  if (document.addEventListener) document.addEventListener('click', handler, true);
  else if (document.attachEvent) document.attachEvent('onclick', handler);
  try { console.log('ES5 fallback handlers installed'); } catch (e) {}
})();

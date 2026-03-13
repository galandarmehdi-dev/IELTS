(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Speaking = window.IELTS.Speaking || {};

  function initSpeakingExam() {
    const openBtn = document.getElementById("openSpeakingExamBtn");
    const speakingSection = document.getElementById("speakingSection");
    const homeSection = document.getElementById("homeSection");

    const startBtn = document.getElementById("startSpeakingBtn");
    const stopBtn = document.getElementById("stopSpeakingBtn");
    const downloadBtn = document.getElementById("downloadSpeakingBtn");
    const backBtn = document.getElementById("backFromSpeakingBtn");
    const playback = document.getElementById("speakingPlayback");
    const statusEl = document.getElementById("speakingStatus");

    if (!openBtn) {
      console.warn("Speaking button not found: openSpeakingExamBtn");
    }
    if (!speakingSection) {
      console.warn("Speaking section not found: speakingSection");
    }

    let mediaRecorder = null;
    let recordedChunks = [];
    let audioBlob = null;
    let audioUrl = "";

    function showSpeaking() {
      if (homeSection) homeSection.classList.add("hidden");
      if (speakingSection) speakingSection.classList.remove("hidden");
    }

    function showHome() {
      if (speakingSection) speakingSection.classList.add("hidden");
      if (homeSection) homeSection.classList.remove("hidden");
    }

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        recordedChunks = [];
        audioBlob = null;

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = function () {
          audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
          audioUrl = URL.createObjectURL(audioBlob);
          if (playback) playback.src = audioUrl;
          if (statusEl) statusEl.textContent = "Status: Recording saved";
        };

        mediaRecorder.start();
        if (statusEl) statusEl.textContent = "Status: Recording...";
      } catch (err) {
        console.error(err);
        if (statusEl) statusEl.textContent = "Status: Microphone access failed";
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        if (statusEl) statusEl.textContent = "Status: Stopping...";
      }
    }

    function downloadRecording() {
      if (!audioUrl) {
        alert("No recording available yet.");
        return;
      }

      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "ielts-speaking-recording.webm";
      a.click();
    }

    if (openBtn) openBtn.onclick = showSpeaking;
    if (backBtn) backBtn.onclick = showHome;
    if (startBtn) startBtn.onclick = startRecording;
    if (stopBtn) stopBtn.onclick = stopRecording;
    if (downloadBtn) downloadBtn.onclick = downloadRecording;
  }

  window.IELTS.Speaking.initSpeakingExam = initSpeakingExam;
})();

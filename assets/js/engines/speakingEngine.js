(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Speaking = window.IELTS.Speaking || {};

  // --------------------------------------------------
  // SIMPLE CONFIG
  // Edit these questions/prompts whenever you want.
  // Times are in seconds.
  // --------------------------------------------------
  const SPEAKING_CONFIG = {
    part1: {
      label: "Part 1",
      duration: 270, // 4.5 minutes
      title: "Introduction and Interview",
      questions: [
        "Do you work or study?",
        "Why did you choose that subject or job?",
        "What do you enjoy most about your daily routine?",
        "What is your hometown like?",
        "What do you like most about your hometown?",
        "Would you like to live in the same place in the future? Why?"
      ]
    },
    part2: {
      label: "Part 2",
      prepDuration: 60,   // 1 minute preparation
      speakDuration: 120, // 2 minutes speaking
      title: "Long Turn",
      cueCardTitle: "Describe a book you recently read.",
      cueCardPoints: [
        "what the book was",
        "when you read it",
        "what it was about",
        "and explain why you liked or disliked it"
      ]
    },
    part3: {
      label: "Part 3",
      duration: 270, // 4.5 minutes
      title: "Discussion",
      questions: [
        "Why do some people enjoy reading fiction?",
        "How have reading habits changed in recent years?",
        "Do you think children should be encouraged to read more books?",
        "What are the advantages of digital reading compared with printed books?",
        "How can schools help students develop a reading habit?"
      ]
    }
  };

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

    let mediaRecorder = null;
    let recordedChunks = [];
    let audioBlob = null;
    let audioUrl = "";

    let timer = null;
    let currentStage = null;
    let stageSecondsLeft = 0;
    let examRunning = false;
    let examFinished = false;
    let micStream = null;

    renderDynamicExamUI();

    const partBox = document.getElementById("speakingCurrentPart");
    const timerBox = document.getElementById("speakingTimer");
    const bodyBox = document.getElementById("speakingDynamicBody");

    function renderDynamicExamUI() {
      const shell = speakingSection ? speakingSection.querySelector(".speaking-shell") : null;
      if (!shell) return;

      if (document.getElementById("speakingExamFlowCard")) return;

      const playbackCard = playback ? playback.closest(".speaking-card") : null;

      const flowCard = document.createElement("div");
      flowCard.className = "speaking-card";
      flowCard.id = "speakingExamFlowCard";
      flowCard.innerHTML = `
        <h2>Exam Flow</h2>
        <div id="speakingCurrentPart" style="font-weight:700;margin-bottom:8px;">Current stage: Not started</div>
        <div id="speakingTimer" style="font-size:28px;font-weight:800;margin-bottom:14px;">00:00</div>
        <div id="speakingDynamicBody"></div>
      `;

      if (playbackCard) {
        shell.insertBefore(flowCard, playbackCard);
      } else {
        shell.appendChild(flowCard);
      }
    }

    function showSpeaking() {
      if (homeSection) homeSection.classList.add("hidden");
      if (speakingSection) speakingSection.classList.remove("hidden");
    }

    function showHome() {
      if (examRunning) {
        const leave = confirm("The speaking exam is still running. Do you want to leave?");
        if (!leave) return;
      }

      if (speakingSection) speakingSection.classList.add("hidden");
      if (homeSection) homeSection.classList.remove("hidden");
    }

    function setTimerText(totalSeconds) {
      if (!timerBox) return;
      const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      timerBox.textContent = m + ":" + s;
    }

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function renderPart1() {
      if (partBox) partBox.textContent = "Current stage: Part 1 — " + SPEAKING_CONFIG.part1.title;
      setStatus("Part 1 in progress");
      setTimerText(stageSecondsLeft);

      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:10px;">Ask these short questions:</div>
          <ol style="margin:0;padding-left:20px;line-height:1.7;">
            ${SPEAKING_CONFIG.part1.questions.map(q => `<li>${q}</li>`).join("")}
          </ol>
        `;
      }
    }

    function renderPart2Prep() {
      if (partBox) partBox.textContent = "Current stage: Part 2 — Preparation Time";
      setStatus("Part 2 preparation time");
      setTimerText(stageSecondsLeft);

      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:10px;font-weight:700;">Cue Card</div>
          <div style="margin-bottom:10px;">${SPEAKING_CONFIG.part2.cueCardTitle}</div>
          <ul style="margin:0;padding-left:20px;line-height:1.7;">
            ${SPEAKING_CONFIG.part2.cueCardPoints.map(p => `<li>${p}</li>`).join("")}
          </ul>
          <div style="margin-top:14px;font-weight:700;">Preparation time is running now.</div>
        `;
      }
    }

    function renderPart2Speak() {
      if (partBox) partBox.textContent = "Current stage: Part 2 — Candidate Speaking Time";
      setStatus("Part 2 speaking time");
      setTimerText(stageSecondsLeft);

      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:10px;font-weight:700;">Cue Card</div>
          <div style="margin-bottom:10px;">${SPEAKING_CONFIG.part2.cueCardTitle}</div>
          <ul style="margin:0;padding-left:20px;line-height:1.7;">
            ${SPEAKING_CONFIG.part2.cueCardPoints.map(p => `<li>${p}</li>`).join("")}
          </ul>
          <div style="margin-top:14px;font-weight:700;">The student should speak now.</div>
        `;
      }
    }

    function renderPart3() {
      if (partBox) partBox.textContent = "Current stage: Part 3 — " + SPEAKING_CONFIG.part3.title;
      setStatus("Part 3 in progress");
      setTimerText(stageSecondsLeft);

      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:10px;">Ask these discussion questions:</div>
          <ol style="margin:0;padding-left:20px;line-height:1.7;">
            ${SPEAKING_CONFIG.part3.questions.map(q => `<li>${q}</li>`).join("")}
          </ol>
        `;
      }
    }

    function renderFinished() {
      if (partBox) partBox.textContent = "Current stage: Exam finished";
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="font-weight:700;margin-bottom:10px;">The speaking exam has finished automatically.</div>
          <div>You can now play back and download the recording.</div>
        `;
      }
      setTimerText(0);
      setStatus("Speaking exam finished");
    }

    function stopStageTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startStageTimer() {
      stopStageTimer();

      timer = setInterval(() => {
        stageSecondsLeft -= 1;
        setTimerText(Math.max(0, stageSecondsLeft));

        if (stageSecondsLeft <= 0) {
          moveToNextStage();
        }
      }, 1000);
    }

    function beginStage(stageName) {
      currentStage = stageName;

      if (stageName === "part1") {
        stageSecondsLeft = SPEAKING_CONFIG.part1.duration;
        renderPart1();
        startStageTimer();
        return;
      }

      if (stageName === "part2prep") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.prepDuration;
        renderPart2Prep();
        startStageTimer();
        return;
      }

      if (stageName === "part2speak") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.speakDuration;
        renderPart2Speak();
        startStageTimer();
        return;
      }

      if (stageName === "part3") {
        stageSecondsLeft = SPEAKING_CONFIG.part3.duration;
        renderPart3();
        startStageTimer();
        return;
      }

      if (stageName === "finished") {
        finishExamAutomatically();
      }
    }

    function moveToNextStage() {
      stopStageTimer();

      if (currentStage === "part1") {
        beginStage("part2prep");
        return;
      }

      if (currentStage === "part2prep") {
        beginStage("part2speak");
        return;
      }

      if (currentStage === "part2speak") {
        beginStage("part3");
        return;
      }

      if (currentStage === "part3") {
        beginStage("finished");
      }
    }

    async function startRecordingAndExam() {
      if (examRunning) return;

      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        recordedChunks = [];
        audioBlob = null;
        audioUrl = "";
        examRunning = true;
        examFinished = false;

        if (playback) playback.src = "";

        mediaRecorder = new MediaRecorder(micStream);

        mediaRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = function () {
          audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
          audioUrl = URL.createObjectURL(audioBlob);

          if (playback) playback.src = audioUrl;

          stopStageTimer();
          currentStage = "finished";
          examRunning = false;
          examFinished = true;

          window.onbeforeunload = null;

          if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
          }

          renderFinished();
        };

        mediaRecorder.start();

        window.onbeforeunload = function () {
          return "Speaking exam is in progress. Are you sure you want to leave?";
        };

        beginStage("part1");
      } catch (err) {
        console.error(err);
        examRunning = false;
        setStatus("Microphone access failed");
      }
    }

    function stopRecordingManually() {
      if (!mediaRecorder || mediaRecorder.state === "inactive") return;

      stopStageTimer();
      setStatus("Stopping exam...");
      mediaRecorder.stop();
    }

    function finishExamAutomatically() {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        renderFinished();
        return;
      }

      setStatus("Time is up. Finishing exam...");
      mediaRecorder.stop();
    }

    function downloadRecording() {
      if (!audioUrl) {
        alert("No recording available yet.");
        return;
      }

      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "ielts-speaking-exam.webm";
      a.click();
    }

    // Initial screen
    if (partBox) partBox.textContent = "Current stage: Not started";
    if (bodyBox) {
      bodyBox.innerHTML = `
        <div style="line-height:1.7;">
          <div><strong>Part 1:</strong> ${Math.floor(SPEAKING_CONFIG.part1.duration / 60)} min ${SPEAKING_CONFIG.part1.duration % 60} sec</div>
          <div><strong>Part 2 Prep:</strong> ${Math.floor(SPEAKING_CONFIG.part2.prepDuration / 60)} min ${SPEAKING_CONFIG.part2.prepDuration % 60} sec</div>
          <div><strong>Part 2 Speaking:</strong> ${Math.floor(SPEAKING_CONFIG.part2.speakDuration / 60)} min ${SPEAKING_CONFIG.part2.speakDuration % 60} sec</div>
          <div><strong>Part 3:</strong> ${Math.floor(SPEAKING_CONFIG.part3.duration / 60)} min ${SPEAKING_CONFIG.part3.duration % 60} sec</div>
          <div style="margin-top:12px;">Click <strong>Start Recording</strong> to begin the full speaking exam.</div>
        </div>
      `;
    }
    setTimerText(0);

    if (openBtn) openBtn.onclick = showSpeaking;
    if (backBtn) backBtn.onclick = showHome;
    if (startBtn) startBtn.onclick = startRecordingAndExam;
    if (stopBtn) stopBtn.onclick = stopRecordingManually;
    if (downloadBtn) downloadBtn.onclick = downloadRecording;
  }

  window.IELTS.Speaking.initSpeakingExam = initSpeakingExam;
})();

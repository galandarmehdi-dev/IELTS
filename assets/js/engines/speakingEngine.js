/* assets/js/engines/speakingEngine.js */
(function () {
  "use strict";

  window.IELTS = window.IELTS || {};
  window.IELTS.Speaking = window.IELTS.Speaking || {};

  const SPEAKING_CONFIG = {
    uploadEndpoint: "",
    realtimeModel: "gpt-realtime",
    voice: "marin",
    part1: {
      title: "Introduction and Interview",
      duration: 270,
      questions: [
        "Can you tell me your full name, please?",
        "Where are you from?",
        "Do you work or are you a student?",
        "Do you enjoy reading?",
        "What kind of books do you like?",
        "Did you read more when you were a child?",
        "Do you prefer reading at home or somewhere else?"
      ]
    },
    part2: {
      title: "Long Turn",
      prepDuration: 60,
      speakDuration: 120,
      cueCard: {
        topic: "Describe a book you have read recently.",
        prompts: [
          "what the book was",
          "what kind of book it was",
          "what happened in it",
          "and explain why you enjoyed it or did not enjoy it"
        ]
      }
    },
    part3: {
      title: "Discussion",
      duration: 270,
      questions: [
        "Why do some people read more than others?",
        "How has technology changed people's reading habits?",
        "Do you think children should be encouraged to read more books? Why?",
        "Is reading more beneficial than watching videos for learning?",
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
    let uploadInProgress = false;

    let peerConnection = null;
    let dataChannel = null;
    let remoteAudioEl = null;
    let sessionReady = false;
    let pendingStagePrompt = null;
    let pushStageTimeout = null;

    renderDynamicExamUI();

    const partBox = document.getElementById("speakingCurrentPart");
    const timerBox = document.getElementById("speakingTimer");
    const bodyBox = document.getElementById("speakingDynamicBody");
    const uploadBtn = document.getElementById("uploadSpeakingBtn");
    const uploadInfo = document.getElementById("speakingUploadInfo");
    const studentNameInput = document.getElementById("speakingStudentName");

    function renderDynamicExamUI() {
      const shell = speakingSection ? speakingSection.querySelector(".speaking-shell") : null;
      if (!shell) return;

      const safeAppendAfterFirstCard = (node) => {
        const firstCard = shell.querySelector(".speaking-card");
        if (firstCard && firstCard.parentNode === shell) {
          if (firstCard.nextSibling) shell.insertBefore(node, firstCard.nextSibling);
          else shell.appendChild(node);
        } else {
          shell.appendChild(node);
        }
      };

      const safeInsertBeforePlayback = (node) => {
        const currentPlaybackCard = playback ? playback.closest(".speaking-card") : null;
        if (currentPlaybackCard && currentPlaybackCard.parentNode === shell) {
          shell.insertBefore(node, currentPlaybackCard);
        } else {
          shell.appendChild(node);
        }
      };

      if (!document.getElementById("speakingNameCard")) {
        const nameCard = document.createElement("div");
        nameCard.className = "speaking-card";
        nameCard.id = "speakingNameCard";
        nameCard.innerHTML = `
          <h2>Student Details</h2>
          <label for="speakingStudentName" style="display:block;margin-bottom:8px;">Student full name</label>
          <input id="speakingStudentName" type="text" placeholder="Enter full name" style="width:100%;max-width:420px;padding:10px 12px;border:1px solid #d7dce5;border-radius:10px;">
          <div style="margin-top:10px;color:#667085;font-size:14px;">This name will be saved together with the recording link.</div>
        `;
        safeAppendAfterFirstCard(nameCard);
      }

      const playbackCard = playback ? playback.closest(".speaking-card") : null;

      if (!document.getElementById("speakingExamFlowCard")) {
        const flowCard = document.createElement("div");
        flowCard.className = "speaking-card";
        flowCard.id = "speakingExamFlowCard";
        flowCard.innerHTML = `
          <h2>Exam Flow</h2>
          <div id="speakingCurrentPart" style="font-weight:700;margin-bottom:8px;">Current stage: Not started</div>
          <div id="speakingTimer" style="font-size:28px;font-weight:800;margin-bottom:14px;">00:00</div>
          <div id="speakingDynamicBody"></div>
        `;
        safeInsertBeforePlayback(flowCard);
      }

      if (playbackCard) {
        playbackCard.style.display = "none";
      }

      if (!document.getElementById("speakingExaminerCard")) {
        const examinerCard = document.createElement("div");
        examinerCard.className = "speaking-card";
        examinerCard.id = "speakingExaminerCard";
        examinerCard.style.display = "none";
        examinerCard.innerHTML = `
          <div id="speakingRealtimeStatus" style="display:none;">Realtime status: Not connected</div>
          <audio id="remoteAudio" autoplay playsinline style="display:none"></audio>
        `;
        safeInsertBeforePlayback(examinerCard);
      }
    }

    remoteAudioEl = document.getElementById("remoteAudio");

    function getUploadEndpoint() {
      const fromRegistry = window.IELTS && window.IELTS.Registry
        ? (window.IELTS.Registry.SPEAKING_UPLOAD_ENDPOINT || "")
        : "";
      return String(fromRegistry || SPEAKING_CONFIG.uploadEndpoint || "").trim();
    }

    function getRealtimeSessionEndpoint() {
      const endpoint = window.IELTS?.Registry?.REALTIME_SESSION_ENDPOINT || "";
      return String(endpoint).trim();
    }

    function getStudentName() {
      return studentNameInput ? String(studentNameInput.value || "").trim() : "";
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = String(reader.result || "");
          const base64 = result.split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    function showSpeaking() {
      try {
        if (window.IELTS?.UI?.showOnly) {
          window.IELTS.UI.showOnly("speaking");
        }
      } catch (e) {}
      try {
        const testId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
        window.IELTS?.Router?.setHashRoute?.(testId, "speaking");
      } catch (e) {}
      if (speakingSection) speakingSection.classList.remove("hidden");
      try {
        window.IELTS?.UI?.setExamNavStatus?.("Status: Speaking module");
      } catch (e) {}
    }

    function showHome() {
      if (examRunning) {
        const leave = confirm("The speaking exam is still running. Do you want to leave?");
        if (!leave) return;
      }
      if (speakingSection) speakingSection.classList.add("hidden");
      try {
        if (window.IELTS?.UI?.showOnly) {
          window.IELTS.UI.showOnly("home");
          const testId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
          window.IELTS?.Router?.setHashRoute?.(testId, "home");
          window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
          return;
        }
      } catch (e) {}
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

    function setRealtimeStatus(text) {
      const el = document.getElementById("speakingRealtimeStatus");
      if (el) el.textContent = "Realtime status: " + text;
    }

    function renderPart1() {
      if (partBox) partBox.textContent = "Current stage: Part 1 — Introduction and Interview";
      setStatus("Part 1 in progress");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            The examiner is asking Part 1 questions.<br>
            Listen and answer naturally.<br>
            <div style="margin-top:12px;color:#667085;">Questions are spoken only and are not shown on the screen.</div>
          </div>
        `;
      }
    }

    function renderPart2Prep() {
      if (partBox) partBox.textContent = "Current stage: Part 2 — Preparation time";
      setStatus("Part 2 preparation time");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:12px;">You have 1 minute to prepare.</div>
          <div style="padding:14px;border:1px solid #d7dce5;border-radius:12px;background:#fff;line-height:1.7;">
            <strong>${SPEAKING_CONFIG.part2.cueCard.topic}</strong>
            <ul style="margin:10px 0 0 18px;">
              ${SPEAKING_CONFIG.part2.cueCard.prompts.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    function renderPart2Speaking() {
      if (partBox) partBox.textContent = "Current stage: Part 2 — Long turn";
      setStatus("Part 2 speaking time");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            Speak for up to 2 minutes about the cue card topic.<br>
            The examiner may stop you when the time is over.
          </div>
        `;
      }
    }

    function renderPart3() {
      if (partBox) partBox.textContent = "Current stage: Part 3 — Discussion";
      setStatus("Part 3 discussion");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            The examiner is asking follow-up discussion questions.<br>
            Listen carefully and answer in detail.
          </div>
        `;
      }
    }

    function renderFinished() {
      if (partBox) partBox.textContent = "Current stage: Finished";
      setStatus("Speaking exam complete");
      setTimerText(0);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            The speaking exam is complete.<br>
            You can now review, download, or upload the recording.
          </div>
        `;
      }
    }

    function updateStageUI() {
      if (currentStage === "part1") return renderPart1();
      if (currentStage === "part2prep") return renderPart2Prep();
      if (currentStage === "part2speak") return renderPart2Speaking();
      if (currentStage === "part3") return renderPart3();
      if (currentStage === "finished") return renderFinished();
      if (partBox) partBox.textContent = "Current stage: Not started";
      setStatus("Ready to begin");
      setTimerText(0);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            This module records a full IELTS-style speaking test.<br>
            Enter the student's full name, then click <strong>Start Recording</strong>.
          </div>
        `;
      }
    }

    function clearStageTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function setStage(nextStage, seconds) {
      currentStage = nextStage;
      stageSecondsLeft = Math.max(0, Number(seconds) || 0);
      updateStageUI();
      clearStageTimer();
      if (stageSecondsLeft <= 0) {
        advanceStage();
        return;
      }
      timer = setInterval(() => {
        stageSecondsLeft -= 1;
        if (stageSecondsLeft <= 0) {
          clearStageTimer();
          stageSecondsLeft = 0;
          updateStageUI();
          advanceStage();
          return;
        }
        updateStageUI();
      }, 1000);
    }

    function getPromptForStage(stage) {
      if (stage === "part1") {
        return [
          "You are an IELTS speaking examiner.",
          "Run Part 1 naturally using short, spoken questions only.",
          "Ask questions one by one and wait for the candidate after each.",
          "Use these possible topics if needed:",
          ...SPEAKING_CONFIG.part1.questions.map((q) => `- ${q}`),
        ].join("\n");
      }
      if (stage === "part2prep") {
        return [
          "You are an IELTS speaking examiner.",
          "Tell the candidate they now have one minute to prepare.",
          "Read the cue card briefly once and then stop speaking.",
          `Cue card: ${SPEAKING_CONFIG.part2.cueCard.topic}`,
          ...SPEAKING_CONFIG.part2.cueCard.prompts.map((q) => `- ${q}`),
        ].join("\n");
      }
      if (stage === "part2speak") {
        return [
          "You are an IELTS speaking examiner.",
          "Tell the candidate to start speaking now.",
          "Do not interrupt unless the candidate goes fully silent for a long time.",
          "At the natural end, say one short acknowledgment only.",
        ].join("\n");
      }
      if (stage === "part3") {
        return [
          "You are an IELTS speaking examiner.",
          "Run Part 3 as a natural discussion.",
          "Ask one question at a time and wait for the candidate after each.",
          "Possible questions:",
          ...SPEAKING_CONFIG.part3.questions.map((q) => `- ${q}`),
        ].join("\n");
      }
      if (stage === "finished") {
        return "The speaking test has ended. Thank the candidate briefly in one short sentence and stop.";
      }
      return "";
    }

    function queueStagePrompt(stage) {
      pendingStagePrompt = getPromptForStage(stage);
      flushPendingStagePrompt();
    }

    function flushPendingStagePrompt() {
      if (!pendingStagePrompt || !sessionReady || !dataChannel || dataChannel.readyState !== "open") return;

      const prompt = pendingStagePrompt;
      pendingStagePrompt = null;

      try {
        dataChannel.send(JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: prompt,
          },
        }));
      } catch (e) {
        console.error("[Speaking] Could not send stage prompt", e);
      }
    }

    function scheduleStagePrompt(stage) {
      if (pushStageTimeout) {
        clearTimeout(pushStageTimeout);
        pushStageTimeout = null;
      }
      queueStagePrompt(stage);
      pushStageTimeout = setTimeout(() => {
        flushPendingStagePrompt();
      }, 600);
    }

    function advanceStage() {
      if (!examRunning && currentStage !== "finished") return;

      if (currentStage === null) {
        setStage("part1", SPEAKING_CONFIG.part1.duration);
        scheduleStagePrompt("part1");
        return;
      }

      if (currentStage === "part1") {
        setStage("part2prep", SPEAKING_CONFIG.part2.prepDuration);
        scheduleStagePrompt("part2prep");
        return;
      }

      if (currentStage === "part2prep") {
        setStage("part2speak", SPEAKING_CONFIG.part2.speakDuration);
        scheduleStagePrompt("part2speak");
        return;
      }

      if (currentStage === "part2speak") {
        setStage("part3", SPEAKING_CONFIG.part3.duration);
        scheduleStagePrompt("part3");
        return;
      }

      if (currentStage === "part3") {
        examRunning = false;
        examFinished = true;
        setStage("finished", 0);
        scheduleStagePrompt("finished");
        if (stopBtn) stopBtn.disabled = false;
        if (uploadBtn) uploadBtn.disabled = false;
        return;
      }
    }

    async function requestMicrophone() {
      if (micStream) return micStream;
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return micStream;
    }

    async function setupRealtimeExaminer() {
      const endpoint = getRealtimeSessionEndpoint();
      if (!endpoint) {
        setRealtimeStatus("disabled");
        return;
      }

      const examinerCard = document.getElementById("speakingExaminerCard");
      if (examinerCard) examinerCard.style.display = "block";
      const realtimeStatusEl = document.getElementById("speakingRealtimeStatus");
      if (realtimeStatusEl) realtimeStatusEl.style.display = "block";

      setRealtimeStatus("requesting session...");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: SPEAKING_CONFIG.realtimeModel,
          voice: SPEAKING_CONFIG.voice,
        }),
      });
      if (!res.ok) throw new Error(`Realtime session failed: HTTP ${res.status}`);
      const payload = await res.json().catch(() => ({}));
      const secret = payload?.client_secret?.value;
      if (!secret) throw new Error("Realtime session missing client secret");

      const stream = await requestMicrophone();
      peerConnection = new RTCPeerConnection();

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        if (remoteAudioEl) {
          remoteAudioEl.srcObject = event.streams[0];
        }
      };

      dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannel.onopen = () => {
        sessionReady = true;
        setRealtimeStatus("connected");
        try {
          dataChannel.send(JSON.stringify({
            type: "session.update",
            session: {
              instructions: [
                "You are a strict but polite IELTS speaking examiner.",
                "Keep the interaction natural and voice-friendly.",
                "Do not show scoring or give detailed feedback during the live test.",
                "Only ask questions and brief transitions unless explicitly told otherwise.",
              ].join(" "),
            },
          }));
        } catch (e) {
          console.error("[Speaking] Could not send session.update", e);
        }
        flushPendingStagePrompt();
      };
      dataChannel.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data || "{}"));
          if (msg.type === "response.done") {
            // no-op, but useful for debugging later
          }
        } catch (e) {}
      };
      dataChannel.onerror = (event) => {
        console.error("[Speaking] dataChannel error", event);
        setRealtimeStatus("error");
      };
      dataChannel.onclose = () => {
        sessionReady = false;
        setRealtimeStatus("closed");
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(SPEAKING_CONFIG.realtimeModel)}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/sdp",
        },
      });
      const answerSdp = await sdpRes.text();
      if (!sdpRes.ok || !answerSdp) {
        throw new Error("Realtime SDP exchange failed");
      }
      await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
      setRealtimeStatus("ready");
    }

    function cleanupRealtimeExaminer() {
      sessionReady = false;
      pendingStagePrompt = null;
      if (pushStageTimeout) {
        clearTimeout(pushStageTimeout);
        pushStageTimeout = null;
      }
      try {
        if (dataChannel) dataChannel.close();
      } catch (e) {}
      dataChannel = null;
      try {
        if (peerConnection) peerConnection.close();
      } catch (e) {}
      peerConnection = null;
      if (remoteAudioEl) {
        try { remoteAudioEl.srcObject = null; } catch (e) {}
      }
      setRealtimeStatus("not connected");
    }

    function resetRecordingState() {
      clearStageTimer();
      currentStage = null;
      stageSecondsLeft = 0;
      examRunning = false;
      examFinished = false;
      updateStageUI();
      cleanupRealtimeExaminer();
      recordedChunks = [];
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = "";
      }
      audioBlob = null;
      if (playback) {
        playback.src = "";
        playback.load();
      }
      if (downloadBtn) downloadBtn.disabled = true;
      if (uploadBtn) uploadBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = true;
    }

    async function startExam() {
      const name = getStudentName();
      if (!name) {
        alert("Please enter the student's full name first.");
        return;
      }
      if (uploadInProgress) return;

      resetRecordingState();
      showSpeaking();

      try {
        const stream = await requestMicrophone();
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      } catch (e) {
        console.error("[Speaking] Could not access microphone", e);
        alert("Could not access the microphone. Please allow microphone access and try again.");
        return;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordedChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        audioBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(audioBlob);
        if (playback) {
          playback.src = audioUrl;
          playback.style.display = "block";
          playback.load();
        }
        if (downloadBtn) downloadBtn.disabled = !audioBlob;
        if (uploadBtn) uploadBtn.disabled = !audioBlob;
        setStatus("Recording ready for review or upload");
      };

      try {
        mediaRecorder.start(1000);
      } catch (e) {
        console.error("[Speaking] MediaRecorder start failed", e);
        alert("Could not start recording. Please refresh and try again.");
        return;
      }

      try {
        await setupRealtimeExaminer();
      } catch (e) {
        console.error("[Speaking] Realtime examiner unavailable", e);
        setRealtimeStatus("offline");
      }

      examRunning = true;
      examFinished = false;
      if (stopBtn) stopBtn.disabled = false;
      if (downloadBtn) downloadBtn.disabled = true;
      if (uploadBtn) uploadBtn.disabled = true;
      advanceStage();
    }

    function stopExam() {
      if (!mediaRecorder) return;
      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      examRunning = false;
      examFinished = true;
      clearStageTimer();
      setStage("finished", 0);
      cleanupRealtimeExaminer();
      if (stopBtn) stopBtn.disabled = true;
    }

    function downloadRecording() {
      if (!audioBlob) return;
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "ielts-speaking-exam.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
    }

    async function uploadRecording() {
      if (!audioBlob || uploadInProgress) return;
      const endpoint = getUploadEndpoint();
      if (!endpoint) {
        alert("Speaking upload endpoint is not configured.");
        return;
      }

      const studentName = getStudentName();
      if (!studentName) {
        alert("Please enter the student's full name first.");
        return;
      }

      uploadInProgress = true;
      if (uploadBtn) uploadBtn.disabled = true;
      if (uploadInfo) uploadInfo.textContent = "Uploading recording...";

      try {
        const base64Audio = await blobToBase64(audioBlob);
        const payload = {
          studentName,
          mimeType: audioBlob.type || "audio/webm",
          fileName: "ielts-speaking-exam.webm",
          audioBase64: base64Audio,
          examType: "IELTS Speaking",
          submittedAt: new Date().toISOString(),
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        if (uploadInfo) {
          uploadInfo.innerHTML = `Uploaded successfully. <a href="${String(data.url || "#")}" target="_blank" rel="noopener">Open file</a>`;
        }
        setStatus("Recording uploaded successfully");
      } catch (e) {
        console.error("[Speaking] Upload failed", e);
        if (uploadInfo) uploadInfo.textContent = `Upload failed: ${e.message || e}`;
      } finally {
        uploadInProgress = false;
        if (uploadBtn) uploadBtn.disabled = !audioBlob;
      }
    }

    if (openBtn && !openBtn.dataset.boundSpeakingOpen) {
      openBtn.dataset.boundSpeakingOpen = "1";
      openBtn.addEventListener("click", showSpeaking);
    }
    if (backBtn && !backBtn.dataset.boundSpeakingBack) {
      backBtn.dataset.boundSpeakingBack = "1";
      backBtn.addEventListener("click", showHome);
    }
    if (startBtn && !startBtn.dataset.boundSpeakingStart) {
      startBtn.dataset.boundSpeakingStart = "1";
      startBtn.addEventListener("click", startExam);
    }
    if (stopBtn && !stopBtn.dataset.boundSpeakingStop) {
      stopBtn.dataset.boundSpeakingStop = "1";
      stopBtn.addEventListener("click", stopExam);
      stopBtn.disabled = true;
    }
    if (downloadBtn && !downloadBtn.dataset.boundSpeakingDownload) {
      downloadBtn.dataset.boundSpeakingDownload = "1";
      downloadBtn.addEventListener("click", downloadRecording);
      downloadBtn.disabled = true;
    }
    if (uploadBtn && !uploadBtn.dataset.boundSpeakingUpload) {
      uploadBtn.dataset.boundSpeakingUpload = "1";
      uploadBtn.addEventListener("click", uploadRecording);
      uploadBtn.disabled = true;
    }

    updateStageUI();
  }

  window.IELTS.Speaking.initSpeakingExam = initSpeakingExam;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpeakingExam, { once: true });
  } else {
    initSpeakingExam();
  }
})();

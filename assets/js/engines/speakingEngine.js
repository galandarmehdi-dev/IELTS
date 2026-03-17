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
        const firstCard = shell.querySelector(".speaking-card");
        if (firstCard) shell.insertBefore(nameCard, firstCard.nextSibling);
        else shell.appendChild(nameCard);
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
        if (playbackCard) shell.insertBefore(flowCard, playbackCard);
        else shell.appendChild(flowCard);
      }

      if (playbackCard && !document.getElementById("speakingExaminerCard")) {
        const examinerCard = document.createElement("div");
        examinerCard.className = "speaking-card";
        examinerCard.id = "speakingExaminerCard";
        examinerCard.innerHTML = `
          <h2>AI Examiner</h2>
          <div id="speakingRealtimeStatus" style="margin-bottom:10px;color:#475467;">Realtime status: Not connected</div>
          <audio id="remoteAudio" autoplay playsinline style="display:none"></audio>
        `;
        shell.insertBefore(examinerCard, playbackCard);
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
              ${SPEAKING_CONFIG.part2.cueCard.prompts.map((p) => `<li>${p}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    function renderPart2Speak() {
      if (partBox) partBox.textContent = "Current stage: Part 2 — Long turn";
      setStatus("Part 2 speaking time");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:12px;">Please speak for up to 2 minutes on this topic:</div>
          <div style="padding:14px;border:1px solid #d7dce5;border-radius:12px;background:#fff;line-height:1.7;">
            <strong>${SPEAKING_CONFIG.part2.cueCard.topic}</strong>
            <ul style="margin:10px 0 0 18px;">
              ${SPEAKING_CONFIG.part2.cueCard.prompts.map((p) => `<li>${p}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    function renderPart3() {
      if (partBox) partBox.textContent = "Current stage: Part 3 — Discussion";
      setStatus("Part 3 in progress");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            The examiner is asking Part 3 questions.<br>
            Listen carefully and answer in detail.<br>
            <div style="margin-top:12px;color:#667085;">Questions are spoken only and are not shown on the screen.</div>
          </div>
        `;
      }
    }

    function renderFinished() {
      if (partBox) partBox.textContent = "Current stage: Finished";
      setStatus("Exam finished");
      setTimerText(0);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="line-height:1.7;">
            The speaking exam is complete.<br>
            You can now download the recording or upload it to the admin sheet.
          </div>
        `;
      }
    }

    function stopStageTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function clearPendingStagePrompt() {
      if (pushStageTimeout) {
        clearTimeout(pushStageTimeout);
        pushStageTimeout = null;
      }
    }

    function sendRealtimeEvent(payload) {
      if (!dataChannel || dataChannel.readyState !== "open") return false;
      dataChannel.send(JSON.stringify(payload));
      return true;
    }

    function createStageInstruction(stage) {
      if (stage === "part1") {
        return [
          "Start the IELTS Speaking test now.",
          "You are in Part 1.",
          "First greet the candidate briefly, ask for their full name, and immediately continue with short Part 1 questions.",
          "Ask one question at a time and keep your turns short.",
          "Stay within Part 1 only until the app changes the stage.",
          "Use only these Part 1 questions as your pool:",
          ...SPEAKING_CONFIG.part1.questions.map((q, i) => `${i + 1}. ${q}`),
          "Do not give feedback or scores. Do not chat casually."
        ].join("\n");
      }

      if (stage === "part2prep") {
        return [
          "Part 2 preparation starts now.",
          "Tell the candidate they now have one minute to prepare.",
          "Read the cue card briefly once and then stop speaking.",
          `Cue card topic: ${SPEAKING_CONFIG.part2.cueCard.topic}`,
          ...SPEAKING_CONFIG.part2.cueCard.prompts.map((p) => `- ${p}`),
          "After giving the cue card, remain silent unless the app changes the stage."
        ].join("\n");
      }

      if (stage === "part2speak") {
        return [
          "The one-minute preparation time is over.",
          "Tell the candidate to start speaking now.",
          "After that, remain silent and let the candidate speak for the long turn.",
          "Do not interrupt unless absolutely necessary."
        ].join("\n");
      }

      if (stage === "part3") {
        return [
          "Part 3 starts now.",
          "Ask deeper discussion questions one at a time.",
          "Stay within Part 3 only until the app ends the exam.",
          "Use only these Part 3 questions as your pool:",
          ...SPEAKING_CONFIG.part3.questions.map((q, i) => `${i + 1}. ${q}`),
          "Keep examiner turns short and natural.",
          "Do not give feedback or scores."
        ].join("\n");
      }

      if (stage === "finished") {
        return "The speaking test has ended. Thank the candidate briefly in one short sentence and stop.";
      }

      return "";
    }

    function sendStagePromptNow(stage) {
      const promptText = createStageInstruction(stage);
      if (!promptText) return false;

      const created = sendRealtimeEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: promptText }
          ]
        }
      });

      if (!created) return false;

      return sendRealtimeEvent({
        type: "response.create",
        response: {
          output_modalities: ["audio"]
        }
      });
    }

    function queueOrSendStagePrompt(stage) {
      pendingStagePrompt = stage;
      clearPendingStagePrompt();

      if (!sessionReady) return;

      pushStageTimeout = setTimeout(() => {
        if (pendingStagePrompt) {
          sendStagePromptNow(pendingStagePrompt);
          pendingStagePrompt = null;
        }
      }, 700);
    }

    function beginStage(stageName) {
      currentStage = stageName;
      stopStageTimer();

      if (stageName === "part1") {
        stageSecondsLeft = SPEAKING_CONFIG.part1.duration;
        renderPart1();
      } else if (stageName === "part2prep") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.prepDuration;
        renderPart2Prep();
      } else if (stageName === "part2speak") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.speakDuration;
        renderPart2Speak();
      } else if (stageName === "part3") {
        stageSecondsLeft = SPEAKING_CONFIG.part3.duration;
        renderPart3();
      } else {
        renderFinished();
        return;
      }

      queueOrSendStagePrompt(stageName);

      timer = setInterval(() => {
        stageSecondsLeft -= 1;
        if (stageSecondsLeft < 0) stageSecondsLeft = 0;
        setTimerText(stageSecondsLeft);

        if (stageSecondsLeft <= 0) {
          stopStageTimer();
          if (currentStage === "part1") beginStage("part2prep");
          else if (currentStage === "part2prep") beginStage("part2speak");
          else if (currentStage === "part2speak") beginStage("part3");
          else if (currentStage === "part3") finishExamAutomatically();
        }
      }, 1000);
    }

    async function connectRealtime(stream) {
      const sessionEndpoint = getRealtimeSessionEndpoint();
      if (!sessionEndpoint) throw new Error("Realtime session endpoint is missing.");

      setRealtimeStatus("Connecting...");
      sessionReady = false;
      pendingStagePrompt = null;
      clearPendingStagePrompt();

      peerConnection = new RTCPeerConnection();

      if (remoteAudioEl) {
        remoteAudioEl.autoplay = true;
        remoteAudioEl.playsInline = true;
      }

      peerConnection.ontrack = (event) => {
        if (remoteAudioEl) remoteAudioEl.srcObject = event.streams[0];
      };

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      dataChannel = peerConnection.createDataChannel("oai-events");

      dataChannel.addEventListener("open", () => {
        setRealtimeStatus("Connected");

        sendRealtimeEvent({
          type: "session.update",
          session: {
            type: "realtime",
            model: SPEAKING_CONFIG.realtimeModel,
            output_modalities: ["audio"],
            audio: {
              input: {
                turn_detection: { type: "semantic_vad" }
              },
              output: {
                voice: SPEAKING_CONFIG.voice
              }
            },
            instructions: [
              "You are an IELTS Speaking examiner for a mock exam.",
              "Follow the app's stage instructions exactly.",
              "Act only as an examiner, not as a casual chatbot.",
              "Speak naturally, clearly, and briefly.",
              "Ask one question at a time.",
              "Do not provide scores, feedback, explanations, or transcripts.",
              "Do not move to another part unless the app tells you to.",
              "If the app tells you to remain silent, remain silent."
            ].join(" ")
          }
        });

        setTimeout(() => {
          sessionReady = true;
          if (currentStage) queueOrSendStagePrompt(currentStage);
        }, 500);
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const serverEvent = JSON.parse(event.data);
          if (serverEvent.type === "error") {
            console.error("Realtime server event error", serverEvent);
            setRealtimeStatus("Error");
          }
        } catch (err) {
          console.error("Failed to parse realtime event", err);
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await waitForIceGatheringComplete(peerConnection);

      const localSdp = peerConnection.localDescription?.sdp || "";
      if (!localSdp.trim()) throw new Error("Local SDP offer is empty.");

      const response = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp"
        },
        body: localSdp
      });

      const answerSdp = await response.text();
      if (!response.ok) {
        throw new Error(answerSdp || `Realtime session failed (${response.status})`);
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp
      });
    }

    function waitForIceGatheringComplete(pc) {
      return new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }

        function checkState() {
          if (pc.iceGatheringState === "complete") {
            pc.removeEventListener("icegatheringstatechange", checkState);
            resolve();
          }
        }

        pc.addEventListener("icegatheringstatechange", checkState);

        setTimeout(() => {
          pc.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }, 2000);
      });
    }

    function disconnectRealtime() {
      sessionReady = false;
      pendingStagePrompt = null;
      clearPendingStagePrompt();

      try {
        if (dataChannel) dataChannel.close();
      } catch {}
      dataChannel = null;

      try {
        if (peerConnection) peerConnection.close();
      } catch {}
      peerConnection = null;

      setRealtimeStatus("Disconnected");
    }

    async function uploadRecording() {
      if (uploadInProgress) return;
      if (!audioBlob) {
        alert("No recording available yet.");
        return;
      }

      const studentFullName = getStudentName();
      if (!studentFullName) {
        alert("Please enter the student full name before uploading.");
        return;
      }

      const endpoint = getUploadEndpoint();
      if (!endpoint) {
        alert("Speaking upload endpoint is missing.");
        return;
      }

      uploadInProgress = true;
      if (uploadInfo) uploadInfo.textContent = "Uploading recording...";

      try {
        const base64Audio = await blobToBase64(audioBlob);
        const payload = {
          action: "uploadSpeaking",
          studentFullName,
          submittedAt: new Date().toISOString(),
          part1DurationSec: SPEAKING_CONFIG.part1.duration,
          part2PrepSec: SPEAKING_CONFIG.part2.prepDuration,
          part2SpeakSec: SPEAKING_CONFIG.part2.speakDuration,
          part3DurationSec: SPEAKING_CONFIG.part3.duration,
          mimeType: audioBlob.type || "audio/webm",
          base64Audio
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });

        const json = await response.json();
        if (!json.ok) throw new Error(json.error || "Upload failed");

        if (uploadInfo) {
          uploadInfo.innerHTML = `
            <div>Upload complete.</div>
            <div><a href="${json.fileUrl}" target="_blank" rel="noopener">Open recording file</a></div>
          `;
        }
      } catch (err) {
        console.error(err);
        if (uploadInfo) uploadInfo.textContent = "Upload failed: " + String(err.message || err);
      } finally {
        uploadInProgress = false;
      }
    }

    async function startRecordingAndExam() {
      if (examRunning) return;

      const studentFullName = getStudentName();
      if (!studentFullName) {
        alert("Please enter the student full name before starting the exam.");
        return;
      }

      try {
        examRunning = true;
        examFinished = false;
        recordedChunks = [];
        audioBlob = null;
        audioUrl = "";
        if (uploadInfo) uploadInfo.textContent = "";
        if (playback) playback.src = "";
        setStatus("Requesting microphone...");

micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000
  }
});

// audio processing (reduces sensitivity to background noise)
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(micStream);

const gainNode = audioContext.createGain();
gainNode.gain.value = 0.85;

source.connect(gainNode);

// create a new processed stream
const processedStream = audioContext.createMediaStreamDestination();
gainNode.connect(processedStream);

// use the processed stream for recording
mediaRecorder = new MediaRecorder(processedStream.stream);

mediaRecorder.ondataavailable = function (event) {
  if (event.data && event.data.size > 0) {
    recordedChunks.push(event.data);
  }
};

        mediaRecorder.onstop = function () {
          audioBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
          audioUrl = URL.createObjectURL(audioBlob);

          if (playback) playback.src = audioUrl;

          stopStageTimer();
          currentStage = "finished";
          examRunning = false;
          examFinished = true;
          window.onbeforeunload = null;

          queueOrSendStagePrompt("finished");
          setTimeout(() => disconnectRealtime(), 250);

          if (micStream) {
            micStream.getTracks().forEach((track) => track.stop());
            micStream = null;
          }

          renderFinished();
          uploadRecording();
        };

        mediaRecorder.start();
        await connectRealtime(micStream);

        window.onbeforeunload = function () {
          return "Speaking exam is in progress. Are you sure you want to leave?";
        };

        beginStage("part1");
      } catch (err) {
        console.error(err);
        examRunning = false;
        setStatus("Microphone / Realtime connection failed");
        setRealtimeStatus("Failed");
        disconnectRealtime();
        if (micStream) {
          micStream.getTracks().forEach((track) => track.stop());
          micStream = null;
        }
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
    setRealtimeStatus("Not connected");

    if (openBtn) openBtn.onclick = showSpeaking;
    if (backBtn) backBtn.onclick = showHome;
    if (startBtn) startBtn.onclick = startRecordingAndExam;
    if (stopBtn) stopBtn.onclick = stopRecordingManually;
    if (downloadBtn) downloadBtn.onclick = downloadRecording;
    if (uploadBtn) uploadBtn.onclick = uploadRecording;
  }

  window.IELTS.Speaking.initSpeakingExam = initSpeakingExam;
})();

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
    let lastUploadResult = null;

    let peerConnection = null;
    let dataChannel = null;
    let realtimeConnected = false;
    let remoteAudioEl = null;
    let remoteTranscriptEl = null;

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
          <audio id="remoteAudio" autoplay playsinline controls style="width:100%;margin-top:10px;"></audio>
          <div id="speakingExaminerTranscript" style="margin-top:12px;padding:12px;border:1px solid #e4e7ec;border-radius:10px;background:#f8fafc;line-height:1.6;color:#344054;min-height:48px;">The examiner's latest text will appear here.</div>
        `;
        shell.insertBefore(examinerCard, playbackCard);
      }

      if (playbackCard && !document.getElementById("uploadSpeakingBtn")) {
        const uploadWrap = document.createElement("div");
        uploadWrap.style.marginTop = "14px";
        uploadWrap.innerHTML = `
          <button id="uploadSpeakingBtn" type="button">Upload Recording</button>
          <div id="speakingUploadInfo" style="margin-top:10px;line-height:1.6;color:#475467;"></div>
        `;
        playbackCard.appendChild(uploadWrap);
      }
    }

    remoteAudioEl = document.getElementById("remoteAudio");
    remoteTranscriptEl = document.getElementById("speakingExaminerTranscript");

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
      const typed = studentNameInput ? String(studentNameInput.value || "").trim() : "";
      return typed;
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

    function setExaminerTranscript(text) {
      if (!remoteTranscriptEl) return;
      remoteTranscriptEl.textContent = text || "The examiner's latest text will appear here.";
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
      if (partBox) partBox.textContent = "Current stage: Part 2 — Preparation time";
      setStatus("Part 2 preparation time");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:12px;">You have 1 minute to prepare.</div>
          <div style="padding:14px;border:1px solid #d7dce5;border-radius:12px;background:#fff;line-height:1.7;">
            <strong>${SPEAKING_CONFIG.part2.cueCard.topic}</strong>
            <ul style="margin:10px 0 0 18px;">
              ${SPEAKING_CONFIG.part2.cueCard.prompts.map(p => `<li>${p}</li>`).join("")}
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
              ${SPEAKING_CONFIG.part2.cueCard.prompts.map(p => `<li>${p}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }

    function renderPart3() {
      if (partBox) partBox.textContent = "Current stage: Part 3 — " + SPEAKING_CONFIG.part3.title;
      setStatus("Part 3 in progress");
      setTimerText(stageSecondsLeft);
      if (bodyBox) {
        bodyBox.innerHTML = `
          <div style="margin-bottom:10px;">Discussion questions:</div>
          <ol style="margin:0;padding-left:20px;line-height:1.7;">
            ${SPEAKING_CONFIG.part3.questions.map(q => `<li>${q}</li>`).join("")}
          </ol>
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

    function sendRealtimeEvent(payload) {
      if (!dataChannel || dataChannel.readyState !== "open") return false;
      dataChannel.send(JSON.stringify(payload));
      return true;
    }

    function sendExaminerTranscriptPrompt(promptText) {
      if (!promptText) return;
      const ok = sendRealtimeEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: promptText }
          ]
        }
      });
      if (!ok) return;
      sendRealtimeEvent({
        type: "response.create",
        response: {
          output_modalities: ["audio", "text"]
        }
      });
    }

    function getStageInstruction(stage) {
      if (stage === "part1") {
        return [
          "Begin IELTS Speaking Part 1 now.",
          "Greet the candidate naturally, confirm that the speaking test is starting, then ask the Part 1 questions one by one.",
          "Use these questions:",
          ...SPEAKING_CONFIG.part1.questions.map((q, i) => `${i + 1}. ${q}`),
          "Keep examiner turns short.",
          "Do not give feedback or scores."
        ].join("\n");
      }

      if (stage === "part2prep") {
        return [
          "Begin IELTS Speaking Part 2 preparation stage now.",
          "Read the cue card briefly and tell the candidate they have one minute to prepare.",
          `Cue card: ${SPEAKING_CONFIG.part2.cueCard.topic}`,
          ...SPEAKING_CONFIG.part2.cueCard.prompts.map((p, i) => `- ${p}`),
          "Do not keep talking after giving the cue card."
        ].join("\n");
      }

      if (stage === "part2speak") {
        return [
          "The one-minute preparation time has finished.",
          "Tell the candidate to start speaking now and allow them to continue.",
          "Only intervene very briefly if needed."
        ].join("\n");
      }

      if (stage === "part3") {
        return [
          "Begin IELTS Speaking Part 3 now.",
          "Ask discussion questions one by one.",
          "Use these questions:",
          ...SPEAKING_CONFIG.part3.questions.map((q, i) => `${i + 1}. ${q}`),
          "Keep examiner turns short and natural.",
          "Do not give feedback or scores."
        ].join("\n");
      }

      if (stage === "finished") {
        return "The speaking test is finished. Thank the candidate briefly and stop.";
      }

      return "";
    }

    function pushStageToExaminer(stage) {
      const prompt = getStageInstruction(stage);
      if (prompt) sendExaminerTranscriptPrompt(prompt);
    }

    function beginStage(stageName) {
      currentStage = stageName;
      stopStageTimer();

      if (stageName === "part1") {
        stageSecondsLeft = SPEAKING_CONFIG.part1.duration;
        renderPart1();
        pushStageToExaminer("part1");
      } else if (stageName === "part2prep") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.prepDuration;
        renderPart2Prep();
        pushStageToExaminer("part2prep");
      } else if (stageName === "part2speak") {
        stageSecondsLeft = SPEAKING_CONFIG.part2.speakDuration;
        renderPart2Speak();
        pushStageToExaminer("part2speak");
      } else if (stageName === "part3") {
        stageSecondsLeft = SPEAKING_CONFIG.part3.duration;
        renderPart3();
        pushStageToExaminer("part3");
      } else {
        renderFinished();
        return;
      }

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
        realtimeConnected = true;
        setRealtimeStatus("Connected");

        sendRealtimeEvent({
          type: "session.update",
          session: {
            type: "realtime",
            model: SPEAKING_CONFIG.realtimeModel,
            output_modalities: ["audio", "text"],
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
              "Follow official IELTS Speaking structure.",
              "Speak naturally, clearly, and briefly.",
              "Ask one question at a time.",
              "Do not give scores during the exam.",
              "Do not become chatty.",
              "Wait for the app's stage instructions and follow them closely."
            ].join(" ")
          }
        });
      });

      dataChannel.addEventListener("message", (event) => {
        try {
          const serverEvent = JSON.parse(event.data);
          if (serverEvent.type === "response.done") {
            const output = serverEvent?.response?.output || [];
            const textParts = [];
            output.forEach((item) => {
              const content = item?.content || [];
              content.forEach((part) => {
                if (part?.transcript) textParts.push(part.transcript);
                if (part?.text) textParts.push(part.text);
              });
            });
            if (textParts.length) setExaminerTranscript(textParts.join(" ").trim());
          }

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

      const response = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Realtime session failed (${response.status})`);
      }

      const answerSdp = await response.text();
      await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
    }

    function disconnectRealtime() {
      realtimeConnected = false;

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
        lastUploadResult = json;

        if (!json.ok) {
          throw new Error(json.error || "Upload failed");
        }

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
        setExaminerTranscript("");
        setStatus("Requesting microphone...");

        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(micStream);

        mediaRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size > 0) recordedChunks.push(event.data);
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

          pushStageToExaminer("finished");
          disconnectRealtime();

          if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
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
          micStream.getTracks().forEach(track => track.stop());
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

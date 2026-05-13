/* assets/js/assignments.js
 * Assignments / homework feature.
 * Teacher: create, publish, manage assignments and assigned students.
 * Student: view assigned tests on home page, bypass password for assigned tests.
 */
(function () {
  "use strict";

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function auth() { return window.IELTS?.Auth || null; }
  function registry() { return window.IELTS?.Registry || null; }

  function $(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return iso.slice(0, 10);
    }
  }

  function isDueSoon(iso) {
    if (!iso) return false;
    try {
      const diff = new Date(iso) - Date.now();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }

  function isPast(iso) {
    if (!iso) return false;
    try { return new Date(iso) < Date.now(); } catch (e) { return false; }
  }

  function formatAssignmentTarget(testId) {
    const value = String(testId || "").trim();
    if (!value) return "Assigned activity";
    if (!value.startsWith("practice|")) return value.replace("ielts", "IELTS Test ");
    const parts = value.split("|");
    const type = parts[1] || "";
    if (type === "reading-task") return `Reading practice · ${parts[2] || "task type"}`;
    const sourceTest = (parts[2] || "ielts").replace("ielts", "IELTS Test ");
    const scope = parts[3] || "full";
    if (scope === "full") return `${sourceTest} · ${type} practice`;
    if (scope.startsWith("section")) return `${sourceTest} · ${type} ${scope.replace("section", "Section ")}`;
    if (scope === "task1") return `${sourceTest} · writing Task 1`;
    if (scope === "task2") return `${sourceTest} · writing Task 2`;
    return `${sourceTest} · ${type} ${scope}`;
  }

  async function getToken() {
    return auth()?.getAccessToken?.() || null;
  }

  async function apiGet(action, params = {}) {
    const token = await getToken();
    if (!token) throw new Error("Not signed in.");
    const url = new URL("/api/admin", window.location.origin);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => null);
    if (!data?.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  async function apiPost(action, body = {}) {
    const token = await getToken();
    if (!token) throw new Error("Not signed in.");
    const url = new URL("/api/admin", window.location.origin);
    url.searchParams.set("action", action);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  // ─── State ────────────────────────────────────────────────────────────────

  const state = {
    // Teacher
    assignments: [],
    classrooms: [],
    classroomStudents: [],
    loadingAssignments: false,
    editingAssignment: null, // assignment object being edited, or null for new
    editingStudents: null,   // { assignmentId, assigned: Set<studentProfileId>, all: [] }
    // Student
    studentAssignments: [],
    studentAssignmentsLoaded: false,
    catalogOptions: [],
    filteredCatalogOptions: [],
    studentsSearchQuery: "",
    // Access cache (testId → { access, assignmentId, dueDate })
    accessCache: new Map(),
  };

  // ─── TEST ID OPTIONS ──────────────────────────────────────────────────────

  function getTestIdOptions() {
    const testsById = registry()?.TESTS?.byId || {};
    const ids = Object.keys(testsById).sort((a, b) => {
      const na = parseInt(String(a).replace(/\D/g, ""), 10) || 0;
      const nb = parseInt(String(b).replace(/\D/g, ""), 10) || 0;
      return nb - na;
    });
    const options = [];
    ids.forEach((id) => {
      const label = id.replace("ielts", "IELTS Test ");
      options.push({ id, label: `Full Test ${label.replace("IELTS Test ", "")}`, kind: "test", testId: id });
      options.push({ id: `practice|reading|${id}|full`, label: `${label} · Reading (full)`, kind: "practice" });
      options.push({ id: `practice|reading|${id}|section1`, label: `${label} · Reading Section 1`, kind: "practice" });
      options.push({ id: `practice|reading|${id}|section2`, label: `${label} · Reading Section 2`, kind: "practice" });
      options.push({ id: `practice|reading|${id}|section3`, label: `${label} · Reading Section 3`, kind: "practice" });
      options.push({ id: `practice|listening|${id}|full`, label: `${label} · Listening (full)`, kind: "practice" });
      options.push({ id: `practice|writing|${id}|full`, label: `${label} · Writing (full)`, kind: "practice" });
      options.push({ id: `practice|writing|${id}|task1`, label: `${label} · Writing Task 1`, kind: "practice" });
      options.push({ id: `practice|writing|${id}|task2`, label: `${label} · Writing Task 2`, kind: "practice" });
    });
    const readingCatalog = registry()?.buildHomeCatalog?.()?.practice?.reading || [];
    const fallbackReadingTaskTypes = [
      { type: "headings", label: "Matching Headings" },
      { type: "tfng", label: "True / False / Not Given" },
      { type: "mcq", label: "Multiple Choice" },
      { type: "sentenceGaps", label: "Sentence / Summary Completion" },
      { type: "summarySelect", label: "Summary Completion" },
      { type: "endingsMatch", label: "Matching Information / Endings" },
      { type: "shortAnswer", label: "Short Answer Questions" },
      { type: "diagram", label: "Diagram / Flowchart / Table Completion" },
    ];
    const taskTypeMap = new Map();
    (readingCatalog || []).forEach((entry) => {
      const taskType = String(entry?.type || "").trim();
      const taskLabel = String(entry?.label || taskType || "").trim();
      if (!taskType) return;
      taskTypeMap.set(taskType, { type: taskType, label: taskLabel });
    });
    fallbackReadingTaskTypes.forEach((entry) => {
      if (!taskTypeMap.has(entry.type)) taskTypeMap.set(entry.type, entry);
    });
    const taskTypes = Array.from(taskTypeMap.values());
    ids.forEach((id) => {
      const testLabel = id.replace("ielts", "Test ");
      taskTypes.forEach((task) => {
        options.push({
          id: `practice|reading-task|${task.type}|${id}`,
          label: `${testLabel} — Reading task — ${task.label}`,
          kind: "reading_task",
          taskId: `${task.type}:${id}`,
          taskType: task.type,
          testId: id,
        });
      });
    });
    return options;
  }

  // ─── TEACHER UI ───────────────────────────────────────────────────────────

  async function loadAndRenderAssignments() {
    const container = $("adminAssignmentsPage");
    if (!container) return;
    const statusEl = $("adminAssignmentsStatus");
    const listEl = $("adminAssignmentsList");
    if (statusEl) statusEl.textContent = "Loading…";
    if (listEl) listEl.innerHTML = "";
    state.loadingAssignments = true;
    try {
      const classroomFilter = $("adminAssignmentsClassroomFilter")?.value || "";
      const data = await apiGet("listAssignments", classroomFilter ? { classroomId: classroomFilter } : {});
      state.assignments = data.assignments || [];
      if (statusEl) statusEl.textContent = `${state.assignments.length} assignment${state.assignments.length !== 1 ? "s" : ""}`;
      renderAssignmentList();
    } catch (e) {
      if (statusEl) statusEl.textContent = e.message || "Could not load assignments.";
    } finally {
      state.loadingAssignments = false;
    }
  }

  function renderAssignmentList() {
    const listEl = $("adminAssignmentsList");
    if (!listEl) return;
    if (!state.assignments.length) {
      listEl.innerHTML = '<p class="small" style="color:var(--text-muted,#888)">No assignments yet. Click <strong>New assignment</strong> to create one.</p>';
      return;
    }
    listEl.innerHTML = state.assignments.map((a) => {
      const badge = `<span class="assignment-badge ${esc(a.status)}">${esc(a.status)}</span>`;
      const due = a.due_date ? `<span>Due: ${esc(fmtDate(a.due_date))}</span>` : "";
      const testLabel = formatAssignmentTarget(a.test_id);
      return `
        <article class="assignment-card ui-assignment-card" data-id="${esc(a.id)}">
          <header class="assignment-card-header ui-card-header">
            <div class="assignment-card-title ui-card-title">${esc(a.title)}</div>
            ${badge}
          </header>
          <div class="assignment-card-meta ui-card-meta">
            <span>${esc(testLabel)}</span>
            ${due}
            ${a.note ? `<span>${esc(a.note)}</span>` : ""}
          </div>
          <div class="assignment-card-actions ui-card-actions">
            <button class="btn secondary" type="button" data-action="edit" data-id="${esc(a.id)}">Edit</button>
            ${a.status === "draft" ? `<button class="btn" type="button" data-action="publish" data-id="${esc(a.id)}">Publish</button>` : ""}
            ${a.status === "published" ? `<button class="btn secondary" type="button" data-action="archive" data-id="${esc(a.id)}">Archive</button>` : ""}
            <button class="btn secondary" type="button" data-action="students" data-id="${esc(a.id)}">Students</button>
          </div>
        </article>`;
    }).join("");
  }

  function showAssignmentEmailSummary(title, data) {
    const summary = data?.emailSummary || null;
    if (!summary) return;
    const sent = Number(data?.emailsSent ?? summary.sent ?? 0);
    const failed = Number(data?.failed ?? summary.failed ?? 0);
    const missing = Number(data?.missingEmails ?? summary.skippedNoEmail ?? 0);
    const duplicate = Number(data?.duplicateSkipped ?? summary.skippedDuplicate ?? 0);
    const failures = Array.isArray(data?.failures) ? data.failures : (Array.isArray(summary.failures) ? summary.failures : []);
    const failureLines = failures
      .slice(0, 6)
      .map((f) => `• ${f.fullName || f.studentIdCode || f.recipient || "Student"}: ${f.error || "send failed"}`)
      .join("\n");
    const details = failureLines ? `\n\nFailures:\n${failureLines}` : "";
    window.IELTS?.Modal?.showModal?.(
      title,
      `Emails sent: ${sent}\nFailed: ${failed}\nMissing emails: ${missing}\nDuplicate-skipped: ${duplicate}${details}`,
      { mode: "confirm" }
    );
  }

  function deriveAssignmentTypeFromTarget(target) {
    const value = String(target || "").trim();
    if (!value) return "test";
    if (value.startsWith("practice|reading-task|")) return "reading_task";
    if (value.startsWith("practice|")) return "practice";
    return "test";
  }

  function getCurrentCatalogTypeFilter() {
    return String($("adminAssignmentTypeSelect")?.value || "test").trim();
  }

  function filterCatalogOptions() {
    const query = String($("adminAssignmentTargetSearchInput")?.value || "").trim().toLowerCase();
    const typeFilter = getCurrentCatalogTypeFilter();
    state.filteredCatalogOptions = state.catalogOptions.filter((opt) => {
      if (typeFilter && opt.kind !== typeFilter) return false;
      if (!query) return true;
      return (`${opt.label} ${opt.id}`.toLowerCase().includes(query));
    });
  }

  function renderTargetResults() {
    const resultsEl = $("adminAssignmentTargetResults");
    const selectedValue = String($("adminAssignmentTargetValue")?.value || "").trim();
    if (!resultsEl) return;
    if (!state.filteredCatalogOptions.length) {
      resultsEl.innerHTML = '<div class="assignment-target-item"><div class="assignment-target-item-meta">No matching activities.</div></div>';
      return;
    }
    resultsEl.innerHTML = state.filteredCatalogOptions.map((opt) => {
      const active = selectedValue === opt.id ? " active" : "";
      return `<button type="button" class="assignment-target-item${active}" data-target-id="${esc(opt.id)}">
        <div class="assignment-target-item-title">${esc(opt.label)}</div>
        <div class="assignment-target-item-meta">${esc(opt.id)}</div>
      </button>`;
    }).join("");
  }

  function setSelectedTarget(value) {
    const targetInput = $("adminAssignmentTargetValue");
    const selectedEl = $("adminAssignmentTargetSelected");
    const match = state.catalogOptions.find((opt) => opt.id === value) || null;
    if (targetInput) targetInput.value = match?.id || "";
    if (selectedEl) selectedEl.textContent = match ? `Selected: ${match.label}` : "No activity selected.";
    renderTargetResults();
  }

  function openEditPanel(assignment = null) {
    state.editingAssignment = assignment;
    const panel = $("adminAssignmentEditPanel");
    if (!panel) return;
    const titleHeading = $("adminAssignmentEditTitle");
    const titleInput = $("adminAssignmentTitleInput");
    const typeSelect = $("adminAssignmentTypeSelect");
    const targetSearchInput = $("adminAssignmentTargetSearchInput");
    const targetValueInput = $("adminAssignmentTargetValue");
    const classroomSelect = $("adminAssignmentClassroomSelect");
    const dueDateInput = $("adminAssignmentDueDateInput");
    const noteInput = $("adminAssignmentNoteInput");
    const deleteBtn = $("adminAssignmentDeleteBtn");

    if (titleHeading) titleHeading.textContent = assignment ? "Edit assignment" : "New assignment";
    if (titleInput) titleInput.value = assignment?.title || "";
    if (dueDateInput) dueDateInput.value = assignment?.due_date ? assignment.due_date.slice(0, 16) : "";
    if (noteInput) noteInput.value = assignment?.note || "";
    if (deleteBtn) deleteBtn.classList.toggle("hidden", !assignment?.id);

    state.catalogOptions = getTestIdOptions();
    if (typeSelect) typeSelect.value = deriveAssignmentTypeFromTarget(assignment?.test_id || "");
    if (targetSearchInput) targetSearchInput.value = "";
    if (targetValueInput) targetValueInput.value = assignment?.test_id || "";
    filterCatalogOptions();
    renderTargetResults();
    setSelectedTarget(assignment?.test_id || "");

    // Populate classroom options
    if (classroomSelect) {
      const classrooms = state.classrooms || [];
      classroomSelect.innerHTML = `<option value="">— No classroom —</option>` +
        classrooms.map((c) =>
          `<option value="${esc(c.id)}" ${assignment?.classroom_id === c.id ? "selected" : ""}>${esc(c.name)}</option>`
        ).join("");
    }

    panel.classList.remove("hidden");
    titleInput?.focus();
  }

  function closeEditPanel() {
    state.editingAssignment = null;
    $("adminAssignmentEditPanel")?.classList.add("hidden");
  }

  async function saveAssignment() {
    const titleInput = $("adminAssignmentTitleInput");
    const targetValueInput = $("adminAssignmentTargetValue");
    const typeSelect = $("adminAssignmentTypeSelect");
    const classroomSelect = $("adminAssignmentClassroomSelect");
    const dueDateInput = $("adminAssignmentDueDateInput");
    const noteInput = $("adminAssignmentNoteInput");
    const saveBtn = $("adminAssignmentSaveBtn");
    const errEl = $("adminAssignmentEditError");

    const title = (titleInput?.value || "").trim();
    const testId = targetValueInput?.value || "";
    const assignmentType = String(typeSelect?.value || deriveAssignmentTypeFromTarget(testId));
    if (!title) { if (errEl) { errEl.textContent = "Title is required."; errEl.classList.remove("hidden"); } return; }
    if (!testId) { if (errEl) { errEl.textContent = "Please select an activity."; errEl.classList.remove("hidden"); } return; }
    if (errEl) errEl.classList.add("hidden");
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }

    const body = {
      title,
      testId,
      assignmentType,
      taskId: assignmentType === "reading_task" ? (testId.split("|")[2] || "") : null,
      classroomId: classroomSelect?.value || null,
      dueDate: dueDateInput?.value || null,
      note: noteInput?.value || null,
    };

    try {
      let response;
      if (state.editingAssignment?.id) {
        body.id = state.editingAssignment.id;
        response = await apiPost("updateAssignment", body);
      } else {
        response = await apiPost("createAssignment", body);
      }
      showAssignmentEmailSummary("Assignment saved", response);
      closeEditPanel();
      await loadAndRenderAssignments();
    } catch (e) {
      if (errEl) { errEl.textContent = e.message || "Could not save."; errEl.classList.remove("hidden"); }
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save"; }
    }
  }

  async function deleteAssignment(id) {
    const assignmentId = String(id || state.editingAssignment?.id || "").trim();
    if (!assignmentId) return;
    const ok = window.confirm("Delete this assignment? This cannot be undone.");
    if (!ok) return;
    try {
      await apiPost("deleteAssignment", { id: assignmentId });
      closeEditPanel();
      if (state.editingStudents?.assignmentId === assignmentId) closeStudentsPanel();
      await loadAndRenderAssignments();
    } catch (e) {
      window.IELTS?.Modal?.showModal?.("Error", e.message || "Could not delete assignment.", { mode: "confirm" });
    }
  }

  async function publishAssignment(id) {
    try {
      const data = await apiPost("updateAssignment", { id, status: "published" });
      const summary = data?.emailSummary || null;
      if (summary) {
        const sent = Number(summary.sent || 0);
        const failed = Number(summary.failed || 0);
        const attempted = Number(summary.attempted || 0);
        const skippedNoEmail = Number(summary.skippedNoEmail || 0);
        const skippedDuplicate = Number(summary.skippedDuplicate || 0);
        if (attempted > 0 && sent === 0) {
          const failures = Array.isArray(summary.failures) ? summary.failures : [];
          const failureLines = failures.slice(0, 5).map((f) => `• ${f.fullName || f.studentIdCode || f.recipient || "Student"}: ${f.error || "send failed"}`).join("\n");
          const configLines = Array.isArray(summary.errors) ? summary.errors.filter((line) => /sender is not configured/i.test(String(line || ""))) : [];
          const providerRejected = Array.isArray(summary.errors) && summary.errors.some((line) => /not allowed|sandbox|domain.*verif/i.test(String(line || "")));
          const providerHint = providerRejected
            ? "\n\nEmail provider rejected recipient(s). Check sandbox/test mode or sending domain verification."
            : "";
          const configText = configLines.length ? `\n\n${configLines[0]}` : "";
          const details = failureLines ? `\n\nFailures:\n${failureLines}` : "";
          window.IELTS?.Modal?.showModal?.(
            "Assignment published",
            `Emails sent: ${sent}\nFailed: ${failed}\nMissing emails: ${skippedNoEmail}\nDuplicate-skipped: ${skippedDuplicate}${details}${configText}${providerHint}`,
            { mode: "confirm" }
          );
        } else {
          window.IELTS?.Modal?.showModal?.(
            "Assignment published",
            `Emails sent: ${sent}\nFailed: ${failed}\nMissing emails: ${skippedNoEmail}\nDuplicate-skipped: ${skippedDuplicate}`,
            { mode: "confirm" }
          );
        }
      }
      await loadAndRenderAssignments();
    } catch (e) {
      window.IELTS?.Modal?.showModal?.("Error", e.message || "Could not publish assignment.", { mode: "confirm" });
    }
  }

  async function archiveAssignment(id) {
    try {
      await apiPost("updateAssignment", { id, status: "archived" });
      await loadAndRenderAssignments();
    } catch (e) {
      window.IELTS?.Modal?.showModal?.("Error", e.message || "Could not archive assignment.", { mode: "confirm" });
    }
  }

  async function editAssignment(id) {
    const a = state.assignments.find((x) => x.id === id);
    if (a) openEditPanel(a);
  }

  // ─── MANAGE STUDENTS ──────────────────────────────────────────────────────

  async function manageStudents(assignmentId) {
    const studentsPanel = $("adminAssignmentStudentsPanel");
    const studentsTitle = $("adminAssignmentStudentsTitle");
    const studentsStatus = $("adminAssignmentStudentsStatus");
    const studentsBody = $("adminAssignmentStudentsBody");
    if (!studentsPanel) return;

    studentsPanel.classList.remove("hidden");
    if (studentsTitle) studentsTitle.textContent = "Manage students";
    if (studentsStatus) studentsStatus.textContent = "Loading…";
    if (studentsBody) studentsBody.innerHTML = "";

    try {
      // Load classroom students (for the assignment's classroom or all)
      const assignment = state.assignments.find((a) => a.id === assignmentId);
      const classroomId = assignment?.classroom_id;

      const [studentsData, assignedData] = await Promise.all([
        apiGet("classroomStudents", classroomId ? { classroomId } : {}).catch(() => ({ students: [] })),
        apiGet("assignmentStudents", { assignmentId }).catch(() => ({ students: [] })),
      ]);

      const allStudents = studentsData.students || [];
      const assignedSet = new Set(
        (assignedData.students || []).map((s) => s.student?.id || s.student_profile_id).filter(Boolean)
      );

      state.editingStudents = {
        assignmentId,
        assigned: new Set(assignedSet),
        original: new Set(assignedSet),
        all: allStudents,
      };
      state.studentsSearchQuery = "";
      const studentsSearchInput = $("adminAssignmentStudentsSearchInput");
      if (studentsSearchInput) studentsSearchInput.value = "";

      if (studentsStatus) studentsStatus.textContent = `${allStudents.length} student${allStudents.length !== 1 ? "s" : ""}`;

      renderStudentChecklist(studentsBody);
    } catch (e) {
      if (studentsStatus) studentsStatus.textContent = e.message || "Could not load students.";
    }
  }

  function renderStudentChecklist(container) {
    if (!container || !state.editingStudents) return;
    const { all, assigned } = state.editingStudents;
    const query = String(state.studentsSearchQuery || "").trim().toLowerCase();
    const filtered = query
      ? all.filter((s) => {
          const fullName = [s.name, s.surname].filter(Boolean).join(" ").toLowerCase();
          const code = String(s.studentIdCode || s.student_id_code || "").toLowerCase();
          return fullName.includes(query) || code.includes(query);
        })
      : all;
    if (!all.length) {
      container.innerHTML = '<p class="small" style="color:var(--text-muted,#888)">No students found. Make sure students are linked to a classroom.</p>';
      return;
    }
    if (!filtered.length) {
      container.innerHTML = '<p class="small" style="color:var(--text-muted,#888)">No students match your search.</p>';
      return;
    }
    container.innerHTML = filtered.map((s) => {
      const pid = s.id || s.studentProfileId || "";
      const checked = assigned.has(pid) ? "checked" : "";
      const name = [s.name, s.surname].filter(Boolean).join(" ") || s.studentIdCode || "Unknown";
      const code = s.studentIdCode || s.student_id_code || "";
      return `
        <label class="assignment-student-check">
          <input type="checkbox" ${checked} data-profile-id="${esc(pid)}">
          <span class="assignment-student-check-name">${esc(name)}</span>
          ${code ? `<span class="assignment-student-check-code">${esc(code)}</span>` : ""}
        </label>`;
    }).join("");
  }

  function _toggleStudent(checkbox) {
    if (!state.editingStudents) return;
    const pid = checkbox.dataset.profileId;
    if (!pid) return;
    if (checkbox.checked) {
      state.editingStudents.assigned.add(pid);
    } else {
      state.editingStudents.assigned.delete(pid);
    }
  }

  async function saveStudentAssignments() {
    if (!state.editingStudents) return;
    const saveBtn = $("adminAssignmentStudentsSaveBtn");
    const errEl = $("adminAssignmentStudentsError");
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }
    if (errEl) errEl.classList.add("hidden");

    const { assignmentId, assigned, original } = state.editingStudents;
    const toAdd = [...assigned].filter((id) => !original.has(id));
    const toRemove = [...original].filter((id) => !assigned.has(id));

    try {
      const data = await apiPost("assignmentStudentsBulk", { assignmentId, add: toAdd, remove: toRemove });
      const summary = data?.emailSummary || null;
      if (summary) {
        const sent = Number(summary.sent || 0);
        const failed = Number(summary.failed || 0);
        const attempted = Number(summary.attempted || 0);
        const skippedNoEmail = Number(summary.skippedNoEmail || 0);
        const skippedDuplicate = Number(summary.skippedDuplicate || 0);
        if (attempted > 0 || skippedNoEmail > 0 || skippedDuplicate > 0) {
          let message = `Emails sent: ${sent}\nFailed: ${failed}\nMissing emails: ${skippedNoEmail}\nDuplicate-skipped: ${skippedDuplicate}`;
          if (failed > 0) {
            const failures = Array.isArray(summary.failures) ? summary.failures : [];
            const failureLines = failures.slice(0, 5).map((f) => `• ${f.fullName || f.studentIdCode || f.recipient || "Student"}: ${f.error || "send failed"}`).join("\n");
            if (failureLines) message += `\n\nFailures:\n${failureLines}`;
          }
          window.IELTS?.Modal?.showModal?.("Students updated", message, { mode: "confirm" });
        }
      }
      closeStudentsPanel();
    } catch (e) {
      if (errEl) { errEl.textContent = e.message || "Could not save."; errEl.classList.remove("hidden"); }
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save"; }
    }
  }

  function closeStudentsPanel() {
    state.editingStudents = null;
    $("adminAssignmentStudentsPanel")?.classList.add("hidden");
  }

  // ─── LOAD CLASSROOM DATA ──────────────────────────────────────────────────

  async function loadClassrooms() {
    try {
      const data = await apiGet("classroomProgress", {});
      state.classrooms = data.classrooms || [];
      state.classroomStudents = data.students || [];
      // Populate classroom filter
      const filterSelect = $("adminAssignmentsClassroomFilter");
      if (filterSelect) {
        const current = filterSelect.value;
        filterSelect.innerHTML = `<option value="">All classrooms</option>` +
          state.classrooms.map((c) =>
            `<option value="${esc(c.id)}" ${current === c.id ? "selected" : ""}>${esc(c.name)}</option>`
          ).join("");
      }
    } catch (e) {
      // Non-fatal — classrooms just won't be populated
    }
  }

  // ─── TEACHER PAGE: OPEN / CLOSE ───────────────────────────────────────────

  async function openAssignmentsPage() {
    const page = $("adminAssignmentsPage");
    if (!page) return;
    // Hide other admin pages
    $("adminResultsBanner")?.classList.add("hidden");
    $("adminResultsContent")?.classList.add("hidden");
    $("adminClassroomsPage")?.classList.add("hidden");
    page.classList.remove("hidden");

    // Update nav button states
    const resultsBtn = $("adminPageResultsBtn");
    const classroomsBtn = $("adminPageClassroomsBtn");
    const assignmentsBtn = $("adminPageAssignmentsBtn");
    if (resultsBtn) { resultsBtn.className = "btn secondary"; resultsBtn.setAttribute("aria-pressed", "false"); }
    if (classroomsBtn) { classroomsBtn.className = "btn secondary"; classroomsBtn.setAttribute("aria-pressed", "false"); }
    if (assignmentsBtn) { assignmentsBtn.className = "btn"; assignmentsBtn.setAttribute("aria-pressed", "true"); }

    try { window.IELTS?.UI?.setExamNavStatus?.("Status: Assignments"); } catch (e) {}

    await loadClassrooms();
    await loadAndRenderAssignments();
  }

  // ─── STUDENT UI ───────────────────────────────────────────────────────────

  async function loadStudentAssignments() {
    if (state.studentAssignmentsLoaded) {
      renderStudentAssignments();
      return;
    }
    try {
      const data = await apiGet("studentAssignments");
      state.studentAssignments = data.assignments || [];
      state.studentAssignmentsLoaded = true;
      renderStudentAssignments();
    } catch (e) {
      // Non-fatal — student assignments section stays empty
    }
  }

  function renderStudentAssignments() {
    const section = $("studentAssignmentsSection");
    if (!section) return;
    const list = $("studentAssignmentsList");
    if (!list) return;
    const heroFallback = $("homeHeroFocusFallback");

    const active = state.studentAssignments.filter((a) => !a.completed && !a.attempted);
    const attempted = state.studentAssignments.filter((a) => !!a.attempted && !a.completed);
    const done = state.studentAssignments.filter((a) => a.completed);
    const all = [...active, ...attempted, ...done];

    if (!all.length) {
      section.classList.add("hidden");
      if (heroFallback) heroFallback.classList.remove("hidden");
      return;
    }

    section.classList.remove("hidden");
    if (heroFallback) heroFallback.classList.add("hidden");
    list.innerHTML = all.map((a) => {
      const testLabel = formatAssignmentTarget(a.testId);
      let dueHtml = "";
      if (a.dueDate) {
        const cls = isPast(a.dueDate) ? "style=\"color:var(--danger,#c00)\"" : (isDueSoon(a.dueDate) ? "style=\"color:#b45309\"" : "");
        dueHtml = `<span ${cls}>Due: ${esc(fmtDate(a.dueDate))}</span>`;
      }
      const completedHtml = a.completed ? `<span style="color:var(--success,#1a6e34);font-weight:600">✓ Completed</span>` : "";
      const attemptedHtml = a.attempted && !a.completed ? `<span style="color:var(--danger,#b42318);font-weight:600">Already attempted</span>` : "";
      const note = a.note ? `<span>${esc(a.note)}</span>` : "";
      return `
        <article class="student-assignment-card ui-assignment-card ui-student-assignment-card${a.completed ? " completed" : ""}${a.attempted && !a.completed ? " attempted" : ""}">
          <div class="student-assignment-info ui-card-stack">
            <div class="student-assignment-title ui-card-title">${esc(a.title)}</div>
            <div class="student-assignment-meta ui-card-meta">${esc(testLabel)} ${dueHtml} ${attemptedHtml} ${completedHtml} ${note}</div>
          </div>
          ${(!a.completed && !a.attempted) ? `<button class="btn student-assignment-btn" type="button" data-assignment-start="1" data-test-id="${esc(a.testId)}" data-assignment-id="${esc(a.id)}">Start</button>` : ""}
        </article>`;
    }).join("");
  }

  async function markAssignmentStarted(assignmentId) {
    if (!assignmentId) return;
    await apiPost("markAssignmentStarted", { assignmentId });
  }

  function getActiveViewName() {
    try {
      return String(document.body?.dataset?.activeView || "").trim();
    } catch (e) {
      return "";
    }
  }

  async function waitForActiveView(expectedViews, timeoutMs = 2500) {
    const accepted = new Set((expectedViews || []).map((v) => String(v || "").trim()).filter(Boolean));
    if (!accepted.size) return true;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (accepted.has(getActiveViewName())) return true;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    return accepted.has(getActiveViewName());
  }

  function expectedViewsForAssignmentTarget(testId) {
    const value = String(testId || "").trim();
    if (!value) return [];
    if (!value.startsWith("practice|")) return ["listening"];
    const parts = value.split("|");
    const type = parts[1] || "";
    if (type === "reading" || type === "reading-task") return ["reading"];
    if (type === "listening") return ["listening"];
    if (type === "writing") return ["writing"];
    return [];
  }

  function markLocalAttempted(testId, assignmentId) {
    const now = new Date().toISOString();
    state.accessCache.set(testId, {
      ...(state.accessCache.get(testId) || {}),
      access: false,
      attempted: true,
      assignmentId,
      attemptedAt: now,
    });
    const currentRow = state.studentAssignments.find((row) => row.id === assignmentId);
    if (currentRow && !currentRow.completed) {
      currentRow.attempted = true;
      currentRow.attemptedAt = now;
    }
    renderStudentAssignments();
  }

  async function launchAssignedTest(testId, assignmentId) {
    if (!testId) return;
    const assignment = state.studentAssignments.find((row) => row.id === assignmentId) || null;
    const parsed = parseAssignmentTargetDebug(testId);
    assignmentDebugLog("start click", {
      assignmentId,
      assignment,
      testId,
      ...parsed,
      activeView: getActiveViewName(),
      activeTestId: registry()?.getActiveTestId?.() || "",
      pathname: window.location.pathname,
      hash: window.location.hash,
    });
    const access = await checkAssignmentAccess(testId);
    assignmentDebugLog("access response", {
      assignmentId,
      testId,
      response: access,
      activeView: getActiveViewName(),
      activeTestId: registry()?.getActiveTestId?.() || "",
      pathname: window.location.pathname,
      hash: window.location.hash,
    });
    if (!access?.access) {
      window.IELTS?.Modal?.showModal?.("Assignment locked", "This assignment is not available for your account.", { mode: "confirm" });
      return;
    }
    if (access?.completed) {
      window.IELTS?.Modal?.showModal?.("Assignment completed", "You have already completed this assignment.", { mode: "confirm" });
      return;
    }
    if (access?.attempted) {
      window.IELTS?.Modal?.showModal?.("Assignment closed", "This assignment has already been attempted and can no longer be started again.", { mode: "confirm" });
      return;
    }
    window.IELTS?.Modal?.showModal?.(
      "Start assignment?",
      "Once you start this assignment, you will not be able to leave and start it again.",
      {
        mode: "confirm",
        showCancel: true,
        submitText: "Start assignment",
        cancelText: "Cancel",
        onConfirm: async () => {
          const resolvedAssignmentId = access.assignmentId || assignmentId;
          const expectedViews = expectedViewsForAssignmentTarget(testId);
          let launchOk = false;
          assignmentDebugLog("normalized", {
            assignmentId: resolvedAssignmentId,
            testId,
            expectedViews,
            parsed,
          });

          // Practice launch paths
          if (String(testId).startsWith("practice|")) {
            try { window.__IELTS_ACTIVE_ASSIGNED_TARGET__ = String(testId || ""); } catch (e) {}
            state.accessCache.set(testId, {
              ...(state.accessCache.get(testId) || {}),
              assignmentId: resolvedAssignmentId,
            });
            persistAssignmentToSession(testId, resolvedAssignmentId);
            try {
              const parts = String(testId).split("|");
              const type = parts[1] || "";
              const sourceTestId = parts[2] || (registry()?.TESTS?.defaultTestId || "ielts1");
              const scope = parts[3] || "";
              assignmentDebugLog("launcher chosen", {
                launcherName: "directAssignedPractice",
                args: { type, sourceTestId, scope, raw: testId },
              });
              assignmentDebugLog("before launch", {
                activeView: getActiveViewName(),
                activeTestId: registry()?.getActiveTestId?.() || "",
                pathname: window.location.pathname,
                hash: window.location.hash,
              });
              const appApi = window.IELTS?.App || {};
              assignmentDebugLog("launcher availability", {
                hasLaunchListeningOnly: typeof appApi.launchListeningOnly === "function",
                hasLaunchReadingOnly: typeof appApi.launchReadingOnly === "function",
                hasLaunchWritingOnly: typeof appApi.launchWritingOnly === "function",
                hasLaunchReadingPractice: typeof appApi.launchReadingPractice === "function",
                hasStartAssignedPractice: typeof appApi.startAssignedPractice === "function",
              });
              if (type === "reading") {
                if (scope && scope.startsWith("section")) {
                  const partId = `part${String(scope).replace("section", "")}`;
                  if (typeof appApi.launchReadingOnly === "function") {
                    appApi.launchReadingOnly(sourceTestId, partId);
                    launchOk = true;
                  }
                } else {
                  if (typeof appApi.launchReadingOnly === "function") {
                    appApi.launchReadingOnly(sourceTestId);
                    launchOk = true;
                  }
                }
              } else if (type === "listening") {
                if (scope && scope.startsWith("section")) {
                  const pageIndex = Number(String(scope).replace("section", "")) - 1;
                  if (typeof appApi.launchListeningOnly === "function") {
                    appApi.launchListeningOnly(sourceTestId, Number.isFinite(pageIndex) ? pageIndex : undefined);
                    launchOk = true;
                  }
                } else {
                  if (typeof appApi.launchListeningOnly === "function") {
                    appApi.launchListeningOnly(sourceTestId);
                    launchOk = true;
                  }
                }
              } else if (type === "writing") {
                if (scope === "task1" || scope === "task2") {
                  if (typeof appApi.launchWritingOnly === "function") {
                    appApi.launchWritingOnly(sourceTestId, scope);
                    launchOk = true;
                  }
                } else {
                  if (typeof appApi.launchWritingOnly === "function") {
                    appApi.launchWritingOnly(sourceTestId);
                    launchOk = true;
                  }
                }
              } else if (type === "reading-task") {
                const taskType = parts[2] || "";
                if (taskType && typeof appApi.launchReadingPractice === "function") {
                  appApi.launchReadingPractice(taskType);
                  launchOk = true;
                }
              }
              if (!launchOk && typeof appApi.startAssignedPractice === "function") {
                assignmentDebugLog("launcher fallback", {
                  launcherName: "startAssignedPractice",
                  args: [testId, assignmentId],
                });
                launchOk = !!appApi.startAssignedPractice(testId, assignmentId);
              }
              assignmentDebugLog("after launch", {
                result: launchOk,
                activeView: getActiveViewName(),
                activeTestId: registry()?.getActiveTestId?.() || "",
                pathname: window.location.pathname,
                hash: window.location.hash,
              });
            } catch (e) {
              launchOk = false;
              assignmentDebugLog("launch exception", {
                launcherName: "directAssignedPractice",
                error: String(e?.message || e),
              });
            }
          } else {
            // Set active test ID and start fresh exam (bypass password)
            try { registry()?.setActiveTestId?.(testId); } catch (e) {}
            try { window.__IELTS_ACTIVE_ASSIGNED_TARGET__ = String(testId || ""); } catch (e) {}
            // Keep assignment id in cache AND sessionStorage for completion sync (survives page refresh)
            state.accessCache.set(testId, {
              ...(state.accessCache.get(testId) || {}),
              assignmentId: resolvedAssignmentId,
            });
            persistAssignmentToSession(testId, resolvedAssignmentId);
            // Navigate/start
            try {
              assignmentDebugLog("launcher chosen", {
                launcherName: "startFreshExamByAssignment",
                args: [testId, assignmentId],
              });
              assignmentDebugLog("before launch", {
                activeView: getActiveViewName(),
                activeTestId: registry()?.getActiveTestId?.() || "",
                pathname: window.location.pathname,
                hash: window.location.hash,
              });
              window.IELTS?.App?.startFreshExamByAssignment?.(testId, assignmentId);
              launchOk = true;
              assignmentDebugLog("after launch", {
                result: launchOk,
                activeView: getActiveViewName(),
                activeTestId: registry()?.getActiveTestId?.() || "",
                pathname: window.location.pathname,
                hash: window.location.hash,
              });
            } catch (e) {
              launchOk = false;
              assignmentDebugLog("launch exception", {
                launcherName: "startFreshExamByAssignment",
                error: String(e?.message || e),
              });
              try {
                assignmentDebugLog("launcher chosen", {
                  launcherName: "startFreshExam",
                  args: [],
                });
                window.IELTS?.App?.startFreshExam?.();
                launchOk = true;
                assignmentDebugLog("after launch", {
                  result: launchOk,
                  activeView: getActiveViewName(),
                  activeTestId: registry()?.getActiveTestId?.() || "",
                  pathname: window.location.pathname,
                  hash: window.location.hash,
                });
              } catch (_) {}
            }
          }

          if (!launchOk) {
            assignmentDebugLog("launch failed", {
              reason: "launcher returned false",
              parsed,
              expectedViews,
              activeView: getActiveViewName(),
              pathname: window.location.pathname,
              hash: window.location.hash,
            });
            window.IELTS?.Modal?.showModal?.("Could not start assignment", "The assignment could not be launched. Please try again.", { mode: "confirm" });
            return;
          }

          const viewOpened = await waitForActiveView(expectedViews, 6000);
          assignmentDebugLog("waitForActiveView", {
            expectedView: expectedViews,
            actualView: getActiveViewName(),
            success: viewOpened,
            timeoutMs: 6000,
            pathname: window.location.pathname,
            hash: window.location.hash,
          });
          if (!viewOpened) {
            assignmentDebugLog("launch failed", { reason: "expected view not reached" });
            window.IELTS?.Modal?.showModal?.("Could not start assignment", "The assignment could not be launched. Please try again.", { mode: "confirm" });
            return;
          }

          try {
            assignmentDebugLog("mark started", {
              assignmentId: resolvedAssignmentId,
              testId,
              called: true,
            });
            await markAssignmentStarted(resolvedAssignmentId);
            markLocalAttempted(testId, resolvedAssignmentId);
          } catch (e) {
            assignmentDebugLog("mark started failed", {
              assignmentId: resolvedAssignmentId,
              testId,
              error: String(e?.message || e),
            });
            window.IELTS?.Modal?.showModal?.("Assignment launch warning", "The test opened, but assignment lock could not be saved. Please refresh and check your assignment status.", { mode: "confirm" });
          }
        },
      }
    );
    return;
  }

  // ─── PASSWORD BYPASS ──────────────────────────────────────────────────────

  /**
   * Check if the current signed-in student has been assigned the given testId.
   * Returns { access: bool, assignmentId?, dueDate? }.
   * Results are cached in memory for the session.
   */
  const ASSIGNMENT_SESSION_KEY = "IELTS:assignment:pending";

  function persistAssignmentToSession(testId, assignmentId) {
    try {
      sessionStorage.setItem(ASSIGNMENT_SESSION_KEY, JSON.stringify({ testId, assignmentId }));
    } catch (e) {}
  }

  function readAssignmentFromSession(testId) {
    try {
      const raw = sessionStorage.getItem(ASSIGNMENT_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.testId === testId && parsed?.assignmentId) return parsed.assignmentId;
    } catch (e) {}
    return null;
  }

  function clearAssignmentFromSession() {
    try { sessionStorage.removeItem(ASSIGNMENT_SESSION_KEY); } catch (e) {}
  }

  function parseAssignmentTargetDebug(testId) {
    const raw = String(testId || "").trim();
    const out = {
      raw,
      kind: raw.startsWith("practice|") ? "practice" : "full_exam",
      type: "",
      section: "",
      skill: "",
      target: raw,
      targetView: "",
      targetMode: "",
      normalizedTestId: raw,
    };
    if (!raw) return out;
    if (!raw.startsWith("practice|")) {
      out.targetView = "listening";
      out.targetMode = "full";
      return out;
    }
    const parts = raw.split("|");
    out.type = parts[1] || "";
    out.skill = out.type === "reading-task" ? "reading" : out.type;
    out.section = parts[3] || "";
    out.normalizedTestId = parts[2] || raw;
    out.targetMode = out.type === "reading-task" ? "practice" : "section";
    if (out.type === "reading" || out.type === "reading-task") out.targetView = "reading";
    else if (out.type === "listening") out.targetView = "listening";
    else if (out.type === "writing") out.targetView = "writing";
    return out;
  }

  function assignmentDebugEnabled() {
    return false;
  }

  function assignmentDebugLog(label, payload = {}) {
    if (!assignmentDebugEnabled()) return;
  }

  async function checkAssignmentAccess(testId) {
    if (!testId) return { access: false };
    // Logged-out users can't have assignments
    if (!auth()?.isSignedIn?.()) return { access: false };

    const cached = state.accessCache.get(testId);
    if (cached !== undefined) return cached;

    try {
      const data = await apiGet("assignmentAccess", { testId });
      const result = {
        access: !!data.access,
        assignmentId: data.assignmentId || null,
        dueDate: data.dueDate || null,
        completed: data.completed || false,
        attempted: data.attempted || false,
        attemptedAt: data.attemptedAt || null,
      };
      if (result.completed || result.attempted) result.access = false;
      state.accessCache.set(testId, result);
      // Persist assignmentId to survive page refresh
      if (result.access && result.assignmentId) {
        persistAssignmentToSession(testId, result.assignmentId);
      }
      return result;
    } catch (e) {
      state.accessCache.set(testId, { access: false });
      return { access: false };
    }
  }

  /** Clear access cache (e.g. after signing in/out). */
  function clearAccessCache() {
    state.accessCache.clear();
    state.studentAssignmentsLoaded = false;
    state.studentAssignments = [];
  }

  // ─── MARK COMPLETE ────────────────────────────────────────────────────────

  async function markAssignmentCompleteForTest(testId) {
    if (!testId) return;
    const cached = state.accessCache.get(testId);
    // Fall back to sessionStorage if in-memory cache was cleared by page refresh
    const assignmentId = cached?.assignmentId || readAssignmentFromSession(testId);
    if (!assignmentId) return;
    try {
      await apiPost("markAssignmentComplete", { assignmentId });
      // Update cache
      state.accessCache.set(testId, { ...(cached || {}), assignmentId, completed: true });
      // Clear persisted session entry — no longer needed
      clearAssignmentFromSession();
      // Update student list
      const a = state.studentAssignments.find((x) => x.id === assignmentId);
      if (a) {
        a.completed = true;
        a.completedAt = new Date().toISOString();
      }
    } catch (e) {
      // Non-fatal
    }
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────

  function bindAssignmentsPageButtons() {
    const newBtn = $("adminAssignmentNewBtn");
    const saveBtn = $("adminAssignmentSaveBtn");
    const cancelBtn = $("adminAssignmentCancelBtn");
    const studentsSaveBtn = $("adminAssignmentStudentsSaveBtn");
    const studentsCancelBtn = $("adminAssignmentStudentsCancelBtn");
    const classroomFilter = $("adminAssignmentsClassroomFilter");
    const assignmentsPageBtn = $("adminPageAssignmentsBtn");
    const deleteBtn = $("adminAssignmentDeleteBtn");
    const list = $("adminAssignmentsList");
    const studentList = $("studentAssignmentsList");
    const studentsBody = $("adminAssignmentStudentsBody");
    const studentsSearchInput = $("adminAssignmentStudentsSearchInput");
    const targetSearchInput = $("adminAssignmentTargetSearchInput");
    const targetResults = $("adminAssignmentTargetResults");
    const typeSelect = $("adminAssignmentTypeSelect");

    if (newBtn && !newBtn.dataset.bound) {
      newBtn.dataset.bound = "1";
      newBtn.addEventListener("click", () => openEditPanel(null));
    }
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = "1";
      saveBtn.addEventListener("click", () => saveAssignment());
    }
    if (cancelBtn && !cancelBtn.dataset.bound) {
      cancelBtn.dataset.bound = "1";
      cancelBtn.addEventListener("click", () => closeEditPanel());
    }
    if (deleteBtn && !deleteBtn.dataset.bound) {
      deleteBtn.dataset.bound = "1";
      deleteBtn.addEventListener("click", () => deleteAssignment());
    }
    if (studentsSaveBtn && !studentsSaveBtn.dataset.bound) {
      studentsSaveBtn.dataset.bound = "1";
      studentsSaveBtn.addEventListener("click", () => saveStudentAssignments());
    }
    if (studentsCancelBtn && !studentsCancelBtn.dataset.bound) {
      studentsCancelBtn.dataset.bound = "1";
      studentsCancelBtn.addEventListener("click", () => closeStudentsPanel());
    }
    if (classroomFilter && !classroomFilter.dataset.bound) {
      classroomFilter.dataset.bound = "1";
      classroomFilter.addEventListener("change", () => loadAndRenderAssignments());
    }
    if (assignmentsPageBtn && !assignmentsPageBtn.dataset.bound) {
      assignmentsPageBtn.dataset.bound = "1";
      assignmentsPageBtn.addEventListener("click", () => openAssignmentsPage());
    }
    if (typeSelect && !typeSelect.dataset.bound) {
      typeSelect.dataset.bound = "1";
      typeSelect.addEventListener("change", () => {
        filterCatalogOptions();
        renderTargetResults();
      });
    }
    if (targetSearchInput && !targetSearchInput.dataset.bound) {
      targetSearchInput.dataset.bound = "1";
      targetSearchInput.addEventListener("input", () => {
        filterCatalogOptions();
        renderTargetResults();
      });
    }
    if (targetResults && !targetResults.dataset.bound) {
      targetResults.dataset.bound = "1";
      targetResults.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-target-id]") : null;
        if (!button) return;
        const targetId = button.getAttribute("data-target-id") || "";
        if (!targetId) return;
        setSelectedTarget(targetId);
      });
    }
    if (list && !list.dataset.bound) {
      list.dataset.bound = "1";
      list.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-action][data-id]") : null;
        if (!button) return;
        const action = button.getAttribute("data-action") || "";
        const id = button.getAttribute("data-id") || "";
        if (!id) return;
        if (action === "edit") return void editAssignment(id);
        if (action === "publish") return void publishAssignment(id);
        if (action === "archive") return void archiveAssignment(id);
        if (action === "students") return void manageStudents(id);
      });
    }
    if (studentList && !studentList.dataset.bound) {
      studentList.dataset.bound = "1";
      studentList.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-assignment-start='1']") : null;
        if (!button) return;
        const testId = button.getAttribute("data-test-id") || "";
        const assignmentId = button.getAttribute("data-assignment-id") || "";
        if (!testId || !assignmentId) return;
        launchAssignedTest(testId, assignmentId);
      });
    }
    if (studentsBody && !studentsBody.dataset.bound) {
      studentsBody.dataset.bound = "1";
      studentsBody.addEventListener("change", (event) => {
        const input = event.target instanceof Element ? event.target.closest("input[type='checkbox'][data-profile-id]") : null;
        if (!input) return;
        _toggleStudent(input);
      });
    }
    if (studentsSearchInput && !studentsSearchInput.dataset.bound) {
      studentsSearchInput.dataset.bound = "1";
      studentsSearchInput.addEventListener("input", () => {
        state.studentsSearchQuery = studentsSearchInput.value || "";
        renderStudentChecklist(studentsBody);
      });
    }
  }

  function init() {
    bindAssignmentsPageButtons();
    try {
      if (!window.IELTS?.Access?.isAdmin?.() && auth()?.isSignedIn?.()) {
        loadStudentAssignments();
      }
    } catch (e) {}
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  window.IELTS = window.IELTS || {};
  window.IELTS.Assignments = {
    init,
    openAssignmentsPage,
    loadStudentAssignments,
    checkAssignmentAccess,
    clearAccessCache,
    markAssignmentCompleteForTest,
    launchAssignedTest,
    deleteAssignment,
    editAssignment,
    publishAssignment,
    archiveAssignment,
    manageStudents,
    _toggleStudent,
  };
})();

"use strict";

const STORAGE_KEY = "workout-log-exercises-v1";

let exercises = loadFromStorage();

const form = document.getElementById("workout-form");
const inputName = document.getElementById("exercise-name");
const inputMuscle = document.getElementById("muscle-group");
const inputWeight = document.getElementById("weight");
const inputReps = document.getElementById("reps");
const inputSets = document.getElementById("sets");
const inputDate = document.getElementById("date");
const formError = document.getElementById("form-error");

const workoutList = document.getElementById("workout-list");
const emptyState = document.getElementById("empty-state");
const filterSelect = document.getElementById("filter-muscle");

const statTotal = document.getElementById("stat-total");
const statSessions = document.getElementById("stat-sessions");
const statVolume = document.getElementById("stat-volume");
const statTopMuscle = document.getElementById("stat-top-muscle");

inputDate.value = todayISO();

form.addEventListener("submit", handleFormSubmit);
filterSelect.addEventListener("change", render);

render();

function handleFormSubmit(e) {
  e.preventDefault();

  const name = inputName.value.trim();
  const muscleGroup = inputMuscle.value;
  const weight = parseFloat(inputWeight.value);
  const reps = parseInt(inputReps.value, 10);
  const sets = parseInt(inputSets.value, 10);
  const date = inputDate.value;

  const error = validate({ name, muscleGroup, weight, reps, sets, date });
  if (error) {
    showError(error);
    return;
  }

  hideError();

  const exercise = {
    id: crypto.randomUUID(),
    name,
    muscleGroup,
    weight,
    reps,
    sets,
    date,
  };

  exercises.unshift(exercise);
  saveToStorage();
  render();
  form.reset();
  inputDate.value = todayISO();
}

function handleDelete(id) {
  exercises = exercises.filter((ex) => ex.id !== id);
  saveToStorage();
  render();
}

function render() {
  renderList();
  renderStats();
}

function renderList() {
  const filter = filterSelect.value;
  const filtered =
    filter === "all"
      ? exercises
      : exercises.filter((ex) => ex.muscleGroup === filter);

  Array.from(workoutList.querySelectorAll(".exercise-card")).forEach((el) =>
    el.remove()
  );

  if (filtered.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  filtered.forEach((ex) => {
    const card = createExerciseCard(ex);
    workoutList.appendChild(card);
  });
}

function createExerciseCard(ex) {
  const volume = ex.weight * ex.reps * ex.sets;
  const formattedDate = formatDate(ex.date);

  const card = document.createElement("article");
  card.className = "exercise-card";
  card.dataset.id = ex.id;

  card.innerHTML = `
    <div class="exercise-card-info">
      <span class="exercise-card-title">${escapeHtml(ex.name)}</span>
      <span class="muscle-badge">${escapeHtml(ex.muscleGroup)}</span>
      <div class="exercise-card-meta">
        <span><strong>${ex.sets}</strong> sets</span>
        <span><strong>${ex.reps}</strong> reps</span>
        <span><strong>${ex.weight} kg</strong> / set</span>
        <span>Volume: <strong>${volume.toLocaleString()} kg</strong></span>
      </div>
      <span class="exercise-card-date">${formattedDate}</span>
    </div>
    <button class="btn btn-danger js-delete" aria-label="Delete ${escapeHtml(ex.name)}">
      Delete
    </button>
  `;

  card.querySelector(".js-delete").addEventListener("click", () =>
    handleDelete(ex.id)
  );

  return card;
}

function renderStats() {
  const total = exercises.length;

  const uniqueDays = new Set(exercises.map((ex) => ex.date)).size;

  const totalVolume = exercises.reduce(
    (sum, ex) => sum + ex.weight * ex.reps * ex.sets,
    0
  );

  const muscleCounts = exercises.reduce((acc, ex) => {
    acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1;
    return acc;
  }, {});

  const topMuscle =
    Object.keys(muscleCounts).length > 0
      ? Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  statTotal.textContent = total;
  statSessions.textContent = uniqueDays;
  statVolume.textContent = totalVolume.toLocaleString();
  statTopMuscle.textContent = topMuscle;
}

function validate({ name, muscleGroup, weight, reps, sets, date }) {
  if (!name) return "Exercise name is required.";
  if (!muscleGroup) return "Please select a muscle group.";
  if (isNaN(weight) || weight < 0) return "Weight must be 0 or greater.";
  if (isNaN(reps) || reps < 1) return "Reps must be at least 1.";
  if (isNaN(sets) || sets < 1) return "Sets must be at least 1.";
  if (!date) return "Please select a date.";
  return null;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function hideError() {
  formError.textContent = "";
  formError.hidden = true;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

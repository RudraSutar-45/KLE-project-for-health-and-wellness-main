
"use strict";

// WellNest: educational wellness tracker.
// Profile details and daily records stay in memory for this demo.
// They are not sent to a server or saved permanently.

const $ = (id) => document.getElementById(id);

const loginPage = $("loginPage");
const dashboardPage = $("dashboardPage");
const studentDashboard = $("studentDashboard");
const adultDashboard = $("adultDashboard");

let profile = null;
let studentRecords = [];
let latestMood = null;
let latestSleep = null;

// Today's date uses the visitor's local calendar date.
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function validNumber(value, min, max) {
  if (value === "" || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max
    ? n : null;
}

function formatHours(value) {
  return `${Number(value).toFixed(2).replace(/\.?0+$/, "")} hours`;
}

// Use textContent for user-provided text to prevent HTML injection.
function showMessage(id, message) {
  $(id).textContent = message;
}

function showDashboard() {
  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");

  const firstName = profile.name.trim().split(/\s+/)[0];
  $("greeting").textContent = `Welcome, ${firstName}!`;

  if (profile.age <= 20) {
    studentDashboard.classList.remove("hidden");
    adultDashboard.classList.add("hidden");
    $("dashboardSubtitle").textContent =
      `Student wellness • Age ${profile.age}`;
    buildStudyPlan();
    renderStudentHistory();
    renderMoodSleepAnalysis();
  } else {
    studentDashboard.classList.add("hidden");
    adultDashboard.classList.remove("hidden");
    $("dashboardSubtitle").textContent =
      "Fitness, hydration and everyday wellbeing";
    updateSteps();
    updateWater();
    updateSuggestions();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// LOGIN AND AGE-BASED ROUTING
$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const age = validNumber($("age").value, 1, 120);
  const name = $("name").value.trim();
  const mobile = $("mobile").value.trim();

  if (!name || !age || !$("gender").value || !mobile) {
    alert("Please enter all required details.");
    return;
  }

  profile = {
    name,
    age,
    gender: $("gender").value,
    mobile,
    health: $("health").value.trim()
  };

  // Do not print health details or the phone number on the dashboard.
  showDashboard();
});

$("logoutBtn").addEventListener("click", () => {
  profile = null;
  studentRecords = [];
  latestMood = null;
  latestSleep = null;

  $("loginForm").reset();
  loginPage.classList.remove("hidden");
  dashboardPage.classList.add("hidden");
  studentDashboard.classList.add("hidden");
  adultDashboard.classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
});

// STUDENT: MOOD TRACKING
const moodLabels = {
  great: "Great 😊",
  good: "Good 🙂",
  okay: "Okay 😐",
  low: "Low 😔",
  stressed: "Stressed 😣"
};

$("saveMoodBtn").addEventListener("click", () => {
  const mood = $("mood").value;

  if (!mood) {
    showMessage("moodMessage", "Please choose a mood first.");
    return;
  }

  latestMood = {
    date: todayKey(),
    mood,
    note: $("moodNote").value.trim()
  };

  upsertStudentRecord();
  showMessage(
    "moodMessage",
    `Mood saved for today: ${moodLabels[mood]}.`
  );

  renderStudentHistory();
  renderMoodSleepAnalysis();
});

function upsertStudentRecord() {
  const key = todayKey();
  let record = studentRecords.find(item => item.date === key);

  if (!record) {
    record = { date: key, mood: null, sleep: null };
    studentRecords.push(record);
  }

  if (latestMood && latestMood.date === key) {
    record.mood = latestMood.mood;
  }

  if (latestSleep && latestSleep.date === key) {
    record.sleep = latestSleep;
  }

  studentRecords.sort((a, b) => b.date.localeCompare(a.date));
}

// STUDENT: SLEEP TRACKING
$("saveSleepBtn").addEventListener("click", () => {
  const hours = validNumber($("sleepHours").value, 0, 24);

  if (hours === null) {
    showMessage("sleepResult", "Enter sleep between 0 and 24 hours.");
    return;
  }

  latestSleep = hours;
  upsertStudentRecord();

  const age = profile.age;
  let advice;

  if (age <= 5) {
    advice = "Young children generally need 10–13 hours of sleep.";
  } else if (age <= 12) {
    advice = "School-age children generally need 9–12 hours.";
  } else if (age <= 17) {
    advice = "Teenagers generally need 8–10 hours.";
  } else {
    advice = "Adults generally need at least 7 hours; needs vary.";
  }

  let message = `Recorded: ${formatHours(hours)}. ${advice}`;

  if (age >= 13 && age <= 17 && hours < 8) {
    message += " Consider an earlier bedtime if possible.";
  } else if (age >= 13 && age <= 17 && hours > 10) {
    message += " Extra sleep can be normal sometimes.";
  } else if (age >= 18 && hours < 7) {
    message += " Try a consistent sleep schedule.";
  }

  $("sleepResult").textContent = message;
  renderStudentHistory();
  renderMoodSleepAnalysis();
});

// STUDENT: MOOD AND SLEEP ANALYSIS
function renderMoodSleepAnalysis() {
  const today = todayKey();
  const record = studentRecords.find(item => item.date === today);

  if (!record || (record.mood === null && record.sleep === null)) {
    showMessage(
      "moodSleepAnalysis",
      "Save your mood and sleep to begin today's analysis."
    );
    return;
  }

  if (record.mood === null || record.sleep === null) {
    showMessage(
      "moodSleepAnalysis",
      "Save both your mood and sleep hours to compare today's entries."
    );
    return;
  }

  const teen = profile.age >= 13 && profile.age <= 17;
  const recommendedMin = teen ? 8 : profile.age <= 12 ? 9 : 7;
  const enoughSleep = record.sleep >= recommendedMin;

  let message = `Today you recorded ${moodLabels[record.mood]} and ` +
    `${formatHours(record.sleep)} of sleep. `;

  if (!enoughSleep) {
    message += "Your sleep was below the general recommendation " +
      `of ${recommendedMin}+ hours for your age group. `;
  } else {
    message += "Your sleep reached the lower end of the general " +
      "recommended range for your age group. ";
  }

  const moodMessage = {
    great: "You reported feeling great.",
    good: "You reported feeling good.",
    okay: "You reported feeling okay.",
    low: "You reported a low mood.",
    stressed: "You reported feeling stressed."
  };

  message += moodMessage[record.mood] + " ";

  if (["low", "stressed"].includes(record.mood)) {
    message += "Consider a relaxing break, a supportive conversation, " +
      "and a regular bedtime. Sleep is only one of many factors " +
      "that can affect mood.";
  } else {
    message += "Keep observing your routine over several days. " +
      "One day's data cannot establish a cause-and-effect relationship.";
  }

  $("moodSleepAnalysis").textContent = message;
}

function renderStudentHistory() {
  const container = $("studentHistory");
  container.replaceChildren();

  if (studentRecords.length === 0) {
    container.textContent = "No daily records yet.";
    return;
  }

  studentRecords.slice(0, 7).forEach(record => {
    const item = document.createElement("div");
    item.className = "history-item";

    const mood = record.mood
      ? moodLabels[record.mood] : "Not recorded";
    const sleep = record.sleep !== null
      ? formatHours(record.sleep) : "Not recorded";

    item.textContent =
      `${record.date} — Mood: ${mood} | Sleep: ${sleep}`;

    container.appendChild(item);
  });
}

// STUDENT: AGE- AND CLASS-AWARE WORKLOAD PLANNER
function buildStudyPlan() {
  const schoolClass = $("schoolClass").value;
  const hours = validNumber($("studyTime").value, 0, 12);
  const container = $("workloadPlan");
  container.replaceChildren();

  if (hours === null) {
    container.textContent = "Enter available time between 0 and 12 hours.";
    return;
  }

  // These are suggested allocations, not school or medical rules.
  const weights = {
    primary:   [0.35, 0.20, 0.10, 0.35],
    middle:    [0.35, 0.25, 0.15, 0.25],
    secondary: [0.35, 0.25, 0.20, 0.20],
    senior:    [0.40, 0.25, 0.20, 0.15],
    college:   [0.40, 0.25, 0.20, 0.15]
  };

  const labels = [
    "Focused learning",
    "Homework / assignments",
    "Revision / practice",
    "Breaks and buffer time"
  ];

  const fractions = weights[schoolClass] || weights.middle;
  const minutes = fractions.map((fraction, index) =>
    index === fractions.length - 1
      ? Math.round(hours * 60) -
        fractions.slice(0, -1).reduce(
          (sum, f) => sum + Math.round(hours * 60 * f), 0
        )
      : Math.round(hours * 60 * fraction)
  );

  const note = document.createElement("p");
  note.className = "muted";
  note.textContent =
    "Suggested plan only. Keep meals, exercise, family time and " +
    "enough sleep outside this study-time budget.";
  container.appendChild(note);

  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "plan-item";

    const title = document.createElement("span");
    title.textContent = label;

    const value = document.createElement("strong");
    const mins = minutes[index];
    value.textContent = mins >= 60
      ? `${Math.floor(mins / 60)} h ${mins % 60} min`
      : `${mins} min`;

    row.append(title, value);
    container.appendChild(row);
  });

  const classNote = document.createElement("p");
  classNote.className = "tiny";

  if (schoolClass === "secondary" || schoolClass === "senior") {
    classNote.textContent =
      "Try 25–40 minute focus blocks with short breaks. " +
      "Prioritize upcoming deadlines and difficult subjects.";
  } else if (schoolClass === "primary") {
    classNote.textContent =
      "Use short, varied learning sessions with movement and play breaks.";
  } else {
    classNote.textContent =
      "Adjust the blocks to attention span, workload and upcoming deadlines.";
  }

  container.appendChild(classNote);
}

$("planBtn").addEventListener("click", buildStudyPlan);
$("schoolClass").addEventListener("change", buildStudyPlan);

// ADULT: STEP TARGET
function updateSteps() {
  const target = validNumber($("stepTarget").value, 1, 100000);
  const steps = validNumber($("stepsDone").value, 0, 100000);

  if (target === null || steps === null) {
    showMessage("stepSummary", "Enter a valid target and step count.");
    $("stepProgress").style.width = "0%";
    return;
  }

  const percent = Math.min(100, (steps / target) * 100);
  $("stepProgress").style.width = `${percent}%`;

  const remaining = Math.max(0, target - steps);
  const summary = `${steps.toLocaleString()} of ` +
    `${target.toLocaleString()} steps (${Math.round(percent)}%). ` +
    (remaining > 0
      ? `${remaining.toLocaleString()} steps remaining.`
      : "Target reached!");

  showMessage("stepSummary", summary);
  updateSuggestions();
}

$("stepTarget").addEventListener("input", updateSteps);
$("stepsDone").addEventListener("input", updateSteps);

// ADULT: WATER TRACKER
function updateWater() {
  const goal = validNumber($("waterGoal").value, 250, 10000);
  const amount = validNumber($("waterAmount").value, 0, 10000);

  if (goal === null || amount === null) {
    showMessage("waterSummary", "Enter a valid water goal and amount.");
    $("waterProgress").style.width = "0%";
    return;
  }

  const percent = Math.min(100, (amount / goal) * 100);
  $("waterProgress").style.width = `${percent}%`;

  showMessage(
    "waterSummary",
    `${amount} mL of ${goal} mL (${Math.round(percent)}%). ` +
    (amount >= goal ? "Your entered goal is reached." :
      `${goal - amount} mL to your entered goal.`)
  );

  updateSuggestions();
}

$("waterGoal").addEventListener("input", updateWater);
$("waterAmount").addEventListener("input", updateWater);

document.querySelectorAll("[data-water]").forEach(button => {
  button.addEventListener("click", () => {
    const current = validNumber($("waterAmount").value, 0, 10000);
    if (current === null) {
      showMessage("waterSummary", "Enter a valid water amount first.");
      return;
    }

    $("waterAmount").value = Math.min(
      10000, current + Number(button.dataset.water)
    );
    updateWater();
  });
});

// ADULT: OXYGEN SATURATION
$("saveOxygenBtn").addEventListener("click", () => {
  const value = validNumber($("oxygen").value, 50, 100);

  if (value === null) {
    showMessage("oxygenResult", "Enter a reading between 50% and 100%.");
    return;
  }

  let message;

  if (value < 90) {
    message = "This is a potentially serious low reading. Seek urgent " +
      "medical assessment, especially if you have breathlessness, " +
      "chest pain, confusion or blue/grey lips. Do not delay care.";
  } else if (value < 95) {
    message = "Below the common 95–100% range for many healthy people " +
      "at sea level. Recheck according to device instructions and " +
      "contact a healthcare professional promptly if it persists. " +
      "Your usual level, altitude and health conditions matter.";
  } else {
    message = "Within the common 95–100% range for many healthy people " +
      "at sea level. This does not rule out a health problem.";
  }

  showMessage("oxygenResult", `Entered SpO₂: ${value}%. ${message}`);
});

// ADULT: BLOOD PRESSURE
$("saveBPBtn").addEventListener("click", () => {
  const systolic = validNumber($("systolic").value, 50, 300);
  const diastolic = validNumber($("diastolic").value, 30, 200);

  if (systolic === null || diastolic === null ||
      systolic <= diastolic) {
    showMessage(
      "bpResult",
      "Enter valid readings, with systolic higher than diastolic."
    );
    return;
  }

  let category;

  if (systolic >= 180 || diastolic >= 120) {
    category = "Severely high reading. Wait at least one minute and " +
      "repeat it. If still this high, seek immediate medical advice. " +
      "With chest pain, breathlessness, weakness, vision change or " +
      "difficulty speaking, call emergency services.";
  } else if (systolic >= 140 || diastolic >= 90) {
    category = "High reading in common adult guidelines. Repeat " +
      "measurements properly and arrange medical advice.";
  } else if (systolic >= 130 || diastolic >= 80) {
    category = "Above the ideal range in some adult guidelines. " +
      "One reading is not a diagnosis; discuss repeated readings " +
      "with a healthcare professional.";
  } else if (systolic >= 120 && diastolic < 80) {
    category = "Elevated systolic reading in common US adult guidelines. " +
      "Maintain healthy habits and monitor as advised.";
  } else if (systolic < 90 || diastolic < 60) {
    category = "This may be low for some people. Symptoms and usual " +
      "readings matter; seek advice if persistent or symptomatic.";
  } else {
    category = "Within the usual adult range in many guidelines. " +
      "Interpret it alongside your health and repeated readings.";
  }

  showMessage(
    "bpResult",
    `Entered reading: ${systolic}/${diastolic} mmHg. ${category}`
  );
});

// ADULT: SLEEP SUGGESTIONS
$("sleepAdviceBtn").addEventListener("click", () => {
  const hours = validNumber($("adultSleep").value, 0, 24);

  if (hours === null) {
    showMessage("adultSleepResult", "Enter sleep between 0 and 24 hours.");
    return;
  }

  let message;

  if (hours < 7) {
    message = "Most adults need at least 7 hours. Try a consistent " +
      "bedtime, reduce late caffeine, dim screens before bed, and " +
      "allow enough time for rest.";
  } else if (hours <= 9) {
    message = "This is within the common 7–9 hour range for adults. " +
      "Keep a regular schedule and notice how rested you feel.";
  } else {
    message = "Some people need extra sleep. If you regularly sleep " +
      "long hours but still feel exhausted, discuss it with a clinician.";
  }

  showMessage(
    "adultSleepResult",
    `Recorded: ${formatHours(hours)}. ${message}`
  );
});

// ADULT: ACTIVITY ENERGY ESTIMATE
$("calorieBtn").addEventListener("click", () => {
  const minutes = validNumber($("activityMinutes").value, 1, 600);

  if (minutes === null) {
    showMessage("calorieResult", "Enter a duration from 1 to 600 minutes.");
    return;
  }

  // Approximate MET values; illustrative 70 kg reference weight only.
  // Formula: kcal ~= MET x 3.5 x weight(kg) / 200 x minutes.
  const activities = {
    walking: 2.8,
    brisk: 4.3,
    cycling: 4.0,
    dancing: 4.5,
    yoga: 2.5
  };

  const met = activities[$("activity").value];
  const referenceWeight = 70;
  const kcal = met * 3.5 * referenceWeight / 200 * minutes;

  showMessage(
    "calorieResult",
    `Approximate energy estimate: ${Math.round(kcal)} kcal for ` +
    `${minutes} minutes. This uses a generic 70 kg reference and an ` +
    "activity estimate, not your personal measurement. Actual energy " +
    "use varies with body, pace and conditions. Move for enjoyment, " +
    "mobility and health rather than to compensate for eating."
  );
});

// ADULT: GENERAL SUGGESTIONS
function updateSuggestions() {
  const list = $("healthSuggestions");
  if (!list) return;

  list.replaceChildren();

  const suggestions = [
    "Build movement into your day in a way that feels comfortable.",
    "Eat regular, varied meals and include fruit, vegetables and other nourishing foods.",
    "Keep a consistent sleep and wake time when possible.",
    "Drink water regularly; needs vary with weather, activity and health.",
    "Take breaks from long periods of sitting and screens."
  ];

  const target = validNumber($("stepTarget").value, 1, 100000);
  const steps = validNumber($("stepsDone").value, 0, 100000);
  const water = validNumber($("waterAmount").value, 0, 10000);
  const goal = validNumber($("waterGoal").value, 250, 10000);

  if (target !== null && steps !== null && steps < target) {
    suggestions.unshift(
      "If comfortable, take a short walk or add gentle movement breaks."
    );
  }

  if (water !== null && goal !== null && water < goal) {
    suggestions.push(
      "Your entered water goal is not yet reached. Drink according to thirst and your clinician's advice."
    );
  }

  suggestions.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

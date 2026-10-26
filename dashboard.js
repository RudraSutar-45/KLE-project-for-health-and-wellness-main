
const $ = (id) => document.getElementById(id);

const profile = JSON.parse(localStorage.getItem("healthProfile") || "null");

if (!profile) {
    window.location.replace("index.html");
} else {
    initializeDashboard();
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function loadData() {
    let data;

    try {
        data = JSON.parse(localStorage.getItem("healthData") || "null");
    } catch {
        data = null;
    }

    if (!data || data.date !== getToday()) {
        data = {
            date: getToday(),
            steps: 0,
            stepGoal: 6000,
            water: 0,
            waterGoal: 2000
        };
    }

    data.steps = Math.max(0, Number(data.steps) || 0);
    data.water = Math.max(0, Number(data.water) || 0);
    data.stepGoal = Math.max(1, Number(data.stepGoal) || 6000);
    data.waterGoal = Math.max(1, Number(data.waterGoal) || 2000);

    return data;
}

let data = loadData();

function saveData() {
    try {
        localStorage.setItem("healthData", JSON.stringify(data));
        return true;
    } catch {
        showMessage("Could not save data. Check browser storage.");
        return false;
    }
}

function initializeDashboard() {
    $("userName").textContent = profile.name;
    $("userAge").textContent = profile.age;
    $("userMobile").textContent = profile.mobile;
    $("userDisease").textContent = profile.disease || "Not provided";
    $("avatar").textContent = profile.name.charAt(0).toUpperCase();

    $("todayDate").textContent = new Date().toLocaleDateString(
        undefined,
        { weekday: "short", day: "numeric", month: "short", year: "numeric" }
    );

    $("stepGoalInput").value = data.stepGoal;
    $("waterGoalInput").value = data.waterGoal;

    $("logoutBtn").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    $("addStepsBtn").addEventListener("click", () => {
        const amount = Number($("stepsInput").value);

        if (!Number.isInteger(amount) || amount < 1 || amount > 100000) {
            showMessage("Enter a whole number of steps from 1 to 100,000.");
            return;
        }

        data.steps += amount;
        if (saveData()) {
            $("stepsInput").value = "";
            renderDashboard();
            showMessage("Steps added successfully!");
        }
    });

    document.querySelectorAll("[data-steps]").forEach(button => {
        button.addEventListener("click", () => {
            data.steps += Number(button.dataset.steps);

            if (saveData()) {
                renderDashboard();
                showMessage("Steps added successfully!");
            }
        });
    });

    $("saveStepGoalBtn").addEventListener("click", () => {
        const goal = Number($("stepGoalInput").value);

        if (!Number.isInteger(goal) || goal < 1 || goal > 100000) {
            showMessage("Enter a step target between 1 and 100,000.");
            return;
        }

        data.stepGoal = goal;

        if (saveData()) {
            renderDashboard();
            showMessage("Step target saved!");
        }
    });

    $("addWaterBtn").addEventListener("click", () => {
        const amount = Number($("waterInput").value);

        if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
            showMessage("Enter water in ml, from 1 to 10,000.");
            return;
        }

        data.water += amount;

        if (saveData()) {
            $("waterInput").value = "";
            renderDashboard();
            showMessage("Water intake updated!");
        }
    });

    document.querySelectorAll("[data-water]").forEach(button => {
        button.addEventListener("click", () => {
            data.water += Number(button.dataset.water);

            if (saveData()) {
                renderDashboard();
                showMessage("Water intake updated!");
            }
        });
    });

    $("saveWaterGoalBtn").addEventListener("click", () => {
        const goal = Number($("waterGoalInput").value);

        if (!Number.isInteger(goal) || goal < 1 || goal > 10000) {
            showMessage("Enter a water target between 1 and 10,000 ml.");
            return;
        }

        data.waterGoal = goal;

        if (saveData()) {
            renderDashboard();
            showMessage("Water target saved!");
        }
    });

    renderDashboard();
}

function percentage(value, goal) {
    return Math.round((value / goal) * 100);
}

function renderDashboard() {
    const stepPct = percentage(data.steps, data.stepGoal);
    const waterPct = percentage(data.water, data.waterGoal);
    const overallPct = Math.round((stepPct + waterPct) / 2);

    $("stepsValue").textContent = data.steps.toLocaleString();
    $("stepsGoalText").textContent = data.stepGoal.toLocaleString();
    $("stepsBar").style.width = Math.min(stepPct, 100) + "%";
    $("stepsPercent").textContent = stepPct + "% completed";
    $("stepStatus").textContent = stepPct >= 100 ? "Goal reached" : "In progress";

    $("waterValue").textContent = data.water.toLocaleString();
    $("waterGoalText").textContent = data.waterGoal.toLocaleString();
    $("waterBar").style.width = Math.min(waterPct, 100) + "%";
    $("waterPercent").textContent = waterPct + "% completed";
    $("waterStatus").textContent = waterPct >= 100 ? "Goal reached" : "In progress";

    $("stepAnalysis").textContent = stepPct + "%";
    $("waterAnalysis").textContent = waterPct + "%";
    $("overallAnalysis").textContent = overallPct + "%";

    const stepsLeft = Math.max(0, data.stepGoal - data.steps);
    const waterLeft = Math.max(0, data.waterGoal - data.water);

    $("stepRemaining").textContent = stepsLeft.toLocaleString() +
        (stepsLeft === 1 ? " step remaining" : " steps remaining");

    $("waterRemaining").textContent = waterLeft.toLocaleString() +
        " ml remaining";
}

function showMessage(message) {
    $("message").textContent = message;
}

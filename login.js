
const profileForm = document.getElementById("profileForm");
const errorMessage = document.getElementById("errorMessage");

profileForm.addEventListener("submit", function (event) {
    event.preventDefault();
    errorMessage.textContent = "";

    const name = document.getElementById("name").value.trim();
    const age = Number(document.getElementById("age").value);
    const mobile = document.getElementById("mobile").value.trim();
    const disease = document.getElementById("disease").value.trim();

    if (!name || !Number.isInteger(age) || age < 1 || age > 120) {
        errorMessage.textContent = "Please enter a valid name and age.";
        return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        errorMessage.textContent =
            "Please enter a valid 10-digit mobile number.";
        return;
    }

    const profile = {
        name: name,
        age: age,
        mobile: mobile,
        disease: disease
    };

    try {
        localStorage.setItem("healthProfile", JSON.stringify(profile));

        if (!localStorage.getItem("healthData")) {
            localStorage.setItem("healthData", JSON.stringify({
                date: new Date().toLocaleDateString("en-CA"),
                steps: 0,
                stepGoal: 6000,
                water: 0,
                waterGoal: 2000
            }));
        }

        window.location.href = "dashboard.html";
    } catch (error) {
        errorMessage.textContent =
            "Browser storage is unavailable. Please enable it and try again.";
    }
});

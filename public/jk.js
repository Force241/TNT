
// note: you can move this JS into a separate .js file later

/* ELEMENTS */
const loginScreen = document.getElementById("loginScreen");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const infoScreen = document.getElementById("infoScreen");
const infoBtn = document.getElementById("infoBtn");
const infoError = document.getElementById("infoError");
const genderInput = document.getElementById("genderInput");
const ageInput = document.getElementById("ageInput");
const countryInput = document.getElementById("countryInput");

const policyScreen = document.getElementById("policyScreen");
const policyBtn = document.getElementById("policyBtn");
const policyError = document.getElementById("policyError");
const policyAgree = document.getElementById("policyAgree");

const blockedScreen = document.getElementById("blockedScreen");
const blockedReloadBtn = document.getElementById("blockedReloadBtn");

const reportScreen = document.getElementById("reportScreen");
const reportThanksScreen = document.getElementById("reportThanksScreen");
const reportReason = document.getElementById("reportReason");
const reportDetails = document.getElementById("reportDetails");
const reportError = document.getElementById("reportError");
const submitReportBtn = document.getElementById("submitReportBtn");
const cancelReportBtn = document.getElementById("cancelReportBtn");
const reportThanksBtn = document.getElementById("reportThanksBtn");

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

const myCameraBox = document.getElementById("myCameraBox");
const startBtn = document.getElementById("startBtn");
const connectBtn = document.getElementById("connectBtn");
const reportBtn = document.getElementById("reportBtn");

/* STATE */
let userData = { email: "", username: "", gender: "", age: null, country: "" };
let localStream = null;

/* LOGIN */
loginBtn.addEventListener("click", () => {
  const email = document.getElementById("emailInput").value.trim();
  const username = document.getElementById("usernameInput").value.trim();
  loginError.textContent = "";

  if (!email.endsWith("@gmail.com")) {
    loginError.textContent = "Email must be a Gmail address.";
    return;
  }
  if (username.length < 3) {
    loginError.textContent = "Username must be at least 3 characters.";
    return;
  }

  userData.email = email;
  userData.username = username;

  loginScreen.style.display = "none";
  infoScreen.style.display = "flex";
});

/* INFO */
infoBtn.addEventListener("click", () => {
  const gender = genderInput.value;
  const ageValue = ageInput.value;
  const country = countryInput.value;

  infoError.textContent = "";
  const age = parseInt(ageValue, 10);

  if (!gender || !ageValue || !country) {
    infoError.textContent = "Please fill out all fields.";
    return;
  }
  if (isNaN(age) || age < 1 || age > 120) {
    infoError.textContent = "Please enter a valid age.";
    return;
  }
  if (age < 18) {
    alert("You must be 18 or older to use TNT.");
    infoScreen.style.display = "none";
    loginScreen.style.display = "flex";
    return;
  }

  userData.gender = gender;
  userData.age = age;
  userData.country = country;

  infoScreen.style.display = "none";
  policyScreen.style.display = "flex";
});

/* POLICY */
policyBtn.addEventListener("click", () => {
  policyError.textContent = "";
  if (!policyAgree.checked) {
    policyError.textContent = "You must agree to the rules to continue.";
    return;
  }

  policyScreen.style.display = "none";

  requestPermissions()
    .then(() => {
      addSystemMessage(
        `@${userData.username} (${userData.gender}, ${userData.age}) from ${userData.country} joined.`
      );
    })
    .catch(() => {
      showBlockedScreen();
    });
});

/* PERMISSIONS */
async function requestPermissions() {
  // note: require both geolocation and camera/mic

  // 1. Geolocation
  await new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        autoSetCountryFromCoords(latitude, longitude);
        resolve();
      },
      err => { console.warn("Geolocation error:", err); reject(); }
    );
  });

  // 2. Camera + Mic
  await new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { reject(); return; }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => { localStream = stream; attachCameraStream(stream); resolve(); })
      .catch(err => { console.error("Camera/mic error:", err); reject(); });
  });
}

function showBlockedScreen() {
  blockedScreen.style.display = "flex";
}
blockedReloadBtn.addEventListener("click", () => { location.reload(); });

/* GEO → COUNTRY (best-effort) */
function autoSetCountryFromCoords(lat, lon) {
  // note: replace with your backend if needed
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  fetch(url, { headers: { "Accept": "application/json" } })
    .then(res => res.json())
    .then(data => {
      const countryName = data.address && data.address.country;
      if (!countryName) return;
      for (let i = 0; i < countryInput.options.length; i++) {
        const opt = countryInput.options[i];
        if (opt.text.toLowerCase() === (countryName || "").toLowerCase()) {
          countryInput.value = opt.text;
          userData.country = opt.text;
          break;
        }
      }
    })
    .catch(err => { console.warn("Reverse geocoding failed:", err); });
}

/* CAMERA */
function attachCameraStream(stream) {
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true; // note: mute local playback to avoid echo
  video.srcObject = stream;
  myCameraBox.innerHTML = "";
  myCameraBox.appendChild(video);
}

/* START BUTTON (re-attach camera if needed) */
startBtn.addEventListener("click", () => {
  if (localStream) { 
    attachCameraStream(localStream);
    return;
  }
  navigator.mediaDevices.getUserMedia({ video:true, audio:true })
    .then(stream => { localStream = stream; attachCameraStream(stream); })
    .catch(() => { alert("Camera/Mic permission denied. Cannot start."); });
});

/* CONNECT PLACEHOLDER */
connectBtn.addEventListener("click", () => {
  alert("To connect with a stranger, you need a backend signaling server (WebRTC). This button is ready to integrate.");
});

/* CHAT */
function addSystemMessage(text) {
  const p = document.createElement("p");
  p.textContent = "System: " + text;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function addUserMessage(text) {
  const p = document.createElement("p");
  p.textContent = "You: " + text;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
sendBtn.addEventListener("click", () => {
  const text = chatInput.value.trim();
  if (!text) return;
  addUserMessage(text);
  chatInput.value = "";
});
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

/* REPORT SYSTEM */
reportBtn.addEventListener("click", () => {
  reportScreen.style.display = "flex";
});
cancelReportBtn.addEventListener("click", () => {
  reportScreen.style.display = "none";
  reportReason.value = "";
  reportDetails.value = "";
  reportError.textContent = "";
});
submitReportBtn.addEventListener("click", () => {
  reportError.textContent = "";
  if (!reportReason.value) { reportError.textContent = "Please select a reason."; return; }
  if (reportDetails.value.trim().length < 10) {
    reportError.textContent = "Please describe the issue (10+ characters).";
    return;
  }
  // note: here you would send to your server
  console.log("Report submitted:", { reason: reportReason.value, details: reportDetails.value });
  reportScreen.style.display = "none";
  reportThanksScreen.style.display = "flex";
});
reportThanksBtn.addEventListener("click", () => {
  reportThanksScreen.style.display = "none";
});
const ws = new WebSocket("ws://192.168.0.100:3000");
peerConnection.onicecandidate = (event) => {
if (event.candidate) {
ws.send(JSON.stringify({ candidate: event.candidate }));
}
};
/* IMPORTANT: run via a local server (VS Code Live Server) for camera/mic/location prompts */

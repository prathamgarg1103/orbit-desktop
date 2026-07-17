const prompt = document.querySelector("#prompt");
const ask = document.querySelector("#ask");
const voice = document.querySelector("#voice");
const answer = document.querySelector("#answer");
const answerText = document.querySelector("#answer-text");
const answerMode = document.querySelector("#answer-mode");
const draw = document.querySelector("#draw");
const headline = document.querySelector("#headline");
const modeLabel = document.querySelector("#mode-label");
const screenStatus = document.querySelector("#screen-status");
const context = document.querySelector("#context");
const agentNote = document.querySelector("#agent-note");
const agentAction = document.querySelector("#agent-action");
const agentActionDetail = document.querySelector("#agent-action-detail");
const approveAgent = document.querySelector("#approve-agent");
const connectorRow = document.querySelector("#connectors");
const connectorSetup = document.querySelector("#connector-setup");
const connectorTitle = document.querySelector("#connector-title");
const connectorCopy = document.querySelector("#connector-copy");
const connectorToken = document.querySelector("#connector-token");
const notionParentRow = document.querySelector("#notion-parent-row");
const notionParent = document.querySelector("#notion-parent");
const saveConnector = document.querySelector("#save-connector");
const disconnectConnector = document.querySelector("#disconnect-connector");

let mode = "coach";
let steps = [];
let currentAgent;
let selectedConnector;
let liveVoice = false;
let activeRecorder;

document.querySelector("#close").onclick = () => window.orbit.close();
document.querySelectorAll(".mode").forEach((button) => { button.onclick = () => setMode(button.dataset.mode); });
ask.onclick = submit;
draw.onclick = () => window.orbit.draw({ steps });
voice.onclick = startVoice;
approveAgent.onclick = runApprovedAgent;
document.querySelector("#cancel-connector").onclick = closeConnectorSetup;
saveConnector.onclick = saveSelectedConnector;
disconnectConnector.onclick = disconnectSelectedConnector;
connectorRow.onclick = (event) => {
  const button = event.target.closest("[data-connector]");
  if (button) openConnectorSetup(button.dataset.connector, button.dataset.connected === "true");
};
prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
});

window.orbit.onOpened((payload) => {
  answer.hidden = true;
  agentAction.hidden = true;
  currentAgent = undefined;
  liveVoice = Boolean(payload.live);
  context.textContent = `SCREEN CONTEXT · ${payload.live ? "LIVE" : "DEMO"}`;
  screenStatus.textContent = `Captured just now at ${new Date(payload.capturedAt).toLocaleTimeString()}. Ask anything about this moment.`;
  prompt.focus();
  loadConnectors();
});
window.orbit.onError((message) => { screenStatus.textContent = message; });

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll(".mode").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  const agent = mode === "agent";
  modeLabel.textContent = agent ? "ORBIT AGENTS" : "TALK ABOUT YOUR SCREEN";
  headline.textContent = agent ? "What should I take off your plate?" : "What are you trying to do?";
  prompt.placeholder = agent ? "Describe the task in your own words..." : "Ask about what you are seeing...";
  ask.innerHTML = agent ? "Start agent <span>↵</span>" : "Talk to Orbit <span>↵</span>";
}

async function loadConnectors() {
  try { renderConnectors(await window.orbit.connectors()); } catch { connectorRow.textContent = "Connectors unavailable"; }
}

function renderConnectors(connectors) {
  connectorRow.innerHTML = [["OpenAI", "openai", connectors.openai], ["Gmail", "gmail", connectors.gmail], ["Notion", "notion", connectors.notion]].map(([name, provider, connected]) => (
    `<button class="connector ${connected ? "connected" : ""}" data-connector="${provider}" data-connected="${connected}" type="button"><i></i>${name} · ${connected ? "connected" : "connect"}</button>`
  )).join("");
  if (!connectors.secureStorage) screenStatus.textContent = "Secure system storage is unavailable, so connectors cannot be saved.";
}

function openConnectorSetup(provider, connected) {
  selectedConnector = provider;
  connectorSetup.hidden = false;
  connectorToken.value = "";
  notionParent.value = "";
  const notion = provider === "notion";
  const name = provider === "openai" ? "OpenAI" : notion ? "Notion" : "Gmail";
  connectorTitle.textContent = connected ? `Manage ${name}` : `Connect ${name}`;
  connectorCopy.textContent = provider === "openai"
    ? "Paste an OpenAI API key to enable live screen reasoning and push-to-talk. It is encrypted by your operating system."
    : notion
      ? "Paste a Notion integration token and the parent page ID it is allowed to edit. They are encrypted by your operating system."
      : "Paste a scoped Gmail OAuth access token. Orbit creates drafts only and never sends email without you reviewing it.";
  connectorToken.placeholder = provider === "openai" ? "sk-..." : "Paste a scoped access token";
  notionParentRow.hidden = !notion;
  disconnectConnector.hidden = !connected;
  connectorToken.focus();
}

function closeConnectorSetup() {
  connectorSetup.hidden = true;
  selectedConnector = undefined;
  connectorToken.value = "";
  notionParent.value = "";
}

async function saveSelectedConnector() {
  if (!selectedConnector) return;
  saveConnector.disabled = true;
  try {
    renderConnectors(await window.orbit.saveConnector({ provider: selectedConnector, token: connectorToken.value, parentPageId: notionParent.value }));
    closeConnectorSetup();
    screenStatus.textContent = `${selectedConnector === "openai" ? "OpenAI" : selectedConnector === "notion" ? "Notion" : "Gmail"} is connected on this computer.`;
  } catch (error) {
    screenStatus.textContent = error.message || "That connection could not be saved.";
  } finally {
    saveConnector.disabled = false;
  }
}

async function disconnectSelectedConnector() {
  if (!selectedConnector) return;
  try {
    renderConnectors(await window.orbit.disconnectConnector(selectedConnector));
    closeConnectorSetup();
    screenStatus.textContent = "Connector disconnected.";
  } catch (error) {
    screenStatus.textContent = error.message || "That connector could not be disconnected.";
  }
}

async function submit() {
  const request = prompt.value.trim();
  if (!request) return prompt.focus();
  ask.disabled = true;
  voice.disabled = true;
  ask.textContent = mode === "agent" ? "Planning..." : "Looking...";
  try {
    const result = await window.orbit.ask({ request, mode });
    steps = result.steps || [];
    currentAgent = result.agent || undefined;
    answer.hidden = false;
    answerMode.textContent = result.demo ? `${mode === "agent" ? "AGENT PLAN" : "ORBIT TALK"} · LOCAL` : (mode === "agent" ? "AGENT PLAN" : "ORBIT TALK");
    answerText.innerHTML = format(result.text);
    agentNote.hidden = mode !== "agent";
    draw.hidden = !steps.length;
    agentAction.hidden = !currentAgent;
    if (currentAgent) {
      agentActionDetail.textContent = currentAgent.detail;
      approveAgent.textContent = currentAgent.approvalLabel;
    }
    screenStatus.textContent = result.demo ? "Demo answer — add OPENAI_API_KEY for live screen reasoning and transcription." : "Live screen answer ready.";
    if (mode === "coach") speak(result.text);
  } catch (error) {
    answer.hidden = false;
    answerText.textContent = error.message || "Orbit could not answer that.";
  } finally {
    ask.disabled = false;
    voice.disabled = false;
    ask.innerHTML = mode === "agent" ? "Start agent <span>↵</span>" : "Talk to Orbit <span>↵</span>";
  }
}

async function runApprovedAgent() {
  if (!currentAgent) return;
  approveAgent.disabled = true;
  approveAgent.textContent = "Running...";
  try {
    const result = await window.orbit.approveAgent(currentAgent.id);
    agentActionDetail.textContent = result.message;
    approveAgent.hidden = true;
    if (result.url && /^https:\/\//.test(result.url)) {
      const link = document.createElement("a");
      link.href = result.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Open it";
      agentActionDetail.append(" ", link);
    }
  } catch (error) {
    agentActionDetail.textContent = error.message || "Orbit could not run that action.";
    approveAgent.disabled = false;
    approveAgent.textContent = currentAgent.approvalLabel;
  }
}

function format(value) {
  const escaped = String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
  return escaped.replace(/\n/g, "<br>").replace(/(^|<br>)(\d+[.)]\s.*?)(?=<br>|$)/g, "$1<strong>$2</strong>");
}

async function startVoice() {
  if (activeRecorder?.state === "recording") { activeRecorder.stop(); return; }
  if (!liveVoice || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return startBrowserSpeechRecognition();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
    const chunks = [];
    activeRecorder = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      activeRecorder = undefined;
      voice.disabled = true;
      voice.textContent = "Transcribing...";
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const spoken = await window.orbit.transcribe({ base64: await blobToBase64(blob), mimeType: blob.type });
        handleSpoken(spoken);
      } catch (error) {
        screenStatus.textContent = error.message || "I couldn't transcribe that. Try again.";
      } finally {
        voice.disabled = false;
        voice.textContent = "◉ Speak";
      }
    };
    recorder.start();
    voice.textContent = "Stop recording";
    screenStatus.textContent = "Listening. Click Stop recording when you finish.";
  } catch (error) {
    screenStatus.textContent = error.name === "NotAllowedError" ? "Microphone permission was denied." : "I couldn't start the microphone.";
  }
}

function startBrowserSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    screenStatus.textContent = "Voice needs an OpenAI API key or this runtime's speech-recognition service. Type your request instead.";
    return;
  }
  const recognition = new Recognition();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = false;
  voice.textContent = "Listening...";
  recognition.onresult = (event) => handleSpoken(event.results[0][0].transcript);
  recognition.onerror = () => { screenStatus.textContent = "I didn't catch that. Try speaking again or type your request."; };
  recognition.onend = () => { voice.textContent = "◉ Speak"; };
  recognition.start();
}

function handleSpoken(spoken) {
  if (/^(orbit|hey\s*orbit|hey\s*clicky)\s+agent/i.test(spoken)) {
    setMode("agent");
    prompt.value = spoken.replace(/^(orbit|hey\s*orbit|hey\s*clicky)\s+agent[:,]?\s*/i, "");
  } else {
    prompt.value = spoken;
  }
  submit();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).replace(/\d+[.)]/g, ""));
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

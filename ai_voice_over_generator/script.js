"use strict";

// TODOs:
// 1. Add max character limit to text area
// 2. Add loading spinners
// 3. Add error handling
// 4. Add success messages
// 5. Show word count
// 9. disable create button until text is entered

let voiceList = [];
let selectedVoice = null;
let previewUrl = null;
let description = null;
let downloadableUrl = null;

document.addEventListener("DOMContentLoaded", function () {
  fetchVoices();

  const voiceSelect = document.getElementById("voiceSelect");
  const sampleButton = document.getElementById("sampleButton");
  const generateButton = document.getElementById("generateButton");
  const downloadButton = document.getElementById("downloadButton");
  const createButton = document.getElementById("createButton");
  const textarea = document.querySelector("textarea");

  voiceSelect.addEventListener("change", function (event) {
    selectedVoice = event.target.value;
    previewUrl = findPreviewUrl(selectedVoice);
  });

  generateButton.addEventListener("click", function (e) {
    e.preventDefault();
    generateVoiceOver();
  });

  sampleButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!previewUrl) {
      alert("Please select a voice");
      return;
    }

    // play audio with new Audio
    const audio = new Audio(previewUrl);
    audio.play();
  });

  downloadButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!downloadableUrl) {
      return;
    }

    // download audio with fetch
    // TODO: move this to a function
    fetch(downloadableUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "audio.mp3";
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  });

  createButton.addEventListener("click", function (e) {
    e.preventDefault();
    generateScript();
  });

  // autoexpand textarea based on content
  textarea.addEventListener("input", (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  });
});

function fetchVoices() {
  const headers = {
    "Content-Type": "application/json",
  };

  const options = {
    method: "GET",
    headers: headers,
  };

  fetch("https://soona-microapps-test.replit.app/api/speech", options)
    .then((response) => response.json())
    .then((data) => {
      voiceList = data;

      console.log(data);

      const voiceSelect = document.getElementById("voiceSelect");

      voiceList.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.voice_id;
        option.text = `${voice.name} (${voice.labels.accent}, ${
          voice.labels.description || voice.labels.descriptive
        }, ${voice.labels.gender})`;
        voiceSelect.appendChild(option);
      });

      selectedVoice = voiceList[0].voice_id;
    });
}

function findPreviewUrl(voiceId) {
  const voice = voiceList.find((voice) => voice.voice_id === voiceId);
  return voice.preview_url;
}

function generateVoiceOver() {
  description = document.getElementById("textArea").value;
  const voiceId = document.getElementById("voiceSelect").value;

  if (!description) {
    alert("Please enter some text");
    return;
  }

  if (!selectedVoice || !voiceId) {
    alert("Please select a voice");
    return;
  }

  const url = `https://soona-microapps-test.replit.app/api/speech`;

  const headers = {
    "Content-Type": "application/json",
  };

  const options = {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      description: description,
      voiceId: voiceId,
    }),
  };

  const generateButton = document.getElementById("generateButton");
  generateButton.innerHTML = "Generating...";
  //   disable button
  generateButton.style.pointerEvents = "none";

  fetch(url, options).then((response) => {
    // take readable stream and convert to blob and then to playable audio
    response.blob().then((blob) => {
      const audioElement = document.getElementById("voiceOverAudio");
      const audio = URL.createObjectURL(blob);

      audioElement.setAttribute("src", audio);
      downloadableUrl = audio;

      const resultElement = document.querySelector(".result-row");
      resultElement.style.display = "flex";
      generateButton.innerHTML = "Generate Voiceover";
    });
  });
}

async function generateScript() {
  description = document.getElementById("textArea").value;

  if (!description) {
    alert("Please enter some text");
    return;
  }

  //   add .loading to classlist
  const createButton = document.getElementById("createButton");
  createButton.classList.add("disabled");
  const p = createButton.querySelector("p");
  p.classList.add("loading");

  const headers = {
    "Content-Type": "application/json",
  };

  const payload = {
    description: description,
  };

  const options = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  };

  const response = await fetch(
    "https://soona-microapps-test.replit.app/api/text/voice-over",
    options
  );

  const data = await response.json();
  textArea.value = data.outputs.script;

  createButton.classList.remove("disabled");
  p.classList.remove("loading");
}

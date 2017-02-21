/*
 * AudioContext
 */
window.AudioContext = window.AudioContext || window.webkitAudioContext;

const launchBtn = document.getElementById('launch-game');
const quitBtn = document.getElementById('quit-game');
launchBtn.onclick = launchGame;
quitBtn.onclick = quitGame;

function launchGame() {
    navigator.getUserMedia({
        audio: true,
        video: false
    }, handleSuccess, handleFailure);
    launchBtn.disabled = true;
    quitBtn.disabled = false;
}
function quitGame() {
}

const audioContext = new AudioContext();
function handleSuccess(stream) {
    const microphone = audioContext.createMediaStreamSource(stream);
    const filter = audioContext.createBiquadFilter();
    // microphone -> filter -> destination.
    microphone.connect(filter);
    filter.connect(audioContext.destination);
}

function handleFailure(error) {
    launchBtn.disabled = false;
    quitBtn.disabled = true;
    alert(`Failed to get access to local microphone. Error: ${error}`);
}

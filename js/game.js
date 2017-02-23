const audioContext = new AudioContext();
let mediaStreamSource = null;
let analyser = null;
let rafID = null;
const buflen = 1024;
let buf = new Float32Array(buflen);
const MIN_SAMPLES = 0;
const GOOD_ENOUGH_CORRELATION = 0.9;

const launchBtn = document.getElementById('launch-game');
const quitBtn = document.getElementById('quit-game');
quitBtn.disabled = true;
launchBtn.onclick = launchGame;
quitBtn.onclick = quitGame;

function launchGame() {
    navigator.getUserMedia({
        "audio": {
            "mandatory": {
                "googEchoCancellation": "false",
                "googAutoGainControl": "false",
                "googNoiseSuppression": "false",
                "googHighpassFilter": "false"
            },
            "optional": []
        },
    }, handleSuccess, handleFailure);
    launchBtn.disabled = true;
    quitBtn.disabled = false;
}
function quitGame() {
    window.cancelAnimationFrame(rafID);
    launchBtn.disabled = false;
    quitBtn.disabled = true;
}


function handleSuccess(stream) {
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect(analyser);
    update();
}
function handleFailure(error) {
    launchBtn.disabled = false;
    quitBtn.disabled = true;
    alert(`Failed to get access to local microphone. Error: ${error}`);
}

function update() {
    analyser.getFloatTimeDomainData(buf);
    const ac = autoCorrelate(buf, audioContext.sampleRate);
    console.log(ac);
    rafID = window.requestAnimationFrame(update);
}

function autoCorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    const correlations = new Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
        const val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01)
        return -1;

    let lastCorrelation = 1;
    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i]) - (buf[i + offset]));
        }
        correlation = 1 - (correlation / MAX_SAMPLES);
        correlations[offset] = correlation;
        if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            const shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
            return sampleRate / (best_offset + (8 * shift));
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
        return sampleRate / best_offset;
    }
    return -1;
}

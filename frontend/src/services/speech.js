/**
 * Speech Service - Web Speech API wrapper for voice input
 * Provides speech-to-text and audio visualization capabilities
 */

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let audioContext = null;
let analyser = null;
let mediaStream = null;

/**
 * Initialize speech recognition
 */
export function initSpeechRecognition() {
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  return recognition;
}

/**
 * Start recording and transcribing speech
 * @param {Function} onResult - Callback with { transcript, isFinal }
 * @param {Function} onError - Error callback
 * @param {Function} onEnd - End callback
 * @returns {Function} stop function
 */
export function startListening(onResult, onError, onEnd) {
  if (!recognition) {
    recognition = initSpeechRecognition();
  }

  if (!recognition) {
    onError?.('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    return () => {};
  }

  let fullTranscript = '';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      fullTranscript += finalTranscript;
    }

    onResult?.({
      transcript: fullTranscript + interimTranscript,
      finalTranscript: fullTranscript,
      interimTranscript,
      isFinal: !!finalTranscript,
    });
  };

  recognition.onerror = (event) => {
    if (event.error !== 'aborted') {
      onError?.(event.error);
    }
  };

  recognition.onend = () => {
    onEnd?.(fullTranscript);
  };

  try {
    recognition.start();
  } catch (e) {
    // Already started, restart
    recognition.stop();
    setTimeout(() => recognition.start(), 100);
  }

  return () => {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore
    }
  };
}

/**
 * Stop listening
 */
export function stopListening() {
  try {
    recognition?.stop();
  } catch (e) {
    // Ignore
  }
}

/**
 * Start audio visualization
 * @param {Function} onData - Callback with frequency data array
 * @returns {Function} cleanup function
 */
export async function startAudioVisualization(onData) {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId;

    function update() {
      analyser.getByteFrequencyData(dataArray);
      onData?.(Array.from(dataArray));
      animationId = requestAnimationFrame(update);
    }

    update();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      mediaStream?.getTracks().forEach(track => track.stop());
      audioContext?.close();
    };
  } catch (error) {
    console.error('Failed to access microphone:', error);
    return () => {};
  }
}

/**
 * Check if speech recognition is available
 */
export function isSpeechRecognitionAvailable() {
  return !!SpeechRecognition;
}

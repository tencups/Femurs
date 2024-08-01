// audioProcessor.js

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let reversedBuffer;
let audioSourceNode;
const gainNode = audioContext.createGain();
let lastPlaybackPosition = 0; // Track the last playback position
let isPlayingReversed = false; // Track if reversed audio is currently playing
let startTime = 0; // Track the start time of playback

// Function to reverse the audio buffer
function reverseAudioBuffer(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;

    const reversedBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const reversedChannelData = reversedBuffer.getChannelData(channel);

        for (let i = 0; i < length; i++) {
            reversedChannelData[i] = channelData[length - i - 1];
        }
    }

    return reversedBuffer;
}

// Function to load and process audio
function loadAndReverseAudio(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            reversedBuffer = reverseAudioBuffer(buffer);
        })
        .catch(error => console.error('Error with audio processing:', error));
}

// Function to play reversed audio from the last position
function playReversedAudio() {
    if (reversedBuffer && !isPlayingReversed) {
        if (audioSourceNode) {
            audioSourceNode.stop(); // Stop any currently playing reversed audio
        }
        audioSourceNode = audioContext.createBufferSource();
        audioSourceNode.buffer = reversedBuffer;
        audioSourceNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        startTime = audioContext.currentTime; // Record the start time of playback
        audioSourceNode.start(0, lastPlaybackPosition); // Start from the last playback position
        isPlayingReversed = true;
    }
}

// Function to stop reversed audio and save the playback position
function stopReversedAudio() {
    if (audioSourceNode && isPlayingReversed) {
        lastPlaybackPosition += audioContext.currentTime - startTime; // Update lastPlaybackPosition
        audioSourceNode.stop(); // Stop reversed audio
        isPlayingReversed = false;
    }
}

// Export functions for use in other scripts
export { loadAndReverseAudio, playReversedAudio, stopReversedAudio };

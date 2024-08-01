const emojis = [
    '🦴', '🌟', '💎', '🚀', '🎨',  // Existing emojis
    '🍕', '🎉', '🐱', '🌈', '🔥',  // New emojis
    '🍔', '⚽', '🚲', '🎸', '🎲',
    '🥑', '🎃', '🍎', '🦄', '🍦',
    '💡', '📚', '🌻', '🍉', '🧩'
];

import { loadAndReverseAudio, playReversedAudio, stopReversedAudio } from './reverse.js';
loadAndReverseAudio('/assets/doomscrolling.mp3');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('backgroundMusic');

// Initialize Socket.io
const socket = io();

// Array to store all drawing paths
let drawingData = [];
let currentPath = []; // Array to store the current path being drawn
let drawing = false;
let erasing = false;

// Function to get a random emoji
function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// Function to update the cursor style with a random emoji
function updateCursor() {
    console.log("Updating cursor"); // Log to verify function is called
    const emoji = getRandomEmoji();
    const cursorUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><text x="0" y="20" font-size="20">${emoji}</text></svg>`;
    document.body.style.cursor = `url('${cursorUrl}') 24 24, auto`;
}

window.addEventListener('wheel', () => {
    console.log("Mouse wheel event detected"); // Verify the wheel event
    updateCursor();
});

// Ensure the cursor is updated initially
updateCursor();

// Resize canvas to fit the window
function resizeCanvas() {
    // Save the current drawing data
    const savedDrawingData = [...drawingData];
    
    // Resize the canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Re-draw all saved drawing data
    savedDrawingData.forEach(path => drawPath(path));
}

resizeCanvas(); // Initial size
window.addEventListener('resize', resizeCanvas); // Adjust canvas size on window resize

function startDrawing(e) {
    if (e.button === 2) { // Right click
        erasing = true;
        playReversedAudio();
        e.preventDefault(); // Prevent the default context menu
        return;
    }

    if (e.button === 0) { // Left click
        drawing = true;
        currentPath = [{ x: e.clientX, y: e.clientY }];
        draw(e);
        if (audio.paused) {
            audio.play(); // Start playing the audio
        }
    }
}

function stopDrawing(e) {
    if (e.button === 2) { // Right click
        erasing = false;
        stopReversedAudio();
        e.preventDefault(); // Prevent the default context menu
        return;
    }

    if (e.button === 0) { // Left click
        drawing = false;
        drawingData.push(currentPath); // Save the current path to the drawing data
        socket.emit('draw', currentPath); // Send the path to the server
        currentPath = [];
        ctx.beginPath();
        if (!drawing && !erasing) {
            audio.pause(); // Pause the audio when not drawing
        }
    }
}

function draw(e) {
    if (!drawing && !erasing) return;

    const x = e.clientX;
    const y = e.clientY;
    
    if (drawing) {
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        currentPath.push({ x, y }); // Store the current position in the path
    }

    if (erasing) {
        ctx.clearRect(x - 10, y - 10, 20, 20); // Erase a 20x20 area around the mouse pointer
    }
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable context menu on right click

// Receive initial drawing data
socket.on('init', (data) => {
    drawingData = data; // Update drawing data with initial data
    drawingData.forEach(path => drawPath(path)); // Draw the initial data
});

// Draw paths when receiving drawing data
socket.on('draw', (data) => {
    drawPath(data);
});

function drawPath(path) {
    if (path.length < 2) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(path[i].x, path[i].y);
    }

    ctx.beginPath(); // Ensure the path is reset after drawing
}

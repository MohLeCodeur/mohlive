// Signaling Server for WebRTC
// This server handles the WebRTC signaling between broadcasters and viewers

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Socket.IO setup with CORS
const io = socketIO(server, {
    cors: {
        origin: "*", // In production, specify your domain
        methods: ["GET", "POST"]
    }
});

// Store active connections
let broadcaster = null;
const viewers = new Map();

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Broadcaster events
    socket.on('broadcaster-start', () => {
        console.log(`Broadcaster started: ${socket.id}`);
        broadcaster = socket.id;

        // Notify all viewers that broadcaster is available
        viewers.forEach((viewerSocket) => {
            viewerSocket.emit('broadcaster-available');
        });

        updateViewerCount();
    });

    socket.on('broadcaster-stop', () => {
        console.log(`Broadcaster stopped: ${socket.id}`);

        if (broadcaster === socket.id) {
            broadcaster = null;

            // Notify all viewers that broadcaster disconnected
            viewers.forEach((viewerSocket) => {
                viewerSocket.emit('broadcaster-disconnected');
            });
        }

        updateViewerCount();
    });

    // Viewer events
    socket.on('viewer-join', () => {
        console.log(`Viewer joined: ${socket.id}`);
        viewers.set(socket.id, socket);

        // If broadcaster is active, notify this viewer
        if (broadcaster) {
            socket.emit('broadcaster-available');
        }

        updateViewerCount();
    });

    socket.on('viewer-ready', () => {
        console.log(`Viewer ready: ${socket.id}`);

        // Notify broadcaster about new viewer
        if (broadcaster) {
            io.to(broadcaster).emit('viewer-ready', socket.id);
        }
    });

    // WebRTC signaling
    socket.on('offer', ({ viewerId, offer }) => {
        console.log(`Offer from broadcaster to viewer: ${viewerId}`);
        io.to(viewerId).emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log(`Answer from viewer ${socket.id} to broadcaster`);

        if (broadcaster) {
            io.to(broadcaster).emit('answer', {
                viewerId: socket.id,
                answer
            });
        }
    });

    socket.on('ice-candidate', (data) => {
        // Handle ICE candidates from both broadcaster and viewers
        if (socket.id === broadcaster && data.viewerId) {
            // From broadcaster to specific viewer
            console.log(`ICE candidate from broadcaster to viewer: ${data.viewerId}`);
            io.to(data.viewerId).emit('ice-candidate', data.candidate);
        } else if (broadcaster) {
            // From viewer to broadcaster
            console.log(`ICE candidate from viewer ${socket.id} to broadcaster`);
            io.to(broadcaster).emit('ice-candidate', {
                viewerId: socket.id,
                candidate: data
            });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);

        if (socket.id === broadcaster) {
            console.log('Broadcaster disconnected');
            broadcaster = null;

            // Notify all viewers
            viewers.forEach((viewerSocket) => {
                viewerSocket.emit('broadcaster-disconnected');
            });
        } else if (viewers.has(socket.id)) {
            console.log('Viewer disconnected');
            viewers.delete(socket.id);

            // Notify broadcaster
            if (broadcaster) {
                io.to(broadcaster).emit('viewer-disconnected', socket.id);
            }
        }

        updateViewerCount();
    });
});

// Update viewer count for all connected clients
function updateViewerCount() {
    const count = viewers.size;

    // Send to broadcaster
    if (broadcaster) {
        io.to(broadcaster).emit('viewer-count', count);
    }

    // Send to all viewers
    viewers.forEach((viewerSocket) => {
        viewerSocket.emit('viewer-count', count);
    });

    console.log(`Current viewers: ${count}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        broadcaster: broadcaster ? 'active' : 'inactive',
        viewers: viewers.size,
        timestamp: new Date().toISOString()
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        broadcaster: broadcaster ? 'online' : 'offline',
        viewerCount: viewers.size
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Signaling server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

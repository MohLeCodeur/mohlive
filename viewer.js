// Viewer.js - WebRTC Client for viewing the stream

const CONFIG = {
    // Change this to your signaling server URL when deployed
    SIGNALING_SERVER: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://your-signaling-server.com',

    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

class StreamViewer {
    constructor() {
        this.socket = null;
        this.peerConnection = null;
        this.remoteVideo = document.getElementById('remoteVideo');
        this.videoOverlay = document.getElementById('videoOverlay');
        this.liveBadge = document.getElementById('liveBadge');
        this.streamStatus = document.getElementById('streamStatus');
        this.connectionState = document.getElementById('connectionState');
        this.videoQuality = document.getElementById('videoQuality');
        this.viewerCount = document.getElementById('viewerCount');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.volumeBtn = document.getElementById('volumeBtn');

        this.isConnected = false;
        this.statsInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectToSignalingServer();
    }

    setupEventListeners() {
        // Fullscreen button
        this.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                this.remoteVideo.parentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // Volume button
        this.volumeBtn.addEventListener('click', () => {
            this.remoteVideo.muted = !this.remoteVideo.muted;
            this.updateVolumeIcon();
        });

        // Video events
        this.remoteVideo.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            this.updateVideoQuality();
        });

        this.remoteVideo.addEventListener('playing', () => {
            console.log('Video playing');
            this.hideOverlay();
            this.showLiveBadge();
        });
    }

    connectToSignalingServer() {
        console.log('Connecting to signaling server...');
        this.updateStatus('Connexion...', 'offline');

        try {
            this.socket = io(CONFIG.SIGNALING_SERVER, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('Connected to signaling server');
                this.updateStatus('Connecté', 'online');
                this.socket.emit('viewer-join');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from signaling server');
                this.updateStatus('Déconnecté', 'offline');
                this.cleanup();
            });

            this.socket.on('broadcaster-available', () => {
                console.log('Broadcaster is available');
                this.createPeerConnection();
                this.socket.emit('viewer-ready');
            });

            this.socket.on('offer', async (offer) => {
                console.log('Received offer from broadcaster');
                await this.handleOffer(offer);
            });

            this.socket.on('ice-candidate', async (candidate) => {
                console.log('Received ICE candidate');
                await this.handleIceCandidate(candidate);
            });

            this.socket.on('broadcaster-disconnected', () => {
                console.log('Broadcaster disconnected');
                this.updateStatus('Hors ligne', 'offline');
                this.showOverlay();
                this.hideLiveBadge();
                this.cleanup();
            });

            this.socket.on('viewer-count', (count) => {
                this.updateViewerCount(count);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.updateStatus('Erreur de connexion', 'offline');
            });

        } catch (error) {
            console.error('Failed to connect to signaling server:', error);
            this.updateStatus('Erreur', 'offline');
        }
    }

    createPeerConnection() {
        console.log('Creating peer connection...');

        this.peerConnection = new RTCPeerConnection({
            iceServers: CONFIG.ICE_SERVERS
        });

        // Handle incoming tracks
        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            if (event.streams && event.streams[0]) {
                this.remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate to broadcaster');
                this.socket.emit('ice-candidate', event.candidate);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            this.updateConnectionState(this.peerConnection.connectionState);

            if (this.peerConnection.connectionState === 'connected') {
                this.startStatsMonitoring();
            } else if (this.peerConnection.connectionState === 'disconnected' ||
                this.peerConnection.connectionState === 'failed') {
                this.stopStatsMonitoring();
            }
        };

        // Handle ICE connection state changes
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        };
    }

    async handleOffer(offer) {
        try {
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description set');

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('Local description set');

            this.socket.emit('answer', answer);
            console.log('Answer sent to broadcaster');

        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('ICE candidate added');
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    startStatsMonitoring() {
        this.stopStatsMonitoring();

        this.statsInterval = setInterval(async () => {
            if (!this.peerConnection) return;

            try {
                const stats = await this.peerConnection.getStats();
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        // Update video quality info
                        if (report.frameWidth && report.frameHeight) {
                            this.videoQuality.textContent = `${report.frameWidth}x${report.frameHeight}`;
                        }
                    }
                });
            } catch (error) {
                console.error('Error getting stats:', error);
            }
        }, 2000);
    }

    stopStatsMonitoring() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }

    updateStatus(text, state) {
        const statusText = this.streamStatus.querySelector('.status-text');
        const statusIndicator = this.streamStatus.querySelector('.status-indicator');

        statusText.textContent = text;
        statusIndicator.className = `status-indicator ${state}`;
    }

    updateConnectionState(state) {
        const stateMap = {
            'new': 'Nouveau',
            'connecting': 'Connexion...',
            'connected': 'Connecté',
            'disconnected': 'Déconnecté',
            'failed': 'Échec',
            'closed': 'Fermé'
        };

        this.connectionState.textContent = stateMap[state] || state;
    }

    updateVideoQuality() {
        if (this.remoteVideo.videoWidth && this.remoteVideo.videoHeight) {
            this.videoQuality.textContent = `${this.remoteVideo.videoWidth}x${this.remoteVideo.videoHeight}`;
        }
    }

    updateViewerCount(count) {
        this.viewerCount.textContent = count;
    }

    updateVolumeIcon() {
        const svg = this.volumeBtn.querySelector('svg');
        if (this.remoteVideo.muted) {
            svg.innerHTML = `
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            `;
        } else {
            svg.innerHTML = `
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        }
    }

    showOverlay() {
        this.videoOverlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.videoOverlay.classList.add('hidden');
    }

    showLiveBadge() {
        this.liveBadge.style.display = 'flex';
    }

    hideLiveBadge() {
        this.liveBadge.style.display = 'none';
    }

    cleanup() {
        this.stopStatsMonitoring();

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.remoteVideo.srcObject) {
            this.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            this.remoteVideo.srcObject = null;
        }

        this.videoQuality.textContent = '-';
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const viewer = new StreamViewer();
});

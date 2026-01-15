// Broadcaster.js - WebRTC Client for broadcasting the stream

const CONFIG = {
    // Change this to your signaling server URL when deployed
    SIGNALING_SERVER: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://mohlive.onrender.com',

    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

class StreamBroadcaster {
    constructor() {
        this.socket = null;
        this.peerConnections = new Map(); // Support multiple viewers
        this.localStream = null;

        // DOM elements
        this.localVideo = document.getElementById('localVideo');
        this.previewOverlay = document.getElementById('previewOverlay');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.broadcastStatus = document.getElementById('broadcastStatus');
        this.connectionStateBroadcast = document.getElementById('connectionStateBroadcast');
        this.viewerCountBroadcast = document.getElementById('viewerCountBroadcast');
        this.bitrate = document.getElementById('bitrate');

        this.startBroadcastBtn = document.getElementById('startBroadcastBtn');
        this.stopBroadcastBtn = document.getElementById('stopBroadcastBtn');
        this.toggleVideoBtn = document.getElementById('toggleVideoBtn');
        this.toggleAudioBtn = document.getElementById('toggleAudioBtn');
        this.switchCameraBtn = document.getElementById('switchCameraBtn');

        this.cameraSelect = document.getElementById('cameraSelect');
        this.micSelect = document.getElementById('micSelect');
        this.qualitySelect = document.getElementById('qualitySelect');

        this.isBroadcasting = false;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.currentCamera = 'user'; // 'user' for front, 'environment' for back
        this.devices = { cameras: [], microphones: [] };
        this.wakeLock = null; // Wake Lock to keep screen on

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.enumerateDevices();
        this.connectToSignalingServer();
    }

    setupEventListeners() {
        this.startBroadcastBtn.addEventListener('click', () => this.startBroadcast());
        this.stopBroadcastBtn.addEventListener('click', () => this.stopBroadcast());
        this.toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.toggleAudioBtn.addEventListener('click', () => this.toggleAudio());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());

        this.cameraSelect.addEventListener('change', (e) => this.changeCamera(e.target.value));
        this.micSelect.addEventListener('change', (e) => this.changeMicrophone(e.target.value));
        this.qualitySelect.addEventListener('change', () => this.updateStreamQuality());
    }

    async enumerateDevices() {
        try {
            // Request permissions first
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices.cameras = devices.filter(d => d.kind === 'videoinput');
            this.devices.microphones = devices.filter(d => d.kind === 'audioinput');

            this.populateDeviceSelects();
        } catch (error) {
            console.error('Error enumerating devices:', error);
            alert('Erreur: Impossible d\'accéder aux périphériques média. Veuillez autoriser l\'accès à la caméra et au microphone.');
        }
    }

    populateDeviceSelects() {
        // Populate camera select
        this.cameraSelect.innerHTML = '';
        this.devices.cameras.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Caméra ${index + 1}`;
            this.cameraSelect.appendChild(option);
        });

        // Populate microphone select
        this.micSelect.innerHTML = '';
        this.devices.microphones.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            this.micSelect.appendChild(option);
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
                this.updateStatus('Prêt à diffuser', 'offline');
                this.connectionStateBroadcast.textContent = 'Connecté';
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from signaling server');
                this.updateStatus('Déconnecté', 'offline');
                this.connectionStateBroadcast.textContent = 'Déconnecté';
            });

            this.socket.on('viewer-ready', async (viewerId) => {
                console.log('New viewer ready:', viewerId);
                await this.handleNewViewer(viewerId);
            });

            this.socket.on('answer', async ({ viewerId, answer }) => {
                console.log('Received answer from viewer:', viewerId);
                await this.handleAnswer(viewerId, answer);
            });

            this.socket.on('ice-candidate', async ({ viewerId, candidate }) => {
                console.log('Received ICE candidate from viewer:', viewerId);
                await this.handleIceCandidate(viewerId, candidate);
            });

            this.socket.on('viewer-disconnected', (viewerId) => {
                console.log('Viewer disconnected:', viewerId);
                this.removeViewer(viewerId);
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

    async startBroadcast() {
        try {
            console.log('Starting broadcast...');
            this.updateStatus('Démarrage...', 'offline');

            // Get media stream
            await this.getMediaStream();

            // Notify signaling server
            this.socket.emit('broadcaster-start');

            this.isBroadcasting = true;
            this.startBroadcastBtn.style.display = 'none';
            this.stopBroadcastBtn.style.display = 'flex';
            this.recordingIndicator.style.display = 'flex';
            this.previewOverlay.classList.add('hidden');

            // Request wake lock to keep screen on
            await this.requestWakeLock();

            this.updateStatus('En direct', 'online');

            console.log('Broadcast started successfully');

        } catch (error) {
            console.error('Error starting broadcast:', error);
            alert('Erreur lors du démarrage de la diffusion: ' + error.message);
            this.updateStatus('Erreur', 'offline');
        }
    }

    async stopBroadcast() {
        console.log('Stopping broadcast...');

        // Close all peer connections
        this.peerConnections.forEach((pc, viewerId) => {
            pc.close();
        });
        this.peerConnections.clear();

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Notify signaling server
        this.socket.emit('broadcaster-stop');

        this.isBroadcasting = false;
        this.startBroadcastBtn.style.display = 'flex';
        this.stopBroadcastBtn.style.display = 'none';
        this.recordingIndicator.style.display = 'none';
        this.previewOverlay.classList.remove('hidden');

        // Release wake lock
        this.releaseWakeLock();

        this.updateStatus('Prêt à diffuser', 'offline');
        this.viewerCountBroadcast.textContent = '0';

        console.log('Broadcast stopped');
    }

    async getMediaStream() {
        const quality = this.qualitySelect.value;
        const constraints = {
            video: {
                deviceId: this.cameraSelect.value ? { exact: this.cameraSelect.value } : undefined,
                width: { ideal: parseInt(quality) * 16 / 9 },
                height: { ideal: parseInt(quality) },
                facingMode: this.currentCamera
            },
            audio: {
                deviceId: this.micSelect.value ? { exact: this.micSelect.value } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };

        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localVideo.srcObject = this.localStream;

        console.log('Media stream acquired');
    }

    async handleNewViewer(viewerId) {
        try {
            if (!this.localStream) {
                console.error('No local stream available');
                return;
            }

            // Create peer connection for this viewer
            const peerConnection = new RTCPeerConnection({
                iceServers: CONFIG.ICE_SERVERS
            });

            // Add local stream tracks
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        viewerId,
                        candidate: event.candidate
                    });
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`Viewer ${viewerId} connection state:`, peerConnection.connectionState);
            };

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            this.socket.emit('offer', { viewerId, offer });

            // Store peer connection
            this.peerConnections.set(viewerId, peerConnection);

            console.log('Offer sent to viewer:', viewerId);

        } catch (error) {
            console.error('Error handling new viewer:', error);
        }
    }

    async handleAnswer(viewerId, answer) {
        try {
            const peerConnection = this.peerConnections.get(viewerId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('Remote description set for viewer:', viewerId);
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(viewerId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(viewerId);
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('ICE candidate added for viewer:', viewerId);
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    removeViewer(viewerId) {
        const peerConnection = this.peerConnections.get(viewerId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(viewerId);
            console.log('Viewer removed:', viewerId);
        }
    }

    async toggleVideo() {
        if (!this.localStream) return;

        this.isVideoEnabled = !this.isVideoEnabled;
        this.localStream.getVideoTracks().forEach(track => {
            track.enabled = this.isVideoEnabled;
        });

        this.toggleVideoBtn.classList.toggle('active', this.isVideoEnabled);

        if (!this.isVideoEnabled) {
            this.previewOverlay.classList.remove('hidden');
        } else {
            this.previewOverlay.classList.add('hidden');
        }
    }

    async toggleAudio() {
        if (!this.localStream) return;

        this.isAudioEnabled = !this.isAudioEnabled;
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = this.isAudioEnabled;
        });

        this.toggleAudioBtn.classList.toggle('active', this.isAudioEnabled);
    }

    async switchCamera() {
        if (!this.isBroadcasting) {
            this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
            return;
        }

        try {
            // Stop current video track
            this.localStream.getVideoTracks().forEach(track => track.stop());

            // Get new video track with switched camera
            this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
            const quality = this.qualitySelect.value;

            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: parseInt(quality) * 16 / 9 },
                    height: { ideal: parseInt(quality) },
                    facingMode: this.currentCamera
                }
            });

            const newVideoTrack = videoStream.getVideoTracks()[0];

            // Replace track in local stream
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            this.localStream.removeTrack(oldVideoTrack);
            this.localStream.addTrack(newVideoTrack);

            // Update local video
            this.localVideo.srcObject = this.localStream;

            // Replace track in all peer connections
            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(newVideoTrack);
                }
            });

            console.log('Camera switched to:', this.currentCamera);

        } catch (error) {
            console.error('Error switching camera:', error);
            alert('Erreur lors du changement de caméra');
        }
    }

    async changeCamera(deviceId) {
        if (!this.isBroadcasting || !deviceId) return;

        try {
            const quality = this.qualitySelect.value;
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: parseInt(quality) * 16 / 9 },
                    height: { ideal: parseInt(quality) }
                }
            });

            const newVideoTrack = videoStream.getVideoTracks()[0];
            const oldVideoTrack = this.localStream.getVideoTracks()[0];

            this.localStream.removeTrack(oldVideoTrack);
            this.localStream.addTrack(newVideoTrack);
            oldVideoTrack.stop();

            this.localVideo.srcObject = this.localStream;

            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(newVideoTrack);
                }
            });

        } catch (error) {
            console.error('Error changing camera:', error);
        }
    }

    async changeMicrophone(deviceId) {
        if (!this.isBroadcasting || !deviceId) return;

        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const newAudioTrack = audioStream.getAudioTracks()[0];
            const oldAudioTrack = this.localStream.getAudioTracks()[0];

            this.localStream.removeTrack(oldAudioTrack);
            this.localStream.addTrack(newAudioTrack);
            oldAudioTrack.stop();

            this.peerConnections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                if (sender) {
                    sender.replaceTrack(newAudioTrack);
                }
            });

        } catch (error) {
            console.error('Error changing microphone:', error);
        }
    }

    async updateStreamQuality() {
        if (!this.isBroadcasting) return;

        // This would require restarting the stream with new constraints
        alert('Veuillez arrêter et redémarrer la diffusion pour changer la qualité');
    }

    updateStatus(text, state) {
        const statusText = this.broadcastStatus.querySelector('.status-text');
        const statusIndicator = this.broadcastStatus.querySelector('.status-indicator');

        statusText.textContent = text;
        statusIndicator.className = `status-indicator ${state}`;
    }

    updateViewerCount(count) {
        this.viewerCountBroadcast.textContent = count;
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock activated - screen will stay on');

                // Re-request wake lock if it's released (e.g., when switching tabs)
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                    if (this.isBroadcasting) {
                        this.requestWakeLock();
                    }
                });
            } else {
                console.warn('Wake Lock API not supported on this device');
            }
        } catch (error) {
            console.error('Error requesting wake lock:', error);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release()
                .then(() => {
                    console.log('Wake Lock released successfully');
                    this.wakeLock = null;
                })
                .catch((error) => {
                    console.error('Error releasing wake lock:', error);
                });
        }
    }
}

// Initialize broadcaster when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const broadcaster = new StreamBroadcaster();
});

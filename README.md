# WebRTC Live Streaming Platform 🎥

Une plateforme de streaming en direct utilisant WebRTC pour diffuser depuis votre téléphone vers votre site web en temps réel.

## ✨ Fonctionnalités

- 📱 **Streaming depuis mobile** - Diffusez directement depuis le navigateur de votre téléphone
- 🎬 **Qualité HD** - Support jusqu'à 1080p
- ⚡ **Latence ultra-faible** - Moins de 500ms grâce à WebRTC
- 👥 **Multi-spectateurs** - Plusieurs personnes peuvent regarder simultanément
- 🎛️ **Contrôles complets** - Changement de caméra, micro, qualité en direct
- 🎨 **Design moderne** - Interface utilisateur premium et responsive

## 🚀 Installation

### Prérequis

- Node.js 14+ installé sur votre ordinateur
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

### Étape 1 : Installer les dépendances

```bash
npm install
```

### Étape 2 : Démarrer le serveur de signaling

```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

## 📖 Utilisation

### Pour le Broadcaster (Celui qui filme)

1. Ouvrez `broadcast.html` dans votre navigateur
2. Autorisez l'accès à la caméra et au microphone
3. Choisissez vos paramètres (caméra, micro, qualité)
4. Cliquez sur "Démarrer la Diffusion"
5. Votre stream est maintenant en direct !

### Pour les Spectateurs

1. Ouvrez `index.html` dans votre navigateur
2. Le stream apparaîtra automatiquement quand le broadcaster est en ligne
3. Profitez du stream en temps réel !

## 📱 Utilisation sur Mobile

### Pour diffuser depuis votre téléphone :

1. Assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau WiFi
2. Trouvez l'adresse IP locale de votre ordinateur :
   - **Windows** : `ipconfig` dans le terminal (cherchez "IPv4 Address")
   - **Mac/Linux** : `ifconfig` ou `ip addr`
3. Sur votre téléphone, ouvrez le navigateur et allez à : `http://[VOTRE-IP]:3000/broadcast.html`
   - Exemple : `http://192.168.1.100:3000/broadcast.html`
4. Autorisez l'accès à la caméra et au microphone
5. Démarrez la diffusion !

## 🌐 Déploiement en Production

### Option 1 : Render (Recommandé - Gratuit)

1. Créez un compte sur [Render.com](https://render.com)
2. Créez un nouveau "Web Service"
3. Connectez votre repository GitHub
4. Configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Environment** : Node
5. Déployez !

### Option 2 : Railway

1. Créez un compte sur [Railway.app](https://railway.app)
2. Créez un nouveau projet
3. Déployez depuis GitHub
4. Railway détectera automatiquement votre application Node.js

### Option 3 : Heroku

```bash
# Installer Heroku CLI
heroku login
heroku create votre-app-name
git push heroku main
```

### Configuration après déploiement

Une fois déployé, mettez à jour l'URL du serveur de signaling dans :
- `viewer.js` (ligne 3)
- `broadcaster.js` (ligne 3)

Remplacez `http://localhost:3000` par l'URL de votre serveur déployé.

## 🔧 Configuration Avancée

### Changer le port du serveur

Modifiez la variable `PORT` dans `server.js` ou utilisez une variable d'environnement :

```bash
PORT=8080 npm start
```

### Serveurs STUN/TURN personnalisés

Pour une meilleure connectivité, vous pouvez ajouter vos propres serveurs TURN dans `viewer.js` et `broadcaster.js` :

```javascript
ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'password'
    }
]
```

Services TURN gratuits/payants :
- [Twilio STUN/TURN](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- [Metered](https://www.metered.ca/tools/openrelay/)

## 🛠️ Structure du Projet

```
.
├── index.html          # Page d'accueil / Spectateurs
├── broadcast.html      # Page broadcaster
├── styles.css          # Styles CSS
├── viewer.js           # Client WebRTC pour spectateurs
├── broadcaster.js      # Client WebRTC pour broadcaster
├── server.js           # Serveur de signaling Socket.IO
├── package.json        # Dépendances Node.js
└── README.md          # Ce fichier
```

## 🔒 Sécurité & HTTPS

Pour utiliser WebRTC en production, vous **devez** utiliser HTTPS. Les navigateurs bloquent l'accès à la caméra/micro sur HTTP (sauf localhost).

Les plateformes comme Render, Railway et Heroku fournissent automatiquement HTTPS.

## 🐛 Dépannage

### Le stream ne s'affiche pas

1. Vérifiez que le serveur de signaling est démarré
2. Ouvrez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que l'URL du serveur est correcte dans `viewer.js` et `broadcaster.js`
4. Assurez-vous d'avoir autorisé l'accès à la caméra/micro

### Problèmes de connexion

1. Vérifiez votre pare-feu
2. Si vous êtes derrière un NAT strict, vous aurez besoin d'un serveur TURN
3. Testez d'abord en local avant de déployer

### Qualité vidéo faible

1. Vérifiez votre connexion internet
2. Réduisez la qualité dans les paramètres
3. Assurez-vous d'avoir une bonne connexion WiFi (pas de 4G instable)

## 📚 Technologies Utilisées

- **WebRTC** - Streaming peer-to-peer
- **Socket.IO** - Signaling en temps réel
- **Express.js** - Serveur web
- **HTML5/CSS3/JavaScript** - Frontend moderne

## 🤝 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

## 📄 Licence

MIT License - Utilisez librement pour vos projets !

---

**Bon streaming ! 🎬✨**

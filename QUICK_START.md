# 🚀 Guide de Démarrage Rapide

## Étapes pour tester localement (sur le même ordinateur)

### 1. Démarrer le serveur

Ouvrez un terminal dans ce dossier et exécutez :

```bash
npm start
```

Vous devriez voir :
```
✅ Signaling server running on port 3000
📡 WebSocket endpoint: ws://localhost:3000
🏥 Health check: http://localhost:3000/health
```

### 2. Tester le broadcaster

1. Ouvrez votre navigateur
2. Allez à : `http://localhost:3000/broadcast.html`
3. Autorisez l'accès à la caméra et au microphone
4. Cliquez sur "Démarrer la Diffusion"

### 3. Tester le viewer

1. Ouvrez un autre onglet (ou un autre navigateur)
2. Allez à : `http://localhost:3000/index.html`
3. Vous devriez voir votre stream en direct !

---

## 📱 Pour diffuser depuis votre téléphone

### Étape 1 : Trouver votre adresse IP locale

**Sur Windows :**
```bash
ipconfig
```
Cherchez "Adresse IPv4" (exemple : 192.168.1.100)

**Sur Mac/Linux :**
```bash
ifconfig | grep inet
```

### Étape 2 : Démarrer le serveur

```bash
npm start
```

### Étape 3 : Sur votre téléphone

1. Connectez votre téléphone au **même WiFi** que votre ordinateur
2. Ouvrez le navigateur de votre téléphone (Chrome ou Safari)
3. Allez à : `http://[VOTRE-IP]:3000/broadcast.html`
   - Exemple : `http://192.168.1.100:3000/broadcast.html`
4. Autorisez la caméra et le micro
5. Démarrez la diffusion !

### Étape 4 : Regarder sur votre ordinateur

Sur votre ordinateur, ouvrez : `http://localhost:3000/index.html`

---

## 🌐 Déployer en ligne (GRATUIT)

### Option 1 : Render.com (Recommandé)

1. Créez un compte sur https://render.com
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre compte GitHub et sélectionnez ce repository
4. Configurez :
   - **Name** : votre-nom-app
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free
5. Cliquez sur "Create Web Service"
6. Attendez le déploiement (5-10 minutes)
7. Vous recevrez une URL comme : `https://votre-app.onrender.com`

### Étape importante après déploiement :

Modifiez ces fichiers pour pointer vers votre serveur déployé :

**Dans `viewer.js` (ligne 3-4) :**
```javascript
SIGNALING_SERVER: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://votre-app.onrender.com',  // ← Changez ici
```

**Dans `broadcaster.js` (ligne 3-4) :**
```javascript
SIGNALING_SERVER: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://votre-app.onrender.com',  // ← Changez ici
```

Puis re-déployez sur Render (il se mettra à jour automatiquement si vous avez connecté GitHub).

### Option 2 : Héberger les fichiers HTML séparément

Vous pouvez aussi :
1. Héberger le serveur Node.js sur Render
2. Héberger les fichiers HTML/CSS/JS sur Netlify ou Vercel (gratuit)

**Sur Netlify :**
1. Créez un compte sur https://netlify.com
2. Glissez-déposez les fichiers : `index.html`, `broadcast.html`, `styles.css`, `viewer.js`, `broadcaster.js`
3. Netlify vous donnera une URL comme : `https://votre-site.netlify.app`

N'oubliez pas de mettre à jour l'URL du serveur dans `viewer.js` et `broadcaster.js` !

---

## ✅ Checklist de vérification

- [ ] Le serveur démarre sans erreur
- [ ] Je peux accéder à `http://localhost:3000/health` et voir un JSON
- [ ] La page broadcaster charge correctement
- [ ] La caméra s'active sur la page broadcaster
- [ ] La page viewer charge correctement
- [ ] Le stream apparaît sur la page viewer quand je diffuse

---

## 🆘 Problèmes courants

### "Cannot find module 'express'"
→ Exécutez `npm install`

### "Port 3000 is already in use"
→ Un autre programme utilise le port 3000. Changez le port dans `server.js` ou arrêtez l'autre programme.

### La caméra ne s'active pas
→ Vérifiez que vous avez autorisé l'accès dans les paramètres du navigateur.

### Le stream ne s'affiche pas
→ Ouvrez la console du navigateur (F12) et vérifiez les erreurs.

---

**Besoin d'aide ? Consultez le README.md complet !**

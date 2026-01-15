# Limitations du Streaming Mobile

## 🚨 Problème : Arrêt en arrière-plan

### Pourquoi le streaming s'arrête quand l'écran s'éteint ?

Les navigateurs mobiles (Chrome, Safari, Firefox) **suspendent automatiquement** les onglets en arrière-plan pour :

1. **Sécurité** : Empêcher l'enregistrement secret avec la caméra/micro
2. **Vie privée** : Protéger contre la surveillance non autorisée
3. **Batterie** : Économiser l'énergie en arrêtant les processus lourds

### Ce qui est suspendu :
- ❌ Accès à la caméra et au microphone
- ❌ Connexions WebRTC
- ❌ WebSockets
- ❌ Exécution JavaScript intensive

---

## ✅ Solution implémentée : Wake Lock API

J'ai ajouté la **Wake Lock API** qui :
- ✅ Empêche l'écran de s'éteindre automatiquement
- ✅ Maintient le streaming actif tant que l'écran est allumé
- ✅ Fonctionne sur Chrome/Edge mobile (Android)
- ⚠️ Ne fonctionne PAS sur Safari iOS (non supporté)

### Comment ça marche :
```javascript
// Quand vous démarrez la diffusion
await navigator.wakeLock.request('screen');
// L'écran reste allumé pendant toute la diffusion
```

### Limitations de cette solution :
- ⚠️ L'écran doit rester **allumé** (mais peut être verrouillé sur certains appareils)
- ⚠️ Si vous changez d'application, le streaming s'arrête quand même
- ⚠️ Ne fonctionne pas sur tous les navigateurs

---

## 🎯 Solutions complètes

### Option 1 : Application Native (Recommandé)
Pour un vrai streaming en arrière-plan, créez une **application mobile** :

**Technologies :**
- React Native
- Flutter
- Swift (iOS) / Kotlin (Android)

**Avantages :**
- ✅ Streaming en arrière-plan complet
- ✅ Notification persistante
- ✅ Contrôle même avec écran éteint
- ✅ Meilleure performance
- ✅ Accès aux APIs natives

### Option 2 : PWA avec Service Worker (Partiel)
Convertir en Progressive Web App :
- ✅ Installation sur l'écran d'accueil
- ✅ Meilleure intégration système
- ⚠️ Toujours limité en arrière-plan

### Option 3 : Garder l'écran allumé (Actuel)
Utiliser Wake Lock API (déjà implémenté) :
- ✅ Simple à implémenter
- ✅ Fonctionne dans le navigateur
- ⚠️ Écran doit rester allumé
- ⚠️ Consomme plus de batterie

---

## 📱 Compatibilité Wake Lock API

| Navigateur | Support | Notes |
|------------|---------|-------|
| Chrome Android | ✅ Oui | Fonctionne parfaitement |
| Edge Android | ✅ Oui | Fonctionne parfaitement |
| Firefox Android | ⚠️ Partiel | Support limité |
| Safari iOS | ❌ Non | Non supporté |
| Samsung Internet | ✅ Oui | Fonctionne |

---

## 💡 Recommandations

### Pour une utilisation immédiate (Web) :
1. ✅ Utilisez la version actuelle avec Wake Lock
2. ✅ Gardez l'écran allumé pendant la diffusion
3. ✅ Utilisez Chrome ou Edge sur Android
4. ⚠️ Évitez de changer d'application

### Pour une solution professionnelle :
1. 🎯 Développez une application native
2. 🎯 Utilisez React Native ou Flutter
3. 🎯 Publiez sur Google Play / App Store
4. 🎯 Profitez du streaming en arrière-plan complet

---

## 🔧 Tests

### Tester le Wake Lock :
1. Ouvrez la page de diffusion sur mobile
2. Démarrez le streaming
3. Attendez quelques minutes sans toucher l'écran
4. L'écran devrait rester allumé automatiquement

### Vérifier dans la console :
```
Wake Lock activated - screen will stay on
```

---

## 📚 Ressources

- [Wake Lock API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Can I Use - Wake Lock](https://caniuse.com/wake-lock)
- [WebRTC Background Limitations](https://developer.chrome.com/blog/background-tabs/)

# 🚀 Guide d'Installation - EPIL Inventaire

## ⚠️ Important : Pourquoi l'écran est blanc ?

**Vous ne pouvez PAS ouvrir `index.html` directement dans votre navigateur !**

Ce projet utilise Vite + React, qui nécessite un serveur de développement pour fonctionner. Ouvrir `index.html` directement donnera toujours un écran blanc.

---

## 📋 Prérequis

Avant de commencer, vous devez installer **Node.js** sur votre ordinateur.

### Installation de Node.js

1. Allez sur : https://nodejs.org/
2. Téléchargez la version **LTS** (version recommandée)
3. Installez Node.js en suivant l'assistant d'installation
4. Vérifiez l'installation en ouvrant un terminal et tapant :
   ```bash
   node --version
   npm --version
   ```
   Vous devriez voir les numéros de version s'afficher.

---

## 🛠️ Installation du Projet

### Méthode 1 : Depuis GitHub (Recommandé)

#### Étape 1 : Connecter le projet à GitHub

1. Sur Lovable, cliquez sur l'icône **GitHub** en haut à droite
2. Connectez votre compte GitHub
3. Transférez le projet vers un nouveau repository GitHub

#### Étape 2 : Cloner le projet sur votre ordinateur

1. Ouvrez un terminal (ou PowerShell sur Windows)
2. Naviguez vers le dossier où vous voulez mettre le projet :
   ```bash
   cd C:\Users\VotreNom\Documents
   ```
3. Clonez le repository :
   ```bash
   git clone https://github.com/votre-nom/nom-du-projet.git
   ```
4. Entrez dans le dossier du projet :
   ```bash
   cd nom-du-projet
   ```

#### Étape 3 : Installer les dépendances

Dans le terminal, à la racine du projet, tapez :
```bash
npm install
```
⏳ Cela peut prendre quelques minutes la première fois.

#### Étape 4 : Lancer le projet

```bash
npm run dev
```

✅ Vous verrez un message comme :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

#### Étape 5 : Ouvrir dans le navigateur

Ouvrez votre navigateur et allez sur : **http://localhost:8080**

🎉 Votre application devrait maintenant fonctionner !

---

### Méthode 2 : Téléchargement Direct

#### Étape 1 : Télécharger le code

1. Sur Lovable, cliquez sur le nom du projet en haut à gauche
2. Allez dans **Paramètres** > **Exporter le projet**
3. Téléchargez le fichier ZIP
4. Décompressez le fichier dans un dossier de votre choix

#### Étape 2 : Installer et lancer

Suivez les **Étapes 3, 4 et 5** de la Méthode 1 ci-dessus.

---

## 🔧 Éditer le Code avec Visual Studio Code

### Installation de VS Code

1. Téléchargez VS Code : https://code.visualstudio.com/
2. Installez-le sur votre ordinateur

### Ouvrir le projet

1. Ouvrez VS Code
2. Cliquez sur **Fichier** > **Ouvrir le dossier**
3. Sélectionnez le dossier de votre projet
4. Vous pouvez maintenant éditer tous les fichiers !

### Extensions recommandées

Pour une meilleure expérience, installez ces extensions dans VS Code :
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **ESLint**

---

## 📝 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm install` | Installe toutes les dépendances |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Crée une version de production |
| `npm run preview` | Prévisualise la version de production |

---

## ❓ Problèmes Courants

### L'écran reste blanc
- ✅ Assurez-vous d'avoir lancé `npm run dev`
- ✅ Vérifiez que vous êtes sur http://localhost:8080
- ✅ Ne pas ouvrir index.html directement !

### "npm n'est pas reconnu"
- ✅ Node.js n'est pas installé ou mal configuré
- ✅ Réinstallez Node.js et redémarrez votre terminal

### Erreur lors de `npm install`
- ✅ Supprimez le dossier `node_modules` et le fichier `package-lock.json`
- ✅ Relancez `npm install`

### Le port 8080 est déjà utilisé
- ✅ Fermez l'autre application utilisant ce port
- ✅ Ou modifiez le port dans `vite.config.ts`

---

## 🌐 Déploiement en Ligne (GRATUIT)

Pour mettre votre application en ligne gratuitement :

### Option 1 : Vercel (Recommandé)

1. Créez un compte sur https://vercel.com
2. Connectez votre repository GitHub
3. Cliquez sur **Import Project**
4. Sélectionnez votre projet
5. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
6. Cliquez sur **Deploy**

✅ Votre site sera accessible sur une URL comme : `votre-projet.vercel.app`

### Option 2 : Netlify

1. Créez un compte sur https://netlify.com
2. Cliquez sur **Add new site** > **Import an existing project**
3. Connectez GitHub et sélectionnez votre projet
4. Build command : `npm run build`
5. Publish directory : `dist`
6. Ajoutez les variables d'environnement
7. Cliquez sur **Deploy**

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js est bien installé
2. Vérifiez que vous avez lancé `npm install` avant `npm run dev`
3. Consultez les logs dans le terminal pour voir les erreurs

---

**Bon développement ! 🎉**

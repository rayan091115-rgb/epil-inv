

## Diagnostic : Page blanche

### Cause probable

L'application rend correctement mais l'utilisateur n'est pas authentifié, donc il voit la page `/auth` qui a un fond `hsl(0 0% 98%)` (quasi-blanc). Le formulaire de connexion est centré mais peut sembler invisible si le contraste est insuffisant avec le design monochrome actuel.

Alternativement, une erreur runtime silencieuse pourrait empêcher le rendu complet.

### Plan de correction

1. **Améliorer la visibilité de la page Auth** : Ajouter une bordure visible et une ombre au formulaire de connexion pour qu'il se distingue clairement du fond blanc. Ajouter un fond légèrement plus contrasté ou un logo/titre visible en haut de page.

2. **Ajouter un ErrorBoundary global** dans `App.tsx` pour capturer les erreurs React silencieuses qui causeraient un écran blanc, avec un message d'erreur visible à l'utilisateur.

3. **Améliorer le LoadingSpinner** dans `Index.tsx` pour qu'il soit plus visible (texte plus foncé, spinner plus grand, fond légèrement contrasté).

4. **Vérifier et corriger le contraste** dans `src/index.css` : s'assurer que les `glass-card` ont une bordure visible en mode clair (`border: 1px solid hsl(0 0% 85%)` au lieu de `rgba(0,0,0,0.06)`).

### Fichiers à modifier
- `src/App.tsx` — ajouter ErrorBoundary
- `src/pages/Auth.tsx` — améliorer contraste visuel
- `src/index.css` — renforcer bordures glass-card en mode clair
- `src/pages/Index.tsx` — améliorer le spinner de chargement


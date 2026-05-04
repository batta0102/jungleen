# Configuration des Routes Angular - Buddy System

## 📁 Structure des fichiers

```
src/Frontend/app/
├── guards/
│   ├── auth.guard.ts           # Guard d'authentification
│   └── admin.guard.ts          # Guard d'administration
├── routes/
│   ├── buddy.routes.ts         # Routes du système buddy
│   └── access-denied.routes.ts # Route d'accès refusé
├── pages/
│   ├── access-denied/          # Page d'accès refusé
│   └── [autres composants...]
├── app.routes.ts               # Configuration principale des routes
└── app.config.ts               # Configuration de l'application
```

## 🛡️ Guards de sécurité

### AuthGuard
- **Fichier** : `guards/auth.guard.ts`
- **Rôle** : Vérifie si l'utilisateur est authentifié
- **Redirection** : Vers `/login` si non connecté
- **Utilisation** : Protège toutes les routes nécessitant une connexion

### AdminGuard
- **Fichier** : `guards/admin.guard.ts`
- **Rôle** : Vérifie si l'utilisateur a le rôle 'admin'
- **Redirection** : Vers `/access-denied` si non administrateur
- **Utilisation** : Protège les routes d'administration

## 🛣️ Routes configurées

### Routes Utilisateurs (Front)
- `/buddies` → Liste des buddies de l'utilisateur
- `/buddies/request` → Formulaire de demande de buddy
- `/buddies/:id` → Détails d'un buddy spécifique
- `/buddies/:id/plan-session` → Planifier une session

### Routes Administrateurs (Dashboard)
- `/admin/buddies/requests` → Gestion des demandes de buddies
- `/admin/buddies/monitoring` → Monitoring du système buddy
- `/admin/clubs/:id/buddies` → Buddies d'un club spécifique

### Route d'Accès Refusé
- `/access-denied` → Page d'erreur pour permissions insuffisantes

## 🔧 Configuration

### Dans `app.routes.ts`
```typescript
export const routes: Routes = [
  // Routes existantes...
  {
    path: 'buddies',
    children: BUDDY_ROUTES  // Routes utilisateurs avec AuthGuard
  },
  {
    path: 'admin',
    children: BUDDY_ROUTES.filter(route => route.path === 'admin')
      .flatMap(route => route.children || [])  // Routes admin avec AuthGuard + AdminGuard
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied.component')
  }
];
```

### Dans `buddy.routes.ts`
```typescript
export const BUDDY_ROUTES: Routes = [
  {
    path: 'buddies',
    children: [
      // Routes utilisateurs (AuthGuard uniquement)
      {
        path: '',
        loadComponent: () => import('../pages/user-buddies/user-buddies.component'),
        canActivate: [AuthGuard]
      },
      // ...
    ]
  },
  {
    path: 'admin',
    children: [
      // Routes admin (AuthGuard + AdminGuard)
      {
        path: 'buddies/requests',
        loadComponent: () => import('../pages/admin-buddy-requests/admin-buddy-requests.component'),
        canActivate: [AuthGuard, AdminGuard]
      },
      // ...
    ]
  }
];
```

## 🚀 Utilisation

### Accès aux routes
```typescript
// Navigation programmatique
this.router.navigate(['/buddies']);                    // Utilisateur
this.router.navigate(['/buddies/request']);              // Utilisateur
this.router.navigate(['/admin/buddies/requests']);       // Admin
this.router.navigate(['/admin/clubs/1/buddies']);        // Admin
```

### Dans les templates
```html
<a routerLink="/buddies">Mes Buddies</a>
<a routerLink="/buddies/request">Demander un Buddy</a>
<a routerLink="/admin/buddies/requests">Demandes</a>
```

## 🔒 Sécurité

### Flow d'authentification
1. **AuthGuard** : Vérifie la présence d'un utilisateur connecté
2. **AdminGuard** : Vérifie le rôle administrateur (après AuthGuard)
3. **Redirection** : Vers login ou access-denied selon le cas

### Rôles supportés
- `student` : Utilisateur standard (accès routes buddies)
- `tutor` : Utilisateur avancé (accès routes buddies)
- `admin` : Administrateur (accès toutes les routes)

## 📄 Pages d'erreur

### Access Denied
- **Composant** : `AccessDeniedComponent`
- **Template** : Page moderne avec message explicatif
- **Actions** : Retour à l'accueil ou page précédente
- **Style** : Design avec Tailwind CSS et animations

## 🎯 Bonnes pratiques

1. **Toujours utiliser les guards** pour les routes protégées
2. **Gérer les redirections** vers des pages appropriées
3. **Afficher des messages clairs** en cas d'accès refusé
4. **Maintenir la cohérence** des URLs et des titres de page
5. **Tester les différents rôles** et leurs permissions

## 🔄 Navigation

### Hiérarchie des routes
```
/
├── /front/...           (Application frontend existante)
├── /back/...            (Application backend existante)
├── /buddies/...         (Système buddy - utilisateurs)
├── /admin/...           (Administration - admins uniquement)
└── /access-denied       (Page d'erreur)
```

### Guards appliqués
- **Routes utilisateurs** : `AuthGuard`
- **Routes admin** : `AuthGuard` + `AdminGuard`
- **Routes publiques** : Aucun guard

Cette configuration assure une séparation claire entre les espaces utilisateur et administrateur tout en maintenant une sécurité robuste.

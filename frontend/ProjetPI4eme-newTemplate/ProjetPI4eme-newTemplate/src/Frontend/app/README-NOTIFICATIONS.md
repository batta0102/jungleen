# Service de Notifications - Buddy System

## 📁 Structure des fichiers

```
src/Frontend/app/
├── services/
│   └── notification.service.ts        # Service principal de notifications
├── components/
│   ├── toast/
│   │   ├── toast.component.ts          # Composant Toast
│   │   ├── toast.component.html        # Template du Toast
│   │   └── toast.component.scss        # Styles du Toast
│   └── notification-center/
│       ├── notification-center.component.ts    # Centre de notifications
│       ├── notification-center.component.html  # Template du centre
│       └── notification-center.component.scss  # Styles du centre
└── README-NOTIFICATIONS.md             # Documentation
```

## 🎯 Fonctionnalités

### **Service de Notifications (`notification.service.ts`)**
- ✅ **Types de notifications** : Success, Error, Warning, Info
- ✅ **Événements buddy** : Demande envoyée/acceptée/refusée, session planifiée/confirmée
- ✅ **Gestion des toasts** : Auto-dismiss, actions personnalisées
- ✅ **Historique** : Stockage et gestion des notifications
- ✅ **Navigation** : Actions contextuelles vers les pages appropriées

### **Composant Toast (`toast.component.ts`)**
- ✅ **Affichage temporaire** : Toasts avec auto-dismiss
- ✅ **Types visuels** : Couleurs et icônes selon le type
- ✅ **Actions** : Boutons d'action personnalisables
- ✅ **Barre de progression** : Indication visuelle du temps restant
- ✅ **Responsive** : Adaptation mobile/desktop

### **Centre de Notifications (`notification-center.component.ts`)**
- ✅ **Liste complète** : Historique des notifications
- ✅ **Badge de compteur** : Nombre de notifications non lues
- ✅ **Actions groupées** : Tout marquer comme lu, vider tout
- ✅ **Filtrage** : Notifications récentes
- ✅ **Gestion individuelle** : Marquer comme lu, supprimer

## 🚀 Utilisation

### **Dans les composants**

```typescript
import { NotificationService } from '../../services/notification.service';

@Component({...})
export class MyComponent {
  constructor(private notificationService: NotificationService) {}

  // Demande de buddy envoyée
  sendBuddyRequest() {
    // ... logique d'envoi
    this.notificationService.showBuddyRequestSent('Alice Martin');
  }

  // Session planifiée
  planSession() {
    // ... logique de planification
    this.notificationService.showSessionPlanned('Bob Dupont', new Date());
  }

  // Notification générique
  showError() {
    this.notificationService.showError('Erreur', 'Une erreur est survenue');
  }
}
```

### **Dans les templates**

```html
<!-- Toast global (à placer dans app.component.html) -->
<app-toast></app-toast>

<!-- Centre de notifications (à placer dans la navbar) -->
<app-notification-center></app-notification-center>
```

## 📋 Types de notifications

### **Événements Buddy System**

#### **Demande de buddy**
```typescript
// Demande envoyée
notificationService.showBuddyRequestSent('Alice Martin');

// Demande acceptée
notificationService.showBuddyRequestAccepted('Bob Dupont');

// Demande refusée
notificationService.showBuddyRequestRejected('Claire Bernard');
```

#### **Sessions**
```typescript
// Session planifiée
notificationService.showSessionPlanned('David Petit', new Date());

// Session confirmée
notificationService.showSessionConfirmed('Emma Leroy');

// Session annulée
notificationService.showSessionCancelled('Frank Moreau');

// Session terminée
notificationService.showSessionCompleted('Grace Robert');
```

#### **Buddy terminé**
```typescript
notificationService.showBuddyTerminated('Henry Dubois');
```

### **Notifications génériques**

```typescript
// Succès
notificationService.showSuccess('Opération réussie', 'Les données ont été sauvegardées');

// Erreur
notificationService.showError('Erreur de connexion', 'Vérifiez votre connexion internet');

// Avertissement
notificationService.showWarning('Attention', 'Certaines modifications n\'ont pas été sauvegardées');

// Information
notificationService.showInfo('Information', 'Nouvelle version disponible');
```

## 🎨 Personnalisation

### **Durées par défaut**
```typescript
private readonly DEFAULT_DURATIONS = {
  [NotificationType.SUCCESS]: 4000,  // 4 secondes
  [NotificationType.ERROR]: 6000,    // 6 secondes
  [NotificationType.WARNING]: 5000,  // 5 secondes
  [NotificationType.INFO]: 3000     // 3 secondes
};
```

### **Actions personnalisées**
```typescript
notificationService.showToast({
  type: NotificationType.SUCCESS,
  title: 'Succès !',
  message: 'Opération réussie',
  action: {
    label: 'Voir les détails',
    callback: () => {
      // Navigation ou autre action
      this.router.navigate(['/details']);
    }
  }
});
```

## 🔄 Intégration avec les composants existants

### **Dans `user-buddy-request.component.ts`**
```typescript
onSubmit(): void {
  // ... logique de soumission
  this.notificationService.showBuddyRequestSent(this.getSelectedPartnerName());
}
```

### **Dans `user-plan-session.component.ts`**
```typescript
onSubmit(): void {
  // ... logique de planification
  this.notificationService.showSessionPlanned(
    this.getPartnerName(), 
    this.sessionForm.get('dateSession')?.value
  );
}
```

### **Dans `admin-buddy-requests.component.ts`**
```typescript
acceptRequest(requestId: number): void {
  // ... logique d'acceptation
  this.notificationService.showSuccess('Demande acceptée', 'La demande de buddy a été acceptée');
}
```

## 📊 État des notifications

### **Propriétés du service**
- `notifications` : Liste complète des notifications
- `currentToast` : Toast actuellement affiché
- `unreadCount` : Nombre de notifications non lues

### **Méthodes de gestion**
- `markAsRead(id)` : Marquer comme lu
- `markAllAsRead()` : Tout marquer comme lu
- `removeNotification(id)` : Supprimer une notification
- `clearAllNotifications()` : Vider tout
- `getUnreadCount()` : Obtenir le compteur

## 🎯 Points forts

### **Expérience utilisateur**
- 🎨 **Toasts non-intrusifs** : Informations rapides sans interruption
- 📊 **Centre de notifications** : Historique complet accessible
- 🔄 **Actions contextuelles** : Navigation directe vers les pages concernées
- ⏱️ **Auto-dismiss intelligent** : Durées adaptées selon le type

### **Développement**
- 🏗️ **Architecture modulaire** : Service + composants réutilisables
- 🎯 **Types forts** : Enums TypeScript pour la sécurité
- 📱 **Responsive design** : Adaptation mobile/desktop
- ♿ **Accessibilité** : ARIA labels et navigation clavier

### **Personnalisation**
- 🎨 **Thèmes** : Couleurs et styles personnalisables
- ⚙️ **Configuration** : Durées et comportements ajustables
- 🔧 **Extensibilité** : Ajout facile de nouveaux types
- 📊 **Analytics** : Tracking possible des interactions

## 🚀 Intégration finale

Pour une intégration complète, ajoutez les composants dans votre layout principal :

```html
<!-- Dans app.component.html ou le layout principal -->
<app-toast></app-toast>

<!-- Dans la navbar -->
<app-notification-center></app-notification-center>
```

Le système de notifications est maintenant prêt à améliorer l'expérience utilisateur du Buddy System ! 🎉

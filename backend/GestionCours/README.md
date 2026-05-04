# GestionCours – Module Advanced Attendance

## Résumé

- **Backend** : Spring Boot (port **8098**), API sous `/advanced` (présences + progrès).
- **Frontend** : Angular 18 (port **4300**), page **Présences** avec tableau et enregistrement par ligne.

## Backend (Spring Boot)

### Lancer l’API

```bash
# à la racine du projet (GestionCours)
mvn spring-boot:run
```

- API : **http://localhost:8098**
- Swagger : **http://localhost:8098/swagger-ui.html**

### Tests unitaires (Attendance)

```bash
mvn test
```

Les tests dans `AttendanceServiceImplTest` couvrent notamment :

- Création d’une nouvelle présence (`markAttendance` quand aucun enregistrement n’existe).
- Mise à jour d’une présence existante (même triplet sessionType/sessionId/studentId).
- Liste des présences par session (`getBySession`).
- Rejet si la requête est nulle (400).

### Exemples d’appels API (curl / Postman)

Voir **ADVANCED_API_CURL_EXAMPLES.md** pour :

- `POST /advanced/attendance/mark` (création et mise à jour).
- `GET /advanced/attendance/session?type=ONLINE|ONSITE&id=<sessionId>`.
- `GET /advanced/progress?...`.

Une collection Postman est fournie : **Advanced_Attendance_Progress.postman_collection.json**.

---

## Frontend (Angular)

### Prérequis

- Node.js 18+
- npm

### Installation et lancement

```bash
cd frontend
npm install
npm start
```

- App : **http://localhost:4300**
- Route principale : **http://localhost:4300/attendance**

Le proxy (`proxy.conf.json`) redirige `/api` vers `http://localhost:8098`. Les appels du frontend utilisent donc `/api/advanced/...`, ce qui pointe vers le backend.

### Utilisation de la page Présences

1. Choisir le **type de session** (ONLINE ou ONSITE).
2. Saisir l’**ID de session** (nombre, ex. 1).
3. Cliquer sur **Charger** : le tableau affiche les présences de la session.
4. Pour chaque ligne : modifier **Statut** et/ou **Note**, puis cliquer **Enregistrer**.
5. Un message de succès ou d’erreur s’affiche en haut ; après enregistrement, la ligne est mise à jour (optimistic UI).

---

## Fichiers modifiés / créés

### Backend (inchangé fonctionnellement, ajouts uniquement)

| Fichier | Action |
|--------|--------|
| `src/main/java/.../controller/AdvancedController.java` | CORS limité à `localhost:4300` et `localhost:4200` |
| `src/test/java/.../service/impl/AttendanceServiceImplTest.java` | **Créé** – tests unitaires Attendance |
| `ADVANCED_API_CURL_EXAMPLES.md` | **Complété** – GET session + exemple UPDATE |

### Frontend (nouveau)

| Fichier | Description |
|--------|-------------|
| `frontend/package.json` | Dépendances Angular 18 |
| `frontend/angular.json` | Config projet, proxy, port 4300 |
| `frontend/tsconfig.json`, `tsconfig.app.json` | Config TypeScript |
| `frontend/proxy.conf.json` | Proxy `/api` → 8098 |
| `frontend/src/index.html` | Page HTML + police |
| `frontend/src/main.ts` | Bootstrap app |
| `frontend/src/styles.css` | Variables CSS globales |
| `frontend/src/app/app.component.ts` | Shell + menu |
| `frontend/src/app/app.routes.ts` | Routes (dont `/attendance`) |
| `frontend/src/app/core/environment.ts` | `apiBaseUrl: '/api'` |
| `frontend/src/app/core/models/attendance.model.ts` | Types + enums TS |
| `frontend/src/app/core/services/attendance-api.service.ts` | `getBySession`, `markAttendance` |
| `frontend/src/app/pages/attendance/attendance.page.ts` | Page Présences (signals, OnPush) |
| `frontend/src/app/pages/attendance/attendance.page.html` | Template (filtres + tableau) |
| `frontend/src/app/pages/attendance/attendance.page.css` | Styles page |

---

## Comment tester end-to-end

1. Démarrer le backend : `mvn spring-boot:run` (depuis la racine).
2. Démarrer le frontend : `cd frontend && npm install && npm start`.
3. Ouvrir **http://localhost:4300/attendance**.
4. Créer des présences via Swagger ou curl (ex. session ONSITE id=1, studentId=1), puis recharger la page Présences avec type ONSITE et id=1 : les lignes doivent s’afficher ; modifier une ligne et cliquer **Enregistrer** pour vérifier la mise à jour.

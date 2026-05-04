# Tests Advanced API – Présences et progrès

Base URL : **http://localhost:8098**

Prérequis : un cours **ONSITE** avec **courseId=1** et au moins **5 sessions** (ids 1, 2, 3, 4, 5).  
Sinon, adapter `courseId` et `sessionId` dans les requêtes.

---

## 1. Marquer 5 présences (PRESENT / ABSENT / PRESENT / PRESENT / EXCUSED)

```bash
# Session 1 – PRESENT
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONSITE","sessionId":1,"studentId":1,"status":"PRESENT","note":""}'

# Session 2 – ABSENT
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONSITE","sessionId":2,"studentId":1,"status":"ABSENT","note":""}'

# Session 3 – PRESENT
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONSITE","sessionId":3,"studentId":1,"status":"PRESENT","note":""}'

# Session 4 – PRESENT
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONSITE","sessionId":4,"studentId":1,"status":"PRESENT","note":""}'

# Session 5 – EXCUSED
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONSITE","sessionId":5,"studentId":1,"status":"EXCUSED","note":""}'
```

---

## 2. Appel GET /advanced/progress

```bash
curl -X GET "http://localhost:8098/advanced/progress?courseType=ONSITE&courseId=1&studentId=1"
```

---

## 3. Réponse attendue pour /advanced/progress

Avec **5 sessions** au total et **4** marquées PRESENT ou EXCUSED (sessions 1, 3, 4, 5) :

- **totalSessions** = 5  
- **presentOrExcused** = 4  
- **attendanceRate** = 80.0  
- **eligible** = true (seuil par défaut 80 %)

Exemple de corps de réponse :

```json
{
  "courseType": "ONSITE",
  "courseId": 1,
  "studentId": 1,
  "totalSessions": 5,
  "presentOrExcused": 4,
  "attendanceRate": 80.0,
  "eligible": true
}
```

---

## 4. Lister les présences d’une session (GET /advanced/attendance/session)

```bash
# Exemple : session ONSITE id=1
curl -X GET "http://localhost:8098/advanced/attendance/session?type=ONSITE&id=1"

# Exemple : session ONLINE id=10
curl -X GET "http://localhost:8098/advanced/attendance/session?type=ONLINE&id=10"
```

Réponse : tableau de présences (id, sessionType, sessionId, studentId, status, note, markedAt).

---

## 5. Mise à jour d’une présence existante (même triplet = UPDATE)

Un deuxième `POST /advanced/attendance/mark` avec le **même** (sessionType, sessionId, studentId) **met à jour** la présence au lieu d’en créer une nouvelle.

```bash
# Création
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONLINE","sessionId":10,"studentId":2,"status":"ABSENT","note":"Premier enregistrement"}'

# Mise à jour (même session 10, étudiant 2) : on change status et note
curl -X POST http://localhost:8098/advanced/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"ONLINE","sessionId":10,"studentId":2,"status":"PRESENT","note":"Corrigé"}'
```

La réponse renvoie l’objet présence mis à jour (même `id`, nouveau `status`/`note`/`markedAt`).

---

## Résumé

| Session | Status   | Compté presentOrExcused |
|--------|----------|---------------------------|
| 1      | PRESENT  | oui                       |
| 2      | ABSENT   | non                       |
| 3      | PRESENT  | oui                       |
| 4      | PRESENT  | oui                       |
| 5      | EXCUSED  | oui                       |

→ 4 / 5 = **80 %** → **eligible = true**.

## RPV Bible (Web)

Commands:

```bash
npm install
npm run dev
```

Pages:
- `/` landing
- `/read` reader UI
- `/admin` admin uploads + quick edits
- `/projector` projector display
- `/remote` remote controller

Notes:
- Data is local, JSON-based for now. Replace `useBibleStore` with Firebase/Firestore integration later (structure compatible).
- Projector sync uses `localStorage` as a simple demo channel. Replace with Firestore `document` for multi-device projection.



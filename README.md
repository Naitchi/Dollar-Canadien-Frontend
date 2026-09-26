# DOLLAR CANADIEN

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Variables d'environnement

Optionnelles en local (les valeurs par défaut pointent sur le backend local), à définir pour un déploiement. Copier `.env.example` en `.env.local` :

| Variable                     | Défaut                  | Rôle                   |
| ---------------------------- | ----------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL`        | `http://localhost:3001` | URL du backend         |
| `NEXT_PUBLIC_PUSHER_KEY`     | clé de l'app actuelle   | Clé publique Pusher    |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `eu`                    | Cluster Pusher         |

Ces valeurs sont intégrées au bundle au moment du build (`next build`) : il faut rebuild après les avoir changées.

TODO pour le responsive faire une securite pour s'assurer qu il soit toujours en format paysage
TODO faire une animation de changement de tour

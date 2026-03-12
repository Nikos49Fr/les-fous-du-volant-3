import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function readRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

function getFirebaseApp() {
    const existing = getApps()[0];
    if (existing) {
        return existing;
    }

    const projectId = readRequiredEnv('FIREBASE_PROJECT_ID');
    const clientEmail = readRequiredEnv('FIREBASE_CLIENT_EMAIL');
    const privateKey = readRequiredEnv('FIREBASE_PRIVATE_KEY').replace(
        /\\n/g,
        '\n',
    );

    return initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

export function getDb() {
    const app = getFirebaseApp();
    return getFirestore(app);
}

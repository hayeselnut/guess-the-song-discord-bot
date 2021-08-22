import * as admin from 'firebase-admin';

export const getFirestoreDatabase = (projectId: string, privateKey: string, clientEmail: string): FirebaseFirestore.Firestore => {
    const serviceAccount = {
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
    } as admin.ServiceAccount;

    admin.initializeApp(serviceAccount);

    return admin.firestore();
}
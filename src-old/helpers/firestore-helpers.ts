import * as admin from 'firebase-admin';

export const getFirestoreDatabase = (projectId: string, privateKey: string, clientEmail: string): FirebaseFirestore.Firestore => {
  const serviceAccount: admin.ServiceAccount = {
    projectId,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    clientEmail,
  };

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  return admin.firestore();
};

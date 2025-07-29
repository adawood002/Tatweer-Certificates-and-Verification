// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Certificate } from "@/components/verification";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const storage = getStorage(app);

const CERTIFICATES_COLLECTION = 'certificates';

// Function to upload a stamped certificate PDF
export const uploadCertificate = async (pdfBlob: Blob, certificateId: string): Promise<string> => {
    if (!certificateId) {
        throw new Error("Certificate ID is required for upload.");
    }
    try {
        const storageRef = ref(storage, `certificates/${certificateId}.pdf`);
        const uploadResult = await uploadBytes(storageRef, pdfBlob, {
            contentType: 'application/pdf',
        });
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        return downloadUrl;
    } catch (e: any) {
        console.error("Error uploading file to Firebase Storage: ", e);
        throw new Error(`Could not upload the certificate PDF. Firebase error: ${e.message}`);
    }
}


// Function to add a new certificate
export const addCertificate = async (certificate: Certificate) => {
  try {
    if (!(certificate.expiryDate instanceof Date)) {
      throw new Error("expiryDate must be a valid Date object.");
    }

    // Create a plain object to ensure no complex types are passed unexpectedly
    const dataToSave = {
      certificateId: certificate.certificateId,
      jobId: certificate.jobId,
      companyName: certificate.companyName,
      pdfUrl: certificate.pdfUrl,
      expiryDate: Timestamp.fromDate(certificate.expiryDate), // Store date as Firestore Timestamp
    };

    const docRef = await addDoc(collection(db, CERTIFICATES_COLLECTION), dataToSave);
    
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding document to Firestore: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during save.";
    throw new Error(`Could not save certificate data: ${errorMessage}`);
  }
};

// Function to get a certificate by its ID
export const getCertificateById = async (certificateId: string): Promise<Certificate | null> => {
    const q = query(collection(db, CERTIFICATES_COLLECTION), where("certificateId", "==", certificateId));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
            certificateId: data.certificateId,
            jobId: data.jobId,
            companyName: data.companyName,
            expiryDate: (data.expiryDate as Timestamp).toDate(), // Convert Timestamp back to Date
            pdfUrl: data.pdfUrl || ''
        };
    } catch(e: any) {
        console.error("Error fetching document from Firestore:", e);
        throw new Error(`Could not fetch certificate data. Firebase error: ${e.message}`);
    }
}

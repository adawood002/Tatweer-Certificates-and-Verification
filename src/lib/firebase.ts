// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Certificate } from "@/components/verification";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB17s-_7xjJcJol_BzGhfSEF9X38zdclto",
  authDomain: "tatweer-certificates.firebaseapp.com",
  projectId: "tatweer-certificates",
  storageBucket: "tatweer-certificates.appspot.com",
  messagingSenderId: "99719845464",
  appId: "1:99719845464:web:a9280ed81971e7d5051c2d"
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

// Function to upload a PDF and get its URL
export const uploadCertificatePdf = async (pdfBlob: Blob, fileName: string): Promise<string> => {
    const storageRef = ref(storage, `certificates/${fileName}`);
    try {
        const snapshot = await uploadBytes(storageRef, pdfBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        console.error("Error uploading file: ", e);
        throw new Error("Could not upload the certificate PDF.");
    }
}

// Function to add a new certificate
export const addCertificate = async (certificate: Omit<Certificate, 'pdfUrl'>, pdfUrl: string) => {
  try {
    const docRef = await addDoc(collection(db, CERTIFICATES_COLLECTION), {
        ...certificate,
        expiryDate: Timestamp.fromDate(new Date(certificate.expiryDate)), // Store date as Firestore Timestamp
        pdfUrl: pdfUrl,
    });
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Could not save certificate data.");
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
    } catch(e) {
        console.error("Error fetching document:", e);
        throw new Error("Could not fetch certificate data.");
    }
}

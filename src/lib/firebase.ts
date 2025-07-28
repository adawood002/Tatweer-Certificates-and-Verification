// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import type { Certificate } from "@/components/verification";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr_PONMMZUuKTGVQtjF9rvC4O2Hwjo_6Q",
  authDomain: "synapdb-nexus.firebaseapp.com",
  projectId: "synapdb-nexus",
  storageBucket: "synapdb-nexus.appspot.com",
  messagingSenderId: "710536601680",
  appId: "1:710536601680:web:c588815deef33bd012f155"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

const CERTIFICATES_COLLECTION = 'certificates';

// Function to add a new certificate
export const addCertificate = async (certificate: Omit<Certificate, 'pdfUrl'>) => {
  try {
    const docRef = await addDoc(collection(db, CERTIFICATES_COLLECTION), {
        ...certificate,
        expiryDate: certificate.expiryDate.toISOString(), // Store date as ISO string
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
            expiryDate: new Date(data.expiryDate), // Convert ISO string back to Date
            pdfUrl: data.pdfUrl || '' // Assume pdfUrl might not be there yet
        };
    } catch(e) {
        console.error("Error fetching document:", e);
        throw new Error("Could not fetch certificate data.");
    }
}

// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Certificate } from "@/components/verification";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr_PONMMZUuKTGVQtjF9rvC4O2Hwjo_6Q",
  authDomain: "synapdb-nexus.firebaseapp.com",
  projectId: "synapdb-nexus",
  storageBucket: "synapdb-nexus.appspot.com",
  messagingSenderId: "710536601680",
  appId: "1:710536601680:web:45ff1928ade1b5d412f155"
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
    try {
        const storageRef = ref(storage, `certificates/${certificateId}.pdf`);
        const uploadResult = await uploadBytes(storageRef, pdfBlob, {
            contentType: 'application/pdf',
        });
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        return downloadUrl;
    } catch (e) {
        console.error("Error uploading file: ", e);
        throw new Error("Could not upload the certificate PDF.");
    }
}


// Function to add a new certificate
export const addCertificate = async (certificate: Certificate) => {
  try {
    if (!(certificate.expiryDate instanceof Date)) {
      throw new Error("expiryDate must be a valid Date object.");
    }
    const docRef = await addDoc(collection(db, CERTIFICATES_COLLECTION), {
        ...certificate,
        expiryDate: Timestamp.fromDate(certificate.expiryDate), // Store date as Firestore Timestamp
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

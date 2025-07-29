'use server';
/**
 * @fileOverview A flow for processing and saving a certificate.
 * This flow applies a QR code to a PDF, uploads it to storage,
 * and saves the certificate metadata to Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addCertificate } from '@/lib/firebase';
import { initializeApp, getApps } from "firebase/app";

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

const storage = getStorage(app);


const ProcessCertificateInputSchema = z.object({
  certificateId: z.string(),
  jobId: z.string(),
  companyName: z.string(),
  expiryDate: z.coerce.date(),
  pdfBase64: z.string().describe('The original PDF file encoded in base64.'),
  qrCodeDataUrl: z.string().describe('The QR code image as a data URL.'),
  qrPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).describe('The pixel coordinates of the QR code on the preview image.'),
  qrSize: z.object({
      width: z.number(),
      height: z.number()
  }).describe('The pixel dimensions of the QR code on the preview image.'),
  previewSize: z.object({
      width: z.number(),
      height: z.number()
  }).describe('The pixel dimensions of the preview area where the QR code was placed.')
});
export type ProcessCertificateInput = z.infer<typeof ProcessCertificateInputSchema>;


const ProcessCertificateOutputSchema = z.object({
    pdfUrl: z.string(),
});
export type ProcessCertificateOutput = z.infer<typeof ProcessCertificateOutputSchema>;


export async function processCertificate(input: ProcessCertificateInput): Promise<ProcessCertificateOutput> {
    return processCertificateFlow(input);
}


const processCertificateFlow = ai.defineFlow(
  {
    name: 'processCertificateFlow',
    inputSchema: ProcessCertificateInputSchema,
    outputSchema: ProcessCertificateOutputSchema,
  },
  async (input) => {
    // 1. Apply QR code to the PDF
    const pdfDoc = await PDFDocument.load(Buffer.from(input.pdfBase64, 'base64'));
    const qrImage = await pdfDoc.embedPng(input.qrCodeDataUrl);
    
    const firstPage = pdfDoc.getPages()[0];
    if (!firstPage) {
      throw new Error('The PDF has no pages.');
    }
    
    const { width: pagePdfWidth, height: pagePdfHeight } = firstPage.getSize();
    const scaleX = pagePdfWidth / input.previewSize.width;
    const scaleY = pagePdfHeight / input.previewSize.height;

    const qrPdfWidth = input.qrSize.width * scaleX;
    const qrPdfHeight = input.qrSize.height * scaleY;
    const x = input.qrPosition.x * scaleX;
    const y = pagePdfHeight - (input.qrPosition.y * scaleY) - qrPdfHeight;

    firstPage.drawImage(qrImage, { x, y, width: qrPdfWidth, height: qrPdfHeight });
    const stampedPdfBytes = await pdfDoc.save();

    // 2. Upload the stamped PDF to Firebase Storage
    const storageRef = ref(storage, `certificates/${input.certificateId}.pdf`);
    const uploadResult = await uploadBytes(storageRef, stampedPdfBytes, {
        contentType: 'application/pdf',
    });
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    // 3. Save the certificate metadata to Firestore
    await addCertificate({
      certificateId: input.certificateId,
      jobId: input.jobId,
      companyName: input.companyName,
      expiryDate: input.expiryDate,
      pdfUrl: downloadUrl,
    });
    
    // 4. Return the download URL
    return { pdfUrl: downloadUrl };
  }
);

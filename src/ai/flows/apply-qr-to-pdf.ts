'use server';
/**
 * @fileOverview A flow for applying a QR code to a PDF certificate.
 *
 * - applyQrToPdf - A function that embeds a QR code image into a PDF file.
 * - ApplyQrToPdfInput - The input type for the applyQrToPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

const ApplyQrToPdfInputSchema = z.object({
  pdfBase64: z.string().describe('The original PDF file encoded in base64.'),
  qrCodeDataUrl: z.string().describe('The QR code image as a data URL.'),
  qrPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).describe('The desired position for the QR code on the page.'),
  qrSizeInPixels: z.number().describe('The desired size of the QR code in pixels.'),
});

export type ApplyQrToPdfInput = z.infer<typeof ApplyQrToPdfInputSchema>;

export async function applyQrToPdf(input: ApplyQrToPdfInput): Promise<string> {
    return applyQrToPdfFlow(input);
}

const applyQrToPdfFlow = ai.defineFlow(
  {
    name: 'applyQrToPdfFlow',
    inputSchema: ApplyQrToPdfInputSchema,
    outputSchema: z.string(),
  },
  async ({ pdfBase64, qrCodeDataUrl, qrPosition, qrSizeInPixels }) => {
    try {
      const pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'));
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      if (!firstPage) {
        throw new Error('The PDF has no pages.');
      }
      
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();
      
      // Convert QR size from pixels to PDF points (assuming 72 DPI for simplicity, a common standard).
      // This gives us a reasonable baseline for scaling.
      const qrSizeInPoints = qrSizeInPixels * (72 / 96);
      
      const margin = 20; // Margin from the edge in points

      let x = 0;
      let y = 0;

      switch (qrPosition) {
        case "bottom-left":
          x = margin;
          y = margin;
          break;
        case "top-left":
          x = margin;
          y = pageHeight - qrSizeInPoints - margin;
          break;
        case "top-right":
          x = pageWidth - qrSizeInPoints - margin;
          y = pageHeight - qrSizeInPoints - margin;
          break;
        case "bottom-right":
        default:
          x = pageWidth - qrSizeInPoints - margin;
          y = margin;
          break;
      }
      
      firstPage.drawImage(qrImage, {
        x: x,
        y: y,
        width: qrSizeInPoints,
        height: qrSizeInPoints,
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes).toString('base64');
    } catch (err) {
      console.error('Failed to apply QR code to PDF:', err);
      throw new Error('An error occurred while processing the PDF.');
    }
  }
);

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
  x: z.number().describe('The x-coordinate to place the QR code.'),
  y: z.number().describe('The y-coordinate to place the QR code.'),
  size: z.number().describe('The size (width and height) of the QR code.'),
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
  async ({ pdfBase64, qrCodeDataUrl, x, y, size }) => {
    try {
      const pdfDoc = await PDFDocument.load(pdfBase64);
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      if (!firstPage) {
        throw new Error('The PDF has no pages.');
      }
      
      // pdf-lib's y-axis starts from the bottom, but our UI's y-axis starts from the top.
      // We need to convert the coordinate.
      const { height: pageHeight } = firstPage.getSize();
      const invertedY = pageHeight - y - size;

      firstPage.drawImage(qrImage, {
        x,
        y: invertedY,
        width: size,
        height: size,
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes).toString('base64');
    } catch (err) {
      console.error('Failed to apply QR code to PDF:', err);
      throw new Error('An error occurred while processing the PDF.');
    }
  }
);

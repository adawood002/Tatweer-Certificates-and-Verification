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
  async ({ pdfBase64, qrCodeDataUrl, qrPosition, qrSize, previewSize }) => {
    try {
      const pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'));
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      if (!firstPage) {
        throw new Error('The PDF has no pages.');
      }
      
      const { width: pagePdfWidth, height: pagePdfHeight } = firstPage.getSize();
      
      // Calculate scaling factors
      const scaleX = pagePdfWidth / previewSize.width;
      const scaleY = pagePdfHeight / previewSize.height;

      const qrPdfWidth = qrSize.width * scaleX;
      const qrPdfHeight = qrSize.height * scaleY;
      
      const x = qrPosition.x * scaleX;
      // Invert Y-axis: PDF origin is bottom-left, screen is top-left
      const y = pagePdfHeight - (qrPosition.y * scaleY) - qrPdfHeight;

      firstPage.drawImage(qrImage, {
        x: x,
        y: y,
        width: qrPdfWidth,
        height: qrPdfHeight,
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes).toString('base64');
    } catch (err) {
      console.error('Failed to apply QR code to PDF:', err);
      throw new Error('An error occurred while processing the PDF.');
    }
  }
);

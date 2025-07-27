'use server';
/**
 * @fileOverview A flow for generating QR codes.
 *
 * - generateQrCode - A function that generates a QR code from a given string.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import QRCode from 'qrcode';

const generateQrCodeFlow = ai.defineFlow(
  {
    name: 'generateQrCodeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (text) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.9,
        margin: 1,
      });
      return qrCodeDataUrl;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to generate QR code.');
    }
  }
);

export async function generateQrCode(text: string): Promise<string> {
    return generateQrCodeFlow(text);
}

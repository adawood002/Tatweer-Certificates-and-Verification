'use server';
/**
 * @fileOverview A flow for generating a PNG preview of a PDF's first page.
 *
 * - generatePdfPreview - Generates a PNG preview from a PDF file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { fromBuffer } from 'pdf-to-png-converter';

const GeneratePdfPreviewInputSchema = z.object({
    pdfBase64: z.string().describe('The PDF file encoded in base64.'),
});

export type GeneratePdfPreviewInput = z.infer<typeof GeneratePdfPreviewInputSchema>;

export async function generatePdfPreview(input: GeneratePdfPreviewInput): Promise<string> {
    return generatePdfPreviewFlow(input);
}

const generatePdfPreviewFlow = ai.defineFlow(
  {
    name: 'generatePdfPreviewFlow',
    inputSchema: GeneratePdfPreviewInputSchema,
    outputSchema: z.string(),
  },
  async ({ pdfBase64 }) => {
    try {
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      const pngPages = await fromBuffer(pdfBuffer, {
        pages: [1], // Only convert the first page
        scale: 2.0, // Use a higher scale for better quality
      });
      
      const firstPage = pngPages[0];
      if (!firstPage) {
        throw new Error('Could not generate preview from the first page.');
      }

      return `data:image/png;base64,${firstPage.toString('base64')}`;
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
      throw new Error('An error occurred while generating the PDF preview.');
    }
  }
);

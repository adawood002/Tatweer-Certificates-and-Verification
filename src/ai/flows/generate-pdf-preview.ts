'use server';
/**
 * @fileOverview A flow for generating a PNG preview of a PDF's first page.
 *
 * - generatePdfPreview - A function that takes a PDF and returns a PNG data URL.
 * - GeneratePdfPreviewInput - The input type for the generatePdfPreview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import { createCanvas } from 'canvas';

// Required to expose the streams we need
pdfjs.GlobalWorkerOptions.workerSrc = `../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`;

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
            const pdfData = Buffer.from(pdfBase64, 'base64');
            const loadingTask = pdfjs.getDocument({ data: pdfData });
            const doc = await loadingTask.promise;
            const page = await doc.getPage(1); // Get the first page

            const viewport = page.getViewport({ scale: 1.5 }); // Use a fixed scale for good quality

            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            return canvas.toDataURL('image/png');
        } catch (err) {
            console.error('Failed to generate PDF preview:', err);
            throw new Error('An error occurred while generating the PDF preview.');
        }
    }
);

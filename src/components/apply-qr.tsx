"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

import {
  CalendarIcon,
  UploadCloud,
  Download,
  FileCheck2,
  AlertCircle,
  Loader2,
  ZoomIn,
  Move,
  Scan,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateQrCode } from "@/ai/flows/generate-qr-code";
import { applyQrToPdf } from "@/ai/flows/apply-qr-to-pdf";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;


const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  companyId: z.string().min(1, "Company ID is required."),
  workId: z.string().min(1, "Work ID is required."),
  expiryDate: z.date({ required_error: "An expiry date is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplyQrCode() {
  const { toast } = useToast();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [qrPosition, setQrPosition] = useState({ x: 10, y: 10 });
  const [qrSize, setQrSize] = useState(120);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyId: "",
      workId: "",
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) {
        setCertificateFile(file);
        setFileError(null);
        setPdfPreviewUrl(null);
        setIsGenerating(true);

        try {
          const fileReader = new FileReader();
          fileReader.readAsArrayBuffer(file);
          fileReader.onload = async (e) => {
            const pdfData = e.target?.result;
            if (pdfData instanceof ArrayBuffer) {
              const loadingTask = pdfjs.getDocument({ data: pdfData });
              const doc = await loadingTask.promise;
              const page = await doc.getPage(1);
              const viewport = page.getViewport({ scale: 1.5 });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                 const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                  };
                  await page.render(renderContext).promise;
                  setPdfPreviewUrl(canvas.toDataURL('image/png'));
              }
            }
          };
        } catch (error) {
            console.error("Failed to generate preview:", error);
            setFileError("Could not generate a preview for this PDF.");
            setCertificateFile(null);
        } finally {
            setIsGenerating(false);
        }

      } else {
        setCertificateFile(null);
        setPdfPreviewUrl(null);
        setFileError("Please upload a PDF file smaller than 5MB.");
      }
    }
  };

  const handleGenerateQr = async () => {
    const { workId, companyName, companyId, expiryDate } = form.getValues();
    if (!workId || !companyName || !companyId || !expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields before generating the QR code.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "Generating QR Code...",
    });

    try {
      const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(workId)}`;
      const qrCodeDataUrl = await generateQrCode(verificationUrl);
      setQrCodeUrl(qrCodeDataUrl);
      toast({
        title: "QR Code Generated!",
        description: "You can now position it on your certificate.",
      });
    } catch (error) {
        console.error("Failed to generate QR code:", error);
        toast({
          title: "QR Generation Failed",
          description: "Could not generate the QR code. Please try again.",
          variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSaveAndDownload = async () => {
      if (!certificateFile || !qrCodeUrl || !previewContainerRef.current) {
          toast({
              title: "Error",
              description: "Missing certificate, QR code, or preview data.",
              variant: "destructive",
          });
          return;
      }
      setIsProcessing(true);
      toast({
        title: "Processing Certificate...",
        description: "Applying the QR code and preparing your download.",
      });
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(certificateFile);
        reader.onload = async () => {
            const pdfBase64 = (reader.result as string).split(",")[1];
            if (!pdfBase64) {
                throw new Error("Failed to read the PDF file.");
            }

            const previewRect = previewContainerRef.current!.getBoundingClientRect();
            
            const newPdfBase64 = await applyQrToPdf({
                pdfBase64,
                qrCodeDataUrl: qrCodeUrl,
                qrPosition: {
                    x: qrPosition.x,
                    y: qrPosition.y
                },
                qrSize: {
                    width: qrSize,
                    height: qrSize
                },
                previewSize: {
                    width: previewRect.width,
                    height: previewRect.height
                }
            });

            const link = document.createElement("a");
            link.href = `data:application/pdf;base64,${newPdfBase64}`;
            link.download = `secured-${certificateFile.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Download Successful!",
                description: "Your secured certificate has been downloaded.",
            });
        };
        reader.onerror = () => { throw new Error("Could not read PDF file for final processing.") }
      } catch (error) {
          console.error("Failed to save and download:", error);
          toast({
              title: "Processing Failed",
              description: "Could not apply the QR code to the PDF. Please try again.",
              variant: "destructive",
          });
      } finally {
          setIsProcessing(false);
      }
  }

  useEffect(() => {
    let isDragging = false;
    
    const handleMouseDown = (event: MouseEvent) => {
      if(event.button !== 0 || !qrRef.current?.contains(event.target as Node)) return;
      isDragging = true;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !qrRef.current || !previewContainerRef.current) return;

      const containerRect = previewContainerRef.current.getBoundingClientRect();
      let x = event.clientX - containerRect.left - qrSize / 2;
      let y = event.clientY - containerRect.top - qrSize / 2;
      
      x = Math.max(0, Math.min(x, containerRect.width - qrSize));
      y = Math.max(0, Math.min(y, containerRect.height - qrSize));

      setQrPosition({ x, y });
    };

    const handleMouseUp = () => {
      isDragging = false;
    };
    
    window.addEventListener('mousedown', handleMouseDown as EventListener);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown as EventListener);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [qrSize]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Create Your Secured Certificate
        </CardTitle>
        <CardDescription>
          Upload your certificate, fill in the details, and place the unique QR code.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FormItem>
                      <FormLabel
                      className={cn("font-semibold", fileError && "text-destructive")}
                      htmlFor="certificate-upload"
                      >
                      Upload Certificate
                      </FormLabel>
                      <div className="relative">
                      <FormControl>
                          <Input
                          id="certificate-upload"
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                          />
                      </FormControl>
                      <label
                          htmlFor="certificate-upload"
                          className={cn(
                          "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/10 transition-colors duration-200",
                          fileError ? "border-destructive hover:bg-destructive/10" : "border-border",
                          certificateFile && "border-green-500 bg-green-50"
                          )}
                      >
                          <div 
                          className="flex flex-col items-center justify-center pt-5 pb-6 text-center"
                          >
                          {certificateFile ? (
                              <>
                              <FileCheck2 className="w-10 h-10 mb-3 text-green-600" />
                              <p className="mb-2 text-sm text-foreground">
                                  <span className="font-semibold">
                                  {certificateFile.name}
                                  </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                  Click to replace file
                              </p>
                              </>
                          ) : (
                              <>
                              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                  PDF only (MAX. 5MB)
                              </p>
                              </>
                          )}
                          </div>
                      </label>
                      </div>
                      {fileError && (
                      <FormMessage className="flex items-center gap-1 pt-1">
                          <AlertCircle size={14} />
                          {fileError}
                      </FormMessage>
                      )}
                  </FormItem>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Secure-Cert Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. C-12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                control={form.control}
                name="workId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work ID</FormLabel>
                    <FormDescription>This will be used for verification.</FormDescription>
                    <FormControl>
                      <Input placeholder="e.g. W-67890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <AnimatePresence>
            {certificateFile && !qrCodeUrl && (
              <motion.div
                className="pt-4 border-t"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                  <Button onClick={handleGenerateQr} disabled={isGenerating} className="w-full text-lg h-12">
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Scan className="mr-2 h-5 w-5" />
                      )}
                      Generate QR Code
                  </Button>
              </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
                {pdfPreviewUrl && qrCodeUrl && (
                    <motion.div
                        className="space-y-6 pt-4 border-t"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="space-y-2 text-center">
                            <h3 className="text-xl font-semibold font-headline">Position Your QR Code</h3>
                            <p className="text-muted-foreground">Drag the QR code to your desired position on the certificate preview.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-2 relative w-full border-2 border-dashed rounded-lg p-2" ref={previewContainerRef}>
                                <img src={pdfPreviewUrl} alt="Certificate Preview" className="w-full h-auto" />
                                <motion.img
                                    ref={qrRef}
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    className="absolute cursor-move"
                                    style={{
                                        width: `${qrSize}px`,
                                        height: `${qrSize}px`,
                                        touchAction: 'none'
                                    }}
                                    animate={{
                                        x: qrPosition.x,
                                        y: qrPosition.y,
                                        width: qrSize,
                                        height: qrSize
                                    }}
                                    dragMomentum={false}
                                />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                  <Label htmlFor="qr-size" className="flex items-center gap-2 font-semibold">
                                    <ZoomIn className="w-5 h-5" />
                                    Adjust QR Code Size
                                  </Label>
                                  <div className="flex items-center gap-4">
                                    <Slider
                                      id="qr-size"
                                      min={50}
                                      max={250}
                                      step={10}
                                      value={[qrSize]}
                                      onValueChange={(value) => setQrSize(value[0])}
                                    />
                                    <span className="text-sm font-medium tabular-nums w-16 text-center border rounded-md py-1">
                                      {qrSize}px
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2 font-semibold">
                                    <Move className="w-5 h-5" />
                                    Position
                                  </Label>
                                   <div className="flex items-center gap-4 text-sm p-2 border rounded-md bg-muted/50">
                                      <span>X: {Math.round(qrPosition.x)}px</span>
                                      <span>Y: {Math.round(qrPosition.y)}px</span>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                 {(isGenerating && !pdfPreviewUrl) && (
                    <div className="mt-8 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="font-semibold">Generating Preview...</p>
                        <p className="text-sm">Please wait a moment.</p>
                    </div>
                )}
            </AnimatePresence>
          </CardContent>
          <AnimatePresence>
          {pdfPreviewUrl && qrCodeUrl && (
             <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
             >
                <CardFooter className="px-6 pb-6 pt-4 bg-muted/30">
                    <Button onClick={handleSaveAndDownload} className="w-full text-lg h-12 group" disabled={isProcessing}>
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-5 w-5" />
                    )}
                    Save & Download
                    </Button>
                </CardFooter>
            </motion.div>
          )}
          </AnimatePresence>
        </form>
      </Form>
    </Card>
  );
}

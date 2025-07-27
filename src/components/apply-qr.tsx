"use client";

import { useState, useRef, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  UploadCloud,
  Move,
  Download,
  FileCheck2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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

const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  companyId: z.string().min(1, "Company ID is required."),
  workId: z.string().min(1, "Work ID is required."),
  expiryDate: z.date({ required_error: "An expiry date is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplyQrCode() {
  const { toast } = useToast();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(120);

  const [qrPosition, setQrPosition] = useState({ x: 50, y: 50 });
  const qrRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);

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
        // We no longer need to read the PDF on the frontend.
        // The object URL is enough for the iframe preview.
        setPdfPreviewUrl(URL.createObjectURL(file));
      } else {
        setCertificateFile(null);
        setPdfPreviewUrl(null);
        setFileError("Please upload a PDF file smaller than 5MB.");
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!certificateFile) {
      setFileError("Please upload a certificate PDF.");
      return;
    }
    setIsProcessing(true);
    try {
      const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(values.workId)}`;
      const qrCodeDataUrl = await generateQrCode(verificationUrl);
      setQrCodeUrl(qrCodeDataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast({
        title: "Error",
        description: "Could not generate the QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!certificateFile || !qrCodeUrl || !previewAreaRef.current) {
      toast({
        title: "Error",
        description: "Missing certificate, QR code, or preview area.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing Certificate",
      description: "Applying QR code and preparing your download...",
    });

    try {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(certificateFile);
      fileReader.onload = async () => {
        const pdfBase64 = (fileReader.result as string).split(",")[1];

        if (!pdfBase64) {
          throw new Error("Failed to read the PDF file.");
        }
        
        const previewRect = previewAreaRef.current!.getBoundingClientRect();

        const newPdfBase64 = await applyQrToPdf({
          pdfBase64,
          qrCodeDataUrl: qrCodeUrl,
          qrPosition: { x: qrPosition.x, y: qrPosition.y },
          qrSize,
          previewDimensions: { width: previewRect.width, height: previewRect.height },
        });

        // Trigger download
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${newPdfBase64}`;
        link.download = `secured-${certificateFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download Successful!",
          description: "Your secured certificate has been downloaded.",
          variant: "default",
        });
      };

      fileReader.onerror = (error) => {
        console.error("FileReader error:", error);
        throw new Error("Failed to read the uploaded file.");
      };
    } catch (error) {
      console.error("Failed to save and download certificate:", error);
      toast({
        title: "Download Failed",
        description: "Could not process your certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {showPreview ? (
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full overflow-hidden shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Position Your QR Code
              </CardTitle>
              <CardDescription>
                Drag the QR code to your desired location, resize it, and then save.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                ref={previewAreaRef}
                className="relative w-full h-[50rem] border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden group"
              >
                {pdfPreviewUrl && (
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full pointer-events-none"
                    title="Certificate Preview"
                  />
                )}
                <motion.div
                  ref={qrRef}
                  drag
                  dragConstraints={previewAreaRef}
                  dragMomentum={false}
                  onDragEnd={(_event, info) => {
                    const qrEl = qrRef.current;
                    if(qrEl) {
                        setQrPosition({
                          x: qrEl.offsetLeft,
                          y: qrEl.offsetTop,
                        });
                    }
                  }}
                  className="absolute cursor-move select-none p-2 bg-white rounded-md shadow-2xl"
                  style={{ top: `${qrPosition.y}px`, left: `${qrPosition.x}px` }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, cursor: 'grabbing' }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1}}
                  transition={{ type: 'spring', stiffness: 300, damping: 20}}
                >
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={qrSize}
                      height={qrSize}
                      className="pointer-events-none"
                    />
                  ) : (
                    <div className="flex items-center justify-center" style={{width: qrSize, height: qrSize}}>
                      <Loader2 className="animate-spin"/>
                    </div>
                  )}
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <Move size={12} />
                    Drag Me
                  </div>
                </motion.div>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <Label htmlFor="qr-size" className="flex items-center gap-2 mb-3 text-sm font-semibold">
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
                  <span className="text-sm font-medium tabular-nums w-12 text-center border rounded-md py-1">
                    {qrSize}px
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-muted/30 py-4 px-6">
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isProcessing}>
                Back to Edit
              </Button>
              <Button onClick={handleSaveAndDownload} disabled={!qrCodeUrl || isProcessing}>
                 {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Save & Download
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Create Your Secured Certificate
              </CardTitle>
              <CardDescription>
                Upload your certificate and fill in the details to apply a unique QR code.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <CardContent className="space-y-6">
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
                  <div className="grid md:grid-cols-2 gap-6">
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
                </CardContent>
                <CardFooter className="px-6 pb-6">
                  <Button type="submit" className="w-full text-lg h-12 group" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : 
                    ( <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />)
                    }
                    Apply QR on Certificate
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

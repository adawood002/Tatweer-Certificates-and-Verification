"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
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
} from "lucide-react";
import Image from "next/image";

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
  const [isApplying, setIsApplying] = useState(false);

  const [qrPosition, setQrPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyId: "",
      workId: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) {
        setCertificateFile(file);
        setPdfPreviewUrl(URL.createObjectURL(file));
        setFileError(null);
      } else {
        setCertificateFile(null);
        setPdfPreviewUrl(null);
        setFileError("Please upload a PDF file smaller than 5MB.");
      }
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!certificateFile) {
      setFileError("Please upload a certificate PDF.");
      return;
    }
    setIsApplying(true);
    // Simulate processing time
    setTimeout(() => {
      setShowPreview(true);
      setIsApplying(false);
    }, 1500);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (qrRef.current) {
      setIsDragging(true);
      const qrRect = qrRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - qrRect.left,
        y: e.clientY - qrRect.top,
      };
      // Prevent text selection while dragging
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !previewAreaRef.current || !qrRef.current) return;
      
      const previewRect = previewAreaRef.current.getBoundingClientRect();
      const qrRect = qrRef.current.getBoundingClientRect();

      let x = e.clientX - previewRect.left - dragOffset.current.x;
      let y = e.clientY - previewRect.top - dragOffset.current.y;
      
      // Constrain QR code within the preview area
      x = Math.max(0, Math.min(x, previewRect.width - qrRect.width));
      y = Math.max(0, Math.min(y, previewRect.height - qrRect.height));

      setQrPosition({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleSaveAndDownload = () => {
    console.log("Saving certificate with QR code at:", qrPosition);
    toast({
      title: "Download Initiated",
      description: "Your secured certificate is being prepared for download.",
      variant: "default",
    });
  };

  if (showPreview) {
    return (
      <Card className="w-full overflow-hidden shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Position Your QR Code
          </CardTitle>
          <CardDescription>
            Drag the QR code to your desired location on the certificate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={previewAreaRef}
            className="relative w-full h-[50rem] border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden"
          >
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="Certificate Preview"
              />
            )}
            <div
              ref={qrRef}
              style={{ top: `${qrPosition.y}px`, left: `${qrPosition.x}px` }}
              className="absolute cursor-move select-none p-2 bg-white rounded-md shadow-2xl"
              onMouseDown={handleMouseDown}
            >
              <Image
                src="https://placehold.co/120x120/png"
                alt="QR Code"
                width={120}
                height={120}
                data-ai-hint="qr code"
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Move size={12} />
                Drag Me
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Back to Edit
          </Button>
          <Button onClick={handleSaveAndDownload}>
            <Download className="mr-2 h-4 w-4" />
            Save & Download
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Create Your Secured Certificate
        </CardTitle>
        <CardDescription>
          Upload your certificate and fill in the details to apply a unique QR
          code.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-6">
            <FormItem>
              <FormLabel
                className={cn(fileError && "text-destructive")}
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
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    fileError ? "border-destructive" : "border-border"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {certificateFile ? (
                      <>
                        <FileCheck2 className="w-10 h-10 mb-3 text-green-500" />
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
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
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
                <FormMessage className="flex items-center gap-1">
                  <AlertCircle size={14} />
                  {fileError}
                </FormMessage>
              )}
            </FormItem>

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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isApplying}>
              {isApplying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Apply QR on Certificate
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

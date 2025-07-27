"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  UploadCloud,
  Download,
  FileCheck2,
  AlertCircle,
  Loader2,
  ZoomIn,
  MoveHorizontal,
  MoveVertical,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  companyId: z.string().min(1, "Company ID is required."),
  workId: z.string().min(1, "Work ID is required."),
  expiryDate: z.date({ required_error: "An expiry date is required." }),
  qrPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"], {
    required_error: "You need to select a QR code position.",
  }),
  qrSize: z.number().min(50).max(250),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplyQrCode() {
  const { toast } = useToast();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyId: "",
      workId: "",
      qrPosition: "bottom-right",
      qrSize: 120,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) {
        setCertificateFile(file);
        setFileError(null);
      } else {
        setCertificateFile(null);
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
    toast({
      title: "Processing Certificate...",
      description: "Generating QR code and applying it to your document.",
    });

    try {
      // 1. Generate QR Code
      const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(values.workId)}`;
      const qrCodeDataUrl = await generateQrCode(verificationUrl);

      // 2. Read PDF file as Base64
      const fileReader = new FileReader();
      fileReader.readAsDataURL(certificateFile);
      fileReader.onload = async () => {
        const pdfBase64 = (fileReader.result as string).split(",")[1];
        if (!pdfBase64) {
          throw new Error("Failed to read the PDF file.");
        }

        // 3. Apply QR to PDF via the flow
        const newPdfBase64 = await applyQrToPdf({
          pdfBase64,
          qrCodeDataUrl,
          qrPosition: values.qrPosition,
          qrSizeInPixels: values.qrSize,
        });

        // 4. Trigger download
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
      
      fileReader.onerror = (error) => {
        console.error("FileReader error:", error);
        throw new Error("Failed to read the uploaded file.");
      };

    } catch (error) {
      console.error("Failed to process certificate:", error);
      toast({
        title: "An Error Occurred",
        description: "Could not process your certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Create Your Secured Certificate
        </CardTitle>
        <CardDescription>
          Upload your certificate, fill in the details, and choose where to place the unique QR code.
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

            <div className="space-y-4 pt-4 border-t">
               <FormField
                  control={form.control}
                  name="qrPosition"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-semibold">QR Code Position</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="bottom-right" id="br" className="peer sr-only" />
                            </FormControl>
                            <Label htmlFor="br" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <span className="text-sm font-semibold">Bottom Right</span>
                            </Label>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="bottom-left" id="bl" className="peer sr-only" />
                            </FormControl>
                            <Label htmlFor="bl" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <span className="text-sm font-semibold">Bottom Left</span>
                            </Label>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="top-right" id="tr" className="peer sr-only" />
                            </FormControl>
                            <Label htmlFor="tr" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <span className="text-sm font-semibold">Top Right</span>
                            </Label>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="top-left" id="tl" className="peer sr-only" />
                            </FormControl>
                            <Label htmlFor="tl" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                                <span className="text-sm font-semibold">Top Left</span>
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="qrSize"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="qr-size" className="flex items-center gap-2 font-semibold">
                      <ZoomIn className="w-5 h-5" />
                      Adjust QR Code Size
                    </Label>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                            id="qr-size"
                            min={50}
                            max={250}
                            step={10}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                      </FormControl>
                      <span className="text-sm font-medium tabular-nums w-16 text-center border rounded-md py-1">
                        {field.value}px
                      </span>
                    </div>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-4 bg-muted/30">
            <Button type="submit" className="w-full text-lg h-12 group" disabled={isProcessing || !certificateFile}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Download className="mr-2 h-5 w-5" />
              )}
              Apply QR & Download
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

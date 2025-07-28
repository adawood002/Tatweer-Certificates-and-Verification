"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  FileX,
  FileCheck,
  CalendarClock,
  Fingerprint,
  Building,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export type Certificate = {
  certificateId: string;
  jobId: string;
  companyName: string;
  expiryDate: Date;
  pdfUrl: string;
};

// Mock data to simulate a database of certificates
const MOCK_CERTIFICATES: Certificate[] = [
  {
    certificateId: "CERT-12345",
    jobId: "JOB-67890",
    companyName: "Innovatech Solutions",
    expiryDate: new Date("2025-12-31T23:59:59"),
    pdfUrl: "/certs/innovatech-cert.pdf",
  },
  {
    certificateId: "CERT-67890",
    jobId: "JOB-11223",
    companyName: "Global Trust Services",
    expiryDate: new Date("2023-01-15T23:59:59"), // Expired
    pdfUrl: "/certs/globaltrust-cert.pdf",
  },
  {
    certificateId: "CERT-ABCDE",
    jobId: "JOB-FGHIJ",
    companyName: "Quantum Leap Inc.",
    expiryDate: new Date(new Date().getTime() + 100 * 24 * 60 * 60 * 1000), // Expires in 100 days
    pdfUrl: "/certs/quantum-cert.pdf",
  },
];

type VerificationProps = {
  certificateId?: string;
};

export default function Verification({ certificateId }: VerificationProps) {
  const [searchQuery, setSearchQuery] = useState(certificateId || "");
  const [isLoading, setIsLoading] = useState(!!certificateId);
  const [searchResult, setSearchResult] = useState<
    Certificate | "not_found" | null
  >(null);

  const performSearch = (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setSearchResult(null);

    // Simulate API call
    setTimeout(() => {
      const result = MOCK_CERTIFICATES.find((cert) => cert.certificateId.toLowerCase() === query.toLowerCase());
      setSearchResult(result || "not_found");
      setIsLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    if (certificateId) {
      performSearch(certificateId);
    }
  }, [certificateId]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const isExpired = searchResult && typeof searchResult !== 'string' && searchResult.expiryDate < new Date();

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Verify a Certificate
        </CardTitle>
        <CardDescription>
          Enter the Certificate ID to verify its authenticity and status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch}>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter Certificate ID (e.g., CERT-12345)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow text-base h-11"
              disabled={!!certificateId}
            />
            {!certificateId && (
              <Button type="submit" disabled={isLoading || !searchQuery} size="lg">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            )}
          </div>
        </form>

        <AnimatePresence>
          {isLoading && (
             <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-8 flex flex-col items-center justify-center text-muted-foreground"
            >
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-semibold">Verifying Certificate...</p>
              <p className="text-sm">Please wait a moment.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
        {searchResult && !isLoading && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Separator className="my-6" />
            {searchResult === "not_found" ? (
              <Alert variant="destructive" className="py-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Not Found</AlertTitle>
                <AlertDescription>
                  No certificate found for the provided Certificate ID. Please check
                  the ID and try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <Alert className="mb-6" variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? <ShieldX className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  <AlertTitle className="font-bold text-lg">
                    {isExpired ? "Certificate Expired" : "Certificate Valid"}
                  </AlertTitle>
                  <AlertDescription>
                    {isExpired
                      ? `This certificate expired on ${format(searchResult.expiryDate, "PPP")}.`
                      : `This certificate is valid and will expire on ${format(searchResult.expiryDate, "PPP")}.`}
                  </AlertDescription>
                </Alert>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  <InfoItem icon={Fingerprint} label="Certificate ID" value={searchResult.certificateId} />
                  <InfoItem icon={Briefcase} label="Job ID" value={searchResult.jobId} />
                  <InfoItem icon={Building} label="Company Name" value={searchResult.companyName} />
                  <InfoItem icon={CalendarClock} label="Expiry Date" value={format(searchResult.expiryDate, "PPP")} />
                </motion.div>
                
                {!isExpired && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2 text-foreground">Certificate Document:</h4>
                     <div className="w-full h-[40rem] border rounded-lg flex items-center justify-center bg-muted/30">
                        <p className="text-muted-foreground">Certificate preview would be displayed here.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <motion.div 
      className="flex items-start gap-4 p-4 bg-background border rounded-lg"
      variants={itemVariants}
      transition={{ ease: "easeOut", duration: 0.3}}
    >
      <Icon className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
      <div>
        <p className="font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground text-base">{value}</p>
      </div>
    </motion.div>
  )
}

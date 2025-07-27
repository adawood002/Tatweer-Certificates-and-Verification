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
  workId: string;
  companyName: string;
  companyId: string;
  expiryDate: Date;
  pdfUrl: string;
};

// Mock data to simulate a database of certificates
const MOCK_CERTIFICATES: Certificate[] = [
  {
    workId: "W-67890",
    companyName: "Innovatech Solutions",
    companyId: "C-12345",
    expiryDate: new Date("2025-12-31T23:59:59"),
    pdfUrl: "/certs/innovatech-cert.pdf",
  },
  {
    workId: "W-11223",
    companyName: "Global Trust Services",
    companyId: "C-67890",
    expiryDate: new Date("2023-01-15T23:59:59"), // Expired
    pdfUrl: "/certs/globaltrust-cert.pdf",
  },
  {
    workId: "W-ABCDE",
    companyName: "Quantum Leap Inc.",
    companyId: "C-FGHIJ",
    expiryDate: new Date(new Date().getTime() + 100 * 24 * 60 * 60 * 1000), // Expires in 100 days
    pdfUrl: "/certs/quantum-cert.pdf",
  },
];

type VerificationProps = {
  workId?: string;
};

export default function Verification({ workId }: VerificationProps) {
  const [searchQuery, setSearchQuery] = useState(workId || "");
  const [isLoading, setIsLoading] = useState(!!workId);
  const [searchResult, setSearchResult] = useState<
    Certificate | "not_found" | null
  >(null);

  const performSearch = (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setSearchResult(null);

    // Simulate API call
    setTimeout(() => {
      const result = MOCK_CERTIFICATES.find((cert) => cert.workId.toLowerCase() === query.toLowerCase());
      setSearchResult(result || "not_found");
      setIsLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    if (workId) {
      performSearch(workId);
    }
  }, [workId]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const isExpired = searchResult && typeof searchResult !== 'string' && searchResult.expiryDate < new Date();

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">
          Verify a Certificate
        </CardTitle>
        <CardDescription>
          Enter the Work ID from a certificate to verify its authenticity and
          status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch}>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter Work ID (e.g., W-67890)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
              disabled={!!workId}
            />
            {!workId && (
              <Button type="submit" disabled={isLoading}>
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
              className="mt-6 flex flex-col items-center justify-center text-muted-foreground"
            >
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-semibold">Verifying Certificate...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
        {searchResult && !isLoading && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Separator className="my-4" />
            {searchResult === "not_found" ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Not Found</AlertTitle>
                <AlertDescription>
                  No certificate found for the provided Work ID. Please check
                  the ID and try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6"
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
                  <InfoItem icon={Fingerprint} label="Work ID" value={searchResult.workId} />
                  <InfoItem icon={Building} label="Company Name" value={searchResult.companyName} />
                  <InfoItem icon={Briefcase} label="Company ID" value={searchResult.companyId} />
                  <InfoItem icon={CalendarClock} label="Expiry Date" value={format(searchResult.expiryDate, "PPP")} />
                </motion.div>

                <Alert className="mt-6" variant={isExpired ? "destructive" : "default"}>
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
                
                {!isExpired && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2 text-primary">Certificate Document:</h4>
                     <div className="w-full h-[40rem] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
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
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <motion.div 
      className="flex items-start gap-3 p-3 bg-background border rounded-lg shadow-sm"
      variants={itemVariants}
    >
      <Icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
      <div>
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </motion.div>
  )
}

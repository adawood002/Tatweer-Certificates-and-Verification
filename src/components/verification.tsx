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
  Download,
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
import { getCertificateById } from "@/lib/firebase";

export type Certificate = {
  certificateId: string;
  jobId: string;
  companyName: string;
  expiryDate: Date;
  pdfUrl: string; 
};

type VerificationProps = {
  certificateId?: string;
};

export default function Verification({ certificateId }: VerificationProps) {
  const [searchQuery, setSearchQuery] = useState(certificateId || "");
  const [isLoading, setIsLoading] = useState(!!certificateId);
  const [searchResult, setSearchResult] = useState<
    Certificate | "not_found" | null
  >(null);
    const [error, setError] = useState<string | null>(null);


  const performSearch = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setSearchResult(null);
    setError(null);

    try {
      const result = await getCertificateById(query);
      setSearchResult(result || "not_found");
    } catch (err) {
        setError("An error occurred while fetching the certificate. Please try again later.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
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
         {error && (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

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
                <FileX className="h-4 w-4" />
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
                      ? "This certificate is no longer valid as of its expiry date."
                      : "This certificate has been successfully verified and is active."}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-muted-foreground">Certificate ID</p>
                      <p className="font-mono text-foreground">{searchResult.certificateId}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-muted-foreground">Job ID</p>
                      <p className="text-foreground">{searchResult.jobId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-muted-foreground">Company Name</p>
                      <p className="text-foreground">{searchResult.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="w-5 h-5 text-primary" />
                     <div>
                      <p className="font-semibold text-muted-foreground">Expiry Date</p>
                      <p className="text-foreground">
                        {format(searchResult.expiryDate, "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!isExpired && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><FileCheck className="w-5 h-5 text-primary" />Stamped Certificate</h4>
                    <a href={searchResult.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        View or Download Stamped PDF
                      </Button>
                    </a>
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

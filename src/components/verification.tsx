"use client";

import { useState } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type Certificate = {
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

export default function Verification() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<
    Certificate | "not_found" | null
  >(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsLoading(true);
    setSearchResult(null);

    // Simulate API call
    setTimeout(() => {
      const result = MOCK_CERTIFICATES.find((cert) => cert.workId.toLowerCase() === searchQuery.toLowerCase());
      setSearchResult(result || "not_found");
      setIsLoading(false);
    }, 1000);
  };

  const isExpired = searchResult && typeof searchResult !== 'string' && searchResult.expiryDate < new Date();

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
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
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </form>

        {searchResult && (
          <div className="mt-6">
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
                <h3 className="text-xl font-semibold font-headline mb-4">
                  Verification Result
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <InfoItem icon={Fingerprint} label="Work ID" value={searchResult.workId} />
                  <InfoItem icon={Building} label="Company Name" value={searchResult.companyName} />
                  <InfoItem icon={Briefcase} label="Company ID" value={searchResult.companyId} />
                  <InfoItem icon={CalendarClock} label="Expiry Date" value={format(searchResult.expiryDate, "PPP")} />
                </div>

                <Alert className="mt-6" variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? <FileX className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
                  <AlertTitle className="font-bold">
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
                    <h4 className="font-semibold mb-2">Certificate Document:</h4>
                     <div className="w-full h-[40rem] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                        <p className="text-muted-foreground">Certificate preview would be displayed here.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
      <div>
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

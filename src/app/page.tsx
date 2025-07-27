"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplyQrCode from "@/components/apply-qr";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background font-body">
      <div className="w-full max-w-4xl mx-auto">
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <ShieldCheck className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold font-headline text-foreground tracking-tight">
              Tatweer Certificates
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A robust solution to securely stamp and instantly verify your digital certificates with QR codes.
          </p>
        </motion.header>

        <Tabs defaultValue="apply-qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-lg bg-muted p-1">
            <TabsTrigger value="apply-qr" className="text-base font-medium rounded-md">Apply QR Code</TabsTrigger>
             <TabsTrigger value="verification" asChild className="text-base font-medium rounded-md data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-muted-foreground">
                <Link href="/verification">Verification</Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="apply-qr" className="mt-6">
            <ApplyQrCode />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

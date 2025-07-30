"use client";

import Verification from "@/components/verification";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerificationPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background font-body">
      <div className="w-full max-w-4xl mx-auto">
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-4 mb-4">
             <Image src="/logo.png" alt="Tatweer Certificates Logo" width={64} height={64} />
            <h1 className="text-5xl font-bold font-headline text-foreground tracking-tight">
              Certificate Verification
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter the Certificate ID from a certificate to verify its authenticity and
            status.
          </p>
        </motion.header>

        <Verification />

        <div className="text-center mt-12">
            <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2" />
                    Back to Home
                </Link>
            </Button>
        </div>

      </div>
    </main>
  );
}

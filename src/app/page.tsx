"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplyQrCode from "@/components/apply-qr";
import Verification from "@/components/verification";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-transparent font-body">
      <div className="w-full max-w-4xl mx-auto">
        <motion.header 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-6xl font-extrabold font-headline text-primary-foreground tracking-tight"
              style={{ textShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))' }}
          >
            CertiSeal
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Securely stamp and verify your digital certificates.
          </p>
        </motion.header>

        <Tabs defaultValue="apply-qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-xl bg-primary/20 p-1.5 backdrop-blur-sm">
            <TabsTrigger value="apply-qr" className="text-base font-semibold rounded-lg">Apply QR Code</TabsTrigger>
            <TabsTrigger value="verification" className="text-base font-semibold rounded-lg">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="apply-qr" className="mt-6">
            <ApplyQrCode />
          </TabsContent>
          <TabsContent value="verification" className="mt-6">
            <Verification />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

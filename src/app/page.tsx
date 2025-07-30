
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplyQrCode from "@/components/apply-qr";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    )
  }

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
              Tatweer Certificates
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Securely stamp and verify your digital certificates
          </p>
            {user && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
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

// Wrap the component with the HOC
export default function HomePage() {
  return (
      <Home />
  )
}

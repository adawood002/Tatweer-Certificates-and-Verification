import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplyQrCode from "@/components/apply-qr";
import Verification from "@/components/verification";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-background font-body">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight">
            CertiSeal
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Securely stamp and verify your digital certificates.
          </p>
        </header>

        <Tabs defaultValue="apply-qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-lg">
            <TabsTrigger value="apply-qr" className="text-base font-semibold">Apply QR Code</TabsTrigger>
            <TabsTrigger value="verification" className="text-base font-semibold">Verification</TabsTrigger>
          </TabsList>
          <TabsContent value="apply-qr">
            <ApplyQrCode />
          </TabsContent>
          <TabsContent value="verification">
            <Verification />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

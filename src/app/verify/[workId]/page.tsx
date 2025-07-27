import Verification from "@/components/verification";

type VerificationPageProps = {
  params: {
    workId: string;
  };
};

export default function VerificationPage({ params }: VerificationPageProps) {
  const { workId } = params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-12 md:p-24 bg-background font-body">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold font-headline text-primary tracking-tight">
            CertiSeal
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Certificate Verification
          </p>
        </header>

        <Verification workId={decodeURIComponent(workId)} />

      </div>
    </main>
  );
}

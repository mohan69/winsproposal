import { PublicNavbar } from "@/components/public-navbar";
import { DemoForm } from "./_components/demo-form";

export default function DemoPage() {
  return (
    <>
      <PublicNavbar />
      <div className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Book a Demo</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See how WinsProposal can transform your proposal workflow. Fill out the form and our team will reach out to schedule a personalized demo.
          </p>
        </div>
        <div className="max-w-lg mx-auto">
          <DemoForm />
        </div>
      </div>
    </>
  );
}

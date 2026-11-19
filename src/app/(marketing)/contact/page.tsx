import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about German courses, levels or membership? Send Divya a message.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { topic } = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Questions? Schreib mir."
        intro="Not sure which level to start with, or interested in membership? Send a message and we will get back to you."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6 sm:p-8">
            <ContactForm defaultTopic={typeof topic === "string" ? topic : undefined} />
          </Card>
          <div className="space-y-6 text-ink-soft">
            <div>
              <h2 className="font-semibold text-ink">Not sure about your level?</h2>
              <p className="mt-2 leading-relaxed">
                Tell us what you have studied so far and why you are learning German. We will suggest where to start.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-ink">Already a student?</h2>
              <p className="mt-2 leading-relaxed">Log in and use the same form; your message is linked to your account so we can help faster.</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

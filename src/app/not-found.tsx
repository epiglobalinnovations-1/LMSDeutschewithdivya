import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/card";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container className="py-24 text-center">
          <p lang="de" className="font-display text-lg italic text-muted">
            Seite nicht gefunden
          </p>
          <h1 className="mt-3 font-display text-4xl">This page does not exist.</h1>
          <p className="mt-3 text-ink-soft">The link may be broken, or the page may have moved.</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/">Back to the homepage</ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | SaaS Infrastructure</title>
        <meta name="description" content="Our terms of service and user agreement" />
        <meta property="og:title" content="Terms of Service | SaaS Infrastructure" />
        <meta property="og:description" content="Our terms of service and user agreement" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <div className="container max-w-3xl py-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using our services, you agree to be bound by these
            Terms of Service and all applicable laws and regulations. If you do
            not agree with any of these terms, you are prohibited from using our
            services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Use License</h2>
          <p className="text-muted-foreground">
            Permission is granted to temporarily use our services for personal,
            non-commercial transitory viewing only. This is the grant of a
            license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
            <li>Transfer the materials to another person</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Account Responsibilities</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the confidentiality of your
            account and password. You agree to accept responsibility for all
            activities that occur under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Disclaimer</h2>
          <p className="text-muted-foreground">
            Our services are provided "as is". We make no warranties, expressed
            or implied, and hereby disclaim all other warranties including,
            without limitation, implied warranties of merchantability, fitness
            for a particular purpose, or non-infringement.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Limitations</h2>
          <p className="text-muted-foreground">
            In no event shall we be liable for any damages arising out of the
            use or inability to use our services, even if we have been notified
            of the possibility of such damages.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Modifications</h2>
          <p className="text-muted-foreground">
            We may revise these terms of service at any time without notice. By
            using our services you are agreeing to be bound by the then current
            version of these terms of service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Governing Law</h2>
          <p className="text-muted-foreground">
            These terms and conditions are governed by and construed in
            accordance with applicable laws and you irrevocably submit to the
            exclusive jurisdiction of the courts in that location.
          </p>
        </section>
      </div>
      </div>
    </>
  );
}

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Breadcrumb */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 25, 2026
            </p>
          </div>

          {/* Plain English Promise Box */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-10">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl text-foreground mb-2">
                  The "Plain English" Promise
                </h2>
                <p className="text-foreground font-medium text-lg">
                  Your Child's Data is for the Mat, Not for Sale.
                </p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li>• We do not sell roster data.</li>
                  <li>• Detailed data (such as date of birth) is visible only to verified Administrators.</li>
                  <li>• Parents can request deletion of their child's data at any time.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground mb-4">
                MatSide collects the minimum information necessary to facilitate fair and safe wrestling matchups. The information collected about youth athletes includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">First Name</strong> – For identification during meets</li>
                <li><strong className="text-foreground">Last Name</strong> – For identification during meets</li>
                <li><strong className="text-foreground">Date of Birth</strong> – To calculate age for age-appropriate matchmaking</li>
                <li><strong className="text-foreground">Weight</strong> – To ensure weight-appropriate pairings</li>
                <li><strong className="text-foreground">Gender</strong> – For gender-appropriate competition divisions</li>
                <li><strong className="text-foreground">Experience Level</strong> – To match athletes of similar experience</li>
                <li><strong className="text-foreground">Skill Level</strong> – To ensure competitive balance</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong className="text-foreground">Purpose Limitation:</strong> This information is collected and used <em>strictly</em> for the purpose of automated matchmaking and meet administration. We do not use this data for any other purpose.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                2. COPPA Compliance
              </h2>
              <p className="text-muted-foreground mb-4">
                MatSide is committed to compliance with the Children's Online Privacy Protection Act (COPPA). We recognize that our service is used to manage information about minors participating in youth wrestling programs.
              </p>
              <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
                <p className="text-foreground font-medium mb-2">Parental Consent Through Team Administrators</p>
                <p className="text-muted-foreground">
                  Team Administrators who enter athlete data into MatSide act as agents authorized to provide consent on behalf of the parents or legal guardians of the minors on their roster. By registering athletes on the platform, Team Administrators represent and warrant that they have obtained the necessary parental consent to collect and process the athlete's personal information for matchmaking purposes.
                </p>
              </div>
              <p className="text-muted-foreground">
                Parents or legal guardians may exercise their rights under COPPA at any time by contacting their Team Administrator or by reaching out to us directly at <a href="mailto:hello@matsideapp.com" className="text-primary hover:underline">hello@matsideapp.com</a>. These rights include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-3">
                <li>Reviewing their child's personal information</li>
                <li>Requesting correction of inaccurate information</li>
                <li>Requesting deletion of their child's data</li>
                <li>Withdrawing consent for future collection</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                3. Data Sharing & Access Controls
              </h2>
              <p className="text-muted-foreground mb-4">
                MatSide implements strict access controls to ensure athlete data is shared only on a "need to know" basis:
              </p>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Team Administrators (Full Access)</h3>
                  <p className="text-muted-foreground text-sm">
                    Team Administrators have full access to their own team's roster data, including all fields listed above. This access is necessary for roster management and meet preparation.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Opposing Coaches (Limited Access)</h3>
                  <p className="text-muted-foreground text-sm">
                    Coaches from opposing teams participating in the same meet can only see "Need to Know" information necessary for fair match pairing: <strong>Age</strong> (calculated from DOB, not the DOB itself) and <strong>Weight</strong>. This ensures fair matches while protecting sensitive personal details.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">League Organizers (Administrative Access)</h3>
                  <p className="text-muted-foreground text-sm">
                    League Organizers have access to athlete data from teams that have explicitly consented to share their roster information for league meets. Teams must opt-in to data sharing in their privacy settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                4. No Third-Party Marketing
              </h2>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">We do not sell, rent, or trade your data.</strong> Period.
              </p>
              <p className="text-muted-foreground mb-4">
                Specifically, we will never:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Sell athlete rosters or contact lists to college recruiters</li>
                <li>Share data with wrestling equipment brands for marketing purposes</li>
                <li>Provide data to any third-party for advertising or promotional use</li>
                <li>Use athlete information for targeted advertising</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Your data exists for one purpose: to help run better, safer, more organized wrestling meets.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                5. Data Security
              </h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect athlete data, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Row-level security policies ensuring users can only access authorized data</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Secure authentication with email verification</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                6. Data Retention
              </h2>
              <p className="text-muted-foreground">
                Athlete data is retained for as long as the Team Administrator maintains an active account. Upon account deletion or at the request of a parent/guardian, athlete data will be permanently deleted within 30 days. Historical match records may be anonymized and retained for statistical purposes.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl text-foreground mb-4 border-b border-border pb-2">
                7. Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or wish to exercise your rights regarding your child's data, please contact us at:
              </p>
              <p className="text-foreground mt-3">
                <strong>Email:</strong> <a href="mailto:hello@matsideapp.com" className="text-primary hover:underline">hello@matsideapp.com</a>
              </p>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground mb-4">Related Documents:</p>
            <Link 
              to="/terms" 
              className="text-primary hover:underline font-medium"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

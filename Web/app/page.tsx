import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Heart,
  LockKeyhole,
  Smartphone,
  Users,
} from "lucide-react";
import Image from "next/image";
import { LedgerDemo } from "../components/ledger-demo";
import { Github } from "../components/github-icon";
import brandLogo from "./images/logWithoutBG.png";

const github = "https://github.com/imshubham07/LenDen";
const androidApkUrl = "/download";

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      href="#top"
      className={`brand ${footer ? "brand-footer" : ""}`}
      aria-label="LenDen home"
    >
      <span className="brand-icon">
        <Image src={brandLogo} alt="" className="brand-logo" />
      </span>
      LenDen<span className="brand-period">.</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header" id="top">
        <div className="container navigation">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#features">The little details</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">The project</a>
          </nav>
          <a
            className="github-nav"
            href={github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={16} />
            <span>View on GitHub</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> A SIMPLE LEDGER. A CLEARER MIND.
            </div>
            <h1 id="hero-title">
              A little clarity,
              <br />
              for every <em>lend.</em>
              <span className="title-stroke" aria-hidden="true" />
            </h1>
            <p className="hero-description">
              Money between people deserves a little care.
              <br className="desktop-break" /> Keep track of what you lend, what
              comes back,
              <br className="desktop-break" /> and where things stand. All in
              one place.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#demo">
                Take a closer look <ArrowUpRight size={18} />
              </a>
              <a
                className="button button-light"
                href={androidApkUrl}
                download="lenden.apk"
              >
                <Smartphone size={18} /> Download Android APK
              </a>
              <a
                className="text-link"
                href={github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={18} /> Explore the code
              </a>
            </div>
            <div className="hero-footnote">
              <span className="mini-check">
                <Check size={11} />
              </span>{" "}
              Open source <span className="separator-dot">·</span> Thoughtfully
              simple <span className="separator-dot">·</span> Made for everyday
              life
            </div>
          </div>
          <LedgerDemo />
          <div className="hero-bottom">
            <span>LESS MENTAL MATHS. MORE PEACE OF MIND.</span>
            <a href="#features" aria-label="Explore LenDen features">
              <ArrowDown size={17} />
            </a>
            <span className="edition">THE EVERYDAY MONEY COMPANION — 01</span>
          </div>
        </section>
        <section className="principles" aria-label="Project highlights">
          <div className="container principles-inner">
            <span>
              <BookOpen /> A home for every entry
            </span>
            <span>
              <Users /> People, before numbers
            </span>
            <span>
              <LockKeyhole /> A ledger of your own
            </span>
            <span>
              <Code2 /> Open by design
            </span>
          </div>
        </section>
        <section
          className="features section-pad container"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / THE LITTLE DETAILS</span>
              <h2 id="features-title">
                Everything in its place.
                <br />
                <em>Finally.</em>
              </h2>
            </div>
            <p>
              A notebook is a good start. LenDen is the next page.
              <br />
              Just the essentials to make everyday lending
              <br className="desktop-break" /> feel a little more put together.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card people-feature">
              <div className="feature-art people-art" aria-hidden="true">
                <div className="person-slip">
                  <span className="avatar peach">AS</span>
                  <div>
                    <strong>Aarav Sharma</strong>
                    <span>A familiar face. A clear record.</span>
                  </div>
                  <span className="slip-check">
                    <Check size={13} />
                  </span>
                </div>
                <div className="person-slip second-slip">
                  <span className="avatar purple">PM</span>
                  <div>
                    <strong>Priya Mehta</strong>
                    <span>Every detail, together.</span>
                  </div>
                  <span className="slip-check">
                    <Check size={13} />
                  </span>
                </div>
              </div>
              <span className="feature-number">01 — PEOPLE</span>
              <h3>
                More than a name
                <br />
                in your notes.
              </h3>
              <p>
                Give every borrower a place of their own, with their contact
                details, lending history, and balance together.
              </p>
            </article>
            <article className="feature-card flow-feature">
              <div className="feature-art flow-art" aria-hidden="true">
                <div className="transaction-chip">
                  <span className="transaction-icon">
                    <ArrowUpRight size={19} />
                  </span>
                  <div>
                    <span>You gave</span>
                    <strong>₹5,000</strong>
                  </div>
                  <span className="chip-sign">−</span>
                </div>
                <div className="flow-line" />
                <div className="transaction-chip return-chip">
                  <span className="transaction-icon">
                    <ArrowDownLeft size={19} />
                  </span>
                  <div>
                    <span>You received</span>
                    <strong>₹2,000</strong>
                  </div>
                  <span className="chip-sign">+</span>
                </div>
              </div>
              <span className="feature-number">02 — MOVEMENT</span>
              <h3>
                Money out.
                <br />
                Money back. Noted.
              </h3>
              <p>
                Record a loan or a repayment as it happens. Keep both sides of
                the story, without the scattered messages.
              </p>
            </article>
            <article className="feature-card balance-feature">
              <div className="feature-art balance-art" aria-hidden="true">
                <span className="balance-art-label">A SIMPLE EQUATION</span>
                <div className="equation">
                  <span>
                    ₹5,000<small>given</small>
                  </span>
                  <b>−</b>
                  <span>
                    ₹2,000<small>returned</small>
                  </span>
                </div>
                <div className="equation-result">
                  <span>Still to come back</span>
                  <strong>
                    ₹3,000 <ArrowUpRight size={20} />
                  </strong>
                </div>
              </div>
              <span className="feature-number">03 — CLARITY</span>
              <h3>
                Know exactly
                <br />
                where you stand.
              </h3>
              <p>
                See the outstanding principal at a glance. What you gave, minus
                what came back. No mental arithmetic needed.
              </p>
            </article>
          </div>
        </section>
        <section
          className="how-section"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="container how-inner">
            <div className="how-intro">
              <span className="eyebrow">02 / A SMALL, SIMPLE ROUTINE</span>
              <h2 id="how-title">
                Less to remember.
                <br />
                <em>More to get on with.</em>
              </h2>
              <p>
                From the first lend to the last repayment,
                <br />
                it only takes a few small steps.
              </p>
              <span className="handwritten">
                Life happens. Keep a little record.
              </span>
            </div>
            <div className="steps">
              {[
                {
                  title: "Make yourself at home",
                  text: "Create your account with your name, mobile number, and password. Your own ledger starts here.",
                },
                {
                  title: "Add a person. Make an entry.",
                  text: "Save a borrower’s details and record the money you’ve given them. There’s a place for every lend.",
                },
                {
                  title: "Keep the picture up to date",
                  text: "Record repayments as they come in and see the remaining balance. Pick up right where you left off.",
                },
              ].map((step, i) => (
                <article className="step" key={step.title}>
                  <span className="step-number">0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className="about-section section-pad container"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="about-note">
            <div className="note-top">
              <span>THE THINKING BEHIND LENDEN</span>
              <Heart size={18} />
            </div>
            <p>
              “The money is one part.
              <br />
              The peace of mind?
              <br />
              <em>That’s the real balance.</em>”
            </p>
            <div className="note-signature">
              <span className="signature">Shubham</span>
              <span>THE MAKER</span>
            </div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">03 / A PROJECT WITH A PURPOSE</span>
            <h2 id="about-title">
              Everyday problem.
              <br />
              <em>Thoughtful little solution.</em>
            </h2>
            <p>
              LenDen brings a familiar habit into a simpler space: keeping an
              honest record of money lent and money returned.
            </p>
            <p>
              It’s an open-source project built by Shubham Kumar Dubey, pairing
              an Expo mobile app with an Express API, PostgreSQL, and Redis.
              This Next.js site is a little introduction to it all.
            </p>
            <div className="project-tags">
              <span>
                <Smartphone size={14} /> Mobile app
              </span>
              <span>
                <Code2 size={14} /> Open source
              </span>
              <span>
                <BookOpen size={14} /> MIT licensed
              </span>
            </div>
            <a
              className="inline-link"
              href={`${github}#readme`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get to know the project <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <section className="faq-section container" aria-labelledby="faq-title">
          <div>
            <span className="eyebrow">A FEW THINGS, CLEARED UP</span>
            <h2 id="faq-title">Good questions.</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>
                What exactly does LenDen do?<span>+</span>
              </summary>
              <p>
                LenDen helps you keep a personal record of borrowers, money you
                have lent, repayments, and outstanding principal. It is a
                ledger; it does not transfer money or issue loans.
              </p>
            </details>
            <details>
              <summary>
                Can I try it here?<span>+</span>
              </summary>
              <p>
                Yes. The interactive ledger at the top uses sample data. Select
                a borrower and record a sample repayment to watch the balances
                update. It resets when you reload and does not save or send any
                data. To run the full app, follow the setup guide on GitHub.
              </p>
            </details>
            <details>
              <summary>
                Does it calculate interest?<span>+</span>
              </summary>
              <p>
                The current balance is the amount given minus repayments. A
                monthly percentage can be stored on borrower profiles, but
                automatic interest calculation is not implemented yet.
              </p>
            </details>
            <details>
              <summary>
                Can I explore or contribute to the code?<span>+</span>
              </summary>
              <p>
                Absolutely. LenDen is available under the MIT license. Explore
                the mobile app and backend, follow the setup instructions, or
                open an issue on{" "}
                <a href={github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                .
              </p>
            </details>
          </div>
        </section>
        <section className="closing container">
          <div className="closing-symbol" aria-hidden="true">
            <ArrowLeftRight size={31} />
          </div>
          <span className="eyebrow">
            A LITTLE LESS GUESSWORK, STARTING HERE.
          </span>
          <h2>
            Good records.
            <br />
            <em>Better peace of mind.</em>
          </h2>
          <p>Take a look around. Make it your own. Build something with it.</p>
          <a
            className="button button-dark"
            href={github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={18} /> Find LenDen on GitHub{" "}
            <ArrowUpRight size={17} />
          </a>
          <span className="closing-caption">
            Built with care. Shared with everyone.
          </span>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Brand footer />
            <p>A little clarity, for every lend.</p>
          </div>
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-github"
          >
            <Github size={17} /> Source code <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} LenDen. Open source, always.</span>
          <span>
            Designed & built by{" "}
            <a
              href="https://github.com/imshubham07"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shubham Kumar Dubey <ArrowUpRight size={13} />
            </a>
          </span>
          <a href="#top">
            Back to top <ArrowRight className="back-arrow" size={14} />
          </a>
        </div>
      </footer>
    </>
  );
}

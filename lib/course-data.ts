// ─────────────────────────────────────────────────────────────
// ROSTER — Music Management Course Curriculum
// Built for managers who are serious about building real careers.
// ─────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "12 min read"
  type: "read" | "video" | "exercise" | "download";
  summary: string;
  content: string; // Full lesson content in markdown-friendly text
  resources?: string[]; // Links to toolkit documents
  exercise?: string;
  keyPoints?: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  totalLessons: number;
  estimatedHours: string;
  lessons: Lesson[];
}

export const COURSES: Course[] = [
  // ── COURSE 1 ────────────────────────────────────────────────
  {
    id: "c1",
    slug: "foundations",
    title: "Music Management Foundations",
    subtitle: "What it actually means to manage an artist",
    description: "Before contracts, before tours, before deals — you need to understand what you're getting into. This course covers the role of a manager, how the music industry is structured, and what separates managers who build lasting careers from those who don't.",
    color: "#C9A84C",
    icon: "🎤",
    level: "Foundation",
    totalLessons: 5,
    estimatedHours: "2 hrs",
    lessons: [
      {
        id: "c1-l1",
        title: "What Does a Music Manager Actually Do?",
        duration: "10 min read",
        type: "read",
        summary: "The role, the reality, and what no one tells you before you start.",
        content: `The title "manager" means different things depending on where you are in the industry. At the highest level, a manager is the CEO of an artist's career — responsible for strategy, direction, relationships, and day-to-day execution. At the beginning, it often means doing everything yourself.

**The core job**

A manager's primary job is to create and manage opportunities for their artist while protecting their interests. That means:

- Building and maintaining relationships with promoters, labels, publishers, booking agents, and media
- Negotiating deals and reviewing contracts (alongside an entertainment lawyer)
- Planning releases, tours, and campaigns
- Managing the artist's finances, schedule, and brand
- Being the person who says no when necessary, and yes at the right time

**What you are not**

A manager is not a booking agent (though many managers handle bookings, especially early on). In most markets, booking agents require a separate license. A manager is also not a publicist, a publisher, or a lawyer — though you need to understand what all of them do.

**The reality**

Most management relationships start informally — a friend, a fan, or someone who believes in an artist and starts helping. The transition from "helper" to "manager" happens the moment there's a formal agreement in place. Until then, you're exposed — legally and financially.

The single most important thing you can do when starting a management relationship is sign an agreement. Not because you don't trust the artist, but because clarity is what good relationships are built on.`,
        keyPoints: [
          "A manager is the strategic lead on an artist's career",
          "The role changes as the artist's level changes",
          "You need a signed agreement before you do anything else",
          "Knowing what you're NOT responsible for is as important as knowing what you are",
        ],
        exercise: "Write a one-paragraph description of what you expect your role to look like in the first 6 months with your artist. Be specific about what you'll handle and what you won't.",
        resources: ["/dashboard/library/startup/agreement"],
      },
      {
        id: "c1-l2",
        title: "How the Music Industry Is Structured",
        duration: "14 min read",
        type: "read",
        summary: "The labels, the publishers, the DSPs, and where the money flows.",
        content: `The music industry has two sides: the creative side (artists, songwriters, producers) and the business side (labels, publishers, distributors, PROs). As a manager, you operate at the intersection of both.

**The major players**

*Record labels* sign artists and invest in recording, marketing, and distribution. In exchange, they take ownership (or a license) of the master recordings and a share of revenue. Major labels (Universal, Sony, Warner) dominate global market share, but independent labels and artist-owned companies are increasingly viable.

*Music publishers* own and administer song copyrights (compositions). When a song is streamed, performed, or synced, the publisher collects the songwriter's share of royalties. Many artists are their own publishers, or sign with a publishing company for administration services.

*Distributors* get music onto streaming platforms, stores, and radio. Digital distributors like TuneCore, DistroKid, and CD Baby handle this for independent artists. Major labels have their own distribution arms.

*PROs (Performing Rights Organisations)* collect performance royalties when music is broadcast or performed publicly. In South Africa: SAMRO. In Nigeria: COSON. In Kenya: MCSK. In Ghana: GHAMRO. Most countries have their own.

**The streaming economy**

When a song is streamed, revenue is split roughly: 50–55% goes to rights holders (labels and artists), 15–25% goes to music publishers (songwriters), and the rest to the platform. Within the artist's share, how much the artist actually receives depends entirely on their recording deal.

**What this means for you**

As a manager, you need to understand these flows so you can identify where your artist's money is being collected, who is collecting it, and whether it's being collected correctly. Most artists — and many managers — leave significant royalty money on the table simply because they haven't registered with the right organisations.`,
        keyPoints: [
          "Labels own masters, publishers own compositions",
          "PRO registration is mandatory for royalty collection",
          "Distribution and publishing are separate functions",
          "Understanding money flow is part of your job",
        ],
        resources: ["/dashboard/library/money/revenue-streams", "/dashboard/library/money/royalties"],
      },
      {
        id: "c1-l3",
        title: "Signing Your First Artist — The Agreement",
        duration: "18 min read",
        type: "read",
        summary: "What goes into a management agreement, why each clause matters, and how to get it right.",
        content: `A management agreement is a legal contract between you (the manager) and the artist. It defines your relationship, your commission, your responsibilities, and what happens when things go wrong. Getting it right protects both of you.

**The key clauses**

*Term* — How long does the agreement last? Typical management agreements are 1–3 years, often with options to extend. Be cautious about long initial terms without performance benchmarks.

*Commission* — The standard management commission is 15–20% of gross income. Some managers take 10% for live performance and 20% for everything else. Whatever you agree, define it clearly — what income is commissionable and what isn't.

*Post-term commission* — This is often contentious. If a deal you negotiated during the management term is still generating income after the term ends, are you still owed commission? Typically yes, on income from deals signed during the term. This is called a "sunset clause."

*Scope of services* — What exactly are you responsible for? Spell it out.

*Expenses* — Are you reimbursed for expenses? What requires pre-approval from the artist?

*Territory* — Is the agreement worldwide, or limited to specific territories?

*Termination* — Under what conditions can either party end the agreement? What happens to outstanding commissions?

**Red flags to avoid**

- Overly long terms (3+ years) without exit clauses for either party
- Undefined commission rates or bases
- No clear dispute resolution process
- Agreements that don't include a lawyer review clause

**The practical reality**

In emerging markets, formal agreements are still rare. Many management relationships operate on handshakes and trust. This works until it doesn't. Protect yourself and your artist by making documentation normal — start with the checklist and the agreement template in this module.`,
        keyPoints: [
          "Commission is typically 15–20% of gross income",
          "Always include a post-term/sunset clause",
          "Define what expenses are reimbursable",
          "Both parties benefit from clarity — this isn't about distrust",
        ],
        resources: [
          "/dashboard/library/startup/agreement",
          "/dashboard/library/startup/checklist",
        ],
      },
      {
        id: "c1-l4",
        title: "Onboarding a New Artist Properly",
        duration: "8 min read",
        type: "read",
        summary: "The first 30 days of a new management relationship set the tone for everything.",
        content: `The way you start a management relationship determines how it will run. The first 30 days are your opportunity to establish systems, understand where the artist stands, and set mutual expectations.

**What to cover in your first sessions**

Start with a full audit of where the artist is:

*Rights and registrations* — Are they registered with a PRO? Do they have an ISRC issuer? Who owns their master recordings? Do they have a publisher or are they self-published?

*Financial baseline* — What income are they currently earning? What are their expenses? Do they have a separate bank account for music income?

*Digital presence* — Who manages their social accounts? Who has access? What are the login credentials? (You'll need to secure these.)

*Existing agreements* — Do they have any contracts in place? Deals with a label, distributor, or producer? Have these been reviewed by a lawyer?

*Relationships* — Who are the key contacts in their network? Who are the people who matter in their market?

**Setting expectations**

Have a direct conversation about:
- What the artist expects from you
- What you expect from the artist
- How decisions will be made
- How you'll communicate (daily? weekly check-ins?)
- What "success" looks like in year one

**Document everything from day one**

Use the onboarding checklist in this module. Every tick on that list is a potential problem you've prevented.`,
        keyPoints: [
          "Audit rights, registrations, and financials before making any moves",
          "Secure access to digital assets immediately",
          "Set communication norms early",
          "Use the checklist — don't rely on memory",
        ],
        resources: ["/dashboard/library/startup/checklist"],
        exercise: "Complete Section 1 of the Artist Onboarding Checklist with a real or hypothetical artist. Identify the three biggest gaps.",
      },
      {
        id: "c1-l5",
        title: "Building Your Management Business",
        duration: "12 min read",
        type: "read",
        summary: "Legal structure, commission tracking, and managing multiple artists without losing the plot.",
        content: `Managing one artist is a job. Managing multiple artists is a business. Even if you're starting with one, build the foundations of a business from the beginning.

**Legal structure**

Register a legal entity for your management business — even a simple sole proprietorship or close corporation (CC) in South Africa. This separates your personal finances from your business finances, protects you from personal liability, and makes you look professional to industry partners.

Options in South Africa:
- *Sole proprietor* — Simplest, no registration needed, but no liability protection
- *Private company (Pty Ltd)* — Proper separation, more credibility, annual CIPC filing required
- *CC (Close Corporation)* — Older structure, still valid, simpler than Pty Ltd

In Nigeria: Register as a Business Name or Limited Liability Company with CAC.
In Kenya: Register with the Business Registration Service.

**Commission tracking**

Keep a clear record of every rand/naira/shilling that flows through your management — what it came from, when it was received, and what your commission was. The Monthly Revenue Tracker in the Money module is built for this.

**Contracts for every engagement**

Every deal, every booking, every agreement should be in writing. Use the templates in the Touring and Recording modules as starting points.

**When to bring in help**

- A music entertainment *lawyer* — as soon as you have your first deal to review
- An *accountant* — once your commission income exceeds R5,000/month
- A *booking agent* — once your artist is performing regularly enough to justify it`,
        keyPoints: [
          "Register a legal entity — even a simple one",
          "Track every commission from day one",
          "Put every agreement in writing",
          "Know when to bring in professionals",
        ],
        resources: ["/dashboard/tools/monthly-revenue", "/dashboard/tools/annual-pl"],
      },
    ],
  },

  // ── COURSE 2 ────────────────────────────────────────────────
  {
    id: "c2",
    slug: "touring",
    title: "Tour Management",
    subtitle: "Running shows that actually make money",
    description: "Touring is where artists build their audience and where managers prove their value. This course covers how to plan, budget, and execute tours that are profitable — from the first booking email to the last settlement.",
    color: "#F59E0B",
    icon: "🚌",
    level: "Intermediate",
    totalLessons: 5,
    estimatedHours: "2.5 hrs",
    lessons: [
      {
        id: "c2-l1",
        title: "How the Touring Business Works",
        duration: "10 min read",
        type: "read",
        summary: "Who gets paid what, and in what order.",
        content: `A show generates gross revenue — ticket sales, potentially merchandise. From that gross, multiple parties take their cut before the artist sees a rand.

**The settlement waterfall**

1. *Venue* takes their deal — either a flat rental fee or a percentage of gross
2. *Promoter* takes their margin — typically 10–20% of profit after costs
3. *Booking agent* commission — typically 10–15% of the artist's gross guarantee
4. *Manager* commission — typically 15–20% of the artist's net
5. *Artist* receives the remainder

**Types of deals**

*Flat guarantee* — The artist is paid a fixed amount regardless of ticket sales. Lowest risk for the artist, lowest upside.

*Percentage deal* — Artist receives a percentage of ticket sales after costs. Higher risk, higher upside.

*Versus deal* — Artist receives whichever is higher: the guarantee OR a percentage of ticket sales. Common for mid-level artists.

**The rider**

A rider is the artist's technical and hospitality requirements for a performance. Technical riders cover stage specs, sound requirements, lighting. Hospitality riders cover dressing room requirements, food, and accommodation. Get yours in writing and attached to every contract.

**The advance**

An "advance" in touring context means the advance information given to the venue — stage plot, input list, set times, hospitality requirements. Not money. This is different from a record advance.`,
        keyPoints: [
          "Always know the settlement waterfall before you agree to a deal",
          "Understand which type of deal is right for where your artist is",
          "A rider protects your artist — have one",
          "The advance is information, not money",
        ],
        resources: ["/dashboard/library/touring/tour-management", "/dashboard/library/touring/promoter-agreement"],
      },
      {
        id: "c2-l2",
        title: "Booking Your First Tour",
        duration: "15 min read",
        type: "read",
        summary: "How to approach venues, build promoter relationships, and fill a calendar.",
        content: `Booking a tour is a sales process. You are selling your artist to venues and promoters who are weighing up risk versus reward. Your job is to make that decision easy for them.

**Before you pitch**

Know your artist's draw. How many people do they bring to a show in each market? What's their social following in each city? What's their streaming numbers per city (check Spotify for Artists)? You need data to support your pitch.

**How to find venues and promoters**

Start with your market. Identify 10–20 venues in your city that host artists at your level. Research who books them — usually a venue booker or an independent promoter. Find their contact information.

For national tours, identify promoters who work the cities you want to play. Many are accessible on social media or through mutual contacts.

**The booking email**

Keep it short. Introduce the artist, make the case (numbers, draw, recent performance), and propose specific dates. Attach the EPK (Electronic Press Kit) with photos, bio, and links. Use the Show Booking Email Template in this module.

**Following up**

You will be ignored most of the time. Follow up once, politely, 5–7 days after your first email. If no response, move on. Relationships matter more than any one booking — don't burn bridges.

**Routing**

When building a tour, route logically — minimise travel time between cities. A tour that zigzags costs more in travel and wears out your artist and crew. Build your routing on a map before you finalise dates.`,
        keyPoints: [
          "Know your artist's draw before you pitch",
          "Keep booking emails short and data-led",
          "Route efficiently to minimise travel costs",
          "Follow up once, then move on",
        ],
        resources: [
          "/dashboard/library/touring/show-booking-email",
          "/dashboard/library/touring/tour-booking",
          "/dashboard/tools/tour-itinerary",
        ],
      },
      {
        id: "c2-l3",
        title: "Budgeting a Tour",
        duration: "18 min read",
        type: "read",
        summary: "Every rand that goes out and every rand that comes in — mapped before you leave.",
        content: `A tour budget is the difference between a profitable tour and a tour that costs you money. Build it before you confirm any shows.

**Income lines**

- Guarantees from each show
- Percentage overages (if applicable)
- Merchandise revenue estimates (typically 10–15% of ticket gross for well-selling merch)
- Sponsorship or partnership income

**Expense lines**

*Travel*
- Flights or fuel costs
- Ground transport (rental car, driver)
- Toll fees and parking

*Accommodation*
- Hotels or Airbnb per night per person
- Number of people in the touring party

*Crew*
- Fees for tour manager, sound engineer, lighting tech, backline tech
- Per diems (daily cash allowance for meals)

*Production*
- Equipment rental (if not provided by venues)
- Backline hire
- Merchandise production cost (cost of goods)

*Marketing*
- Local promotion costs in each city
- Paid social advertising

*Miscellaneous*
- Visas and permits (for international touring)
- Insurance
- Contingency (10% of total expenses minimum)

**The bottom line**

Total income minus total expenses = tour profit/loss. Run this BEFORE you agree to go. If the numbers don't work, renegotiate guarantees or reduce the touring party. Never start a tour without a budget.`,
        keyPoints: [
          "Build the budget before confirming shows",
          "Always include a 10% contingency",
          "Per diems for crew are non-negotiable",
          "Merchandise can meaningfully improve tour profitability",
        ],
        resources: ["/dashboard/tools/tour-budget"],
        exercise: "Use the Tour Budget template to model a 3-show weekend run in your city. What guarantee do you need per show to break even?",
      },
      {
        id: "c2-l4",
        title: "The Show Day — Running a Professional Show",
        duration: "12 min read",
        type: "read",
        summary: "Load-in to load-out. What a well-run show looks like.",
        content: `A show day has a structure. Know it, own it, run it.

**The run sheet**

Your run sheet is the master document for show day. Every person involved — venue staff, crew, artist — should have a copy. It includes:

- Load-in time
- Soundcheck schedule (support acts first, headline last)
- Dinner/catering time
- Doors open time
- Support act set time and duration
- Headline set time and duration
- Curfew
- Load-out time

Build the run sheet the week before the show and share it with all parties 48 hours in advance.

**Advance the show**

"Advancing" a show means confirming all the details with the venue in the week before the show. Call or email the venue contact and confirm:

- Load-in time
- Stage dimensions and available backline
- Sound system and engineer
- Catering/hospitality
- Settlement time and process
- Parking for the touring vehicle

**Day of show — your checklist**

- Arrive at load-in time (not after)
- Walk the stage before soundcheck
- Confirm settlement amount and process with venue
- Brief the artist on the schedule
- Check merchandise setup if applicable
- Be present for doors open
- Be at the side of the stage for the set
- Settle after the show (collect payment)
- Load out — leave nothing behind`,
        keyPoints: [
          "The run sheet is sacred — share it early and stick to it",
          "Advance every show the week before",
          "Always be at load-in",
          "Settle the show before you leave",
        ],
        resources: [
          "/dashboard/tools/run-sheet",
          "/dashboard/library/touring/stage-plot",
          "/dashboard/library/touring/personnel-record",
        ],
      },
      {
        id: "c2-l5",
        title: "Merchandise — Your Most Profitable Revenue Stream",
        duration: "10 min read",
        type: "read",
        summary: "Why merch matters, how to set it up, and how to track it properly.",
        content: `Merchandise is often the most profitable revenue stream for independent artists because the margin is high and 100% of it stays in your ecosystem — no label, no publisher, no PRO. The artist makes the sale, keeps the money.

**Why merch works**

A fan who buys a T-shirt is a fan who is investing in the artist. That investment deepens the relationship. Merch also extends the artist's brand beyond the stage.

**What to sell**

Start simple: T-shirts and one other item (cap, tote bag, poster). Quality over quantity — a well-designed shirt that people actually wear is marketing. A cheap shirt that sits in a drawer isn't.

**Pricing**

A T-shirt that costs R150 to produce should retail for R350–450 at a show. That's a 2–3x margin, which is standard. Never undercut yourself on price — fans at shows are willing to pay for a memory.

**Setup**

For your merch table:
- Clear display of all items with prices visible
- Card payment option (SnapScan, Yoco, or similar) — card-only is increasingly normal
- Inventory sheet to track stock
- Secure cash handling if accepting cash

**Tracking**

Use the Merchandise Sales Register and Merchandise Revenue Tracker in the Touring module. Count stock before and after every show. Discrepancies between sales and stock need to be explained.`,
        keyPoints: [
          "Merch is your highest-margin revenue stream",
          "Always have card payment available",
          "Count stock before and after every show",
          "Quality matters more than variety",
        ],
        resources: [
          "/dashboard/tools/merch-revenue",
          "/dashboard/tools/merch-sales",
        ],
      },
    ],
  },

  // ── COURSE 3 ────────────────────────────────────────────────
  {
    id: "c3",
    slug: "money",
    title: "Music Business Finance",
    subtitle: "Track it, protect it, grow it",
    description: "Most managers don't get into this business for the accounting. But understanding money — where it comes from, how to track it, and how to make sure it arrives — is what separates professionals from everyone else.",
    color: "#EC4899",
    icon: "💰",
    level: "Foundation",
    totalLessons: 4,
    estimatedHours: "2 hrs",
    lessons: [
      {
        id: "c3-l1",
        title: "Where the Money Comes From",
        duration: "15 min read",
        type: "read",
        summary: "Every music revenue stream, explained plainly.",
        content: `Music income has more sources than most people realise. Understanding all of them means your artist doesn't leave money on the table.

**Live performance income**
The most immediate and controllable. Guarantees from shows, percentage deals, festival fees.

**Streaming income**
Divided into two parts:
- *Master royalties* — paid to whoever owns the recording (usually the artist, or a label)
- *Composition royalties* — paid to the songwriter through their PRO

Streaming rates vary significantly by platform and territory. As a rough guide: R0.004–0.008 per stream on Spotify. Volume matters.

**Sync licensing**
When music is used in TV, film, advertising, or games, a sync fee is paid to both the master holder and the publisher. Sync can generate significant one-time income.

**Publishing income**
When a song is performed, broadcast, or streamed publicly, performance royalties are generated and collected by PROs (SAMRO, COSON, MCSK, etc.). These royalties flow to the songwriter, not the recording artist.

**Merchandise**
Artist-branded products. High margin, immediate cash flow.

**Brand partnerships**
Direct deals with brands for endorsement, sponsorship, or co-creation. Fee-based.

**YouTube Content ID**
If music is registered with Content ID, ad revenue from YouTube videos using the artist's music is collected.

**Neighbouring rights**
When recordings are broadcast on radio or TV, neighbouring rights royalties are generated. In SA, RISA collects these.`,
        resources: ["/dashboard/library/money/revenue-streams", "/dashboard/library/money/royalties"],
        keyPoints: [
          "There are at least 7 distinct music revenue streams",
          "Streaming pays master AND composition royalties separately",
          "PRO registration is required to collect performance royalties",
          "Sync is often the largest single income event for independent artists",
        ],
      },
      {
        id: "c3-l2",
        title: "PRO Registration — Don't Leave Money on the Table",
        duration: "14 min read",
        type: "read",
        summary: "How to register with SAMRO, CAPASSO, COSON, MCSK, and why it matters.",
        content: `A Performing Rights Organisation (PRO) is a collective that licenses the public performance of music and distributes the royalties to songwriters and publishers. If your artist's music is being played on radio, streamed online, or performed publicly — and they're not registered — that money is going uncollected.

**South Africa**

*SAMRO* (Southern African Music Rights Organisation) — collects performance royalties for music performed or broadcast in South Africa. Register at samro.org.za.

*CAPASSO* (Composers, Authors and Publishers Association) — manages mechanical rights (reproduction royalties). Register at capasso.co.za.

*RISA* (Recording Industry of South Africa) — collects neighbouring rights royalties when master recordings are broadcast. Register at risa.org.za.

**Nigeria**

*COSON* (Copyright Society of Nigeria) — the primary PRO. Register at coson.org.ng.

**Kenya**

*MCSK* (Music Copyright Society of Kenya) — covers performance and broadcast rights. Register at mcsk.or.ke.

**Ghana**

*GHAMRO* (Ghana Music Rights Organisation) — register at ghamro.org.

**What you need to register**

- Proof of identity
- List of songs (title, co-writers, percentage splits)
- ISRC codes for recordings (for some PROs)
- Banking details for royalty payments

**ISRC and UPC codes**

ISRC (International Standard Recording Code) uniquely identifies a recording. UPC (Universal Product Code) identifies a release. Every recording should have an ISRC. Most digital distributors issue these automatically. Learn more in the Recording module.`,
        keyPoints: [
          "Register with your country's PRO as soon as you have released music",
          "Different organisations collect different types of royalties",
          "Keep a complete list of songs with co-writer splits",
          "ISRC codes are required for proper royalty tracking",
        ],
        resources: ["/dashboard/library/recording/isrc-upc", "/dashboard/library/money/royalties"],
      },
      {
        id: "c3-l3",
        title: "Tracking Your Money — Bookkeeping Basics",
        duration: "10 min read",
        type: "read",
        summary: "What to track, how to track it, and how to stay on top of it without becoming an accountant.",
        content: `You don't need to be an accountant. You need to know where every rand comes from and where it goes. That's it.

**Separate the money**

The first rule: your artist's music income goes into a dedicated bank account. Not a personal account, not a joint account — a music business account. This makes bookkeeping easier, taxes cleaner, and disputes simpler.

**Income tracking**

Every time money comes in, log it:
- Date
- Source (which show, which platform, which deal)
- Amount
- Your commission

Use the Monthly Revenue Tracker. Do it weekly — don't let it pile up.

**Expense tracking**

Every time money goes out on behalf of the business, log it:
- Date
- What it was for
- Amount
- Category (travel, production, marketing, etc.)

Keep receipts. In most jurisdictions, business expenses are tax-deductible — but only if you can prove them.

**The monthly review**

Set aside 30 minutes at the end of each month to review your financial position:
- Total income for the month
- Total expenses
- Net income (your commission basis)
- Year-to-date totals

This 30-minute habit prevents end-of-year surprises.

**Paying yourself**

When you start earning commissions, pay yourself consistently. Transfer your commission to your personal account on a regular schedule. Never blur the line between the business account and your personal money.`,
        keyPoints: [
          "Separate music business money from personal money from day one",
          "Log income and expenses weekly, not monthly",
          "Keep all receipts — they're tax documents",
          "30 minutes of monthly review prevents year-end chaos",
        ],
        resources: [
          "/dashboard/tools/monthly-revenue",
          "/dashboard/tools/daily-bookkeeping",
          "/dashboard/tools/annual-pl",
        ],
        exercise: "Set up the Monthly Revenue Tracker with your artist's current income streams. Fill in whatever you know for the last 3 months.",
      },
      {
        id: "c3-l4",
        title: "Invoicing and Getting Paid",
        duration: "8 min read",
        type: "read",
        summary: "How to issue professional invoices and what to do when payment is late.",
        content: `Invoicing is how you formalise payment for services. Every show guarantee, every brand deal, every session fee should be supported by an invoice. It's not just good practice — it's a paper trail that protects you.

**What a good invoice includes**

- Your business name and contact details
- Client's business name and contact details
- Invoice number (sequential — keep track)
- Invoice date and payment due date
- Itemised description of services
- Amount per item
- Total amount
- Payment details (bank account, reference number)
- VAT if applicable

**Payment terms**

Standard terms are 30 days from invoice date (net 30). For shows, it's common to request 50% deposit upon signing and 50% on the day of the show. For brand deals, 50% on signing and 50% on delivery.

**When payment is late**

First: follow up with a polite reminder 3 days after the due date. Second: send a formal payment reminder 7 days overdue. Third: if still unpaid after 21 days, issue a letter of demand. Fourth: if still unpaid, small claims court (for amounts under R20,000 in SA) or an attorney for larger amounts.

Document everything. Emails, messages, calls — keep a record of every interaction regarding outstanding payment.

**Prevention is better than cure**

Signed contracts with clear payment terms prevent most disputes. The Service Record template in the Money module is useful for documenting services when a full contract isn't in place.`,
        keyPoints: [
          "Every payment should be supported by an invoice",
          "Use sequential invoice numbers",
          "Request deposits upfront on shows and brand deals",
          "Document every follow-up on late payments",
        ],
        resources: [
          "/dashboard/tools/invoice",
          "/dashboard/library/money/service-record",
        ],
      },
    ],
  },

  // ── COURSE 4 ────────────────────────────────────────────────
  {
    id: "c4",
    slug: "marketing",
    title: "Marketing Your Artist",
    subtitle: "Getting the right people to pay attention",
    description: "Marketing is not posting on Instagram every day. It's a strategy — who you're trying to reach, what you want them to do, and how you're going to get their attention. This course shows you how to build and execute a real marketing plan.",
    color: "#8B5CF6",
    icon: "📢",
    level: "Intermediate",
    totalLessons: 4,
    estimatedHours: "2 hrs",
    lessons: [
      {
        id: "c4-l1",
        title: "Building a Release Plan",
        duration: "16 min read",
        type: "read",
        summary: "How to plan and execute a release from 6 weeks out to 6 weeks after.",
        content: `A release plan is the roadmap for getting a song or album from finished to heard. Without one, a release is just an upload. With one, it's a campaign.

**The timeline**

*8 weeks before release*
- Finalise recording, mixing, mastering
- Register ISRC and UPC codes
- Submit to distributor (most require 7–14 days, Spotify editorial submission requires 7 days minimum)
- Prepare EPK and press release
- Brief the team on the campaign

*6 weeks before*
- Submit to Spotify for Artists editorial playlist consideration
- Begin outreach to music blogs and journalists
- Prepare visual assets (cover art, promotional images, video clips)
- Plan social content calendar

*4 weeks before*
- Begin teaser content on social media
- Pitch to radio stations
- Confirm any press interviews

*2 weeks before*
- "Coming soon" announcement with cover art
- Pre-save campaign (link through DistroKid, ToneDen, etc.)
- Confirm playlist pitching status

*Release week*
- Release day announcement
- Behind-the-scenes content
- Live or Q&A activation
- Push social sharing

*Post-release (weeks 1–6)*
- Track streaming performance weekly
- Continue pitching for playlists and radio
- Analyse what's working and adjust`,
        keyPoints: [
          "Start planning 8 weeks before release, not 2",
          "Spotify editorial requires minimum 7 days advance submission",
          "Pre-save campaigns build day-one streaming numbers",
          "Post-release maintenance is as important as launch",
        ],
        resources: [
          "/dashboard/library/recording/release-checklist",
          "/dashboard/tools/single-release-plan",
        ],
      },
      {
        id: "c4-l2",
        title: "Radio Promotion",
        duration: "14 min read",
        type: "read",
        summary: "How radio actually works and how to get your artist on it.",
        content: `Radio remains one of the most powerful distribution channels for music, especially in African markets where terrestrial radio reaches audiences that streaming platforms don't. Understanding radio is understanding your market.

**Types of radio**

*Commercial radio* — Stations that broadcast to large audiences and are funded by advertising. Higher standards, harder to access, biggest impact. Examples: Metro FM, YFM, Smooth FM (SA); Cool FM, Beat FM (Nigeria).

*Community radio* — Local stations that serve a specific geographic community. More accessible, genuinely supportive of local artists, important for building regional fanbase.

*College radio* — Student-run stations, particularly influential in the US but exists in other markets. Often early adopters of new artists.

*Digital/online radio* — Internet-based stations. Lower barrier, growing listenership.

**How to pitch to radio**

Research before you pitch. Know the station's format (what kind of music they play), who the music director is, and what the submission process is. Most stations have a formal submissions process.

Your pitch package:
- Professional cover art (300 dpi minimum)
- Radio edit of the song (typically 3:30 or under, no explicit content)
- One-page artist bio
- Press release with the song's story
- Direct download link (not a streaming link — radio needs a WAV or high-quality MP3)

Follow up once, a week after submission. Radio is a long game — persistence without pestering.

**Airplay monitoring**

Once you're getting airplay, register with your PRO if you haven't already. Airplay generates performance royalties. You need to be registered to collect them.`,
        keyPoints: [
          "Community radio is more accessible and genuinely supports local artists",
          "Submit a radio edit, not the album version",
          "Radio needs a download link, not a streaming link",
          "Airplay is worthless if you're not registered to collect royalties",
        ],
        resources: [
          "/dashboard/library/marketing/routine-checklist",
          "/dashboard/tools/dsp-pitching",
          "/dashboard/tools/marketing-forecast",
        ],
      },
      {
        id: "c4-l3",
        title: "Streaming Playlists — The New Radio",
        duration: "12 min read",
        type: "read",
        summary: "How playlists work, how to pitch them, and how to track your placements.",
        content: `Playlist placement on Spotify, Apple Music, Boomplay, and other platforms is the modern equivalent of radio airplay — it exposes your artist to audiences who wouldn't otherwise find them. It can move streaming numbers significantly.

**Types of playlists**

*Editorial playlists* — Curated by the platform's internal team. High impact, high competition. Spotify's New Music Friday, RapCaviar, Afrobeats playlists. These are pitched through Spotify for Artists before release.

*Algorithmic playlists* — Generated by the platform based on listening behaviour. Discover Weekly, Release Radar, Radio stations. These are influenced by early performance metrics — saves, streams, completion rates.

*Independent curator playlists* — Run by individuals or music blogs with large followings. Often more accessible than editorial. Find them on Submithub, Groover, or by searching the genre on Spotify.

*Branded playlists* — Curated by brands or media companies (magazines, radio stations). Good for positioning.

**How to pitch Spotify editorial**

Use Spotify for Artists (spotifyforartists.spotify.com). You must submit BEFORE the release date — 7 days minimum, ideally more. Complete the full submission form: mood, genre, instrumentation, story. The more information you provide, the better.

**Boomplay**

For African artists, Boomplay is the dominant platform in many markets. Submit through their artist portal or through your digital distributor.

**Tracking placement**

Use the Streaming Playlist Target Tracker in the Marketing module to log every pitch, every placement, and every follow-up.`,
        keyPoints: [
          "Editorial pitches must be submitted before release — not on release day",
          "Algorithmic playlists follow from early performance metrics",
          "Boomplay matters more than Spotify in many African markets",
          "Track every pitch and placement",
        ],
        resources: [
          "/dashboard/tools/dsp-pitching",
          "/dashboard/tools/artist-audience-report",
        ],
      },
      {
        id: "c4-l4",
        title: "Social Media as a Marketing Tool",
        duration: "12 min read",
        type: "read",
        summary: "Strategy over posting. What actually builds an audience.",
        content: `Social media is not a marketing strategy. It is a distribution channel. The strategy is what you're trying to achieve and who you're trying to reach. The channel is where you reach them.

**The three types of content**

*Connection content* — Shows who the artist is as a person. Behind-the-scenes, personal stories, opinions, humour. This is what builds fans, not followers.

*Promotional content* — New releases, shows, merch drops, announcements. Necessary but easy to overdo. A good ratio: no more than 1 in 5 posts should be overtly promotional.

*Conversion content* — Calls to action. Stream this, buy this, come to this show. Should be clear, direct, and infrequent enough to have impact.

**Platform strategy by market**

*Instagram* — Visual-first, strong in SA and across Africa. Best for image and short video content.

*TikTok* — The platform most likely to generate virality for music. Short-form video, sound-first.

*YouTube* — Long-form content, music videos, vlogs. SEO-friendly — videos rank in search.

*Facebook* — Still significant reach in many African markets, especially older demographics. Good for event promotion.

*WhatsApp* — Underutilised for music marketing. A WhatsApp broadcast list to superfans is more valuable than 10,000 passive followers.

**The consistency trap**

Posting every day is not a strategy. Posting with intention — knowing why you're posting, who you're posting for, and what you want them to do — is a strategy. Quality over frequency.

**Build the email list**

Social platforms own the audience. You don't. The Email Sign-Up Sheet in the Touring module is the beginning of a list you actually own. A fan email list is an asset that survives algorithm changes and platform shutdowns.`,
        keyPoints: [
          "Strategy first, channel second",
          "No more than 1 in 5 posts should be promotional",
          "WhatsApp is underutilised and highly effective",
          "Build an email list — you own it, unlike your social following",
        ],
        resources: [
          "/dashboard/tools/social-media-calendar",
          "/dashboard/library/marketing/routine-checklist",
          "/dashboard/tools/fan-signup",
        ],
      },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find(c => c.slug === slug);
}

export function getLesson(courseSlug: string, lessonId: string): Lesson | undefined {
  const course = getCourse(courseSlug);
  return course?.lessons.find(l => l.id === lessonId);
}

/**
 * Visual production contract clause libraries.
 * Photographer, DP, Stylist — three flavours of creative-services-with-IP-assignment contract.
 */
export interface Clause { num: string; title: string; text: string; }

const baseCreative = (govLaw: string, role: string, deliverable: string): Clause[] => [
  { num: "1", title: "Engagement", text: `Commissioner engages ${role} to provide the services and deliver the ${deliverable} described in Schedule A. ${role} accepts the engagement on the terms set out in this Agreement and Schedule A.` },
  { num: "2", title: "Deliverables & Timeline", text: `${role} shall deliver: (i) the ${deliverable} in the formats specified in Schedule A; (ii) all underlying files / negatives / project files / RAW / proxies; (iii) attendance at all agreed shoot days. Final delivery shall be no later than the date in Schedule A.` },
  { num: "3", title: "Fee", text: `Commissioner shall pay ${role} the fee specified in Schedule A. Where Schedule A specifies a day rate, fee covers attendance, prep and one round of post (where applicable). Out-of-hours, holiday or extended-day surcharges apply only as specified in Schedule A.` },
  { num: "4", title: "Payment", text: "Payment is structured as: 50% on full execution; 50% on delivery and Commissioner's acceptance of the deliverables. Invoices are paid by EFT within fourteen (14) days. VAT is added where the supplier is registered for VAT." },
  { num: "5", title: "Ownership of Deliverables", text: `All right, title and interest in and to the ${deliverable} (and all underlying assets) shall vest exclusively in Commissioner upon creation, as a commissioned work for the purposes of applicable copyright law. To the extent any assignment is required, ${role} hereby irrevocably assigns to Commissioner all such rights, in perpetuity, throughout the world, free of any further consideration. ${role} retains the right to display the deliverables in ${role}'s portfolio for marketing purposes only.` },
  { num: "6", title: "Credit", text: `Commissioner shall accord ${role} credit substantially as: "[Discipline] by [${role} Name]" where customary on the deliverable medium (e.g. liner notes, video credits, social caption tag). Inadvertent omission shall not be a breach but shall be corrected on notice for prospective uses.` },
  { num: "7", title: "Conduct on Set", text: `${role} shall: (i) arrive on time and ready to work; (ii) co-operate with the producer / director's reasonable direction; (iii) observe health, safety and access protocols; (iv) refrain from social-media posting of unreleased material without written consent; (v) maintain professional conduct at all times.` },
  { num: "8", title: "Warranties", text: `${role} warrants: (i) the right to provide the services; (ii) the deliverable shall be original; (iii) any third-party material incorporated has been licensed; (iv) ${role} carries professional indemnity insurance to a level commensurate with the engagement.` },
  { num: "9", title: "Indemnity", text: `${role} indemnifies Commissioner against direct claims arising from breach of warranties up to a cap equal to the fee paid, save fraud or wilful misconduct.` },
  { num: "10", title: "Force Majeure & Reschedule", text: "Where shoot cannot proceed due to force majeure (weather, illness, civil unrest), the parties shall reschedule on the next mutually available date with no kill fee. Where Commissioner cancels with less than seven (7) days' notice, 50% of fee is payable. Within 48 hours, full fee is payable." },
  { num: "11", title: "Termination", text: `Either party may terminate on seven (7) days' notice for material breach not cured. On termination by Commissioner without cause, ${role} is entitled to fees due for services performed plus 25% of unbilled fee. On termination for cause, no further fee is payable.` },
  { num: "12", title: "Governing Law", text: `This Agreement is governed by the laws of ${govLaw}. Disputes shall be referred to mediation and, failing resolution, to arbitration.` },
];

export const PHOTOGRAPHER = (govLaw: string) =>
  baseCreative(govLaw, "Photographer", "photographs");

export const DP = (govLaw: string) =>
  baseCreative(govLaw, "Director of Photography", "cinematographic footage and project files");

export const STYLIST = (govLaw: string) =>
  baseCreative(govLaw, "Stylist", "wardrobe, styling and look-book");

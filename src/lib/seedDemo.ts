import type { EntryType, LinkMeta } from '../types';

/**
 * TEMPORARY demo seed data. Used by the "Seed demo" button in the topbar to
 * populate the app with three extra projects (each on a different preset) and
 * a deliberately uneven, sporadic spread of entries across their categories —
 * some categories carry a heavy run of entries, others get just one or two,
 * and several are left completely empty so the demo doesn't read as an
 * exhaustively-filled checklist. Timestamps (`daysAgo`) are irregular too:
 * bursts of same-day/adjacent-day activity separated by multi-day gaps,
 * rather than a smooth even spread.
 *
 * Safe to delete this file, the `seedDemoData` store action, and the topbar
 * button together when the demo is no longer needed.
 */

export interface SeedEntry {
  categoryId: string;
  subHeadingId?: string;
  type: EntryType;
  body: string;
  link?: LinkMeta;
  relatesTo?: string;
  citation?: string;
  /** Backdates the entry this many days for a realistic timeline. */
  daysAgo?: number;
}

export interface SeedProject {
  name: string;
  description: string;
  presetId: string;
  entries: SeedEntry[];
}

export const DEMO_PROJECTS: SeedProject[] = [
  {
    name: 'Demo — Riverside Pavilion (UTS)',
    description: 'Sample UTS design-log project seeded for demonstration.',
    presetId: 'uts',
    // Categories left empty on purpose: return-brief, ncc, sustainability, planning.
    entries: [
      // feedback (6)
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Initial studio pin-up: tutor questioned whether a pavilion typology even suits the brief scale — asked us to test a more distributed, multi-structure response before committing.',
        relatesTo: 'process',
        daysAgo: 47,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: "Peer review (swap crit): classmates found the entry sequence confusing from the car park side — the boardwalk doesn't read as the 'front door'.",
        daysAgo: 42,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Tutor crit: the roof plane reads as too heavy against the water. Suggested lightening the eaves and pulling the structure back from the bank.',
        relatesTo: 'process',
        daysAgo: 19,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Tutor crit: better legibility on the entry now, but asked for a materials palette that responds to the flood cycle rather than fighting it.',
        daysAgo: 11,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: "Desk crit: engineer's prop detail resolved the cantilever worry. Tutor wants the amenities core pulled back from the heritage wall curtilage by another 500mm to be safe.",
        relatesTo: 'planning',
        daysAgo: 5,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Crit 2: the prop reads well and the lighter eaves fixed the heaviness. Push the screen detail further and resolve the amenities entry.',
        relatesTo: 'structure',
        daysAgo: 1,
      },
      // ideas (3)
      {
        categoryId: 'ideas',
        type: 'text',
        body: 'What if the pavilion floats on a boardwalk deck so the ground plane stays pervious and the river edge is left untouched?',
        relatesTo: 'sustainability',
        daysAgo: 18,
      },
      {
        categoryId: 'ideas',
        type: 'text',
        body: 'Idea: instead of one roof, break the pavilion into three linked modules stepping down toward the water — echoes the terracing of the bank itself.',
        daysAgo: 6,
      },
      {
        categoryId: 'ideas',
        type: 'text',
        body: 'What if the amenities core doubles as a flood marker — a scale painted up its face showing historic flood heights? Turns compliance into storytelling.',
        daysAgo: 1,
      },
      // process (8)
      {
        categoryId: 'process',
        subHeadingId: 'pf-options',
        type: 'text',
        body: 'First massing pass: tested a single long bar building vs a cluster of small pavilions. Cluster reads better against the riverside scale but needs more circulation.',
        daysAgo: 46,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-sketches',
        type: 'text',
        body: 'Hand sketches of the roof geometry — trying a single-pitch skillion vs a butterfly roof that could channel rainwater to a tank.',
        daysAgo: 45,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-precedent',
        type: 'text',
        body: "Precedent dig: Murcutt's Marika-Alderton House for the lightweight skin-and-frame language. Also looking at Troppo's tropical pavilions for the deep verandah move.",
        daysAgo: 29,
      },
      {
        categoryId: 'process',
        type: 'text',
        body: 'Model study #2: raised the whole plan on the 600mm datum from the hydrology note. Reads more confident, less apologetic about the flood constraint.',
        daysAgo: 8,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-options',
        type: 'text',
        body: "Tested pulling the amenities core to the south edge — opens the north deck fully to the view. This is the version that's sticking.",
        daysAgo: 6,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-precedent',
        type: 'link',
        body: 'Precedent: Glenn Murcutt riverside works — the way the roof floats over an open plan.',
        link: {
          url: 'https://en.wikipedia.org/wiki/Glenn_Murcutt',
          title: 'Glenn Murcutt — Wikipedia',
          domain: 'wikipedia.org',
        },
        daysAgo: 5,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-sketches',
        type: 'text',
        body: 'Iteration 3: shifted the core to the south edge so the north deck opens fully to the view. Massing feels much calmer now.',
        daysAgo: 4,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-sketches',
        type: 'text',
        body: 'Final detail sketches for the screen battens on the west face — settled on a variable-spacing louvre pattern instead of a uniform grid.',
        daysAgo: 1,
      },
      // references (2)
      {
        categoryId: 'references',
        type: 'link',
        body: 'Reference: flood-resilient construction approaches for raised timber structures near waterways.',
        link: {
          url: 'https://en.wikipedia.org/wiki/Flood_control',
          title: 'Flood control — Wikipedia',
          domain: 'wikipedia.org',
        },
        daysAgo: 28,
      },
      {
        categoryId: 'references',
        type: 'link',
        body: 'Precedent: timber boardwalk pavilions and their structural detailing.',
        link: {
          url: 'https://www.archdaily.com/tag/pavilion',
          title: 'Pavilion projects — ArchDaily',
          domain: 'archdaily.com',
        },
        citation: 'ArchDaily. (2024). Pavilion. https://www.archdaily.com/tag/pavilion',
        daysAgo: 6,
      },
      // country (5)
      {
        categoryId: 'country',
        subHeadingId: 'cwc-geology',
        type: 'text',
        body: "Geology note: sandy alluvial soils along the bank — footings will need to go deeper than expected, or the design should minimise point loads altogether.",
        daysAgo: 38,
      },
      {
        categoryId: 'country',
        subHeadingId: 'cwc-ecologies',
        type: 'text',
        body: 'Ecology walk with the ranger: this stretch of bank is a known frog habitat during wet season. Any lighting on the deck needs to be shielded and low-level.',
        daysAgo: 33,
      },
      {
        categoryId: 'country',
        subHeadingId: 'cwc-seasonality',
        type: 'text',
        body: "Seasonality: the site floods for roughly six weeks over summer. The pavilion's 'closed' season should be designed for, not treated as a failure state.",
        daysAgo: 25,
      },
      {
        categoryId: 'country',
        subHeadingId: 'cwc-hydrology',
        type: 'text',
        body: 'Hydrology note: the site floods seasonally. Raising the deck 600mm keeps it dry while letting water move through underneath.',
        daysAgo: 17,
      },
      {
        categoryId: 'country',
        subHeadingId: 'cwc-songlines',
        type: 'text',
        body: "Guest lecture note: reminded to keep researching whether there's a documented songline connection to this stretch of river before assuming there isn't — follow up with Country consultation, not assumption.",
        daysAgo: 9,
      },
      // context (3)
      {
        categoryId: 'context',
        subHeadingId: 'ctx-views',
        type: 'text',
        body: 'View analysis: the best sightline down-river is from the north-west corner, not dead-centre where the original site plan assumed.',
        daysAgo: 36,
      },
      {
        categoryId: 'context',
        subHeadingId: 'ctx-sun',
        type: 'text',
        body: 'Sun-path study shows harsh western glare across the deck in summer afternoons — needs a screen or deep overhang on the river side.',
        daysAgo: 15,
      },
      {
        categoryId: 'context',
        subHeadingId: 'ctx-landscape',
        type: 'text',
        body: "Landscape note: the riparian planting buffer can't be touched within 10m of the bank — pushes the deck footprint further back than the brief sketch assumed.",
        daysAgo: 3,
      },
      // carbon (2)
      {
        categoryId: 'carbon',
        subHeadingId: 'wlc-matrix',
        type: 'text',
        body: 'Started the materials matrix in EPiC. Glulam frame is the big win on embodied carbon vs the steel option — roughly half the kgCO₂e.',
        daysAgo: 12,
      },
      {
        categoryId: 'carbon',
        subHeadingId: 'wlc-calcs',
        type: 'text',
        body: 'Ran the EPiC numbers on the final structure: glulam + steel prop combo lands at roughly 38% lower embodied carbon than the all-steel option from concept stage.',
        daysAgo: 2,
      },
      // structure (5)
      {
        categoryId: 'structure',
        subHeadingId: 'str-axo',
        type: 'text',
        body: 'Started the exploded axo — want to show the roof, screen layer, deck structure and prop as separate legible systems.',
        daysAgo: 30,
      },
      {
        categoryId: 'structure',
        subHeadingId: 'str-lifecycle',
        type: 'text',
        body: 'Material life-cycle check: glulam is FSC-certified and locally fabricated, which helps the transport-emissions story too.',
        daysAgo: 16,
      },
      {
        categoryId: 'structure',
        subHeadingId: 'str-engineer',
        type: 'text',
        body: 'Engineer mark-up: the cantilevered deck edge needs a deeper edge beam or a prop down to the boardwalk. Leaning toward a slender steel prop.',
        daysAgo: 7,
      },
      {
        categoryId: 'structure',
        subHeadingId: 'str-engineer',
        type: 'text',
        body: 'Second engineer meeting: confirmed the prop can be a single 150mm CHS instead of the doubled-up option — cleaner reading under the deck.',
        daysAgo: 3,
      },
      {
        categoryId: 'structure',
        type: 'text',
        body: 'Structure resolved for submission: prop, edge beam and deck joists all coordinated with the services run under the boardwalk.',
        daysAgo: 1,
      },
      // ipd-notes (2)
      {
        categoryId: 'ipd-notes',
        type: 'text',
        body: 'IPD session addendum: reminded that Whole Life Carbon and Connecting with Country entries should cross-reference each other where materials choices touch on Country knowledge — don\'t silo them.',
        daysAgo: 22,
      },
      {
        categoryId: 'ipd-notes',
        type: 'text',
        body: 'Lecture note (Week 7): assessors want the design-log narrative legible — every decision should trace back to feedback, Country or context evidence.',
        daysAgo: 2,
      },
    ],
  },
  {
    name: 'Demo — Saltmarsh (Novel)',
    description: 'Sample book-writing project seeded for demonstration.',
    presetId: 'book',
    // Categories left empty on purpose: book-worldbuilding, book-feedback, book-craft-notes.
    entries: [
      // book-premise (2)
      {
        categoryId: 'book-premise',
        type: 'text',
        body: 'Logline: a marine biologist returns to her flooding hometown and uncovers why the saltmarsh is dying — and what her family buried there.',
        daysAgo: 36,
      },
      {
        categoryId: 'book-premise',
        type: 'text',
        body: "Reworked the logline to foreground the flooding threat rather than the mystery — test readers respond more to stakes than intrigue in the pitch.",
        daysAgo: 14,
      },
      // book-characters (4)
      {
        categoryId: 'book-characters',
        type: 'text',
        body: 'Protagonist: Mara, 34, prickly and precise. Wants the truth; afraid of what it costs. Voice should be dry, observational.',
        daysAgo: 33,
      },
      {
        categoryId: 'book-characters',
        type: 'text',
        body: "Secondary cast: Dr. Okafor, the old marine station director who knows what the family did. Warm on the surface, evasive underneath.",
        daysAgo: 27,
      },
      {
        categoryId: 'book-characters',
        type: 'text',
        body: "Cut a subplot character (Mara's ex-partner) entirely — he was pulling focus from the family/marsh relationship, which is the real engine of the book.",
        daysAgo: 5,
      },
      {
        categoryId: 'book-characters',
        type: 'text',
        body: "Character note: Mara's brother Sam needs one redeeming scene before the climax or his confession reads as too sudden.",
        daysAgo: 1,
      },
      // book-chapters (7)
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act1',
        type: 'text',
        body: "Drafted chapter 3 — 1,800 words. First real conversation between Mara and Dr. Okafor, heavy with what's not being said.",
        daysAgo: 24,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act1',
        type: 'text',
        body: 'Drafted chapter 6 — 2,300 words. End of act one: Mara decides to stay past the funeral instead of catching the ferry home.',
        daysAgo: 18,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act1',
        type: 'text',
        body: 'Drafted chapter 1 — 2,100 words. Mara arrives by ferry; the marsh is the first thing she sees and it stops her cold.',
        daysAgo: 15,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act2',
        type: 'text',
        body: 'Drafted chapter 9 — 2,600 words. Mara finds the old water-board survey that the family paid to bury. Midpoint reversal landed.',
        daysAgo: 12,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act3',
        type: 'text',
        body: 'Outlined the climax: the spring tide breaches the new seawall during the town meeting. Nature forces the confession the people would not.',
        daysAgo: 9,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act2',
        type: 'text',
        body: "Drafted chapter 11 — 2,000 words. Sam's first lie unravels in front of Mara. Good tension, needs a pass for pacing.",
        daysAgo: 4,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act3',
        type: 'text',
        body: 'Drafted chapter 14 (final) — 1,950 words. First full draft complete. Rough, but it\'s there.',
        daysAgo: 1,
      },
      // book-research (3)
      {
        categoryId: 'book-research',
        type: 'text',
        body: "Researching historical flood records for the fictional town — basing the 'buried survey' plot device on a real 1970s land-reclamation scandal.",
        daysAgo: 23,
      },
      {
        categoryId: 'book-research',
        type: 'link',
        body: 'Reference on saltmarsh ecology and tidal die-back for the science beats.',
        link: {
          url: 'https://en.wikipedia.org/wiki/Salt_marsh',
          title: 'Salt marsh — Wikipedia',
          domain: 'wikipedia.org',
        },
        daysAgo: 11,
      },
      {
        categoryId: 'book-research',
        type: 'text',
        body: 'Interviewed a coastal council ranger about managed retreat and seawall politics. Great detail on how slowly a town admits it is sinking.',
        daysAgo: 2,
      },
      // book-revisions (2)
      {
        categoryId: 'book-revisions',
        type: 'text',
        body: "Very early revision: cut the prologue entirely after a workshop group said it told the reader the ending before earning it.",
        daysAgo: 34,
      },
      {
        categoryId: 'book-revisions',
        type: 'text',
        body: 'Revision pass: seeded a hint of the buried secret into the ferry scene. Cut 300 words of throat-clearing from the opening.',
        daysAgo: 1,
      },
    ],
  },
  {
    name: 'Demo — Reef Thermal Tolerance (Study)',
    description: 'Sample scientific-study project seeded for demonstration.',
    presetId: 'scientific-study',
    // Categories left empty on purpose: study-literature, study-findings, study-limitations.
    entries: [
      // study-question (2)
      {
        categoryId: 'study-question',
        type: 'text',
        body: 'Hypothesis: corals from warmer back-reef pools have higher bleaching thresholds than conspecifics from cooler fore-reef sites.',
        daysAgo: 29,
      },
      {
        categoryId: 'study-question',
        type: 'text',
        body: 'Refined the hypothesis to specify Fv/Fm as the operational proxy for bleaching threshold, since that\'s what the PAM fluorometer actually measures.',
        daysAgo: 4,
      },
      // study-methodology (4)
      {
        categoryId: 'study-methodology',
        subHeadingId: 'study-ethics',
        type: 'text',
        body: 'Ethics amendment submitted to extend fragmenting to 8 colonies per site — reviewer flagged our original n as underpowered.',
        daysAgo: 30,
      },
      {
        categoryId: 'study-methodology',
        subHeadingId: 'study-materials',
        type: 'text',
        body: 'Instruments: Diving-PAM fluorometer for Fv/Fm, HOBO loggers in each pool for thermal history, custom 4-bath ramp rig calibrated to ±0.1°C.',
        daysAgo: 20,
      },
      {
        categoryId: 'study-methodology',
        subHeadingId: 'study-ethics',
        type: 'text',
        body: 'Collection permit approved (GBRMPA). Fragmenting limited to 5 colonies per site to minimise impact.',
        daysAgo: 15,
      },
      {
        categoryId: 'study-methodology',
        type: 'text',
        body: 'Piloted the ramp protocol on 5 spare fragments before the real run — caught a temperature overshoot in the 33°C bath and recalibrated.',
        daysAgo: 8,
      },
      // study-data (8)
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Site visit 1: deployed HOBO loggers in 3 back-reef and 3 fore-reef pools. Baseline thermal profiles starting to log.',
        daysAgo: 44,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Site visit 2: collected donor colonies under the permit. 5 per site as agreed with GBRMPA, tagged and transported in coolers.',
        daysAgo: 37,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Logger retrieval — first full week of thermal data. Back-reef pools already showing a clear midday spike pattern.',
        daysAgo: 18,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Batch 1 photography backlog cleared — PAM images matched to timestamps and filed. Tedious but necessary before batch 2 starts.',
        daysAgo: 13,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Ran the thermal ramp on batch 1: 40 fragments held at 26/29/31/33°C for 18h. Photographed every 3h for PAM scoring.',
        daysAgo: 10,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Batch 2 complete — 40 more fragments. Logger data confirms back-reef pools run ~1.8°C warmer at midday than fore-reef sites. n now = 80.',
        daysAgo: 6,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Re-ran 6 fragments that had ambiguous PAM readings in batch 2 — likely a probe contact issue, not a biological signal.',
        daysAgo: 1,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Final data QC pass: flagged and excluded 3 fragments with visible pre-existing bleaching at collection — shouldn\'t have been included in n=80.',
        daysAgo: 1,
      },
      // study-analysis (3)
      {
        categoryId: 'study-analysis',
        type: 'text',
        body: 'Exploratory plots only so far — back-reef fragments visually cluster higher on Fv/Fm at 31°C and up, but nothing formal yet.',
        daysAgo: 24,
      },
      {
        categoryId: 'study-analysis',
        type: 'text',
        body: 'Fitted dose-response curves to Fv/Fm. Back-reef ED50 ≈ 32.4°C vs fore-reef ≈ 31.1°C — a 1.3°C shift, p < 0.01.',
        daysAgo: 5,
      },
      {
        categoryId: 'study-analysis',
        type: 'text',
        body: 'Mixed-effects model with site as random effect: thermal history remains significant after accounting for colony. Wrote the R script up cleanly.',
        daysAgo: 3,
      },
      // study-writeup (2)
      {
        categoryId: 'study-writeup',
        type: 'text',
        body: "Started the intro/lit framing paragraph early so the gap statement is ready before results are finalised — easier to write while it's fresh.",
        daysAgo: 21,
      },
      {
        categoryId: 'study-writeup',
        type: 'text',
        body: 'Drafted methods + results sections. Targeting Coral Reefs journal; need to finish the discussion and tidy figures.',
        daysAgo: 1,
      },
    ],
  },
];

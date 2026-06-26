import type { EntryType, LinkMeta } from '../types';

/**
 * TEMPORARY demo seed data. Used by the "Seed demo" button in the topbar to
 * populate the app with three extra projects (each on a different preset) and a
 * spread of entries across their categories, for showcasing/screenshots.
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
    entries: [
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Tutor crit: the roof plane reads as too heavy against the water. Suggested lightening the eaves and pulling the structure back from the bank.',
        relatesTo: 'process',
        daysAgo: 22,
      },
      {
        categoryId: 'ideas',
        type: 'text',
        body: 'What if the pavilion floats on a boardwalk deck so the ground plane stays pervious and the river edge is left untouched?',
        relatesTo: 'sustainability',
        daysAgo: 21,
      },
      {
        categoryId: 'return-brief',
        subHeadingId: 'rb-typology',
        type: 'text',
        body: 'Confirmed typology: small public gathering pavilion, ~180 m² GFA, with a sheltered deck and amenities core.',
        daysAgo: 19,
      },
      {
        categoryId: 'country',
        subHeadingId: 'cwc-hydrology',
        type: 'text',
        body: 'Hydrology note: the site floods seasonally. Raising the deck 600mm keeps it dry while letting water move through underneath.',
        daysAgo: 16,
      },
      {
        categoryId: 'context',
        subHeadingId: 'ctx-sun',
        type: 'text',
        body: 'Sun-path study shows harsh western glare across the deck in summer afternoons — needs a screen or deep overhang on the river side.',
        daysAgo: 12,
      },
      {
        categoryId: 'process',
        subHeadingId: 'pf-sketches',
        type: 'text',
        body: 'Iteration 3: shifted the core to the south edge so the north deck opens fully to the view. Massing feels much calmer now.',
        daysAgo: 7,
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
        daysAgo: 4,
      },
      {
        categoryId: 'ncc',
        subHeadingId: 'ncc-class',
        type: 'text',
        body: 'Building classification: Class 9b (public assembly) for the gathering space, Class 10a for the detached amenities. Confirm occupant load with tutor.',
        daysAgo: 18,
      },
      {
        categoryId: 'carbon',
        subHeadingId: 'wlc-matrix',
        type: 'text',
        body: 'Started the materials matrix in EPiC. Glulam frame is the big win on embodied carbon vs the steel option — roughly half the kgCO₂e.',
        daysAgo: 14,
      },
      {
        categoryId: 'sustainability',
        subHeadingId: 'sus-systems',
        type: 'text',
        body: 'Passive strategy: cross-ventilation through the open deck plus the deep north overhang handles most of the cooling. No mechanical AC in the brief.',
        daysAgo: 13,
      },
      {
        categoryId: 'planning',
        subHeadingId: 'pi-heritage',
        type: 'text',
        body: 'Heritage check: the stone retaining wall along the bank is a listed item. Design has to read as reversible and keep clear of its curtilage.',
        daysAgo: 11,
      },
      {
        categoryId: 'structure',
        subHeadingId: 'str-engineer',
        type: 'text',
        body: 'Engineer mark-up: the cantilevered deck edge needs a deeper edge beam or a prop down to the boardwalk. Leaning toward a slender steel prop.',
        daysAgo: 9,
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
        daysAgo: 8,
      },
      {
        categoryId: 'ipd-notes',
        type: 'text',
        body: 'Lecture note (Week 7): assessors want the design-log narrative legible — every decision should trace back to feedback, Country or context evidence.',
        daysAgo: 6,
      },
      {
        categoryId: 'feedback',
        type: 'text',
        body: 'Crit 2: the prop reads well and the lighter eaves fixed the heaviness. Push the screen detail further and resolve the amenities entry.',
        relatesTo: 'structure',
        daysAgo: 3,
      },
    ],
  },
  {
    name: 'Demo — Saltmarsh (Novel)',
    description: 'Sample book-writing project seeded for demonstration.',
    presetId: 'book',
    entries: [
      {
        categoryId: 'book-premise',
        type: 'text',
        body: 'Logline: a marine biologist returns to her flooding hometown and uncovers why the saltmarsh is dying — and what her family buried there.',
        daysAgo: 30,
      },
      {
        categoryId: 'book-characters',
        type: 'text',
        body: 'Protagonist: Mara, 34, prickly and precise. Wants the truth; afraid of what it costs. Voice should be dry, observational.',
        daysAgo: 27,
      },
      {
        categoryId: 'book-worldbuilding',
        type: 'text',
        body: 'Setting: a half-drowned coastal town, tides creeping further up the main street each year. Smell of brine and rot underpins every scene.',
        daysAgo: 24,
      },
      {
        categoryId: 'book-chapters',
        subHeadingId: 'book-act1',
        type: 'text',
        body: 'Drafted chapter 1 — 2,100 words. Mara arrives by ferry; the marsh is the first thing she sees and it stops her cold.',
        daysAgo: 15,
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
        categoryId: 'book-feedback',
        type: 'text',
        body: "Beta reader: loved the atmosphere but said Mara's motive is unclear until ch.4. Bring the family secret forward.",
        daysAgo: 6,
      },
      {
        categoryId: 'book-revisions',
        type: 'text',
        body: 'Revision pass: seeded a hint of the buried secret into the ferry scene. Cut 300 words of throat-clearing from the opening.',
        daysAgo: 2,
      },
      {
        categoryId: 'book-characters',
        type: 'text',
        body: "Secondary cast: Dr. Okafor, the old marine station director who knows what the family did. Warm on the surface, evasive underneath.",
        daysAgo: 25,
      },
      {
        categoryId: 'book-worldbuilding',
        type: 'text',
        body: 'Lore: the marsh has a folk name — "the breathing field" — because the mud sighs as the tide pulls out. Locals read the dying as an omen.',
        daysAgo: 22,
      },
      {
        categoryId: 'book-premise',
        type: 'text',
        body: 'Theme crystallising: you cannot drain a place of its memory without it surfacing somewhere else. The marsh is the family conscience made literal.',
        daysAgo: 20,
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
        daysAgo: 8,
      },
      {
        categoryId: 'book-craft-notes',
        type: 'text',
        body: 'POV decision: staying tight third on Mara throughout. Tried a chapter in her brother\'s POV and it leaked tension — cut it.',
        daysAgo: 7,
      },
      {
        categoryId: 'book-research',
        type: 'text',
        body: 'Interviewed a coastal council ranger about managed retreat and seawall politics. Great detail on how slowly a town admits it is sinking.',
        daysAgo: 5,
      },
    ],
  },
  {
    name: 'Demo — Reef Thermal Tolerance (Study)',
    description: 'Sample scientific-study project seeded for demonstration.',
    presetId: 'scientific-study',
    entries: [
      {
        categoryId: 'study-question',
        type: 'text',
        body: 'Hypothesis: corals from warmer back-reef pools have higher bleaching thresholds than conspecifics from cooler fore-reef sites.',
        daysAgo: 26,
      },
      {
        categoryId: 'study-literature',
        type: 'link',
        body: 'Key review on thermal acclimatisation in reef-building corals — anchors the lit review.',
        link: {
          url: 'https://www.nature.com/subjects/coral-reefs',
          title: 'Coral reefs — Nature',
          domain: 'nature.com',
        },
        citation: 'Nature. (2024). Coral reefs. https://www.nature.com/subjects/coral-reefs',
        daysAgo: 23,
      },
      {
        categoryId: 'study-methodology',
        subHeadingId: 'study-ethics',
        type: 'text',
        body: 'Collection permit approved (GBRMPA). Fragmenting limited to 5 colonies per site to minimise impact.',
        daysAgo: 18,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Ran the thermal ramp on batch 1: 40 fragments held at 26/29/31/33°C for 18h. Photographed every 3h for PAM scoring.',
        daysAgo: 10,
      },
      {
        categoryId: 'study-analysis',
        type: 'text',
        body: 'Fitted dose-response curves to Fv/Fm. Back-reef ED50 ≈ 32.4°C vs fore-reef ≈ 31.1°C — a 1.3°C shift, p < 0.01.',
        daysAgo: 5,
      },
      {
        categoryId: 'study-findings',
        type: 'text',
        body: 'Findings support the hypothesis: thermal history predicts tolerance. Discussion angle — back-reef pools as refugia/seed stock.',
        daysAgo: 3,
      },
      {
        categoryId: 'study-writeup',
        type: 'text',
        body: 'Drafted methods + results sections. Targeting Coral Reefs journal; need to finish the discussion and tidy figures.',
        daysAgo: 1,
      },
      {
        categoryId: 'study-methodology',
        subHeadingId: 'study-materials',
        type: 'text',
        body: 'Instruments: Diving-PAM fluorometer for Fv/Fm, HOBO loggers in each pool for thermal history, custom 4-bath ramp rig calibrated to ±0.1°C.',
        daysAgo: 21,
      },
      {
        categoryId: 'study-literature',
        type: 'text',
        body: 'Gap in the literature: most thermal-tolerance work compares reefs hundreds of km apart. Few studies test fine-scale within-reef microhabitats.',
        daysAgo: 20,
      },
      {
        categoryId: 'study-data',
        type: 'text',
        body: 'Batch 2 complete — 40 more fragments. Logger data confirms back-reef pools run ~1.8°C warmer at midday than fore-reef sites. n now = 80.',
        daysAgo: 8,
      },
      {
        categoryId: 'study-analysis',
        type: 'text',
        body: 'Mixed-effects model with site as random effect: thermal history remains significant after accounting for colony. Wrote the R script up cleanly.',
        daysAgo: 6,
      },
      {
        categoryId: 'study-findings',
        type: 'text',
        body: 'Caveat for discussion: higher ED50 may trade off against growth rate. Back-reef fragments were visibly smaller — worth flagging, not over-claiming.',
        daysAgo: 4,
      },
      {
        categoryId: 'study-limitations',
        type: 'text',
        body: 'Limitations: single season, one reef system, no genotyping so acclimatisation vs adaptation is unresolved. Future work needs reciprocal transplants.',
        daysAgo: 2,
      },
    ],
  },
];

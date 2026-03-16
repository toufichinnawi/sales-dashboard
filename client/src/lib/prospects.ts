/**
 * Real Montreal Wholesale Prospect List
 * Researched businesses that could be potential wholesale bagel customers
 * Organized by segment with contact approach suggestions
 */

export interface Prospect {
  id: string;
  business: string;
  segment: string;
  neighborhood: string;
  whyTarget: string;
  approach: string;
  priority: "high" | "medium" | "low";
  estimatedDozens: string;
  status: "new" | "contacted" | "tasting_scheduled" | "follow_up";
}

export const prospects: Prospect[] = [
  // ─── CAFES (High volume, daily orders) ────────────────────────────────────
  {
    id: "p-001", business: "Café Olimpico", segment: "Cafe",
    neighborhood: "Mile End", whyTarget: "Iconic Montreal cafe, massive foot traffic, serves breakfast",
    approach: "Drop off sample dozen with pricing sheet, ask for the owner",
    priority: "high", estimatedDozens: "15-20/week", status: "new",
  },
  {
    id: "p-002", business: "Café Myriade", segment: "Cafe",
    neighborhood: "Downtown", whyTarget: "Top-rated specialty coffee shop, food menu could expand",
    approach: "Morning visit with samples, pitch bagel + coffee pairing",
    priority: "high", estimatedDozens: "8-12/week", status: "new",
  },
  {
    id: "p-003", business: "Café Saint-Henri", segment: "Cafe",
    neighborhood: "Saint-Henri", whyTarget: "Multiple locations, growing brand, serves food",
    approach: "Email first, then in-person tasting at flagship location",
    priority: "high", estimatedDozens: "20-30/week", status: "new",
  },
  {
    id: "p-004", business: "Dispatch Coffee", segment: "Cafe",
    neighborhood: "Mile End", whyTarget: "Popular specialty cafe, serves breakfast items",
    approach: "Drop off samples during quiet afternoon hours",
    priority: "medium", estimatedDozens: "8-12/week", status: "new",
  },
  {
    id: "p-005", business: "Tommy Café", segment: "Cafe",
    neighborhood: "Old Montreal", whyTarget: "Trendy cafe in tourist area, high volume",
    approach: "Morning sample drop with pricing sheet",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-006", business: "Melk Café", segment: "Cafe",
    neighborhood: "Mile End", whyTarget: "Popular neighborhood cafe, serves breakfast & lunch",
    approach: "Walk-in with samples, ask for manager",
    priority: "medium", estimatedDozens: "8-10/week", status: "new",
  },
  {
    id: "p-007", business: "Café In Gamba", segment: "Cafe",
    neighborhood: "Little Italy", whyTarget: "Well-known coffee shop near Jean-Talon Market",
    approach: "Sample drop-off, pitch Italian-style bagel sandwiches",
    priority: "medium", estimatedDozens: "6-8/week", status: "new",
  },
  {
    id: "p-008", business: "Pigeon Café", segment: "Cafe",
    neighborhood: "Downtown", whyTarget: "New popular spot, building their food menu",
    approach: "Email introduction + in-person sample delivery",
    priority: "medium", estimatedDozens: "6-10/week", status: "new",
  },
  {
    id: "p-009", business: "Crew Collective & Café", segment: "Cafe",
    neighborhood: "Old Montreal", whyTarget: "Stunning space, high tourist traffic, serves food",
    approach: "Email to events/food manager, offer tasting",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-010", business: "Café OSMO", segment: "Cafe",
    neighborhood: "Downtown", whyTarget: "Near universities, high student traffic",
    approach: "Walk-in with samples during morning rush",
    priority: "medium", estimatedDozens: "8-12/week", status: "new",
  },

  // ─── RESTAURANTS & BRUNCH SPOTS ───────────────────────────────────────────
  {
    id: "p-011", business: "Régine Café", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Top-rated brunch spot, always packed, serves breakfast",
    approach: "Call ahead for manager, bring sample box",
    priority: "high", estimatedDozens: "15-25/week", status: "new",
  },
  {
    id: "p-012", business: "Arthurs Nosh Bar", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Jewish-style deli/brunch, bagels are core menu item",
    approach: "This is a MUST — they already serve bagels, pitch quality upgrade",
    priority: "high", estimatedDozens: "20-30/week", status: "new",
  },
  {
    id: "p-013", business: "Beautys Luncheonette", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Legendary Montreal brunch institution since 1942",
    approach: "Respectful approach — ask to speak with owner, bring samples",
    priority: "high", estimatedDozens: "15-20/week", status: "new",
  },
  {
    id: "p-014", business: "Olive et Gourmando", segment: "Restaurant",
    neighborhood: "Old Montreal", whyTarget: "Famous bakery/cafe, massive brunch crowds",
    approach: "Email first, then follow up with in-person tasting",
    priority: "high", estimatedDozens: "20-30/week", status: "new",
  },
  {
    id: "p-015", business: "Foiegwa", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Trendy brunch spot, creative menu, high demand",
    approach: "DM on Instagram + email, offer exclusive tasting",
    priority: "high", estimatedDozens: "12-18/week", status: "new",
  },
  {
    id: "p-016", business: "Le Café Bloom", segment: "Restaurant",
    neighborhood: "Villeray", whyTarget: "Popular brunch destination, growing reputation",
    approach: "Walk-in with samples, pitch seasonal bagel specials",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-017", business: "Leméac", segment: "Restaurant",
    neighborhood: "Outremont", whyTarget: "Upscale bistro, serves brunch, high-end clientele",
    approach: "Formal email to chef/owner, offer private tasting",
    priority: "medium", estimatedDozens: "8-12/week", status: "new",
  },
  {
    id: "p-018", business: "La Banquise", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Famous 24/7 restaurant, huge volume, could add bagels",
    approach: "Walk-in during quiet hours, pitch breakfast bagel menu",
    priority: "medium", estimatedDozens: "15-25/week", status: "new",
  },
  {
    id: "p-019", business: "Schwartz's Deli", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Montreal institution, deli = natural bagel pairing",
    approach: "Formal approach to management, emphasize Montreal heritage",
    priority: "high", estimatedDozens: "25-40/week", status: "new",
  },
  {
    id: "p-020", business: "Junior", segment: "Restaurant",
    neighborhood: "Plateau", whyTarget: "Popular brunch spot from Eater Montreal best list",
    approach: "Instagram DM + email with pricing sheet",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },

  // ─── HOTELS ───────────────────────────────────────────────────────────────
  {
    id: "p-021", business: "Ritz-Carlton Montreal", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Luxury hotel, breakfast buffet, room service, high volume",
    approach: "Email F&B director, offer private tasting for kitchen team",
    priority: "high", estimatedDozens: "25-40/week", status: "new",
  },
  {
    id: "p-022", business: "Four Seasons Hotel Montreal", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Premium hotel, breakfast service, high-end guests",
    approach: "Formal letter + email to Executive Chef",
    priority: "high", estimatedDozens: "20-35/week", status: "new",
  },
  {
    id: "p-023", business: "Fairmont The Queen Elizabeth", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Massive hotel, multiple restaurants, banquet service",
    approach: "Email purchasing/F&B department, offer volume pricing",
    priority: "high", estimatedDozens: "30-50/week", status: "new",
  },
  {
    id: "p-024", business: "Hôtel Le Germain Montreal", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Boutique hotel chain, emphasizes local products",
    approach: "Pitch 'local artisan' angle, email GM",
    priority: "high", estimatedDozens: "15-25/week", status: "new",
  },
  {
    id: "p-025", business: "Sofitel Montreal Golden Mile", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Upscale hotel, French-inspired breakfast service",
    approach: "Email F&B manager, emphasize artisan quality",
    priority: "medium", estimatedDozens: "15-20/week", status: "new",
  },
  {
    id: "p-026", business: "Hotel William Gray", segment: "Hotel",
    neighborhood: "Old Montreal", whyTarget: "Trendy boutique hotel, rooftop restaurant",
    approach: "Email + Instagram DM, pitch local partnership",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-027", business: "Le Mount Stephen", segment: "Hotel",
    neighborhood: "Downtown", whyTarget: "Luxury heritage hotel, breakfast service",
    approach: "Formal email to culinary team",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-028", business: "Hôtel Nelligan", segment: "Hotel",
    neighborhood: "Old Montreal", whyTarget: "Popular boutique hotel, restaurant on-site",
    approach: "Walk-in with samples to front desk, ask for F&B contact",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },

  // ─── GROCERY & DELIS ──────────────────────────────────────────────────────
  {
    id: "p-029", business: "Marché Jean-Talon vendors", segment: "Grocery",
    neighborhood: "Little Italy", whyTarget: "Multiple deli/food stalls, high foot traffic market",
    approach: "Walk the market, introduce yourself to deli owners with samples",
    priority: "high", estimatedDozens: "15-25/week", status: "new",
  },
  {
    id: "p-030", business: "Segal's Market", segment: "Grocery",
    neighborhood: "Mile End", whyTarget: "Neighborhood grocery, serves local community",
    approach: "Walk-in with samples, pitch local artisan angle",
    priority: "medium", estimatedDozens: "8-12/week", status: "new",
  },
  {
    id: "p-031", business: "PA Supermarché", segment: "Grocery",
    neighborhood: "Multiple locations", whyTarget: "Popular local chain, bakery section, multiple stores",
    approach: "Contact head office purchasing department",
    priority: "high", estimatedDozens: "30-50/week", status: "new",
  },
  {
    id: "p-032", business: "Provigo Le Marché", segment: "Grocery",
    neighborhood: "Multiple locations", whyTarget: "Major grocery chain, bakery/deli counter",
    approach: "Contact regional bakery buyer, offer trial period",
    priority: "medium", estimatedDozens: "20-40/week", status: "new",
  },
  {
    id: "p-033", business: "IGA Extra", segment: "Grocery",
    neighborhood: "Multiple locations", whyTarget: "Large grocery chain with deli sections",
    approach: "Contact store managers individually for pilot program",
    priority: "medium", estimatedDozens: "15-30/week", status: "new",
  },

  // ─── CATERING COMPANIES ───────────────────────────────────────────────────
  {
    id: "p-034", business: "Société Traiteur", segment: "Catering",
    neighborhood: "Montreal", whyTarget: "Leading Montreal catering company, corporate events",
    approach: "Email with pricing sheet, offer bulk discount for events",
    priority: "high", estimatedDozens: "15-30/week", status: "new",
  },
  {
    id: "p-035", business: "Les 3 Maîtres Gourmands", segment: "Catering",
    neighborhood: "Montreal", whyTarget: "Popular catering service, buffet menus",
    approach: "Email + phone call, pitch bagel platters for events",
    priority: "medium", estimatedDozens: "10-20/week", status: "new",
  },
  {
    id: "p-036", business: "Traiteur Brera", segment: "Catering",
    neighborhood: "Montreal", whyTarget: "Upscale event catering, Greater Montreal Area",
    approach: "Email to chef, offer tasting for their team",
    priority: "medium", estimatedDozens: "10-15/week", status: "new",
  },
  {
    id: "p-037", business: "FreshMTL", segment: "Catering",
    neighborhood: "Montreal", whyTarget: "Corporate event catering, growing company",
    approach: "Email + Instagram, pitch fresh bagel breakfast platters",
    priority: "medium", estimatedDozens: "8-15/week", status: "new",
  },
  {
    id: "p-038", business: "21st Century Food", segment: "Catering",
    neighborhood: "Montreal", whyTarget: "Major corporate cafeteria supplier, huge volume potential",
    approach: "Contact sales team, offer competitive wholesale pricing",
    priority: "high", estimatedDozens: "30-60/week", status: "new",
  },

  // ─── UNIVERSITIES & CORPORATE ─────────────────────────────────────────────
  {
    id: "p-039", business: "McGill University Food Services", segment: "University",
    neighborhood: "Downtown", whyTarget: "Multiple dining halls, 40,000+ students",
    approach: "Contact Chartwells/food services procurement",
    priority: "high", estimatedDozens: "40-80/week", status: "new",
  },
  {
    id: "p-040", business: "Concordia University Food Services", segment: "University",
    neighborhood: "Downtown", whyTarget: "Buzz Dining Hall + multiple locations, 50,000+ students",
    approach: "Contact campus dining procurement team",
    priority: "high", estimatedDozens: "30-60/week", status: "new",
  },
  {
    id: "p-041", business: "Université de Montréal", segment: "University",
    neighborhood: "Côte-des-Neiges", whyTarget: "Largest French-speaking university, campus dining",
    approach: "Contact services alimentaires department",
    priority: "high", estimatedDozens: "30-50/week", status: "new",
  },
  {
    id: "p-042", business: "ALCE Enterprise (Corporate Meals)", segment: "Corporate",
    neighborhood: "Montreal", whyTarget: "Corporate lunch delivery service, could add bagels",
    approach: "Email partnership proposal for breakfast menu",
    priority: "medium", estimatedDozens: "15-25/week", status: "new",
  },
  {
    id: "p-043", business: "Prêt-à-Table", segment: "Corporate",
    neighborhood: "Montreal", whyTarget: "Corporate catering platters and lunch boxes",
    approach: "Email with wholesale pricing, pitch bagel breakfast boxes",
    priority: "medium", estimatedDozens: "10-20/week", status: "new",
  },
];

// ─── Summary Stats ──────────────────────────────────────────────────────────

export const prospectStats = {
  total: 43,
  bySegment: {
    Cafe: 10,
    Restaurant: 10,
    Hotel: 8,
    Grocery: 5,
    Catering: 5,
    University: 3,
    Corporate: 2,
  },
  highPriority: 18,
  estimatedTotalDozens: "500-900/week",
  estimatedWeeklyRevenue: "$4,250-$7,650",
};

/**
 * WholesaleLanding — Hinnawi Bros Bagels
 * Premium wholesale landing page — dark/gold artisan aesthetic
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Truck,
  Clock,
  Star,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Users,
  Building2,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  GraduationCap,
  Flame,
  Shield,
  Sparkles,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { motion, useScroll, useTransform } from "framer-motion";

/* ── Image URLs ── */
const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-logo_a3e13a96.webp";
const HERO_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/yIOnnRBJGYCFrgJa.jpg";
const PLAIN_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/IJNmfNUrHjhjDDaR.jpg";
const SESAME_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/iquKRyFdnVWDlEti.jpg";
const EVERYTHING_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/HQrpFRcCCUluERry.jpg";
const WHOLE_WHEAT_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/lzSXXKSasjVAJSWR.jpg";
const CINNAMON_RAISIN_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/qpGZdGKpQZbHwzdJ.jpg";
const GARLIC_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/LpsEuXUKbMaDflur.jpg";
const TRIO_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/voroEHUlSqLFRYEV.jpg";
const EVERYTHING_TOP_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/LCIfVOOByKkWrjRB.jpg";
const SESAME_ALT_IMG =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663434685937/UYGzFxfbQIYYEDnr.jpg";

/* ── Brand Colors ── */
const GOLD = "#C8913A";
const GOLD_LIGHT = "#d9a24a";
const DARK = "#1a0f0a";
const DARK_MID = "#2C1810";
const CREAM = "#FDFBF7";
const WARM_GRAY = "#6B5C52";
const MUTED = "#8B7B72";

/* ── Data ── */
const products = [
  {
    name: "Plain",
    price: "$8.00",
    perUnit: "$0.67 ea",
    img: PLAIN_IMG,
    desc: "The classic Montreal bagel — golden, slightly sweet, with a tender chewy crumb.",
    tag: "Best Seller",
  },
  {
    name: "Sesame",
    price: "$8.00",
    perUnit: "$0.67 ea",
    img: SESAME_IMG,
    desc: "Generously coated in roasted sesame seeds for a nutty, toasted flavor.",
    tag: "Most Popular",
  },
  {
    name: "Everything",
    price: "$8.00",
    perUnit: "$0.67 ea",
    img: EVERYTHING_IMG,
    desc: "Sesame, poppy, garlic, onion, and coarse salt. Bold flavor in every bite.",
    tag: "Customer Favorite",
  },
  {
    name: "Whole Wheat",
    price: "$8.00",
    perUnit: "$0.67 ea",
    img: WHOLE_WHEAT_IMG,
    desc: "Hearty and wholesome with a rustic crust and nutty depth.",
    tag: "Healthy Choice",
  },
  {
    name: "Cinnamon Raisin",
    price: "$8.50",
    perUnit: "$0.71 ea",
    img: CINNAMON_RAISIN_IMG,
    desc: "Sweet cinnamon swirled through soft dough, studded with plump raisins.",
    tag: "Sweet Option",
  },
  {
    name: "Garlic",
    price: "$8.00",
    perUnit: "$0.67 ea",
    img: GARLIC_IMG,
    desc: "Infused with roasted garlic throughout the dough. Savory and aromatic.",
    tag: "Savory Pick",
  },
];

const segments = [
  { icon: Coffee, label: "Cafes", sub: "Morning menus" },
  { icon: UtensilsCrossed, label: "Restaurants", sub: "Brunch & lunch" },
  { icon: Building2, label: "Hotels", sub: "Breakfast buffets" },
  { icon: ShoppingBag, label: "Grocery", sub: "Retail shelves" },
  { icon: Users, label: "Catering", sub: "Events & offices" },
  { icon: GraduationCap, label: "Universities", sub: "Campus dining" },
];

const pricingTiers = [
  { tier: "Starter", range: "5\u201310 dz/week", discount: "Standard price", highlight: false },
  { tier: "Growth", range: "11\u201325 dz/week", discount: "5% off", highlight: true },
  { tier: "Volume", range: "26\u201350 dz/week", discount: "10% off", highlight: false },
  { tier: "Enterprise", range: "50+ dz/week", discount: "15% off", highlight: false },
];

/* ── Inline styles for CSS-in-JS (no external CSS needed) ── */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

  .wholesale-page * { box-sizing: border-box; }
  .wholesale-page { font-family: 'Inter', system-ui, sans-serif; }
  .wholesale-page h1, .wholesale-page h2, .wholesale-page h3, .wholesale-page h4 {
    font-family: 'Playfair Display', Georgia, serif;
  }

  /* Subtle grain texture overlay */
  .grain-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  /* Product card hover overlay */
  .product-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(26,15,10,0.85) 0%, rgba(26,15,10,0.2) 50%, transparent 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
  }
  .product-card-wrap:hover .product-overlay { opacity: 1; }
  .product-card-wrap:hover .product-img { transform: scale(1.08); }
  .product-img { transition: transform 0.6s ease; }

  /* Floating CTA */
  .floating-cta {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    animation: float-pulse 3s ease-in-out infinite;
  }
  @keyframes float-pulse {
    0%, 100% { transform: translateY(0); box-shadow: 0 4px 20px rgba(200,145,58,0.3); }
    50% { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(200,145,58,0.5); }
  }

  /* Decorative divider */
  .ornament-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px 0;
  }
  .ornament-divider .line {
    height: 1px;
    width: 60px;
    background: linear-gradient(to right, transparent, ${GOLD}66, transparent);
  }
  .ornament-divider .diamond {
    width: 6px;
    height: 6px;
    background: ${GOLD};
    transform: rotate(45deg);
  }

  /* Smooth scroll */
  html { scroll-behavior: smooth; }

  /* Input focus glow */
  .form-input:focus {
    outline: none;
    border-color: ${GOLD} !important;
    box-shadow: 0 0 0 3px rgba(200,145,58,0.15);
  }

  /* Parallax photo strip */
  .photo-strip {
    display: flex;
    gap: 0;
    overflow: hidden;
  }
  .photo-strip img {
    flex: 1;
    min-width: 0;
    height: 220px;
    object-fit: cover;
    filter: brightness(0.7);
    transition: filter 0.4s ease;
  }
  .photo-strip img:hover {
    filter: brightness(0.95);
  }

  /* Nav link underline animation */
  .nav-link {
    position: relative;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 1px;
    background: ${GOLD};
    transition: width 0.3s ease;
  }
  .nav-link:hover::after {
    width: 100%;
  }

  /* Pricing card glow */
  .pricing-glow {
    position: relative;
  }
  .pricing-glow::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 10px;
    background: linear-gradient(135deg, ${GOLD}, ${GOLD}44, ${GOLD});
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .pricing-glow:hover::before {
    opacity: 1;
  }
`;

export default function WholesaleLanding() {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    message: "",
  });
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [activeNav, setActiveNav] = useState("");

  // Show floating CTA after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 600);
      // Update active nav based on scroll position
      const sections = ["produits", "pricing", "why-us", "contact"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveNav(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Thank you! We'll be in touch within 24 hours.", {
        description: "Your tasting request has been received.",
      });
      setFormData({ name: "", business: "", email: "", phone: "", message: "" });
    },
    onError: (error: { message: string }) => {
      toast.error("Something went wrong. Please try again.", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate({
      name: formData.name,
      business: formData.business,
      email: formData.email,
      phone: formData.phone || undefined,
      message: formData.message || undefined,
      source: "wholesale_landing_page",
    });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="wholesale-page min-h-screen">
      <style>{globalCSS}</style>

      {/* ═══════════ FLOATING CTA ═══════════ */}
      {showFloatingCTA && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="floating-cta rounded-full px-5 py-3 font-semibold text-sm flex items-center gap-2 cursor-pointer border-0"
          style={{ background: GOLD, color: DARK }}
          onClick={() => scrollTo("contact")}
        >
          <Sparkles className="h-4 w-4" />
          Free Tasting
        </motion.button>
      )}

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(26,15,10,0.92)",
          borderBottom: `1px solid rgba(200,145,58,0.12)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-9 brightness-0 invert" />
          </a>
          <div className="hidden md:flex items-center gap-10">
            {[
              { href: "produits", label: "Products" },
              { href: "pricing", label: "Pricing" },
              { href: "why-us", label: "Why Us" },
              { href: "contact", label: "Contact" },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="nav-link text-xs tracking-[0.2em] uppercase transition-colors duration-200 bg-transparent border-0 cursor-pointer"
                style={{
                  color: activeNav === link.href ? GOLD : "rgba(255,255,255,0.45)",
                  fontWeight: activeNav === link.href ? 600 : 400,
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
          <button
            className="px-5 py-2 text-xs font-semibold tracking-wider uppercase rounded-full transition-all duration-300 flex items-center gap-1.5 border-0 cursor-pointer"
            style={{ background: GOLD, color: DARK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD_LIGHT;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(200,145,58,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = GOLD;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={() => scrollTo("contact")}
          >
            Free Tasting
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden grain-overlay" style={{ background: DARK, minHeight: "92vh" }}>
        <div className="absolute inset-0">
          <motion.img
            src={HERO_IMG}
            alt="Fresh Hinnawi Bros bagels"
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${DARK} 0%, ${DARK}dd 25%, ${DARK}99 50%, ${DARK}44 75%, transparent 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${DARK} 0%, ${DARK}cc 15%, transparent 50%)`,
            }}
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28 flex flex-col justify-center" style={{ minHeight: "92vh" }}>
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Decorative line */}
            <motion.div
              className="mb-6 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="h-px w-10" style={{ background: GOLD }} />
              <span
                className="text-[10px] font-semibold tracking-[0.35em] uppercase"
                style={{ color: GOLD }}
              >
                Montreal &middot; Est. Wholesale Program
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-white"
              style={{ fontWeight: 800 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              Hinnawi
              <br />
              <span style={{ color: GOLD }}>Bros.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl mt-4"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Wholesale Bagels for Your Business
            </motion.p>

            <motion.div
              className="mt-3 ornament-divider justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </motion.div>

            <motion.p
              className="mt-5 leading-relaxed max-w-lg"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: "14.5px", lineHeight: 1.8 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Hand-rolled, boiled in honey water, and baked in a wood-fired oven.
              Fresh Montreal-style bagels delivered to your cafe, restaurant, hotel,
              or grocery store every morning.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <button
                className="px-8 py-3.5 font-semibold tracking-wide text-sm rounded-full transition-all duration-300 flex items-center gap-2 border-0 cursor-pointer"
                style={{ background: GOLD, color: DARK }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = GOLD_LIGHT;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 25px rgba(200,145,58,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = GOLD;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => scrollTo("contact")}
              >
                Request a Free Tasting
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                className="px-8 py-3.5 font-medium tracking-wide text-sm rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer"
                style={{
                  border: `1px solid rgba(200,145,58,0.3)`,
                  color: "rgba(255,255,255,0.7)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(200,145,58,0.08)";
                  e.currentTarget.style.borderColor = GOLD;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.3)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }}
                onClick={() => scrollTo("produits")}
              >
                View Our Products
              </button>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              {[
                { icon: Truck, text: "Free delivery" },
                { icon: Clock, text: "Fresh daily" },
                { icon: Star, text: "No minimum" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: "rgba(200,145,58,0.12)", border: `1px solid rgba(200,145,58,0.2)` }}
                  >
                    <item.icon className="h-3.5 w-3.5" style={{ color: GOLD }} />
                  </div>
                  <span className="text-xs tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={() => scrollTo("produits")}
          >
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" style={{ color: "rgba(200,145,58,0.4)" }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHO WE SERVE ═══════════ */}
      <section
        className="py-16 relative grain-overlay"
        style={{ background: DARK_MID }}
      >
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="ornament-divider mb-4">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
            <p className="text-[10px] tracking-[0.35em] uppercase font-semibold" style={{ color: GOLD }}>
              Who We Serve
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex flex-col items-center gap-2 p-5 rounded-xl transition-all duration-300 cursor-default group"
                style={{
                  border: "1px solid rgba(200,145,58,0.1)",
                  background: "rgba(200,145,58,0.03)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.35)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.1)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.03)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300"
                  style={{ background: "rgba(200,145,58,0.1)" }}
                >
                  <seg.icon className="h-5 w-5" style={{ color: GOLD }} />
                </div>
                <span className="text-sm font-medium text-white">{seg.label}</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{seg.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PHOTO STRIP DIVIDER ═══════════ */}
      <div className="photo-strip">
        <img src={PLAIN_IMG} alt="" />
        <img src={SESAME_ALT_IMG} alt="" />
        <img src={EVERYTHING_TOP_IMG} alt="" />
        <img src={TRIO_IMG} alt="" />
        <img src={GARLIC_IMG} alt="" />
      </div>

      {/* ═══════════ PRODUCTS ═══════════ */}
      <section id="produits" className="py-24" style={{ background: CREAM }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: GOLD }}>
              Our Collection
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight" style={{ fontWeight: 700, color: DARK_MID }}>
              Hand-Rolled Varieties
            </h2>
            <div className="ornament-divider mt-4 mb-3">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
            <p className="max-w-lg mx-auto text-sm leading-relaxed" style={{ color: WARM_GRAY }}>
              Every bagel is hand-rolled, boiled in honey water, and baked fresh daily.
              Available in dozens or by the case.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="product-card-wrap relative bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-default group"
                style={{
                  border: "1px solid #EDE8E2",
                  boxShadow: "0 2px 12px rgba(44,24,16,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(44,24,16,0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(44,24,16,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="product-img w-full h-full object-cover"
                  />
                  {/* Hover overlay with price */}
                  <div className="product-overlay">
                    <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {product.price}
                    </span>
                    <span className="text-xs mt-1" style={{ color: GOLD }}>per dozen</span>
                  </div>
                  {/* Tag badge */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: DARK, color: GOLD, backdropFilter: "blur(4px)" }}
                  >
                    {product.tag}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg" style={{ fontWeight: 700, color: DARK_MID }}>
                      {product.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-base font-bold" style={{ color: GOLD }}>
                        {product.price}
                      </span>
                      <span className="text-[10px] block" style={{ color: MUTED }}>/dozen</span>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: WARM_GRAY }}>
                    {product.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 relative grain-overlay" style={{ background: DARK }}>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="rounded-xl overflow-hidden shadow-2xl">
                <img src={TRIO_IMG} alt="Bagel varieties" className="w-full" />
              </div>
              {/* Decorative frame */}
              <div
                className="absolute -bottom-3 -right-3 w-full h-full rounded-xl -z-10"
                style={{ border: `1px solid ${GOLD}33` }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8" style={{ background: GOLD }} />
                <p className="text-[10px] tracking-[0.35em] uppercase font-semibold" style={{ color: GOLD }}>
                  How It Works
                </p>
              </div>
              <h2 className="text-3xl md:text-4xl tracking-tight mb-10 text-white" style={{ fontWeight: 400 }}>
                From our oven{" "}
                <span style={{ fontWeight: 700, fontStyle: "italic" }}>to your door.</span>
              </h2>
              <div className="space-y-7">
                {[
                  {
                    step: "01",
                    title: "Free Tasting",
                    desc: "We bring a complimentary sample box to your location \u2014 no commitment.",
                  },
                  {
                    step: "02",
                    title: "Choose Your Order",
                    desc: "Pick your varieties, quantities, and delivery schedule.",
                  },
                  {
                    step: "03",
                    title: "Fresh Delivery",
                    desc: "Baked fresh every morning and delivered to your door, 6 days a week.",
                  },
                  {
                    step: "04",
                    title: "Grow Together",
                    desc: "Volume discounts as you scale. The more you order, the more you save.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    className="flex gap-5 group"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <div className="relative">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wider transition-all duration-300"
                        style={{
                          border: `1.5px solid rgba(200,145,58,0.4)`,
                          color: GOLD,
                          background: "rgba(200,145,58,0.05)",
                        }}
                      >
                        {item.step}
                      </div>
                      {item.step !== "04" && (
                        <div
                          className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-7"
                          style={{ background: "rgba(200,145,58,0.15)" }}
                        />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <h4 className="font-semibold text-sm text-white mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {item.title}
                      </h4>
                      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24" style={{ background: CREAM }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: GOLD }}>
              Wholesale Pricing
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight" style={{ fontWeight: 700, color: DARK_MID }}>
              Simple, Transparent Pricing
            </h2>
            <div className="ornament-divider mt-4 mb-3">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
            <p className="max-w-md mx-auto text-sm" style={{ color: WARM_GRAY }}>
              No hidden fees. No contracts. The more you order, the more you save.
            </p>
          </motion.div>

          {/* Product pricing table */}
          <motion.div
            className="max-w-2xl mx-auto mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EDE8E2", boxShadow: "0 2px 12px rgba(44,24,16,0.04)" }}>
              <div
                className="grid grid-cols-3 gap-0 px-6 py-3.5"
                style={{ background: DARK_MID }}
              >
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/60">
                  Product
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/60 text-center">
                  Per Dozen
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/60 text-right">
                  Per Bagel
                </span>
              </div>
              {products.map((p, i) => (
                <div
                  key={p.name}
                  className="grid grid-cols-3 gap-0 px-6 py-3.5 border-b last:border-0 transition-colors duration-200"
                  style={{
                    borderColor: "#EDE8E2",
                    background: i % 2 === 0 ? "#fff" : CREAM,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,145,58,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : CREAM)}
                >
                  <span className="font-medium text-sm" style={{ color: DARK_MID }}>
                    {p.name}
                  </span>
                  <span className="font-bold text-center" style={{ color: GOLD }}>
                    {p.price}
                  </span>
                  <span className="text-sm text-right" style={{ color: MUTED }}>
                    {p.perUnit}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Volume tiers */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="pricing-glow rounded-xl p-6 text-center transition-all duration-300"
                style={{
                  border: tier.highlight ? `2px solid ${GOLD}` : "1px solid #EDE8E2",
                  background: tier.highlight ? DARK_MID : "#fff",
                  color: tier.highlight ? "#fff" : DARK_MID,
                  boxShadow: tier.highlight ? `0 8px 30px rgba(200,145,58,0.2)` : "none",
                  transform: tier.highlight ? "scale(1.03)" : "scale(1)",
                }}
              >
                {tier.highlight && (
                  <span
                    className="inline-block text-[9px] uppercase tracking-[0.25em] px-3 py-1 rounded-full mb-3 font-bold"
                    style={{ background: GOLD, color: DARK }}
                  >
                    Popular
                  </span>
                )}
                <h4 className="text-base" style={{ fontWeight: 700 }}>{tier.tier}</h4>
                <p
                  className="text-sm mt-1"
                  style={{ color: tier.highlight ? "rgba(255,255,255,0.45)" : MUTED }}
                >
                  {tier.range}
                </p>
                <p
                  className="font-bold mt-2 text-lg"
                  style={{ color: tier.highlight ? GOLD : DARK_MID }}
                >
                  {tier.discount}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY US ═══════════ */}
      <section id="why-us" className="py-24 relative grain-overlay" style={{ background: DARK }}>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: GOLD }}>
              Why Hinnawi Bros
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight text-white" style={{ fontWeight: 400 }}>
              What sets us <span style={{ fontWeight: 700, fontStyle: "italic" }}>apart.</span>
            </h2>
            <div className="ornament-divider mt-4">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Artisan Quality",
                desc: "Hand-rolled and kettle-boiled using traditional methods. No shortcuts, no preservatives. Every bagel is made with care and pride.",
                icon: Flame,
              },
              {
                title: "Reliable Delivery",
                desc: "Baked fresh every morning and delivered to your door by 7 AM, 6 days a week. Rain or shine, we always show up.",
                icon: Truck,
              },
              {
                title: "Competitive Pricing",
                desc: "Starting at just $8/dozen \u2014 a fraction of premium bakeries. Volume discounts available as your business grows.",
                icon: Shield,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="rounded-xl p-7 transition-all duration-300"
                style={{
                  background: "rgba(200,145,58,0.04)",
                  border: "1px solid rgba(200,145,58,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.3)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.08)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.1)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full mb-5"
                  style={{ background: "rgba(200,145,58,0.12)", border: `1px solid rgba(200,145,58,0.2)` }}
                >
                  <item.icon className="h-5 w-5" style={{ color: GOLD }} />
                </div>
                <h3 className="text-xl text-white mb-2" style={{ fontWeight: 700 }}>
                  {item.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDER STORY ═══════════ */}
      <section className="py-24" style={{ background: CREAM }}>
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[10px] tracking-[0.35em] uppercase font-semibold mb-3" style={{ color: GOLD }}>
              Our Story
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight mb-10" style={{ fontWeight: 700, color: DARK_MID }}>
              A message from <span style={{ color: GOLD, fontStyle: "italic" }}>Rosie.</span>
            </h2>
            <div className="max-w-2xl mx-auto">
              <div
                className="rounded-xl p-10 relative"
                style={{ background: DARK_MID }}
              >
                {/* Quote icon */}
                <div
                  className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: GOLD }}
                >
                  <Quote className="h-4 w-4" style={{ color: DARK }} />
                </div>
                <p
                  className="leading-[1.9] text-base mt-2"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  At Hinnawi Bros, we{"'"}ve been making bagels for years with one obsession:
                  making every bite perfect. Hand-rolled, kettle-boiled, oven-baked {"\u2014"} no
                  shortcuts. We launched our wholesale program because we want everyone to taste what
                  makes Montreal bagels so special. Our dream? That every cafe, restaurant, and hotel
                  serves bagels they{"'"}re proud of.
                </p>
                <div className="mt-8">
                  <div className="ornament-divider">
                    <div className="line" />
                    <div className="diamond" />
                    <div className="line" />
                  </div>
                  <p className="font-bold text-sm mt-3" style={{ color: GOLD }}>
                    Rosie Manneh
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Founder &middot; 733 Cathcart, Montreal
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CONTACT / CTA ═══════════ */}
      <section id="contact" className="py-24 relative grain-overlay" style={{ background: DARK }}>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8" style={{ background: GOLD }} />
                <p className="text-[10px] tracking-[0.35em] uppercase font-semibold" style={{ color: GOLD }}>
                  Get Started
                </p>
              </div>
              <h2 className="text-3xl tracking-tight mb-3 text-white" style={{ fontWeight: 400 }}>
                Ready to taste{" "}
                <span style={{ fontWeight: 700, fontStyle: "italic", color: GOLD }}>the difference?</span>
              </h2>
              <p className="leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px" }}>
                Fill out the form and we{"'"}ll bring a complimentary sample box to your
                establishment. No commitment required.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Phone, label: "Call us", value: "(514) 571-7672" },
                  { icon: Mail, label: "Email us", value: "Rosalyn@wineandmore.com" },
                  { icon: MapPin, label: "Visit us", value: "733 Cathcart, Montreal" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full shrink-0"
                      style={{ background: "rgba(200,145,58,0.08)", border: `1px solid rgba(200,145,58,0.2)` }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p className="text-[10px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-white mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(200,145,58,0.12)" }}>
                <a
                  href="https://www.hinnawibrosbagelandcafe.com"
                  className="text-sm inline-flex items-center gap-2 transition-all duration-200 no-underline"
                  style={{ color: GOLD }}
                  onMouseEnter={(e) => (e.currentTarget.style.gap = "10px")}
                  onMouseLeave={(e) => (e.currentTarget.style.gap = "8px")}
                >
                  Visit our main website
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-xl p-7"
              style={{
                background: DARK_MID,
                border: `1px solid rgba(200,145,58,0.15)`,
                boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
              }}
            >
              <h3 className="text-xl mb-1 text-white" style={{ fontWeight: 700 }}>
                Request a Free Tasting
              </h3>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
                We{"'"}ll bring samples directly to your business.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Name", key: "name" as const, placeholder: "Your name", type: "text" },
                    { label: "Business", key: "business" as const, placeholder: "Business name", type: "text" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: GOLD }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        required
                        className="form-input w-full h-10 rounded-lg px-3.5 text-sm transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(200,145,58,0.15)",
                          color: "#fff",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Email", key: "email" as const, placeholder: "you@business.com", type: "email" },
                    { label: "Phone", key: "phone" as const, placeholder: "(514) 555-0000", type: "tel" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: GOLD }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.key === "email"}
                        className="form-input w-full h-10 rounded-lg px-3.5 text-sm transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(200,145,58,0.15)",
                          color: "#fff",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: GOLD }}>
                    Tell us about your business
                  </label>
                  <textarea
                    placeholder="Type of business? How many customers per week?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="form-input w-full rounded-lg px-3.5 py-2.5 text-sm resize-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(200,145,58,0.15)",
                      color: "#fff",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 font-bold tracking-wide text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border-0 cursor-pointer"
                  style={{ background: GOLD, color: DARK }}
                  disabled={createLead.isPending}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = GOLD_LIGHT;
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,145,58,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = GOLD;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {createLead.isPending ? "Sending..." : "Send Request \u2014 It's Free"}
                  {!createLead.isPending && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                  We{"'"}ll respond within 24 hours. No spam, ever.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer
        className="py-10"
        style={{ background: DARK_MID, borderTop: `1px solid rgba(200,145,58,0.08)` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
              <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-8 brightness-0 invert opacity-50" />
            </a>
            <div className="ornament-divider">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
            <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
              &copy; {new Date().getFullYear()} Hinnawi Bros Bagel &amp; Cafe &middot; Hand-crafted in Montreal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

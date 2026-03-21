/**
 * WholesaleLanding — Hinnawi Bros Bagels
 * Public-facing wholesale landing page — English only
 * Branding: warm dark tones, gold accents, Playfair Display, artisan warmth
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Clock,
  Star,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Check,
  ArrowRight,
  Users,
  Building2,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  GraduationCap,
  Flame,
  Heart,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ── Data ── */
const products = [
  {
    name: "Plain",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: PLAIN_IMG,
    desc: "The classic Montreal bagel — golden, slightly sweet, with a tender chewy crumb. The foundation of every great bagel menu.",
    tag: "Best Seller",
  },
  {
    name: "Sesame",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: SESAME_IMG,
    desc: "Generously coated in roasted sesame seeds for a nutty, toasted flavor. The iconic Montreal bagel experience.",
    tag: "Most Popular",
  },
  {
    name: "Everything",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: EVERYTHING_IMG,
    desc: "Loaded with sesame, poppy seeds, dried garlic, onion, and coarse salt. Bold flavor in every bite.",
    tag: "Customer Favorite",
  },
  {
    name: "Whole Wheat",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: WHOLE_WHEAT_IMG,
    desc: "A hearty, wholesome option with a rustic crust and nutty flavor. Perfect for health-conscious customers.",
    tag: "Healthy Choice",
  },
  {
    name: "Cinnamon Raisin",
    price: "$8.50",
    perUnit: "$0.71/bagel",
    img: CINNAMON_RAISIN_IMG,
    desc: "Sweet cinnamon swirled through soft dough, studded with plump raisins. A breakfast favorite with cream cheese.",
    tag: "Sweet Option",
  },
  {
    name: "Garlic",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: GARLIC_IMG,
    desc: "Infused with roasted garlic throughout the dough and flecked on the crust. Savory and aromatic.",
    tag: "Savory Pick",
  },
];

const segments = [
  { icon: Coffee, label: "Cafes" },
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: Building2, label: "Hotels" },
  { icon: ShoppingBag, label: "Grocery" },
  { icon: Users, label: "Catering" },
  { icon: GraduationCap, label: "Universities" },
];

const pricingTiers = [
  { tier: "Starter", range: "5\u201310 dz/week", discount: "Standard price", highlight: false },
  { tier: "Growth", range: "11\u201325 dz/week", discount: "5% off", highlight: true },
  { tier: "Volume", range: "26\u201350 dz/week", discount: "10% off", highlight: false },
  { tier: "Enterprise", range: "50+ dz/week", discount: "15% off", highlight: false },
];

/* ── Gold accent color ── */
const GOLD = "#C8913A";
const DARK = "#1a0f0a";
const DARK_LIGHT = "#2C1810";

export default function WholesaleLanding() {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    message: "",
  });

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

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: "rgba(26,15,10,0.95)", borderColor: "rgba(200,145,58,0.15)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-10 brightness-0 invert" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm tracking-[0.15em] uppercase">
            {[
              { href: "#produits", label: "Products" },
              { href: "#pricing", label: "Pricing" },
              { href: "#why-us", label: "Why Us" },
              { href: "#contact", label: "Contact" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                {link.label}
              </a>
            ))}
          </div>
          <button
            className="px-5 py-2 text-xs font-semibold tracking-wider uppercase rounded transition-all duration-200 flex items-center gap-1.5"
            style={{ background: GOLD, color: DARK }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d9a24a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Free Tasting
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden" style={{ background: DARK }}>
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Fresh Hinnawi Bros bagels" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${DARK} 0%, ${DARK}ee 30%, ${DARK}88 55%, transparent 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${DARK} 0%, transparent 40%)`,
            }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-40">
          <motion.div
            className="max-w-xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-block px-4 py-1.5 rounded text-xs font-semibold tracking-[0.25em] uppercase mb-6"
              style={{ background: GOLD, color: DARK }}
            >
              Montreal · Hand-Rolled · Wood-Fired
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-white"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
            >
              Hinnawi Bros
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl md:text-2xl mt-2"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: GOLD }}
            >
              Wholesale Bagels for Your Business
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={3}
              className="mt-5 leading-relaxed max-w-lg"
              style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}
            >
              Fresh, hand-rolled Montreal-style bagels delivered directly to your cafe, restaurant,
              hotel, or grocery store. Boiled in honey water and baked in a wood-fired oven — the
              authentic Montreal way.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap gap-3">
              <button
                className="px-7 py-3 font-semibold tracking-wide text-sm rounded transition-all duration-200 flex items-center gap-2"
                style={{ background: GOLD, color: DARK }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d9a24a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Request a Free Tasting
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                className="px-7 py-3 font-semibold tracking-wide text-sm rounded transition-all duration-200 flex items-center gap-2"
                style={{ border: `1px solid rgba(200,145,58,0.4)`, color: GOLD, background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(200,145,58,0.1)";
                  e.currentTarget.style.borderColor = GOLD;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.4)";
                }}
                onClick={() => document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Our Products
              </button>
            </motion.div>
            <motion.div variants={fadeUp} custom={5} className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: Truck, text: "Free delivery in Montreal" },
                { icon: Clock, text: "Fresh daily, 6 days/week" },
                { icon: Star, text: "No minimum order" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <item.icon className="h-4 w-4" style={{ color: GOLD }} />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHO WE SERVE ═══════════ */}
      <section className="py-16" style={{ background: DARK_LIGHT, borderTop: `1px solid rgba(200,145,58,0.1)`, borderBottom: `1px solid rgba(200,145,58,0.1)` }}>
        <div className="max-w-6xl mx-auto px-4">
          <p
            className="text-center text-xs uppercase tracking-[0.3em] mb-8"
            style={{ color: GOLD }}
          >
            Who We Serve
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex flex-col items-center gap-2 p-5 rounded-lg transition-all duration-200 cursor-default"
                style={{
                  border: "1px solid rgba(200,145,58,0.15)",
                  background: "rgba(200,145,58,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.4)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(200,145,58,0.15)";
                  e.currentTarget.style.background = "rgba(200,145,58,0.05)";
                }}
              >
                <seg.icon className="h-6 w-6" style={{ color: GOLD }} />
                <span className="text-sm font-medium text-white">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRODUCTS ═══════════ */}
      <section id="produits" className="py-20" style={{ background: "#FDFBF7" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
              Our Collection
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: DARK_LIGHT }}
            >
              Hand-Rolled Varieties
            </h2>
            <p className="mt-3 max-w-md mx-auto text-sm" style={{ color: "#6B5C52" }}>
              Every bagel is hand-rolled, boiled in honey water, and baked fresh. Available in dozens
              or by the case for wholesale orders.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                style={{ border: "1px solid #EDE8E2" }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-lg"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: DARK_LIGHT }}
                    >
                      {product.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-lg font-semibold" style={{ color: DARK_LIGHT }}>
                        {product.price}
                      </span>
                      <span className="text-[11px] block" style={{ color: "#8B7B72" }}>
                        /dozen
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#6B5C52" }}>
                    {product.desc}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-block text-[10px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 rounded"
                      style={{ color: GOLD, background: "rgba(200,145,58,0.1)" }}
                    >
                      {product.tag}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "#8B7B72" }}>
                      {product.perUnit}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-20" style={{ background: DARK, borderTop: `1px solid rgba(200,145,58,0.1)` }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-lg overflow-hidden shadow-2xl"
            >
              <img src={TRIO_IMG} alt="Bagel varieties" className="w-full" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
                How It Works
              </p>
              <h2
                className="text-3xl tracking-tight mb-8 text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                From our oven{" "}
                <span style={{ fontWeight: 700 }}>to your door.</span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Free Tasting",
                    desc: "We bring a complimentary sample box to your location \u2014 no commitment.",
                  },
                  {
                    step: "2",
                    title: "Choose Your Order",
                    desc: "Pick your varieties, quantities, and delivery schedule.",
                  },
                  {
                    step: "3",
                    title: "Fresh Delivery",
                    desc: "Baked fresh every morning and delivered to your door, 6 days a week.",
                  },
                  {
                    step: "4",
                    title: "Grow Together",
                    desc: "Volume discounts as you scale. The more you order, the more you save.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm"
                      style={{ border: `2px solid ${GOLD}`, color: GOLD }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                      <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-20" style={{ background: "#FDFBF7" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
              Wholesale Pricing
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: DARK_LIGHT }}
            >
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 max-w-md mx-auto text-sm" style={{ color: "#6B5C52" }}>
              The more you order, the more you save. No hidden fees, no contracts.
            </p>
          </div>

          {/* Product pricing table */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="rounded-lg overflow-hidden shadow-sm" style={{ border: "1px solid #EDE8E2" }}>
              <div
                className="grid grid-cols-3 gap-0 px-6 py-3"
                style={{ background: DARK_LIGHT }}
              >
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/70">
                  Product
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 text-center">
                  Per Dozen
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 text-right">
                  Per Bagel
                </span>
              </div>
              {products.map((p, i) => (
                <div
                  key={p.name}
                  className="grid grid-cols-3 gap-0 px-6 py-3.5 border-b last:border-0"
                  style={{
                    borderColor: "#EDE8E2",
                    background: i % 2 === 0 ? "#fff" : "#FDFBF7",
                  }}
                >
                  <span className="font-medium text-sm" style={{ color: DARK_LIGHT }}>
                    {p.name}
                  </span>
                  <span className="font-semibold text-center" style={{ color: GOLD }}>
                    {p.price}
                  </span>
                  <span className="text-sm text-right" style={{ color: "#8B7B72" }}>
                    {p.perUnit}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 italic" style={{ color: "#8B7B72" }}>
              * Volume discounts available. Contact us for custom quotes on large orders.
            </p>
          </div>

          {/* Volume tiers */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.tier}
                className="rounded-lg p-5 text-center transition-all duration-200"
                style={{
                  border: tier.highlight ? `2px solid ${GOLD}` : "1px solid #EDE8E2",
                  background: tier.highlight ? DARK_LIGHT : "#fff",
                  color: tier.highlight ? "#fff" : DARK_LIGHT,
                  boxShadow: tier.highlight ? "0 4px 20px rgba(200,145,58,0.2)" : "none",
                }}
              >
                {tier.highlight && (
                  <span
                    className="inline-block text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded mb-2 font-semibold"
                    style={{ background: GOLD, color: DARK }}
                  >
                    Popular
                  </span>
                )}
                <h4 className="font-semibold text-base">{tier.tier}</h4>
                <p
                  className="text-sm mt-1"
                  style={{ color: tier.highlight ? "rgba(255,255,255,0.5)" : "#8B7B72" }}
                >
                  {tier.range}
                </p>
                <p
                  className="font-semibold mt-2"
                  style={{ color: tier.highlight ? GOLD : DARK_LIGHT }}
                >
                  {tier.discount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY US ═══════════ */}
      <section id="why-us" className="py-20" style={{ background: DARK }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
              Why Hinnawi Bros
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What sets us <span style={{ fontWeight: 700 }}>apart.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Artisan Quality",
                desc: "Hand-rolled and kettle-boiled using traditional methods. No shortcuts, no preservatives. Every bagel is made with care.",
                icon: Flame,
              },
              {
                title: "Reliable Delivery",
                desc: "Baked fresh every morning and delivered to your door by 7 AM, 6 days a week. Rain or shine, we show up.",
                icon: Truck,
              },
              {
                title: "Competitive Pricing",
                desc: "Starting at just $8/dozen — a fraction of premium bakeries. Volume discounts available as you grow.",
                icon: Shield,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="rounded-lg p-6"
                style={{
                  background: "rgba(200,145,58,0.05)",
                  border: "1px solid rgba(200,145,58,0.15)",
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg mb-4"
                  style={{ background: "rgba(200,145,58,0.15)" }}
                >
                  <item.icon className="h-5 w-5" style={{ color: GOLD }} />
                </div>
                <h3
                  className="text-lg text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDER STORY ═══════════ */}
      <section className="py-20" style={{ background: "#FDFBF7" }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
              Our Story
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight mb-8"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: DARK_LIGHT }}
            >
              A message from <span style={{ color: GOLD }}>Rosie.</span>
            </h2>
            <div className="max-w-2xl mx-auto">
              <div
                className="rounded-lg p-8"
                style={{ background: DARK_LIGHT, borderLeft: `4px solid ${GOLD}` }}
              >
                <p
                  className="leading-relaxed text-base"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {'"'}At Hinnawi Bros, we{"'"}ve been making bagels for years with one obsession:
                  making every bite perfect. Hand-rolled, kettle-boiled, oven-baked {"\u2014"} no
                  shortcuts. We launched our wholesale program because we want everyone to taste what
                  makes Montreal bagels so special. Our dream? That every cafe, restaurant, and hotel
                  serves bagels they{"'"}re proud of.{'"'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="h-px flex-1" style={{ background: "rgba(200,145,58,0.3)" }} />
                  <p className="font-semibold text-sm" style={{ color: GOLD }}>
                    {"\u2014"} Rosie Manneh, Founder
                  </p>
                  <div className="h-px flex-1" style={{ background: "rgba(200,145,58,0.3)" }} />
                </div>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  733 Cathcart, Montreal
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CONTACT / CTA ═══════════ */}
      <section id="contact" className="py-20" style={{ background: DARK }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: GOLD }}>
                Get Started
              </p>
              <h2
                className="text-3xl tracking-tight mb-2 text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ready to taste{" "}
                <span style={{ fontWeight: 700, color: GOLD }}>the difference?</span>
              </h2>
              <p
                className="leading-relaxed mb-8"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Fill out the form and we{"'"}ll bring a complimentary sample box to your
                establishment. No commitment required.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Call us", value: "(514) 571-7672" },
                  { icon: Mail, label: "Email us", value: "Rosalyn@wineandmore.com" },
                  { icon: MapPin, label: "Our address", value: "733 Cathcart, Montreal" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ border: `1px solid rgba(200,145,58,0.3)` }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(200,145,58,0.15)" }}>
                <a
                  href="https://www.hinnawibrosbagelandcafe.com"
                  className="text-sm inline-flex items-center gap-1.5 transition-colors duration-200"
                  style={{ color: GOLD }}
                >
                  Visit our main website
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div
              className="rounded-lg p-6 shadow-lg"
              style={{ background: DARK_LIGHT, border: `1px solid rgba(200,145,58,0.2)` }}
            >
              <h3
                className="text-lg mb-1 text-white"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
              >
                Request a Free Tasting
              </h3>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
                We{"'"}ll bring samples directly to your business.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-medium mb-1 block"
                      style={{ color: GOLD }}
                    >
                      Name
                    </label>
                    <input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full h-9 rounded-md px-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(200,145,58,0.2)",
                        color: "#fff",
                        // @ts-ignore
                        "--tw-ring-color": GOLD,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-medium mb-1 block"
                      style={{ color: GOLD }}
                    >
                      Business
                    </label>
                    <input
                      placeholder="Business name"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      required
                      className="w-full h-9 rounded-md px-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(200,145,58,0.2)",
                        color: "#fff",
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="text-xs font-medium mb-1 block"
                      style={{ color: GOLD }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full h-9 rounded-md px-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(200,145,58,0.2)",
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-medium mb-1 block"
                      style={{ color: GOLD }}
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(514) 555-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-9 rounded-md px-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(200,145,58,0.2)",
                        color: "#fff",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-xs font-medium mb-1 block"
                    style={{ color: GOLD }}
                  >
                    Tell us about your business
                  </label>
                  <textarea
                    placeholder="Type of business? How many customers per week? Any specific needs?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full rounded-md px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 resize-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(200,145,58,0.2)",
                      color: "#fff",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 font-semibold tracking-wide rounded transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ background: GOLD, color: DARK }}
                  disabled={createLead.isPending}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#d9a24a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                >
                  {createLead.isPending ? "Sending..." : "Send Request \u2014 It's Free"}
                  {!createLead.isPending && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                  We{"'"}ll respond within 24 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer
        className="py-8"
        style={{ background: DARK_LIGHT, borderTop: `1px solid rgba(200,145,58,0.1)` }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-8 brightness-0 invert opacity-60" />
          </a>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Hand-crafted in Montreal
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} Hinnawi Bros Bagel &amp; Cafe
          </p>
        </div>
      </footer>
    </div>
  );
}

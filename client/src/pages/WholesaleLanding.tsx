/**
 * WholesaleLanding — Hinnawi Bros Bagels
 * Public-facing wholesale landing page — English only
 * Branding: clean white, elegant typography, food-forward, artistic warmth
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-logo_a3e13a96.webp";
const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/wholesale-hero-wide-8A7SXF32SF3XXoTVCJTz8K.webp";
const PLAIN_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/plain-bagel-product-DQ2zGdpHzS7MfunT2S586L.webp";
const SESAME_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/sesame-bagel-product-jrv7rQzzHNXM7b5Q2CX4iz.webp";
const EVERYTHING_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/everything-bagel-product-jjEH2n6KQWwqDJD22xckag.webp";
const DELIVERY_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-delivery-box-hyuKKhkyHgVr9MyK6dvFDL.webp";

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

const products = [
  {
    name: "Plain",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: PLAIN_IMG,
    desc: "The classic. Golden crust, soft chewy interior. Perfect for sandwiches, toasting, or serving fresh.",
  },
  {
    name: "Sesame",
    price: "$8.50",
    perUnit: "$0.71/bagel",
    img: SESAME_IMG,
    desc: "Generously coated with toasted sesame seeds. A nutty, aromatic favorite for breakfast menus.",
  },
  {
    name: "Everything",
    price: "$9.00",
    perUnit: "$0.75/bagel",
    img: EVERYTHING_IMG,
    desc: "Poppy, sesame, garlic, onion and salt. Bold flavor that customers keep coming back for.",
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
    <div
      className="min-h-screen bg-white text-stone-900"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-10" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm tracking-[0.15em] uppercase">
            <a href="#products" className="text-stone-500 hover:text-stone-900 transition-colors">
              Products
            </a>
            <a href="#pricing" className="text-stone-500 hover:text-stone-900 transition-colors">
              Pricing
            </a>
            <a href="#why-us" className="text-stone-500 hover:text-stone-900 transition-colors">
              Why Us
            </a>
            <a href="#contact" className="text-stone-500 hover:text-stone-900 transition-colors">
              Contact
            </a>
          </div>
          <Button
            size="sm"
            className="bg-stone-900 hover:bg-stone-800 text-white tracking-wide uppercase text-xs"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Free Tasting
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Fresh bagels" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-40">
          <motion.div
            className="max-w-xl"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4"
            >
              Wholesale Program
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 leading-[1.1] tracking-tight"
            >
              Artisan bagels,
              <br />
              <span className="font-semibold">wholesale prices.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 text-stone-600 leading-relaxed max-w-lg"
            >
              Hand-crafted Montreal bagels delivered fresh to your business. Starting at just
              $8/dozen.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white tracking-wide"
                onClick={() =>
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Request a Free Tasting
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-stone-300 text-stone-700 hover:bg-stone-50 bg-white/80 tracking-wide"
                onClick={() =>
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View Our Products
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: Truck, text: "Free delivery in Montreal" },
                { icon: Clock, text: "Fresh daily, 6 days/week" },
                { icon: Star, text: "No minimum order" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-stone-500 text-sm">
                  <item.icon className="h-4 w-4 text-stone-700" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-16 border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-stone-400 mb-8">
            Who We Serve
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex flex-col items-center gap-2 p-5 rounded-lg border border-stone-100 hover:border-stone-300 hover:shadow-sm transition-all bg-white"
              >
                <seg.icon className="h-6 w-6 text-stone-700" />
                <span className="text-sm font-medium">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Our Products</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Three classics, <span className="font-semibold">perfected.</span>
            </h2>
            <p className="mt-3 text-stone-500 max-w-md mx-auto text-sm">
              Hand-rolled, kettle-boiled, and baked fresh every morning.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group bg-white rounded-lg border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-stone-50">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-stone-900">{product.price}</span>
                      <span className="text-[11px] text-stone-400 block">/dozen</span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{product.desc}</p>
                  <p className="mt-3 text-xs text-stone-500 font-medium">{product.perUnit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-stone-50 border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={DELIVERY_IMG}
                alt="Wholesale bagel delivery"
                className="rounded-lg shadow-lg w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">
                How It Works
              </p>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                From our oven <span className="font-semibold">to your door.</span>
              </h2>
              <div className="space-y-5">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-700 font-semibold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-stone-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">
              Wholesale Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Simple and <span className="font-semibold">transparent.</span>
            </h2>
            <p className="mt-3 text-stone-500 max-w-md mx-auto text-sm">
              The more you order, the more you save. No hidden fees, no contracts.
            </p>
          </div>

          {/* Product pricing table */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
              <div className="grid grid-cols-3 gap-0 border-b border-stone-100 bg-stone-50 px-6 py-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                  Product
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium text-center">
                  Per Dozen
                </span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium text-right">
                  Per Bagel
                </span>
              </div>
              {products.map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-3 gap-0 px-6 py-4 border-b border-stone-50 last:border-0"
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="font-semibold text-stone-900 text-center">{p.price}</span>
                  <span className="text-sm text-stone-400 text-right">{p.perUnit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volume tiers */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.tier}
                className={`rounded-lg border p-5 text-center transition-all ${
                  tier.highlight
                    ? "border-stone-900 bg-stone-900 text-white shadow-md"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                {tier.highlight && (
                  <span className="inline-block text-[10px] uppercase tracking-[0.2em] bg-white text-stone-900 px-2 py-0.5 rounded mb-2 font-medium">
                    Popular
                  </span>
                )}
                <h4 className="font-semibold text-base">{tier.tier}</h4>
                <p
                  className={`text-sm mt-1 ${tier.highlight ? "text-stone-300" : "text-stone-400"}`}
                >
                  {tier.range}
                </p>
                <p
                  className={`font-semibold mt-2 ${tier.highlight ? "text-white" : "text-stone-900"}`}
                >
                  {tier.discount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="py-20 bg-stone-900 text-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-3">
              Why Hinnawi Bros
            </p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              What sets us <span className="font-semibold">apart.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Artisan Quality",
                desc: "Hand-rolled and kettle-boiled using traditional methods. No shortcuts, no preservatives.",
                icon: Star,
              },
              {
                title: "Reliable Delivery",
                desc: "Baked fresh every morning and delivered to your door by 7 AM, 6 days a week.",
                icon: Truck,
              },
              {
                title: "Competitive Pricing",
                desc: "Starting at just $8/dozen \u2014 a fraction of premium bakeries. Volume discounts available.",
                icon: Check,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-1">{item.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">
              A message from <span className="font-semibold">Rosie.</span>
            </h2>
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-stone-600 leading-relaxed text-base">
                {'"'}At Hinnawi Bros, we{"'"}ve been making bagels for years with one obsession:
                making every bite perfect. Hand-rolled, kettle-boiled, oven-baked {"\u2014"} no
                shortcuts. We launched our wholesale program because we want everyone to taste what
                makes Montreal bagels so special. Our dream? That every cafe, restaurant, and hotel
                serves bagels they{"'"}re proud of.{'"'}
              </p>
              <p className="text-stone-900 font-semibold mt-6">
                {"\u2014"} Rosie Manneh, Founder
              </p>
              <p className="text-sm text-stone-400">733 Cathcart, Montreal</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Get Started</p>
              <h2 className="text-3xl font-light tracking-tight mb-2">
                Ready to taste <span className="font-semibold">the difference?</span>
              </h2>
              <p className="text-stone-500 leading-relaxed mb-8">
                Fill out the form and we{"'"}ll bring a complimentary sample box to your
                establishment. No commitment required.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Call us</p>
                    <p className="text-sm font-medium">(514) 571-7672</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Email us</p>
                    <p className="text-sm font-medium">Rosalyn@wineandmore.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Our address</p>
                    <p className="text-sm font-medium">733 Cathcart, Montreal</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <a
                  href="https://www.hinnawibrosbagelandcafe.com"
                  className="text-sm text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center gap-1.5"
                >
                  Visit our main website
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-1">Request a Free Tasting</h3>
              <p className="text-xs text-stone-400 mb-5">
                We{"'"}ll bring samples directly to your business.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Name</label>
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">
                      Business
                    </label>
                    <Input
                      placeholder="Business name"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Email</label>
                    <Input
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Phone</label>
                    <Input
                      type="tel"
                      placeholder="(514) 555-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">
                    Tell us about your business
                  </label>
                  <textarea
                    placeholder="Type of business? How many customers per week? Any specific needs?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-400 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium tracking-wide"
                  disabled={createLead.isPending}
                >
                  {createLead.isPending ? "Sending..." : "Send Request \u2014 It's Free"}
                  {!createLead.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
                <p className="text-[11px] text-stone-400 text-center">
                  We{"'"}ll respond within 24 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-8 opacity-60" />
          </a>
          <p className="text-xs text-stone-400">Hand-crafted in Montreal</p>
          <p className="text-xs text-stone-400">
            &copy; {new Date().getFullYear()} Hinnawi Bros Bagel &amp; Cafe
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * WholesaleLanding — Hinnawi Bros Bagels
 * Public-facing wholesale landing page for attracting new B2B customers
 * Design: Warm, editorial, appetizing — artisan quality meets competitive pricing
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Cookie,
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

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/wholesale-hero-wide-8A7SXF32SF3XXoTVCJTz8K.webp";
const PLAIN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/plain-bagel-product-DQ2zGdpHzS7MfunT2S586L.webp";
const SESAME_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/sesame-bagel-product-jrv7rQzzHNXM7b5Q2CX4iz.webp";
const EVERYTHING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/everything-bagel-product-jjEH2n6KQWwqDJD22xckag.webp";
const DELIVERY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-delivery-box-hyuKKhkyHgVr9MyK6dvFDL.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
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
    desc: "Poppy, sesame, garlic, onion & salt. Bold flavor that customers keep coming back for.",
  },
];

const segments = [
  { icon: Coffee, label: "Cafes", desc: "Brunch & breakfast menus" },
  { icon: UtensilsCrossed, label: "Restaurants", desc: "Dine-in & takeout" },
  { icon: Building2, label: "Hotels", desc: "Room service & buffets" },
  { icon: ShoppingBag, label: "Grocery", desc: "Retail & deli counters" },
  { icon: Users, label: "Catering", desc: "Events & corporate" },
  { icon: GraduationCap, label: "Universities", desc: "Campus dining halls" },
];

const pricingTiers = [
  { tier: "Starter", range: "5–10 dz/week", discount: "Standard pricing", highlight: false },
  { tier: "Growth", range: "11–25 dz/week", discount: "5% off", highlight: true },
  { tier: "Volume", range: "26–50 dz/week", discount: "10% off", highlight: false },
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
        description: "We'll reach out to schedule a free tasting.",
      });
      setFormData({ name: "", business: "", email: "", phone: "", message: "" });
    },
    onError: (error) => {
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
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Sticky Nav ─── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-800 text-white">
              <Cookie className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold tracking-tight leading-none">Hinnawi Bros</span>
              <span className="text-[10px] text-muted-foreground leading-none">Wholesale Bagels</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#products" className="text-muted-foreground hover:text-foreground transition-colors">Products</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#why-us" className="text-muted-foreground hover:text-foreground transition-colors">Why Us</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <Button
            size="sm"
            className="bg-amber-800 hover:bg-amber-900 text-white"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Get a Free Tasting
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Fresh bagels" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/60 to-stone-950/30" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
          <motion.div
            className="max-w-xl"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="bg-amber-800/90 text-amber-50 border-0 mb-4 text-xs font-medium px-3 py-1">
                <MapPin className="h-3 w-3 mr-1" />
                Montreal, QC
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight"
            >
              Hand-crafted bagels,{" "}
              <span className="text-amber-300">wholesale-friendly</span>{" "}
              pricing.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 text-lg text-stone-300 leading-relaxed max-w-lg"
            >
              Artisan Montreal bagels delivered fresh to your business. Starting at just $8/dozen — quality your customers will love, margins you can count on.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Request a Free Tasting
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-stone-500 text-stone-200 hover:bg-stone-800/50 bg-transparent"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Products
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: Truck, text: "Free delivery in Montreal" },
                { icon: Clock, text: "Fresh daily, 6 days/week" },
                { icon: Star, text: "No minimum order" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-stone-400 text-sm">
                  <item.icon className="h-4 w-4 text-amber-400" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Who We Serve ─── */}
      <section className="py-16 bg-stone-50 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-8">
            Trusted by Montreal businesses
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white border border-border/50 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <seg.icon className="h-6 w-6 text-amber-700" />
                <span className="text-sm font-semibold">{seg.label}</span>
                <span className="text-[11px] text-muted-foreground text-center">{seg.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="products" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">Our Products</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Three classics, perfected.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Hand-rolled, kettle-boiled, and baked fresh every morning. Simple ingredients, exceptional taste.
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
                className="group bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-xl font-bold">{product.name}</h3>
                    <div className="text-right">
                      <span className="font-data text-lg font-bold text-amber-800">{product.price}</span>
                      <span className="text-[11px] text-muted-foreground block">/dozen</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.desc}</p>
                  <p className="mt-3 text-xs text-amber-700 font-medium">{product.perUnit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Delivery Box Section ─── */}
      <section className="py-20 bg-stone-50 border-y border-border/40">
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
                alt="Wholesale delivery box"
                className="rounded-xl shadow-lg w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">How It Works</p>
              <h2 className="font-display text-3xl font-bold tracking-tight mb-6">
                From our oven to your door.
              </h2>
              <div className="space-y-5">
                {[
                  { step: "1", title: "Free Tasting", desc: "We bring a complimentary sample box to your location — no commitment." },
                  { step: "2", title: "Choose Your Order", desc: "Pick your varieties, quantities, and delivery schedule. Flexible weekly orders." },
                  { step: "3", title: "Fresh Delivery", desc: "Baked fresh every morning and delivered to your door, 6 days a week." },
                  { step: "4", title: "Grow Together", desc: "Volume discounts as you scale. We grow with your business." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-display font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">Wholesale Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              The more you order, the more you save. No hidden fees, no contracts.
            </p>
          </div>

          {/* Product pricing */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="grid grid-cols-3 gap-0 border-b border-border/40 bg-stone-50 px-6 py-3">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Product</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-center">Per Dozen</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Per Bagel</span>
              </div>
              {products.map((p) => (
                <div key={p.name} className="grid grid-cols-3 gap-0 px-6 py-4 border-b border-border/20 last:border-0">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="font-data font-bold text-amber-800 text-center">{p.price}</span>
                  <span className="text-sm text-muted-foreground text-right">{p.perUnit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volume tiers */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.tier}
                className={`rounded-xl border p-5 text-center transition-all ${
                  tier.highlight
                    ? "border-amber-400 bg-amber-50 shadow-sm"
                    : "border-border/60 bg-white hover:border-amber-200"
                }`}
              >
                {tier.highlight && (
                  <Badge className="bg-amber-700 text-white border-0 text-[10px] mb-2">Most Popular</Badge>
                )}
                <h4 className="font-display font-bold text-lg">{tier.tier}</h4>
                <p className="text-sm text-muted-foreground mt-1">{tier.range}</p>
                <p className="font-data font-bold text-amber-800 mt-2">{tier.discount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Us ─── */}
      <section id="why-us" className="py-20 bg-stone-900 text-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-semibold mb-2">Why Hinnawi Bros</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
              What sets us apart.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Artisan Quality",
                desc: "Hand-rolled and kettle-boiled using traditional methods. No shortcuts, no preservatives. Just real ingredients and time-honored technique.",
                icon: Star,
              },
              {
                title: "Reliable Delivery",
                desc: "Baked fresh every morning and delivered to your door by 7 AM, 6 days a week. Consistent quality, consistent schedule.",
                icon: Truck,
              },
              {
                title: "Competitive Pricing",
                desc: "Starting at just $8/dozen — a fraction of premium bakeries. Your customers get artisan quality, you get healthy margins.",
                icon: Check,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-800/30 text-amber-400 mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact / CTA ─── */}
      <section id="contact" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-2">Get Started</p>
              <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
                Ready to taste the difference?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Fill out the form and we'll bring a complimentary sample box to your location. No commitment, no pressure — just great bagels.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Call us</p>
                    <p className="text-sm font-medium">(514) 555-BAGEL</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email us</p>
                    <p className="text-sm font-medium">wholesale@hinnawibros.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visit us</p>
                    <p className="text-sm font-medium">Montreal, QC</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border/60 p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-4">Request a Free Tasting</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name</label>
                    <Input
                      placeholder="Rosie Manneh"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Name</label>
                    <Input
                      placeholder="Café Example"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                    <Input
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                    <Input
                      type="tel"
                      placeholder="(514) 555-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Tell us about your business
                  </label>
                  <textarea
                    placeholder="What type of business? How many customers/week? Any specific needs?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>
                         <Button
                  type="submit"
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold"
                  disabled={createLead.isPending}
                >
                  {createLead.isPending ? "Sending..." : "Send Request — It's Free"}
                  {!createLead.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  We'll respond within 24 hours. No spam, ever.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 bg-stone-50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-amber-800" />
            <span className="font-display text-sm font-bold">Hinnawi Bros Bagels</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hand-crafted in Montreal. Wholesale inquiries: wholesale@hinnawibros.com
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Hinnawi Bros. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

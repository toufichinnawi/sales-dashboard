/**
 * WholesaleLanding — Hinnawi Bros Bagels
 * Public-facing wholesale landing page — bilingual (FR/EN)
 * Branding matched to hinnawibrosbagelandcafe.com:
 *   Clean white, elegant typography, food-forward, artistic warmth
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

const LOGO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-logo_a3e13a96.webp";
const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/wholesale-hero-wide-8A7SXF32SF3XXoTVCJTz8K.webp";
const PLAIN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/plain-bagel-product-DQ2zGdpHzS7MfunT2S586L.webp";
const SESAME_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/sesame-bagel-product-jrv7rQzzHNXM7b5Q2CX4iz.webp";
const EVERYTHING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/everything-bagel-product-jjEH2n6KQWwqDJD22xckag.webp";
const DELIVERY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-delivery-box-hyuKKhkyHgVr9MyK6dvFDL.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const products = [
  {
    name: "Nature / Plain",
    price: "$8.00",
    perUnit: "$0.67/bagel",
    img: PLAIN_IMG,
    descFr: "Le classique. Croute dorée, intérieur moelleux. Parfait pour les sandwichs, grillé ou servi frais.",
    descEn: "The classic. Golden crust, soft chewy interior. Perfect for sandwiches, toasting, or serving fresh.",
  },
  {
    name: "Sésame / Sesame",
    price: "$8.50",
    perUnit: "$0.71/bagel",
    img: SESAME_IMG,
    descFr: "Généreusement enrobé de graines de sésame grillées. Un favori aromatique pour les menus déjeuner.",
    descEn: "Generously coated with toasted sesame seeds. A nutty, aromatic favorite for breakfast menus.",
  },
  {
    name: "Tout Garni / Everything",
    price: "$9.00",
    perUnit: "$0.75/bagel",
    img: EVERYTHING_IMG,
    descFr: "Pavot, sésame, ail, oignon et sel. Une saveur audacieuse qui fait revenir vos clients.",
    descEn: "Poppy, sesame, garlic, onion & salt. Bold flavor that customers keep coming back for.",
  },
];

const segments = [
  { icon: Coffee, labelFr: "Cafés", labelEn: "Cafes", desc: "Brunch & déjeuner" },
  { icon: UtensilsCrossed, labelFr: "Restaurants", labelEn: "Restaurants", desc: "Sur place & emporter" },
  { icon: Building2, labelFr: "Hôtels", labelEn: "Hotels", desc: "Service aux chambres" },
  { icon: ShoppingBag, labelFr: "Épiceries", labelEn: "Grocery", desc: "Comptoirs & détail" },
  { icon: Users, labelFr: "Traiteurs", labelEn: "Catering", desc: "Événements & corporatif" },
  { icon: GraduationCap, labelFr: "Universités", labelEn: "Universities", desc: "Cafétérias" },
];

const pricingTiers = [
  { tier: "Départ / Starter", range: "5–10 dz/sem", discount: "Prix standard", highlight: false },
  { tier: "Croissance / Growth", range: "11–25 dz/sem", discount: "5% de rabais", highlight: true },
  { tier: "Volume", range: "26–50 dz/sem", discount: "10% de rabais", highlight: false },
  { tier: "Entreprise / Enterprise", range: "50+ dz/sem", discount: "15% de rabais", highlight: false },
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
      toast.success("Merci! Nous vous contacterons dans les 24 heures.", {
        description: "Thank you! We'll be in touch within 24 hours.",
      });
      setFormData({ name: "", business: "", email: "", phone: "", message: "" });
    },
    onError: (error: { message: string }) => {
      toast.error("Une erreur est survenue. Veuillez réessayer.", {
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
    <div className="min-h-screen bg-white text-stone-900" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-10" />
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm tracking-[0.15em] uppercase">
            <a href="#produits" className="text-stone-500 hover:text-stone-900 transition-colors">Produits</a>
            <a href="#prix" className="text-stone-500 hover:text-stone-900 transition-colors">Prix</a>
            <a href="#pourquoi" className="text-stone-500 hover:text-stone-900 transition-colors">Pourquoi Nous</a>
            <a href="#contact" className="text-stone-500 hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <Button
            size="sm"
            className="bg-stone-900 hover:bg-stone-800 text-white tracking-wide uppercase text-xs"
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Dégustation Gratuite
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Bagels frais" className="w-full h-full object-cover" />
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
              Programme de vente en gros · Wholesale Program
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 leading-[1.1] tracking-tight"
            >
              Bagels artisanaux,
              <br />
              <span className="font-semibold">prix de gros.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 text-stone-600 leading-relaxed max-w-lg"
            >
              Des bagels montréalais faits à la main, livrés frais à votre commerce. À partir de seulement 8$/douzaine.
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-2 text-stone-400 italic leading-relaxed max-w-lg text-sm"
            >
              Hand-crafted Montreal bagels delivered fresh to your business. Starting at just $8/dozen.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white tracking-wide"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Demander une dégustation gratuite
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-stone-300 text-stone-700 hover:bg-stone-50 bg-white/80 tracking-wide"
                onClick={() => document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" })}
              >
                Voir nos produits
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: Truck, fr: "Livraison gratuite à Montréal", en: "Free delivery in Montreal" },
                { icon: Clock, fr: "Frais tous les jours, 6j/7", en: "Fresh daily, 6 days/week" },
                { icon: Star, fr: "Aucune commande minimum", en: "No minimum order" },
              ].map((item) => (
                <div key={item.en} className="flex items-center gap-2 text-stone-500 text-sm">
                  <item.icon className="h-4 w-4 text-stone-700" />
                  <span>{item.fr}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Who We Serve ─── */}
      <section className="py-16 border-y border-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-stone-400 mb-8">
            Nos clients · Our Clients
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg) => (
              <div
                key={seg.labelEn}
                className="flex flex-col items-center gap-2 p-5 rounded-lg border border-stone-100 hover:border-stone-300 hover:shadow-sm transition-all bg-white"
              >
                <seg.icon className="h-6 w-6 text-stone-700" />
                <span className="text-sm font-medium">{seg.labelFr}</span>
                <span className="text-[11px] text-stone-400 italic">{seg.labelEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="produits" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Nos Produits · Our Products</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Trois classiques, <span className="font-semibold">perfectionnés.</span>
            </h2>
            <p className="mt-3 text-stone-500 max-w-md mx-auto text-sm">
              Roulés à la main, bouillis au chaudron et cuits frais chaque matin.
            </p>
            <p className="mt-1 text-stone-400 italic max-w-md mx-auto text-xs">
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
                      <span className="text-[11px] text-stone-400 block">/douzaine</span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{product.descFr}</p>
                  <p className="text-xs text-stone-400 italic leading-relaxed mt-2">{product.descEn}</p>
                  <p className="mt-3 text-xs text-stone-500 font-medium">{product.perUnit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
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
                alt="Livraison de bagels en gros"
                className="rounded-lg shadow-lg w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Comment ça marche · How It Works</p>
              <h2 className="text-3xl font-light tracking-tight mb-6">
                De notre four <span className="font-semibold">à votre porte.</span>
              </h2>
              <div className="space-y-5">
                {[
                  { step: "1", titleFr: "Dégustation gratuite", titleEn: "Free Tasting", descFr: "Nous apportons un échantillon gratuit à votre établissement — sans engagement.", descEn: "We bring a complimentary sample box to your location — no commitment." },
                  { step: "2", titleFr: "Choisissez votre commande", titleEn: "Choose Your Order", descFr: "Sélectionnez vos variétés, quantités et horaire de livraison.", descEn: "Pick your varieties, quantities, and delivery schedule." },
                  { step: "3", titleFr: "Livraison fraîche", titleEn: "Fresh Delivery", descFr: "Cuits frais chaque matin et livrés à votre porte, 6 jours par semaine.", descEn: "Baked fresh every morning and delivered to your door, 6 days a week." },
                  { step: "4", titleFr: "Grandissons ensemble", titleEn: "Grow Together", descFr: "Rabais de volume à mesure que vous grandissez.", descEn: "Volume discounts as you scale." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-700 font-semibold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.titleFr}</h4>
                      <p className="text-sm text-stone-500 mt-0.5">{item.descFr}</p>
                      <p className="text-xs text-stone-400 italic mt-0.5">{item.descEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="prix" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Prix de Gros · Wholesale Pricing</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Simple et <span className="font-semibold">transparent.</span>
            </h2>
            <p className="mt-3 text-stone-500 max-w-md mx-auto text-sm">
              Plus vous commandez, plus vous économisez. Pas de frais cachés, pas de contrats.
            </p>
            <p className="mt-1 text-stone-400 italic max-w-md mx-auto text-xs">
              The more you order, the more you save. No hidden fees, no contracts.
            </p>
          </div>

          {/* Product pricing table */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
              <div className="grid grid-cols-3 gap-0 border-b border-stone-100 bg-stone-50 px-6 py-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium">Produit</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium text-center">Par Douzaine</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium text-right">Par Bagel</span>
              </div>
              {products.map((p) => (
                <div key={p.name} className="grid grid-cols-3 gap-0 px-6 py-4 border-b border-stone-50 last:border-0">
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
                    Populaire
                  </span>
                )}
                <h4 className="font-semibold text-base">{tier.tier}</h4>
                <p className={`text-sm mt-1 ${tier.highlight ? "text-stone-300" : "text-stone-400"}`}>{tier.range}</p>
                <p className={`font-semibold mt-2 ${tier.highlight ? "text-white" : "text-stone-900"}`}>{tier.discount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Us ─── */}
      <section id="pourquoi" className="py-20 bg-stone-900 text-stone-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-3">Pourquoi Hinnawi Bros · Why Hinnawi Bros</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              Ce qui nous <span className="font-semibold">distingue.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                titleFr: "Qualité Artisanale",
                titleEn: "Artisan Quality",
                descFr: "Roulés à la main et bouillis au chaudron selon les méthodes traditionnelles. Pas de raccourcis, pas de conservateurs.",
                descEn: "Hand-rolled and kettle-boiled using traditional methods. No shortcuts, no preservatives.",
                icon: Star,
              },
              {
                titleFr: "Livraison Fiable",
                titleEn: "Reliable Delivery",
                descFr: "Cuits frais chaque matin et livrés à votre porte avant 7h, 6 jours par semaine.",
                descEn: "Baked fresh every morning and delivered to your door by 7 AM, 6 days a week.",
                icon: Truck,
              },
              {
                titleFr: "Prix Compétitifs",
                titleEn: "Competitive Pricing",
                descFr: "À partir de seulement 8$/douzaine — une fraction du prix des boulangeries premium.",
                descEn: "Starting at just $8/dozen — a fraction of premium bakeries.",
                icon: Check,
              },
            ].map((item, i) => (
              <motion.div
                key={item.titleEn}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-1">{item.titleFr}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{item.descFr}</p>
                <p className="text-xs text-stone-500 italic leading-relaxed mt-2">{item.descEn}</p>
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
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-3">Commencer · Get Started</p>
              <h2 className="text-3xl font-light tracking-tight mb-2">
                Prêt à goûter <span className="font-semibold">la différence?</span>
              </h2>
              <p className="text-sm text-stone-400 italic mb-6">Ready to taste the difference?</p>
              <p className="text-stone-500 leading-relaxed mb-8">
                Remplissez le formulaire et nous apporterons un échantillon gratuit à votre établissement. Sans engagement.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Appelez-nous · Call us</p>
                    <p className="text-sm font-medium">(514) 555-BAGEL</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Écrivez-nous · Email us</p>
                    <p className="text-sm font-medium">wholesale@hinnawibros.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Visitez-nous · Visit us</p>
                    <p className="text-sm font-medium">Montréal, QC</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                <a
                  href="https://www.hinnawibrosbagelandcafe.com"
                  className="text-sm text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center gap-1.5"
                >
                  Visitez notre site principal · Visit our main website
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-1">Demander une dégustation gratuite</h3>
              <p className="text-xs text-stone-400 italic mb-5">Request a Free Tasting</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Nom / Name</label>
                    <Input
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Commerce / Business</label>
                    <Input
                      placeholder="Nom du commerce"
                      value={formData.business}
                      onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Courriel / Email</label>
                    <Input
                      type="email"
                      placeholder="vous@commerce.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-9 text-sm border-stone-200 focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Téléphone / Phone</label>
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
                    Parlez-nous de votre commerce / Tell us about your business
                  </label>
                  <textarea
                    placeholder="Type de commerce? Combien de clients par semaine? Besoins spécifiques?"
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
                  {createLead.isPending ? "Envoi en cours..." : "Envoyer la demande — C'est gratuit"}
                  {!createLead.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
                <p className="text-[11px] text-stone-400 text-center">
                  Nous répondrons dans les 24 heures. · We'll respond within 24 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="https://www.hinnawibrosbagelandcafe.com" className="flex items-center">
            <img src={LOGO_IMG} alt="Hinnawi Bros" className="h-8 opacity-60" />
          </a>
          <p className="text-xs text-stone-400">
            Fait à la main à Montréal · Hand-crafted in Montreal
          </p>
          <p className="text-xs text-stone-400">
            &copy; {new Date().getFullYear()} Hinnawi Bros Bagel & Café
          </p>
        </div>
      </footer>
    </div>
  );
}

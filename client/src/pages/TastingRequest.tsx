/**
 * TastingRequest — Public form for prospects to request a free bagel tasting
 * Matches the dark/gold artisan aesthetic from WholesaleLanding
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

/* ── Brand Colors ── */
const GOLD = "#C8913A";
const DARK = "#1a0f0a";
const DARK_MID = "#2C1810";
const CREAM = "#FDFBF7";

/* ── Image URLs ── */
const LOGO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-logo_a3e13a96.webp";
const BAGEL_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-variety_72c673df.jpg";

const BAGEL_OPTIONS = [
  "Plain",
  "Sesame",
  "Everything",
  "Whole Wheat",
  "Cinnamon Raisin",
  "Garlic",
];

export default function TastingRequest() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedBagels, setSelectedBagels] = useState<string[]>([]);

  const submitMutation = trpc.tastings.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Tasting request submitted! We'll be in touch soon.");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const toggleBagel = (name: string) => {
    setSelectedBagels((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    submitMutation.mutate({
      name: formData.get("name") as string,
      business: formData.get("business") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      preferredDate: (formData.get("preferredDate") as string) || undefined,
      bagelPreferences:
        selectedBagels.length > 0 ? selectedBagels.join(", ") : undefined,
      message: (formData.get("message") as string) || undefined,
    });
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: DARK }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: DARK_MID, border: `2px solid ${GOLD}` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: CREAM, fontFamily: "'Playfair Display', serif" }}
          >
            Tasting Request Received!
          </h1>
          <p style={{ color: "#8B7B72" }} className="text-sm leading-relaxed">
            Thank you for your interest in Hinnawi Bros Bagels. Our wholesale
            team will reach out within 24 hours to schedule your complimentary
            tasting.
          </p>
          <div
            className="rounded-lg p-4 text-sm"
            style={{ background: DARK_MID, color: "#8B7B72" }}
          >
            <p className="font-medium mb-1" style={{ color: CREAM }}>
              What happens next?
            </p>
            <ul className="space-y-1 text-left list-disc list-inside">
              <li>We'll confirm your preferred date & time</li>
              <li>Fresh bagels delivered to your location</li>
              <li>No obligation — just great bagels</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/wholesale">
              <Button
                variant="outline"
                className="text-sm"
                style={{
                  borderColor: GOLD,
                  color: GOLD,
                  background: "transparent",
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Wholesale
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: DARK }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#2C1810" }}
      >
        <Link href="/wholesale">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={LOGO_IMG}
              alt="Hinnawi Bros"
              className="w-8 h-8 rounded-full"
            />
            <span
              className="font-semibold text-sm"
              style={{
                color: CREAM,
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Hinnawi Bros
            </span>
          </div>
        </Link>
        <Link href="/wholesale">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            style={{ color: "#8B7B72" }}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Image + Info */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl">
              <img
                src={BAGEL_IMG}
                alt="Hinnawi Bros Bagels"
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5" style={{ color: GOLD }} />
                <h2
                  className="text-xl font-bold"
                  style={{
                    color: CREAM,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  Request a Free Tasting
                </h2>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#8B7B72" }}
              >
                Experience our hand-rolled, wood-fired Montreal-style bagels at
                your location. We'll bring a fresh selection so you and your
                team can taste the difference. No commitment, no cost — just
                great bagels.
              </p>
            </div>

            <div
              className="rounded-lg p-5 space-y-4"
              style={{ background: DARK_MID }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: CREAM }}
              >
                What's included:
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Assorted fresh bagels (your choice of varieties)",
                  "Cream cheese & spreads for sampling",
                  "Wholesale pricing guide & volume discounts",
                  "Delivery schedule & coverage area info",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "#8B7B72" }}
                  >
                    <CheckCircle2
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: GOLD }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-lg p-4 text-xs space-y-2"
              style={{ background: DARK_MID, color: "#8B7B72" }}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" style={{ color: GOLD }} />
                <span>514-571-7672</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" style={{ color: GOLD }} />
                <span>rosalyn@bagelandcafe.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" style={{ color: GOLD }} />
                <span>733 Cathcart, Montreal, QC</span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div
            className="rounded-xl p-6 md:p-8"
            style={{ background: DARK_MID }}
          >
            <h2
              className="text-lg font-bold mb-1"
              style={{
                color: CREAM,
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Tell us about your business
            </h2>
            <p className="text-xs mb-6" style={{ color: "#8B7B72" }}>
              Fill out the form below and we'll schedule your tasting within 24
              hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Your Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Marie Tremblay"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Business */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="business"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Business Name *
                </Label>
                <Input
                  id="business"
                  name="business"
                  required
                  placeholder="e.g. Cafe Lumiere"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. marie@cafelumiere.com"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="e.g. 514-555-1234"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="address"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Delivery Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Where should we bring the tasting?"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Preferred Date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="preferredDate"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  <Calendar
                    className="w-3.5 h-3.5 inline mr-1"
                    style={{ color: GOLD }}
                  />
                  Preferred Date / Time
                </Label>
                <Input
                  id="preferredDate"
                  name="preferredDate"
                  placeholder="e.g. Next Tuesday morning, or any weekday"
                  className="text-sm border-0"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Bagel Preferences */}
              <div className="space-y-2">
                <Label
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Which bagels would you like to try?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {BAGEL_OPTIONS.map((bagel) => {
                    const isSelected = selectedBagels.includes(bagel);
                    return (
                      <button
                        key={bagel}
                        type="button"
                        onClick={() => toggleBagel(bagel)}
                        className="px-3 py-2 rounded-md text-xs font-medium transition-all text-left"
                        style={{
                          background: isSelected ? GOLD : DARK,
                          color: isSelected ? DARK : "#8B7B72",
                          border: isSelected
                            ? `1px solid ${GOLD}`
                            : "1px solid #3a2a20",
                        }}
                      >
                        {isSelected ? "✓ " : ""}
                        {bagel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="message"
                  className="text-xs font-medium"
                  style={{ color: CREAM }}
                >
                  Anything else we should know?
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="e.g. We serve 200 customers daily, interested in weekly delivery..."
                  className="text-sm border-0 resize-none"
                  style={{
                    background: DARK,
                    color: CREAM,
                  }}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full text-sm font-semibold py-5 mt-2"
                style={{
                  background: GOLD,
                  color: DARK,
                }}
              >
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Request My Free Tasting"}
              </Button>

              <p className="text-center text-[10px]" style={{ color: "#6B5C52" }}>
                No commitment required. We'll contact you within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

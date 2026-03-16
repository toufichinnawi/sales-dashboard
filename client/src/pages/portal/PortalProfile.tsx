/**
 * Portal — My Profile
 * View and update customer contact info
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Building2, Mail, Phone, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

export default function PortalProfile() {
  const { data: customer, isLoading } = trpc.portal.me.useQuery();
  const utils = trpc.useUtils();

  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (customer) {
      setContactName(customer.contactName);
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
    }
  }, [customer]);

  const updateProfile = trpc.portal.updateProfile.useMutation({
    onSuccess: () => {
      utils.portal.me.invalidate();
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      contactName: contactName || undefined,
      phone: phone || null,
      address: address || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-semibold mb-1">No Account Linked</h2>
        <p className="text-sm text-muted-foreground">
          Your login is not linked to a customer account yet. Contact Hinnawi Bros for an invite.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your contact information
        </p>
      </div>

      {/* Business info (read-only) */}
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Business Name</Label>
            <p className="text-sm font-medium mt-0.5">{customer.businessName}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Segment</Label>
            <p className="text-sm font-medium mt-0.5 capitalize">{customer.segment}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{customer.email}</span>
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Contact Hinnawi Bros to update business name, email, or segment.
          </p>
        </CardContent>
      </Card>

      {/* Editable contact info */}
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label htmlFor="contactName" className="text-xs mb-1 block">
              Contact Name
            </Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="h-10"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-xs mb-1 block">
              <Phone className="h-3 w-3 inline mr-1" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(514) 555-0123"
              className="h-10"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-xs mb-1 block">
              <MapPin className="h-3 w-3 inline mr-1" />
              Delivery Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Montreal, QC"
              className="h-10"
            />
          </div>

          <Button
            className="w-full h-10 gap-2"
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="border-border/50 py-0">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Customer since {new Date(customer.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

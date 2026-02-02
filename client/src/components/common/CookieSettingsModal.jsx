import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CookieSettingsModal = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cookie Settings</DialogTitle>
          <DialogDescription>
            Customize your cookie preferences. Essential cookies cannot be
            disabled as they are required for the site to function properly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="essential" className="font-semibold">
                Essential Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Required for authentication, security, and basic functionality.
              </p>
            </div>
            <Switch id="essential" checked disabled />
          </div>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="analytics" className="font-semibold">
                Analytics Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Help us understand how visitors interact with the platform.
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings.analytics}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, analytics: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="marketing" className="font-semibold">
                Marketing Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Used to deliver more relevant advertisements and limit how many
                times you see an ad.
              </p>
            </div>
            <Switch
              id="marketing"
              checked={settings.marketing}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, marketing: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookieSettingsModal;

// ============================================================
// PUBLISH WIZARD PAGE
// Route wrapper for the Review Publishing Wizard.
// ============================================================

import React from "react";
import { ReviewPublishingWizard } from "@/components/wizard";

export default function PublishWizardPage() {
  return (
    <div className="min-h-screen gradient-dark-surface py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ReviewPublishingWizard />
      </div>
    </div>
  );
}

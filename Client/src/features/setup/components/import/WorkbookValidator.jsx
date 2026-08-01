import React from "react";
import ValidationCard from "./ValidationCard";

export default function WorkbookValidator({ errors, warnings }) {
  return (
    <div className="space-y-4">
      <ValidationCard errors={errors} warnings={warnings} />
    </div>
  );
}

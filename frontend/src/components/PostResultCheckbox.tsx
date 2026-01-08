import React, { useState } from "react";
import { handlePostVisit } from "./Function";

export function PostResultCheckbox({
  visitId,
  initialPosted,
  setError,
}: {
  visitId: string;
  initialPosted: boolean;
  setError: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [posted, setPosted] = useState(initialPosted);
  const [loading, setLoading] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;

    setPosted(next);
    setLoading(true);

    try {
      await handlePostVisit(next, visitId, setError);
    } catch {
      setPosted(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-2 select-none cursor-pointer">
      <input
        type="checkbox"
        checked={posted}
        onChange={onChange}
        disabled={loading}
        className="h-4 w-4"
      />
      <span className={posted ? "text-green-700" : "text-gray-600"}>
        {posted ? "Posted" : "Unposted"}
      </span>
    </label>
  );
}

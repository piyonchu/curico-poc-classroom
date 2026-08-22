import { activity as vinegar } from "./activity";
import { rainbow } from "./rainbow";
import type { Activity } from "./activity";

export const activities: Activity[] = [vinegar, rainbow];

const byId: Record<string, Activity> = {
  [vinegar.id]: vinegar,
  [rainbow.id]: rainbow,
};

export function getActivity(id?: string | null): Activity {
  if (id && byId[id]) return byId[id];
  return vinegar;
}

export const matterBudgets = [
  {desktop:2400,mobile:850},
  {desktop:1800,mobile:600},
  {desktop:1200,mobile:400},
] as const;

/** Only downgrade after a measured scroll sample; never increase during a visit. */
export function nextMatterTier(current:number, samples:number, p95Ms:number):number {
  return samples>=60 && p95Ms>10 && current<matterBudgets.length-1 ? current+1 : current;
}

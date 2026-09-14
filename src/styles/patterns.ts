// Shared Tailwind recipes: layout and native controls only.
export const container =
  "mx-auto w-[calc(100%-48px)] max-w-[1440px] md:w-[calc(100%-clamp(48px,8.3334vw,128px))]";
export const metadata = "font-mono text-xs leading-normal tracking-normal";
export const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-electric";
export const heading =
  "text-balance font-[650] leading-[1.05] tracking-[-.04em]";
export const sectionHeading =
  heading + " text-[clamp(44px,10.6vw,64px)] md:text-[clamp(48px,5.21vw,80px)]";
export const action =
  "inline-flex min-h-12 items-center justify-center gap-3 text-sm leading-[1.3] font-medium transition-colors duration-160 ease-editorial motion-reduce:transition-none md:gap-4 md:text-base " +
  focus;

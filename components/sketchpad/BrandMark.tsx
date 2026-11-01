
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
});

export function BrandMark({
  showWordmark = true,
}: {
  showWordmark?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center">
      {showWordmark && (
        <span
          className={`${plusJakarta.className} whitespace-nowrap text-[17px] font-extrabold tracking-[-0.8px] sm:text-[20px] sm:tracking-[-1px] xl:text-[25px] xl:tracking-[-1.5px]`}
        >
          <span className="text-foreground">Sketch</span>
          <span style={{ color: 'hsl(var(--chart-2))' }}>Pad</span>
        </span>
      )}
    </div>
  );
}

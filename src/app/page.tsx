import { CyberTombApp } from "~/components/CyberTombApp";
import { HeroProvider } from "~/context/HeroContext";

export default function HomePage() {
  return (
    <HeroProvider>
      <CyberTombApp />
    </HeroProvider>
  );
}

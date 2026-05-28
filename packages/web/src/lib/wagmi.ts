import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, xLayer } from "wagmi/chains";
import { http } from "viem";

/**
 * WalletConnect projectId.
 *
 * Strict: in production we require NEXT_PUBLIC_WC_PROJECT_ID to be set.
 * For build/preview without env (and tests/CI), we fall back to a placeholder
 * + warn — the wallet button will render but a project-id-gated open will
 * fail. The P16 stake widget requires a real id from the operator.
 */
const PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "regista11-placeholder-projectid";

if (
  typeof window !== "undefined" &&
  PROJECT_ID === "regista11-placeholder-projectid"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is not set; using placeholder. Wallet modal will not work."
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Regista 11",
  projectId: PROJECT_ID,
  chains: [xLayer, mainnet],
  transports: {
    [xLayer.id]: http("https://rpc.xlayer.tech"),
    [mainnet.id]: http(),
  },
  ssr: true,
});

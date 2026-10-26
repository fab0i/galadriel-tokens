import type { TokenDef } from "../types.ts";

export function TokenArt({ token }: { token: TokenDef }) {
  return token.imageUrl ? (
    <img
      className="token-art"
      src={token.imageUrl}
      alt=""
      crossOrigin="anonymous"
      loading="lazy"
      draggable={false}
    />
  ) : (
    <div className="token-art placeholder">{token.name.charAt(0)}</div>
  );
}

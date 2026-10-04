// S-24（2026-10-04）：Merkle Proof 浏览器本地折叠重算。
// 算法与 service-audit internal/hash/merkle.go 逐行对齐：
//   hashPair(a,b) = SHA256Hex(a + b)（两个 hex 字符串 ASCII 拼接后取 SHA-256 小写 hex）；
//   proof 元素 "L:"+hash 表示 sibling 在左、"R:"+hash 表示 sibling 在右；
//   current = leafHash 起，逐项折叠（"L:" → hashPair(sibling, current)，其余 → hashPair(current, sibling)），
//   末值 === rootHash 即验证通过。
// 依赖 WebCrypto（HTTPS / localhost 安全上下文）；不可用时由调用方降级展示。

async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function verifyMerkleProof(
	leafHash: string,
	proof: string[],
	rootHash: string,
): Promise<{ ok: boolean; computedRoot: string }> {
	let current = leafHash;
	for (const p of proof) {
		if (typeof p !== 'string' || p.length < 3) return { ok: false, computedRoot: current };
		const dir = p.slice(0, 2);
		const sibling = p.slice(2);
		current = dir === 'L:' ? await sha256Hex(sibling + current) : await sha256Hex(current + sibling);
	}
	return { ok: current === rootHash, computedRoot: current };
}

const skinToneModifiers = /[\u{1F3FB}-\u{1F3FF}]/gu;

export function withoutSkinTones(emoji: string) {
	return emoji.replaceAll(skinToneModifiers, "");
}

import sharp from 'sharp';
import { DomainError } from '$lib/server/errors';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['jpeg', 'png', 'webp']);

/**
 * Valide et normalise un avatar : ≤ 2 Mo, format réellement jpeg/png/webp
 * (détecté par décodage, pas par le type MIME déclaré), recadré 256×256,
 * réencodé en WebP (supprime EXIF / métadonnées).
 */
export async function processAvatar(
	file: File
): Promise<{ data: Uint8Array<ArrayBuffer>; mime: string }> {
	if (!(file instanceof File) || file.size === 0) throw new DomainError(400, 'Aucune image reçue');
	if (file.size > AVATAR_MAX_BYTES) throw new DomainError(400, 'Image trop lourde (2 Mo maximum)');

	const input = Buffer.from(await file.arrayBuffer());
	let format: string | undefined;
	try {
		const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
		format = meta.format;
		if (!meta.width || !meta.height) throw new Error('dimensions');
	} catch {
		throw new DomainError(400, 'Fichier image illisible');
	}
	if (!format || !ALLOWED.has(format))
		throw new DomainError(400, 'Formats acceptés : JPEG, PNG ou WebP');

	const out = await sharp(input, { limitInputPixels: 40_000_000 })
		.rotate()
		.resize(256, 256, { fit: 'cover' })
		.webp({ quality: 82 })
		.toBuffer();
	return { data: new Uint8Array(out), mime: 'image/webp' };
}

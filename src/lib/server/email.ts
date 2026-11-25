import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

let client: Resend | null = null;

/** Envoie l'email de réinitialisation. Sans RESEND_API_KEY (dev), le lien est affiché dans la console. */
export async function sendResetEmail(to: string, link: string): Promise<void> {
	const subject = 'Réinitialise ton mot de passe myLego';
	const text = `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable 30 minutes) :\n${link}\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.\n\n— myLego`;
	const html = `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, clique sur le lien ci-dessous (valable 30&nbsp;minutes)&nbsp;:</p><p><a href="${escapeHtml(link)}">Réinitialiser mon mot de passe</a></p><p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p><p>— myLego</p>`;

	if (!env.RESEND_API_KEY) {
		console.info(`[email:dev] Réinitialisation pour ${to} → ${link}`);
		return;
	}
	client ??= new Resend(env.RESEND_API_KEY);
	const { error } = await client.emails.send({
		from: env.EMAIL_FROM || 'myLego <onboarding@resend.dev>',
		to,
		subject,
		text,
		html
	});
	if (error) console.error('[email] Échec Resend :', error.name, error.message);
}

function escapeHtml(s: string) {
	return s.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);
}

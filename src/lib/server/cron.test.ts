import { describe, expect, it } from 'vitest';
import { isCronAuthorized } from './cron';

describe('cron keepalive', () => {
	it('accepte uniquement le bon secret', () => {
		expect(isCronAuthorized('Bearer s3cret', 's3cret')).toBe(true);
		expect(isCronAuthorized('Bearer autre!', 's3cret')).toBe(false);
		expect(isCronAuthorized('s3cret', 's3cret')).toBe(false);
		expect(isCronAuthorized(null, 's3cret')).toBe(false);
	});
	it('refuse tout si aucun secret n’est configuré', () => {
		expect(isCronAuthorized('Bearer ', '')).toBe(false);
		expect(isCronAuthorized('Bearer undefined', undefined)).toBe(false);
	});
});

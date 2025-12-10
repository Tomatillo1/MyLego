export type Lego = {
	id: string;
	imageUrl: string;
	name: string;
	setNumber: string;
	theme: string;
	pieces: number;
	startingPrice: number;
	currentPrice: number;
	removedFromStoreOn: number | null;
};

export type User = {
	id: string;
	email: string;
	password: string;
	collection: Lego[];
};

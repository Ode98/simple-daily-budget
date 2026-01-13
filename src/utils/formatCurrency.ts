export const formatCurrency = (
	amount: number,
	currency: string = "EUR",
	locale: string = "fi-FI"
): string => {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
	}).format(Math.abs(amount));
};

export const extractDatesFromFilename = (filename: string) => {
	const match = filename.match(/puzzle_(\d{6})_(\d{6})\.json/);
	if (!match) return null;

	const [, originalDate, newDate] = match;
	return { originalDate, newDate };
};

export const formatDisplayDate = (yyMMdd: string) => {
	const year = parseInt("20" + yyMMdd.slice(0, 2), 10);
	const month = parseInt(yyMMdd.slice(2, 4), 10) - 1;
	const day = parseInt(yyMMdd.slice(4, 6), 10);

	const date = new Date(year, month, day);

	return new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
};

export const formatDate = (d: Date) => {
	const y = String(d.getFullYear()).slice(2);
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}${m}${day}`;
};

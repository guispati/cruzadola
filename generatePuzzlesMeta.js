import fs from "fs";
import path from "path";

const puzzlesDir = path.resolve("./public/assets/puzzles");
const outputFile = path.resolve("./public/assets/puzzlesMeta.json");

const getTotalCells = puzzleData => {
	if (!puzzleData.grid) return 0;
	return puzzleData.grid.flat().filter(cell => cell).length;
};

const files = fs.readdirSync(puzzlesDir).filter(f => f.endsWith(".json"));
const meta = [];

for (const file of files) {
	const filePath = path.join(puzzlesDir, file);
	const raw = fs.readFileSync(filePath, "utf-8");
	const data = JSON.parse(raw);

	const match = file.match(/puzzle_(\d{6})_(\d{6})\.json$/);
	if (!match) continue;

	const [, code, date] = match;
	meta.push({
		id: `${code}_${date}`,
		date,
		file,
		totalCells: getTotalCells(data),
	});
}

fs.writeFileSync(outputFile, JSON.stringify(meta, null, 2), "utf-8");
console.log(`Generated ${meta.length} puzzle metadata entries in puzzlesMeta.json`);

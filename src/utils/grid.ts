import type { PuzzleData } from "@/types/puzzle";

export function buildGrid(data: PuzzleData, size: number) {
	const grid = Array.from({ length: size }, () => Array(size).fill(null));

	Object.entries(data.across).forEach(([num, { answer, row, col }]) => {
		for (let i = 0; i < answer.length; i++) {
			grid[row][col + i] = { letter: answer[i], number: i === 0 ? num : null };
		}
	});

	Object.entries(data.down).forEach(([num, { answer, row, col }]) => {
		for (let i = 0; i < answer.length; i++) {
			if (!grid[row + i][col]) {
				grid[row + i][col] = { letter: answer[i], number: i === 0 ? num : null };
			} else if (i === 0) {
				grid[row + i][col].number ??= num;
			}
		}
	});

	return grid;
}

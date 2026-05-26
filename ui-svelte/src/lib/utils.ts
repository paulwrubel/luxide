export function getGridColumnsTemplateForPercentage(
	percentage: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
): string {
	switch (percentage) {
		case 0:
			return 'grid-cols-[0fr_100fr]';
		case 10:
			return 'grid-cols-[10fr_90fr]';
		case 20:
			return 'grid-cols-[20fr_80fr]';
		case 30:
			return 'grid-cols-[30fr_70fr]';
		case 40:
			return 'grid-cols-[40fr_60fr]';
		case 50:
			return 'grid-cols-[50fr_50fr]';
		case 60:
			return 'grid-cols-[60fr_40fr]';
		case 70:
			return 'grid-cols-[70fr_30fr]';
		case 80:
			return 'grid-cols-[80fr_20fr]';
		case 90:
			return 'grid-cols-[90fr_10fr]';
		case 100:
			return 'grid-cols-[100fr_0fr]';
		default:
			return 'grid-cols-[30fr_70fr]';
	}
}

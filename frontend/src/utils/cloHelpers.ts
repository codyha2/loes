export interface CLOLike {
  id: number;
  code?: string | null;
}

export type CLOWithDisplay<T extends CLOLike = CLOLike> = T & { displayCode: string };

export const sortClosWithDisplay = <T extends CLOLike>(clos: T[]): CLOWithDisplay<T>[] => {
  const sorted = [...clos].sort((a, b) => {
    const aMatch = a.code?.match(/CLO(\d+)/i);
    const bMatch = b.code?.match(/CLO(\d+)/i);

    if (aMatch && bMatch) {
      return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    }

    return (a.id || 0) - (b.id || 0);
  });

  return sorted.map((clo, index) => ({
    ...clo,
    displayCode: `CLO${index + 1}`,
  }));
};


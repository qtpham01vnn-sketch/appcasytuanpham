export interface GeneratedImage {
  id: string;
  url: string;
  gender: 'Nam' | 'Nữ';
  style: string;
  context: string;
  description: string;
  createdAt: number;
}

export const STYLES = ["Acoustic Singer", "Rock Star", "Pop Diva", "Bolero Artist", "Rapper", "Jazz Performer"];

export const CONTEXTS = ["Acoustic Lounge", "Sân khấu lớn", "Phòng thu (Studio)", "Đường phố", "Quán Cafe"];

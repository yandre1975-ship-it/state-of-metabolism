// Popular food database (per 100g)
export interface FoodDBItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const FOOD_DATABASE: FoodDBItem[] = [
  // Молочные
  { name: 'Творог 5%', calories: 121, protein: 17, carbs: 1.8, fat: 5 },
  { name: 'Творог 0%', calories: 71, protein: 18, carbs: 1.8, fat: 0.1 },
  { name: 'Йогурт натуральный', calories: 60, protein: 4, carbs: 6, fat: 1.5 },
  { name: 'Кефир 1%', calories: 40, protein: 3, carbs: 4, fat: 1 },
  { name: 'Молоко 2.5%', calories: 52, protein: 2.8, carbs: 4.7, fat: 2.5 },
  { name: 'Сыр твёрдый', calories: 350, protein: 26, carbs: 0, fat: 27 },
  { name: 'Моцарелла', calories: 280, protein: 22, carbs: 2, fat: 20 },

  // Мясо и птица
  { name: 'Куриная грудка', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Куриное бедро', calories: 210, protein: 26, carbs: 0, fat: 11 },
  { name: 'Индейка филе', calories: 135, protein: 29, carbs: 0, fat: 1.5 },
  { name: 'Говядина', calories: 250, protein: 26, carbs: 0, fat: 16 },
  { name: 'Свинина', calories: 242, protein: 19, carbs: 0, fat: 18 },
  { name: 'Фарш куриный', calories: 143, protein: 17, carbs: 0, fat: 8 },
  { name: 'Фарш говяжий', calories: 254, protein: 17, carbs: 0, fat: 20 },

  // Рыба и морепродукты
  { name: 'Лосось', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Тунец', calories: 130, protein: 29, carbs: 0, fat: 1 },
  { name: 'Треска', calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: 'Креветки', calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { name: 'Минтай', calories: 72, protein: 16, carbs: 0, fat: 0.9 },

  // Яйца
  { name: 'Яйцо куриное (1 шт)', calories: 75, protein: 6, carbs: 0.6, fat: 5 },
  { name: 'Яичный белок (1 шт)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
  { name: 'Омлет (2 яйца)', calories: 180, protein: 13, carbs: 1, fat: 14 },

  // Крупы и гарниры
  { name: 'Рис варёный', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Гречка варёная', calories: 110, protein: 4.5, carbs: 21, fat: 1.1 },
  { name: 'Овсянка на воде', calories: 88, protein: 3, carbs: 15, fat: 1.7 },
  { name: 'Макароны варёные', calories: 131, protein: 5, carbs: 27, fat: 0.5 },
  { name: 'Булгур варёный', calories: 83, protein: 3, carbs: 14, fat: 0.2 },
  { name: 'Картофель варёный', calories: 82, protein: 2, carbs: 17, fat: 0.1 },
  { name: 'Киноа варёная', calories: 120, protein: 4, carbs: 21, fat: 2 },

  // Хлеб
  { name: 'Хлеб ржаной (1 кусок)', calories: 65, protein: 2, carbs: 12, fat: 0.7 },
  { name: 'Хлеб белый (1 кусок)', calories: 75, protein: 2.5, carbs: 14, fat: 0.8 },
  { name: 'Лаваш тонкий', calories: 236, protein: 8, carbs: 48, fat: 0.7 },

  // Овощи
  { name: 'Огурец', calories: 15, protein: 0.7, carbs: 2.8, fat: 0.1 },
  { name: 'Помидор', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Авокадо', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Брокколи', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Салат листовой', calories: 15, protein: 1.4, carbs: 2, fat: 0.2 },
  { name: 'Капуста белокочанная', calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
  { name: 'Морковь', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Перец болгарский', calories: 27, protein: 1, carbs: 5, fat: 0.3 },

  // Фрукты
  { name: 'Банан', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Яблоко', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Апельсин', calories: 43, protein: 0.9, carbs: 10, fat: 0.1 },
  { name: 'Клубника', calories: 33, protein: 0.7, carbs: 8, fat: 0.3 },
  { name: 'Виноград', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: 'Черника', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },

  // Орехи и семена
  { name: 'Миндаль (30г)', calories: 173, protein: 6, carbs: 6, fat: 15 },
  { name: 'Грецкий орех (30г)', calories: 196, protein: 5, carbs: 4, fat: 20 },
  { name: 'Арахис (30г)', calories: 170, protein: 8, carbs: 5, fat: 14 },
  { name: 'Семена чиа (1 ст.л.)', calories: 58, protein: 2, carbs: 5, fat: 4 },

  // Готовые блюда
  { name: 'Овсянка с бананом', calories: 220, protein: 6, carbs: 40, fat: 4 },
  { name: 'Салат Цезарь', calories: 180, protein: 12, carbs: 8, fat: 12 },
  { name: 'Суп куриный', calories: 86, protein: 7, carbs: 5, fat: 4 },
  { name: 'Борщ', calories: 49, protein: 2, carbs: 5, fat: 2 },
  { name: 'Плов', calories: 150, protein: 7, carbs: 18, fat: 6 },
  { name: 'Котлета куриная', calories: 190, protein: 18, carbs: 8, fat: 10 },
  { name: 'Сырники (2 шт)', calories: 220, protein: 14, carbs: 18, fat: 10 },

  // Напитки
  { name: 'Кофе с молоком', calories: 25, protein: 1, carbs: 2, fat: 1 },
  { name: 'Протеиновый коктейль', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Смузи ягодный', calories: 110, protein: 2, carbs: 24, fat: 0.5 },

  // Сладкое
  { name: 'Шоколад тёмный (30г)', calories: 170, protein: 2, carbs: 15, fat: 12 },
  { name: 'Мёд (1 ст.л.)', calories: 64, protein: 0.1, carbs: 17, fat: 0 },
  { name: 'Зефир (1 шт)', calories: 100, protein: 1, carbs: 25, fat: 0 },
];

export function searchFoods(query: string): FoodDBItem[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(q)).slice(0, 6);
}

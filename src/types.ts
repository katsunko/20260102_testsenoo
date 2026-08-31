export type PfcBalance = {
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
  totalKcal: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
};

export type RdaProgress = {
  nutrient: string;
  unit: string;
  rdaValue: number;
  intake: number;
  percent: number;
};

export type Goal = {
  id: string;
  type: "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN" | "BUILD_MUSCLE";
  targetWeightKg: number | null;
  targetDate: string | null;
  dailyKcalTarget: number;
  pfcRatioProtein: number;
  pfcRatioFat: number;
  pfcRatioCarb: number;
  dailyStepsTarget: number | null;
  isActive: boolean;
};

export type DailyBreakdownItem = {
  date: string;
  kcal: number;
  pfc: PfcBalance;
};

export type SummaryResponse = {
  range: "day" | "week" | "month";
  start: string;
  end: string;
  totals: Record<string, number>;
  pfc: PfcBalance;
  rdaProgress: RdaProgress[];
  goal: Goal | null;
  dailyBreakdown: DailyBreakdownItem[];
};

export type FoodItem = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

export type MealItem = {
  id: string;
  foodNameRaw: string;
  estimatedGrams: number;
  confirmedGrams: number | null;
  foodItem: FoodItem | null;
};

export type MealLog = {
  id: string;
  loggedAt: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  inputMethod: "TEXT" | "PHOTO";
  status: "PENDING" | "CONFIRMED";
  items: MealItem[];
};

export type MealDraftItem = {
  foodNameRaw: string;
  estimatedGrams: number;
  foodItemId: string | null;
  matchedFoodName: string | null;
};

export type RecommendationResponse = {
  kcalTarget: number;
  totalKcal: number;
  remainingKcal: number;
  foodRecommendations: {
    nutrient: string;
    percent: number;
    foods: { foodName: string; per100gAmount: number; unit: string }[];
  }[];
  exerciseRecommendation: { walkMinutes: number; joggingMinutes: number };
  dailyStepsTarget: number | null;
  lowNutrients: string[];
};

export const MEAL_TYPE_LABELS: Record<MealLog["mealType"], string> = {
  BREAKFAST: "朝食",
  LUNCH: "昼食",
  DINNER: "夕食",
  SNACK: "間食",
};

export const NUTRIENT_LABELS: Record<string, string> = {
  vitamin_a: "ビタミンA",
  vitamin_d: "ビタミンD",
  vitamin_e: "ビタミンE",
  vitamin_k: "ビタミンK",
  vitamin_b1: "ビタミンB1",
  vitamin_b2: "ビタミンB2",
  vitamin_b6: "ビタミンB6",
  vitamin_b12: "ビタミンB12",
  vitamin_c: "ビタミンC",
  niacin: "ナイアシン",
  folate: "葉酸",
  pantothenic_acid: "パントテン酸",
  calcium: "カルシウム",
  iron: "鉄",
  zinc: "亜鉛",
  magnesium: "マグネシウム",
  potassium: "カリウム",
  salt_g: "食塩相当量",
};

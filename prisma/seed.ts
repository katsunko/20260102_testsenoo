import { PrismaClient, Sex } from "@prisma/client";
import foodItems from "./data/food_items.sample.json";

const prisma = new PrismaClient();

const AGE_BANDS = ["18-29", "30-49", "50-69"] as const;

// 日本人の食事摂取基準(2020年版)の推奨量/目安量の簡易近似値。
// 年齢区分間の細かな差異は簡略化している。本番投入時は公式テーブルへの置き換えを推奨(docs/DESIGN.md 9章参照)。
type RdaRow = { nutrient: string; unit: string; male: number; female: (ageBand: string) => number };

const RDA_TABLE: RdaRow[] = [
  { nutrient: "vitamin_a", unit: "µg", male: 850, female: () => 650 },
  { nutrient: "vitamin_d", unit: "µg", male: 8.5, female: () => 8.5 },
  { nutrient: "vitamin_e", unit: "mg", male: 6.5, female: () => 6.0 },
  { nutrient: "vitamin_k", unit: "µg", male: 150, female: () => 150 },
  { nutrient: "vitamin_b1", unit: "mg", male: 1.3, female: () => 1.0 },
  { nutrient: "vitamin_b2", unit: "mg", male: 1.4, female: () => 1.1 },
  { nutrient: "vitamin_b6", unit: "mg", male: 1.4, female: () => 1.1 },
  { nutrient: "vitamin_b12", unit: "µg", male: 2.4, female: () => 2.4 },
  { nutrient: "vitamin_c", unit: "mg", male: 100, female: () => 100 },
  { nutrient: "niacin", unit: "mg", male: 14, female: () => 11 },
  { nutrient: "folate", unit: "µg", male: 240, female: () => 240 },
  { nutrient: "pantothenic_acid", unit: "mg", male: 5.5, female: () => 5.0 },
  { nutrient: "calcium", unit: "mg", male: 750, female: () => 650 },
  {
    nutrient: "iron",
    unit: "mg",
    male: 7.0,
    female: (ageBand) => (ageBand === "50-69" ? 6.0 : 10.5),
  },
  { nutrient: "zinc", unit: "mg", male: 10, female: () => 8 },
  { nutrient: "magnesium", unit: "mg", male: 340, female: () => 270 },
  { nutrient: "potassium", unit: "mg", male: 2500, female: () => 2000 },
  // 食塩相当量は「上限目標値」。他の栄養素と意味が異なる点に注意(超過を警告する用途)。
  { nutrient: "salt_g", unit: "g", male: 7.5, female: () => 6.5 },
  { nutrient: "fiber_g", unit: "g", male: 21, female: () => 18 },
];

async function seedFoodItems() {
  for (const item of foodItems) {
    await prisma.foodItem.upsert({
      where: { id: `seed-${item.name}` },
      update: {},
      create: { id: `seed-${item.name}`, ...item } as any,
    });
  }
  console.log(`food_items: ${foodItems.length}件を投入しました`);
}

async function seedRdaReference() {
  let count = 0;
  for (const ageBand of AGE_BANDS) {
    for (const row of RDA_TABLE) {
      await prisma.rdaReference.upsert({
        where: { ageBand_sex_nutrient: { ageBand, sex: Sex.MALE, nutrient: row.nutrient } },
        update: { rdaValue: row.male, unit: row.unit },
        create: { ageBand, sex: Sex.MALE, nutrient: row.nutrient, rdaValue: row.male, unit: row.unit },
      });
      await prisma.rdaReference.upsert({
        where: { ageBand_sex_nutrient: { ageBand, sex: Sex.FEMALE, nutrient: row.nutrient } },
        update: { rdaValue: row.female(ageBand), unit: row.unit },
        create: {
          ageBand,
          sex: Sex.FEMALE,
          nutrient: row.nutrient,
          rdaValue: row.female(ageBand),
          unit: row.unit,
        },
      });
      count += 2;
    }
  }
  console.log(`rda_reference: ${count}件を投入しました`);
}

async function seedDefaultUser() {
  const defaultUserId = process.env.DEFAULT_USER_ID ?? "00000000-0000-0000-0000-000000000001";
  await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {},
    create: {
      id: defaultUserId,
      email: "me@example.com",
      name: "自分",
      sex: Sex.MALE,
      activityLevel: "MODERATE",
    },
  });
  console.log(`default user: ${defaultUserId}`);
}

async function main() {
  await seedDefaultUser();
  await seedFoodItems();
  await seedRdaReference();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

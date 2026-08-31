-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'MAINTAIN', 'BUILD_MUSCLE');

-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('MEXT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('TEXT', 'PHOTO');

-- CreateEnum
CREATE TYPE "MealStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('MANUAL', 'HEALTHKIT');

-- CreateEnum
CREATE TYPE "AdvisorTrigger" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'GOAL_EVENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "sex" "Sex",
    "birth_date" TIMESTAMP(3),
    "height_cm" DOUBLE PRECISION,
    "activity_level" "ActivityLevel",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "target_weight_kg" DOUBLE PRECISION,
    "target_date" TIMESTAMP(3),
    "daily_kcal_target" INTEGER NOT NULL,
    "pfc_ratio_protein" DOUBLE PRECISION NOT NULL,
    "pfc_ratio_fat" DOUBLE PRECISION NOT NULL,
    "pfc_ratio_carb" DOUBLE PRECISION NOT NULL,
    "daily_steps_target" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "source" "FoodSource" NOT NULL DEFAULT 'MEXT',
    "name" TEXT NOT NULL,
    "name_kana" TEXT,
    "kcal_per100g" DOUBLE PRECISION NOT NULL,
    "protein_g" DOUBLE PRECISION NOT NULL,
    "fat_g" DOUBLE PRECISION NOT NULL,
    "carb_g" DOUBLE PRECISION NOT NULL,
    "fiber_g" DOUBLE PRECISION,
    "sugar_g" DOUBLE PRECISION,
    "salt_g" DOUBLE PRECISION,
    "vitamin_a" DOUBLE PRECISION,
    "vitamin_d" DOUBLE PRECISION,
    "vitamin_e" DOUBLE PRECISION,
    "vitamin_k" DOUBLE PRECISION,
    "vitamin_b1" DOUBLE PRECISION,
    "vitamin_b2" DOUBLE PRECISION,
    "vitamin_b6" DOUBLE PRECISION,
    "vitamin_b12" DOUBLE PRECISION,
    "vitamin_c" DOUBLE PRECISION,
    "niacin" DOUBLE PRECISION,
    "folate" DOUBLE PRECISION,
    "pantothenic_acid" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "magnesium" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,
    "zinc" DOUBLE PRECISION,
    "copper" DOUBLE PRECISION,
    "manganese" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "input_method" "InputMethod" NOT NULL,
    "photo_url" TEXT,
    "raw_text" TEXT,
    "status" "MealStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "meal_log_id" TEXT NOT NULL,
    "food_item_id" TEXT,
    "food_name_raw" TEXT NOT NULL,
    "estimated_grams" DOUBLE PRECISION NOT NULL,
    "confirmed_grams" DOUBLE PRECISION,
    "recognition_confidence" DOUBLE PRECISION,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "duration_min" INTEGER,
    "calories_burned" DOUBLE PRECISION,
    "source" "ExerciseSource" NOT NULL DEFAULT 'MANUAL',
    "steps" INTEGER,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_date" TIMESTAMP(3) NOT NULL,
    "trigger" "AdvisorTrigger" NOT NULL,
    "message_text" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rda_reference" (
    "id" TEXT NOT NULL,
    "age_band" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "nutrient" TEXT NOT NULL,
    "rda_value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "rda_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "food_items_name_idx" ON "food_items"("name");

-- CreateIndex
CREATE INDEX "meal_logs_user_id_logged_at_idx" ON "meal_logs"("user_id", "logged_at");

-- CreateIndex
CREATE INDEX "exercise_logs_user_id_logged_at_idx" ON "exercise_logs"("user_id", "logged_at");

-- CreateIndex
CREATE INDEX "advisor_messages_user_id_target_date_idx" ON "advisor_messages"("user_id", "target_date");

-- CreateIndex
CREATE UNIQUE INDEX "rda_reference_age_band_sex_nutrient_key" ON "rda_reference"("age_band", "sex", "nutrient");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_log_id_fkey" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

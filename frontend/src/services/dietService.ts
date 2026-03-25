import { authService } from './auth';

export interface Meal {
  dish: string;
  calories: string;
  portion?: string;
  alternatives?: string[];
  note?: string;
}

export interface DietPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

export interface Exercise {
  name: string;
  steps?: string;
  benefits: string;
  duration: string;
  note?: string;
}

export interface ExercisePlan {
  exercises: Exercise[];
}

class DietService {
  // Get diet recommendation based on region, category, and budget
  async getDietRecommendation(
    region: string, 
    category: string, 
    budget: string = 'medium'
  ): Promise<DietPlan | null> {
    try {
      const response = await fetch('http://localhost:5000/api/diet/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region,
          category,
          budget
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to get diet recommendation');
    } catch (error) {
      console.error('Error getting diet recommendation:', error);
      return null;
    }
  }

  // Get exercise recommendation based on age group and category
  async getExerciseRecommendation(
    ageGroup: string,
    category: string
  ): Promise<ExercisePlan | null> {
    try {
      const response = await fetch('http://localhost:5000/api/exercise/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age_group: ageGroup,
          category
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to get exercise recommendation');
    } catch (error) {
      console.error('Error getting exercise recommendation:', error);
      return null;
    }
  }

  // Get available regions
  getAvailableRegions(): string[] {
    return ['south_india', 'north_india', 'east_india', 'west_india', 'central_india'];
  }

  // Get available budgets
  getAvailableBudgets(): string[] {
    return ['low', 'medium', 'luxury'];
  }

  // Format region name for display
  formatRegionName(region: string): string {
    const regionMap: { [key: string]: string } = {
      'south_india': 'South Indian',
      'north_india': 'North Indian',
      'east_india': 'East Indian',
      'west_india': 'West Indian',
      'central_india': 'Central Indian'
    };
    return regionMap[region] || region;
  }

  // Format budget name for display
  formatBudgetName(budget: string): string {
    const budgetMap: { [key: string]: string } = {
      'low': 'Low Cost',
      'medium': 'Medium Cost',
      'luxury': 'Luxury'
    };
    return budgetMap[budget] || budget;
  }
}

export const dietService = new DietService();
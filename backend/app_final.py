from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import io
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# In-memory storage for demo
medicines = []
exercises = []
bmi_records = []
users = []

# Load diet and exercise data from files
def load_json_file(filename, default):
    try:
        with open(f'data/{filename}', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load {filename}: {e}")
        return default

# Load data files
DIET_DATA = load_json_file('diet_data.json', {})
EXERCISE_DATA = load_json_file('exercise_data.json', {})
BMI_DATA = load_json_file('bmi_data.json', {})

# ==================== BMI SERVICE ====================
class BMIService:
    @staticmethod
    def calculate_bmi(weight, height):
        height_m = height / 100
        return round(weight / (height_m ** 2), 1)
    
    @staticmethod
    def get_age_group(age):
        if age < 2:
            return "infant"
        elif age < 5:
            return "toddler"
        elif age < 13:
            return "child"
        elif age < 20:
            return "adolescent"
        elif age < 65:
            return "adult"
        else:
            return "senior"
    
    @staticmethod
    def classify_bmi(age, gender, bmi):
        # Simple classification for adults
        if age >= 20 and age < 65:
            if bmi < 18.5:
                return "underweight"
            elif bmi < 25:
                return "normal"
            elif bmi < 30:
                return "overweight"
            else:
                return "obese"
        # For seniors (65+)
        elif age >= 65:
            if bmi < 22:
                return "underweight"
            elif bmi < 27:
                return "normal"
            elif bmi < 30:
                return "overweight"
            else:
                return "obese"
        # For children and adolescents (use BMI_DATA if available)
        else:
            if bmi < 18.5:
                return "underweight"
            elif bmi < 25:
                return "normal"
            elif bmi < 30:
                return "overweight"
            else:
                return "obese"

# ==================== API ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'MediBuddy Backend is running!',
        'endpoints': [
            '/api/health',
            '/api/bmi/calculate',
            '/api/bmi/history/<user_id>',
            '/api/medicine/add',
            '/api/medicine/list/<user_id>',
            '/api/medicine/complete/<record_id>',
            '/api/exercise/add',
            '/api/exercise/list/<user_id>',
            '/api/exercise/complete/<record_id>',
            '/api/recommendations/<user_id>',
            '/api/report/generate/<user_id>',
            '/api/diet/recommend',
            '/api/exercise/recommend'
        ]
    })

# ==================== DIET & EXERCISE RECOMMENDATIONS ====================

@app.route('/api/diet/recommend', methods=['POST'])
def get_diet_recommendation():
    """Get diet recommendation based on region, category, and budget"""
    try:
        data = request.json
        region = data.get('region', 'south_india')
        category = data.get('category', 'normal')
        budget = data.get('budget', 'medium')
        
        # Get recommendations from dataset
        region_data = DIET_DATA.get(category, {}).get(region, {})
        plan = region_data.get(budget, region_data.get('medium', {}))
        
        # If no plan found, return default
        if not plan:
            plan = {
                "breakfast": {"dish": "Balanced Breakfast", "calories": "300-400 kcal"},
                "lunch": {"dish": "Balanced Lunch", "calories": "500-600 kcal"},
                "dinner": {"dish": "Light Dinner", "calories": "400-500 kcal"},
                "snacks": {"dish": "Healthy Snacks", "calories": "150-200 kcal"}
            }
        
        return jsonify(plan)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exercise/recommend', methods=['POST'])
def get_exercise_recommendation():
    """Get exercise recommendation based on age group and category"""
    try:
        data = request.json
        age_group = data.get('age_group', 'adult')
        category = data.get('category', 'normal')
        
        # Get recommendations from dataset
        plan = EXERCISE_DATA.get(category, {}).get(age_group, {})
        
        # If no plan found, return default
        if not plan:
            plan = {
                "exercises": [
                    {"name": "Walking", "duration": "30 minutes", "benefits": "Cardiovascular health"},
                    {"name": "Stretching", "duration": "15 minutes", "benefits": "Flexibility"},
                    {"name": "Basic Strength", "duration": "20 minutes", "benefits": "Muscle tone"}
                ]
            }
        
        return jsonify(plan)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BMI ROUTES ====================

@app.route('/api/bmi/calculate', methods=['POST'])
def calculate_bmi():
    """Calculate and store BMI record"""
    try:
        data = request.json
        user_id = data.get('user_id', 'demo-user')
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age', 30)
        gender = data.get('gender', 'male')
        
        if not weight or not height:
            return jsonify({'error': 'Missing weight or height'}), 400
        
        # Calculate BMI
        height_m = height / 100
        bmi = round(weight / (height_m ** 2), 1)
        
        # Classify BMI
        category = BMIService.classify_bmi(age, gender, bmi)
        
        # Get advice
        if category == "underweight":
            advice = "You are underweight. Consider increasing your calorie intake with nutritious foods."
        elif category == "normal":
            advice = "You have a healthy weight. Maintain your lifestyle with balanced diet and exercise."
        elif category == "overweight":
            advice = "You are overweight. Consider reducing calorie intake and increasing physical activity."
        else:
            advice = "You are in the obese range. Please consult a healthcare provider for guidance."
        
        # Store record
        record = {
            'id': len(bmi_records) + 1,
            'user_id': user_id,
            'bmi_value': bmi,
            'category': category,
            'advice': advice,
            'weight': weight,
            'height': height,
            'age': age,
            'gender': gender,
            'created_at': datetime.now().isoformat()
        }
        bmi_records.append(record)
        
        return jsonify({
            'success': True,
            'bmi': bmi,
            'category': category,
            'advice': advice,
            'record_id': record['id']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bmi/history/<user_id>', methods=['GET'])
def get_bmi_history(user_id):
    """Get BMI history for user"""
    user_records = [r for r in bmi_records if r['user_id'] == user_id]
    return jsonify(user_records)

# ==================== MEDICINE ROUTES ====================

@app.route('/api/medicine/add', methods=['POST'])
def add_medicine():
    """Add medicine reminder"""
    try:
        data = request.json
        medicine = {
            'id': len(medicines) + 1,
            'user_id': data.get('user_id', 'demo-user'),
            'name': data.get('name'),
            'dosage': data.get('dosage'),
            'time': data.get('time'),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        medicines.append(medicine)
        return jsonify(medicine)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medicine/list/<user_id>', methods=['GET'])
def get_medicines(user_id):
    """Get user's medicines"""
    user_medicines = [m for m in medicines if m['user_id'] == user_id]
    return jsonify(user_medicines)

@app.route('/api/medicine/complete/<int:record_id>', methods=['PUT'])
def complete_medicine(record_id):
    """Mark medicine as taken"""
    try:
        for med in medicines:
            if med['id'] == record_id:
                med['status'] = 'completed'
                med['completed_at'] = datetime.now().isoformat()
                return jsonify({'success': True})
        return jsonify({'error': 'Medicine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== EXERCISE ROUTES ====================

@app.route('/api/exercise/add', methods=['POST'])
def add_exercise():
    """Add exercise reminder"""
    try:
        data = request.json
        exercise = {
            'id': len(exercises) + 1,
            'user_id': data.get('user_id', 'demo-user'),
            'exercise_name': data.get('exercise_name'),
            'duration': data.get('duration'),
            'time': data.get('time'),
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        exercises.append(exercise)
        return jsonify(exercise)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exercise/list/<user_id>', methods=['GET'])
def get_exercises(user_id):
    """Get user's exercises"""
    user_exercises = [e for e in exercises if e['user_id'] == user_id]
    return jsonify(user_exercises)

@app.route('/api/exercise/complete/<int:record_id>', methods=['PUT'])
def complete_exercise(record_id):
    """Mark exercise as completed"""
    try:
        for ex in exercises:
            if ex['id'] == record_id:
                ex['status'] = 'completed'
                ex['completed_at'] = datetime.now().isoformat()
                return jsonify({'success': True})
        return jsonify({'error': 'Exercise not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== RECOMMENDATION ROUTES ====================

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """Get personalized recommendations"""
    try:
        # Get latest BMI
        user_records = [r for r in bmi_records if r['user_id'] == user_id]
        latest_bmi = user_records[0] if user_records else None
        
        category = latest_bmi['category'] if latest_bmi else 'normal'
        
        # Diet recommendations based on BMI category
        diet_plans = {
            'underweight': {
                'breakfast': {'dish': 'Ghee Idli with Sambar', 'calories': '450-550 kcal'},
                'lunch': {'dish': 'Chicken Biryani with Raita', 'calories': '700-800 kcal'},
                'dinner': {'dish': 'Parotta with Curry', 'calories': '600-700 kcal'},
                'snacks': {'dish': 'Milkshake with Nuts', 'calories': '300-400 kcal'},
                'advice': 'Focus on calorie-dense, nutrient-rich foods. Include healthy fats and proteins.'
            },
            'normal': {
                'breakfast': {'dish': 'Masala Dosa / Idli', 'calories': '350-450 kcal'},
                'lunch': {'dish': 'Rice + Sambar + Vegetables', 'calories': '500-600 kcal'},
                'dinner': {'dish': 'Chapati + Dal + Sabzi', 'calories': '400-500 kcal'},
                'snacks': {'dish': 'Fruits / Sprouts', 'calories': '150-200 kcal'},
                'advice': 'Maintain balanced diet with all food groups. Stay hydrated.'
            },
            'overweight': {
                'breakfast': {'dish': 'Oats / Ragi Porridge', 'calories': '250-300 kcal'},
                'lunch': {'dish': 'Brown Rice + Vegetable Curry', 'calories': '400-450 kcal'},
                'dinner': {'dish': 'Grilled Vegetables + Soup', 'calories': '300-350 kcal'},
                'snacks': {'dish': 'Green Tea + Roasted Chana', 'calories': '100-150 kcal'},
                'advice': 'Reduce calorie intake. Increase fiber and protein. Avoid fried foods.'
            },
            'obese': {
                'breakfast': {'dish': 'Vegetable Oats / Moong Dal Chilla', 'calories': '200-250 kcal'},
                'lunch': {'dish': 'Quinoa + Steamed Vegetables', 'calories': '350-400 kcal'},
                'dinner': {'dish': 'Clear Soup + Salad', 'calories': '200-250 kcal'},
                'snacks': {'dish': 'Cucumber / Carrot Sticks', 'calories': '50-100 kcal'},
                'advice': 'Consult healthcare provider. Focus on portion control and regular exercise.'
            }
        }
        
        # Exercise recommendations based on BMI category
        exercise_plans = {
            'underweight': [
                {'name': 'Strength Training', 'duration': '30 min', 'frequency': '3x/week', 'benefits': 'Builds muscle mass'},
                {'name': 'Light Cardio', 'duration': '20 min', 'frequency': '2x/week', 'benefits': 'Improves stamina'},
                {'name': 'Yoga', 'duration': '20 min', 'frequency': '2x/week', 'benefits': 'Flexibility and strength'}
            ],
            'normal': [
                {'name': 'Walking / Jogging', 'duration': '30 min', 'frequency': '5x/week', 'benefits': 'Cardiovascular health'},
                {'name': 'Bodyweight Exercises', 'duration': '20 min', 'frequency': '3x/week', 'benefits': 'Strength maintenance'},
                {'name': 'Stretching', 'duration': '15 min', 'frequency': 'Daily', 'benefits': 'Flexibility'}
            ],
            'overweight': [
                {'name': 'Brisk Walking', 'duration': '45 min', 'frequency': '5x/week', 'benefits': 'Weight loss'},
                {'name': 'Swimming / Cycling', 'duration': '30 min', 'frequency': '3x/week', 'benefits': 'Low impact cardio'},
                {'name': 'Basic Strength Training', 'duration': '20 min', 'frequency': '3x/week', 'benefits': 'Muscle building'}
            ],
            'obese': [
                {'name': 'Walking', 'duration': '20 min', 'frequency': '5x/week', 'benefits': 'Start slow'},
                {'name': 'Seated Exercises', 'duration': '15 min', 'frequency': 'Daily', 'benefits': 'Gentle movement'},
                {'name': 'Water Aerobics', 'duration': '30 min', 'frequency': '3x/week', 'benefits': 'Low impact cardio'}
            ]
        }
        
        return jsonify({
            'diet_plan': diet_plans.get(category, diet_plans['normal']),
            'exercise_plan': {'exercises': exercise_plans.get(category, exercise_plans['normal'])},
            'current_bmi': latest_bmi['bmi_value'] if latest_bmi else None,
            'category': category
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== REPORT ROUTES ====================

@app.route('/api/report/generate/<user_id>', methods=['GET'])
def generate_report(user_id):
    """Generate health report"""
    try:
        user_records = [r for r in bmi_records if r['user_id'] == user_id]
        user_medicines = [m for m in medicines if m['user_id'] == user_id]
        user_exercises = [e for e in exercises if e['user_id'] == user_id]
        
        total_meds = len(user_medicines)
        completed_meds = sum(1 for m in user_medicines if m.get('status') == 'completed')
        med_adherence = (completed_meds / total_meds * 100) if total_meds > 0 else 0
        
        total_ex = len(user_exercises)
        completed_ex = sum(1 for e in user_exercises if e.get('status') == 'completed')
        ex_completion = (completed_ex / total_ex * 100) if total_ex > 0 else 0
        
        latest_bmi = user_records[0] if user_records else None
        first_bmi = user_records[-1] if user_records else None
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'user_id': user_id,
            'bmi_statistics': {
                'current_bmi': latest_bmi['bmi_value'] if latest_bmi else None,
                'current_category': latest_bmi['category'] if latest_bmi else None,
                'first_bmi': first_bmi['bmi_value'] if first_bmi else None,
                'bmi_change': (first_bmi['bmi_value'] - latest_bmi['bmi_value']) if latest_bmi and first_bmi else None,
                'total_records': len(user_records)
            },
            'adherence': {
                'medicine_adherence': round(med_adherence, 1),
                'exercise_completion': round(ex_completion, 1),
                'total_medicines': total_meds,
                'completed_medicines': completed_meds,
                'total_exercises': total_ex,
                'completed_exercises': completed_ex
            },
            'recommendations': {
                'diet': 'Maintain a balanced diet with adequate protein and fiber',
                'exercise': 'Aim for at least 150 minutes of moderate exercise per week'
            }
        }
        
        return jsonify(report)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ROOT ROUTE ====================

@app.route('/')
def root():
    """Root endpoint"""
    return jsonify({
        'name': 'MediBuddy AI+ Pro Max Backend',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'bmi': '/api/bmi/calculate',
            'medicine': '/api/medicine/add',
            'exercise': '/api/exercise/add',
            'recommendations': '/api/recommendations/<user_id>',
            'report': '/api/report/generate/<user_id>',
            'diet_recommend': '/api/diet/recommend',
            'exercise_recommend': '/api/exercise/recommend'
        }
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 MediBuddy AI+ Pro Max Backend Server")
    print("="*60)
    print("✓ Flask server running")
    print("✓ All API endpoints ready")
    print("✓ Diet and Exercise recommendations loaded")
    print(f"\n📍 Server: http://localhost:5000")
    print("📍 Health: http://localhost:5000/api/health")
    print("📍 Diet: POST http://localhost:5000/api/diet/recommend")
    print("📍 Exercise: POST http://localhost:5000/api/exercise/recommend")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, host='0.0.0.0')